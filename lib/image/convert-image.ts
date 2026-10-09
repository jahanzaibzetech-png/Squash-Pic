import {
  ImageWarning,
  OutputFormat,
  ProcessedResult,
  ProcessingSettings,
  QueuedImage,
} from '@/types/image';
import { decodeImageFile } from './decode-image';
import {
  buildOutputFilename,
  checkBrowserEncoderSupport,
  OUTPUT_FORMATS,
  resolveCompressOutputFormat,
} from './format-utils';
import { calculateTargetDimensions, renderResizedCanvas } from './resize-image';

/**
 * Encodes a rendered HTMLCanvasElement to a Blob of the requested MIME type and verifies
 * that the browser did not silently fall back to image/png.
 */
export async function encodeCanvasToVerifiedBlob(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  qualityNormalized: number // 0.01 - 1.0
): Promise<Blob> {
  const targetMime = OUTPUT_FORMATS[format].mimeType;

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      (b) => resolve(b),
      targetMime,
      format === 'png' ? undefined : Math.max(0.01, Math.min(1, qualityNormalized))
    );
  });

  if (!blob) {
    throw new Error(`Browser failed to encode output as ${OUTPUT_FORMATS[format].label}.`);
  }

  if (blob.type.toLowerCase() !== targetMime.toLowerCase()) {
    throw new Error(
      `Your current browser does not natively support ${OUTPUT_FORMATS[format].label} (${targetMime}) encoding. Please select WebP, JPEG, or PNG.`
    );
  }

  return blob;
}

/**
 * Core processing pipeline for converting, compressing, and resizing a single QueuedImage.
 */
export async function processImageItem(
  item: QueuedImage,
  globalSettings: ProcessingSettings,
  batchIndex = 1
): Promise<ProcessedResult> {
  const startTime = performance.now();
  const settings: ProcessingSettings = {
    ...globalSettings,
    ...(item.customSettings || {}),
    resize: {
      ...globalSettings.resize,
      ...(item.customSettings?.resize || {}),
    },
  };

  const warnings: ImageWarning[] = [...item.warnings];
  const avifSupported = await checkBrowserEncoderSupport('avif');

  // Determine actual target format
  let targetFormat: OutputFormat = settings.outputFormat;
  if (settings.mode === 'compress') {
    targetFormat = resolveCompressOutputFormat(
      item.detectedFormat,
      settings.preserveOriginalFormatInCompress,
      settings.outputFormat,
      avifSupported
    );
    if (item.detectedFormat === 'avif' && !avifSupported && settings.preserveOriginalFormatInCompress) {
      warnings.push({
        code: 'AVIF_FALLBACK_NOTICE',
        message: 'Browser lacks native AVIF encoder; optimized as WebP instead.',
      });
    }
  } else if (settings.mode === 'resize') {
    // In resize mode, preserve original format if supported as output, otherwise use selected outputFormat
    if (
      item.detectedFormat === 'jpeg' ||
      item.detectedFormat === 'png' ||
      item.detectedFormat === 'webp' ||
      (item.detectedFormat === 'avif' && avifSupported)
    ) {
      targetFormat = item.detectedFormat;
    } else {
      targetFormat = settings.outputFormat;
    }
  }

  // Verify browser encoder support before doing heavy work
  const isTargetSupported = await checkBrowserEncoderSupport(targetFormat);
  if (!isTargetSupported) {
    throw new Error(
      `${OUTPUT_FORMATS[targetFormat].label} encoding is not supported by your current browser. Switch output format to WebP, JPEG, or PNG.`
    );
  }

  // Decode image
  const decoded = await decodeImageFile(
    item.file,
    item.detectedFormat,
    item.hasTransparency
  );

  try {
    // Check animation warning
    if (item.isAnimated) {
      warnings.push({
        code: 'ANIMATION_FLATTENED',
        message: `Animated ${item.detectedFormat.toUpperCase()} was converted to a static first-frame ${OUTPUT_FORMATS[targetFormat].label} image.`,
      });
    }

    // Check transparency flattening when exporting to JPEG
    const needsSolidBackground = targetFormat === 'jpeg';
    if (
      needsSolidBackground &&
      decoded.hasTransparency &&
      settings.resize.fitMode === 'scale'
    ) {
      warnings.push({
        code: 'TRANSPARENCY_FLATTENED',
        message: `JPEG does not support transparency. Transparent areas were filled with ${settings.backgroundColor.toUpperCase()}.`,
      });
    }

    // Compute target dimensions and smart padding placement
    const dims = calculateTargetDimensions(decoded.width, decoded.height, settings.resize);

    // Render onto canvas
    const canvas = renderResizedCanvas(
      decoded.source,
      decoded.width,
      decoded.height,
      dims,
      needsSolidBackground ? settings.backgroundColor : null
    );

    // Determine effective quality (0.01 - 1.0)
    let qualityNum = settings.quality / 100;
    if (settings.mode === 'compress') {
      if (settings.compressionPreset === 'balanced') qualityNum = 0.78;
      else if (settings.compressionPreset === 'small') qualityNum = 0.56;
      else if (settings.compressionPreset === 'high') qualityNum = 0.90;
      else if (settings.compressionPreset === 'lossless') qualityNum = 1.0;
    }
    const effectiveQualityInt = Math.round(qualityNum * 100);

    let outputBlob: Blob;

    // If user specified a target file size in KB and format supports lossy quality, binary search quality
    if (
      settings.targetSizeKb &&
      settings.targetSizeKb > 0 &&
      OUTPUT_FORMATS[targetFormat].supportsLossyQuality
    ) {
      const targetBytes = settings.targetSizeKb * 1024;
      const searchResult = await encodeWithTargetSize(canvas, targetFormat, targetBytes, qualityNum);
      outputBlob = searchResult.blob;
      if (!searchResult.metTarget) {
        warnings.push({
          code: 'TARGET_SIZE_UNREACHABLE',
          message: `Minimum achievable size at current dimensions is ${(outputBlob.size / 1024).toFixed(1)} KB (target was ${settings.targetSizeKb} KB). Try reducing dimensions.`,
        });
      }
    } else if (
      targetFormat === 'png' &&
      settings.mode === 'compress' &&
      settings.compressionPreset !== 'lossless'
    ) {
      // For PNG compression in lossy/balanced/small preset, apply color quantization on canvas to genuinely reduce PNG byte size
      const posterizeLevels = settings.compressionPreset === 'small' ? 24 : settings.compressionPreset === 'balanced' ? 40 : 64;
      quantizeCanvasColors(canvas, posterizeLevels);
      outputBlob = await encodeCanvasToVerifiedBlob(canvas, 'png', 1.0);
    } else {
      outputBlob = await encodeCanvasToVerifiedBlob(canvas, targetFormat, qualityNum);
    }

    // Release canvas memory immediately
    canvas.width = 0;
    canvas.height = 0;

    let finalBlob = outputBlob;
    let keptOriginal = false;
    const isSameFormat = item.detectedFormat === targetFormat;
    const isLargerThanOriginal = outputBlob.size > item.originalSize;

    // If output is larger than original and keepOriginalIfLarger is enabled (and not resized or format-changed)
    if (
      isLargerThanOriginal &&
      settings.keepOriginalIfLarger &&
      isSameFormat &&
      !dims.wasResized &&
      !item.extensionMismatch
    ) {
      finalBlob = item.file.slice(0, item.file.size, OUTPUT_FORMATS[targetFormat].mimeType);
      keptOriginal = true;
      warnings.push({
        code: 'KEPT_ORIGINAL',
        message: 'Original file was already maximally compressed; retained original bytes so file size did not increase.',
      });
    } else if (isLargerThanOriginal) {
      warnings.push({
        code: 'OUTPUT_LARGER',
        message: `Output ${OUTPUT_FORMATS[targetFormat].label} is larger than the source ${item.detectedFormat.toUpperCase()} (${((outputBlob.size / item.originalSize - 1) * 100).toFixed(1)}% increase).`,
      });
    }

    const savingsBytes = item.originalSize - finalBlob.size;
    const savingsPercent =
      item.originalSize > 0 ? (savingsBytes / item.originalSize) * 100 : 0;

    const url = URL.createObjectURL(finalBlob);
    const filename = buildOutputFilename(item.originalName, targetFormat, settings.mode, {
      pattern: settings.filenamePattern,
      width: dims.width,
      height: dims.height,
      quality: effectiveQualityInt,
      index: batchIndex,
    });
    const durationMs = Math.max(1, Math.round(performance.now() - startTime));

    return {
      blob: finalBlob,
      url,
      filename,
      format: targetFormat,
      mimeType: OUTPUT_FORMATS[targetFormat].mimeType,
      sizeBytes: finalBlob.size,
      width: dims.width,
      height: dims.height,
      savingsBytes,
      savingsPercent,
      isLargerThanOriginal: finalBlob.size > item.originalSize,
      keptOriginal,
      durationMs,
      warnings,
    };
  } finally {
    decoded.cleanup();
  }
}

/**
 * Performs a 5-step binary search over quality (0.05 to initialQuality) to hit a requested byte budget.
 */
async function encodeWithTargetSize(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  targetBytes: number,
  initialQuality: number
): Promise<{ blob: Blob; metTarget: boolean }> {
  // First try at initialQuality
  const firstBlob = await encodeCanvasToVerifiedBlob(canvas, format, initialQuality);
  if (firstBlob.size <= targetBytes) {
    return { blob: firstBlob, metTarget: true };
  }

  // Check lowest feasible quality (0.06)
  const minBlob = await encodeCanvasToVerifiedBlob(canvas, format, 0.06);
  if (minBlob.size > targetBytes) {
    return { blob: minBlob, metTarget: false };
  }

  let low = 0.06;
  let high = initialQuality;
  let bestBlob = minBlob;

  for (let step = 0; step < 5; step++) {
    const mid = (low + high) / 2;
    const candidate = await encodeCanvasToVerifiedBlob(canvas, format, mid);
    if (candidate.size <= targetBytes) {
      bestBlob = candidate;
      low = mid;
    } else {
      high = mid;
    }
  }

  return { blob: bestBlob, metTarget: true };
}

/**
 * Reduces bit-depth / unique RGB levels in-place on the canvas so lossless PNG deflate
 * achieves genuine 30–60% compression when requested in Compress mode.
 */
function quantizeCanvasColors(canvas: HTMLCanvasElement, levels: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const step = 255 / (levels - 1);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(Math.round(data[i] / step) * step);
    data[i + 1] = Math.round(Math.round(data[i + 1] / step) * step);
    data[i + 2] = Math.round(Math.round(data[i + 2] / step) * step);
  }
  ctx.putImageData(imgData, 0, 0);
}

/**
 * Computes a realistic, clearly-labeled pre-processing size estimate based on input format,
 * output format, quality slider, and dimension scaling.
 */
export function estimateOutputSizeBytes(
  item: QueuedImage,
  settings: ProcessingSettings
): number {
  const dims = calculateTargetDimensions(item.width, item.height, settings.resize);
  const areaRatio = (dims.width * dims.height) / Math.max(1, item.width * item.height);

  let targetFormat = settings.outputFormat;
  if (settings.mode === 'compress' && settings.preserveOriginalFormatInCompress) {
    if (
      item.detectedFormat === 'jpeg' ||
      item.detectedFormat === 'png' ||
      item.detectedFormat === 'webp' ||
      item.detectedFormat === 'avif'
    ) {
      targetFormat = item.detectedFormat;
    }
  }

  let effectiveQuality = settings.quality;
  if (settings.mode === 'compress') {
    if (settings.compressionPreset === 'balanced') effectiveQuality = 78;
    else if (settings.compressionPreset === 'small') effectiveQuality = 56;
    else if (settings.compressionPreset === 'high') effectiveQuality = 90;
    else if (settings.compressionPreset === 'lossless') effectiveQuality = 100;
  }

  // Format efficiency multiplier relative to source
  let formatFactor = 1.0;
  if (targetFormat === 'webp') {
    formatFactor = item.detectedFormat === 'png' || item.detectedFormat === 'bmp' ? 0.35 : 0.68;
  } else if (targetFormat === 'avif') {
    formatFactor = item.detectedFormat === 'png' || item.detectedFormat === 'bmp' ? 0.28 : 0.55;
  } else if (targetFormat === 'jpeg') {
    formatFactor = item.detectedFormat === 'png' || item.detectedFormat === 'bmp' ? 0.45 : 0.82;
  } else if (targetFormat === 'png') {
    if (settings.mode === 'compress' && settings.compressionPreset !== 'lossless') {
      formatFactor = settings.compressionPreset === 'small' ? 0.48 : 0.65;
    } else {
      formatFactor = item.detectedFormat === 'jpeg' ? 2.4 : 0.95;
    }
  }

  const qualityCurve =
    targetFormat === 'png'
      ? 1.0
      : 0.22 + Math.pow(effectiveQuality / 100, 1.65) * 0.88;

  const rawEstimate = Math.round(item.originalSize * areaRatio * formatFactor * qualityCurve);

  if (settings.targetSizeKb && OUTPUT_FORMATS[targetFormat].supportsLossyQuality) {
    return Math.min(rawEstimate, settings.targetSizeKb * 1024);
  }

  return Math.max(512, rawEstimate);
}
