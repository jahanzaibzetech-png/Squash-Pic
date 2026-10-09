import { z } from 'zod';
import { detectImageFormat, FormatDetectionResult } from './detect-format';

export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_QUEUE_FILES = 40;
export const MAX_CANVAS_DIMENSION = 16384;
export const MAX_CANVAS_PIXELS = 67108864; // 64 Megapixels safe limit across desktop/mobile browsers

export const processingSettingsSchema = z.object({
  mode: z.enum(['convert', 'compress', 'resize']),
  outputFormat: z.enum(['webp', 'jpeg', 'png', 'avif']),
  preserveOriginalFormatInCompress: z.boolean(),
  quality: z.number().min(1).max(100),
  compressionPreset: z.enum(['balanced', 'small', 'high', 'lossless', 'custom']),
  targetSizeKb: z.number().min(5).max(50000).nullable(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  stripMetadata: z.boolean(),
  keepOriginalIfLarger: z.boolean(),
  filenamePattern: z.string().min(1).max(120),
  resize: z.object({
    enabled: z.boolean(),
    mode: z.enum(['none', 'dimensions', 'percentage', 'max-bounds', 'preset']),
    width: z.number().int().min(1).max(MAX_CANVAS_DIMENSION).nullable(),
    height: z.number().int().min(1).max(MAX_CANVAS_DIMENSION).nullable(),
    percentage: z.number().min(1).max(200),
    lockAspectRatio: z.boolean(),
    preventEnlargement: z.boolean(),
    presetId: z.string().nullable(),
    fitMode: z.enum(['scale', 'contain-solid', 'contain-blur']),
    padColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    padMarginPercent: z.number().min(0).max(25),
  }),
});

export interface FileValidationOutcome {
  valid: boolean;
  error?: string;
  detection?: FormatDetectionResult;
}

export async function validateImageFile(
  file: File,
  maxSizeBytes: number = MAX_FILE_SIZE_BYTES
): Promise<FileValidationOutcome> {
  if (!file || file.size === 0) {
    return {
      valid: false,
      error: `"${file?.name || 'File'}" is empty (0 bytes) and cannot be processed.`,
    };
  }

  if (file.size > maxSizeBytes) {
    const limitMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    const fileMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `"${file.name}" (${fileMb} MB) exceeds the ${limitMb} MB browser processing limit.`,
    };
  }

  const detection = await detectImageFormat(file);

  if (detection.format === 'unknown') {
    return {
      valid: false,
      error: `"${file.name}" is not a recognized or supported image file. Supported inputs: JPEG, PNG, WebP, AVIF, GIF, BMP, and SVG.`,
    };
  }

  if (detection.format === 'heic') {
    return {
      valid: false,
      error: `"${file.name}" is encoded in Apple HEIC/HEIF format, which is not natively decoded by most web browsers without proprietary codecs. Please export as JPEG or PNG first.`,
    };
  }

  return {
    valid: true,
    detection,
  };
}

/**
 * Safely sanitizes SVG text before rasterizing it into an isolated Image object.
 * Removes <script>, event handler attributes (onload, onerror, etc.), and external <foreignObject>.
 */
export async function sanitizeSvgBlob(file: File): Promise<Blob> {
  const rawText = await file.text();

  if (!rawText.toLowerCase().includes('<svg')) {
    throw new Error('Invalid SVG file: missing root <svg> element.');
  }

  // Parse using DOMParser in isolated XML mode
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawText, 'image/svg+xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Malformed SVG XML structure could not be parsed safely.');
  }

  const svgRoot = doc.documentElement;
  if (svgRoot.tagName.toLowerCase() !== 'svg') {
    throw new Error('Root element is not an <svg> node.');
  }

  // Strip dangerous elements
  const forbiddenTags = ['script', 'foreignobject', 'iframe', 'object', 'embed'];
  const allElements = svgRoot.querySelectorAll('*');
  allElements.forEach((el) => {
    if (forbiddenTags.includes(el.tagName.toLowerCase())) {
      el.remove();
      return;
    }
    // Strip inline event handlers and external hrefs
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const val = attr.value.trim().toLowerCase();
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
      if ((name === 'href' || name === 'xlink:href') && (val.startsWith('javascript:') || val.startsWith('http://') || val.startsWith('https://'))) {
        el.removeAttribute(attr.name);
      }
    });
  });

  // Ensure explicit width/height or viewBox so rasterization succeeds
  if (!svgRoot.getAttribute('width') && !svgRoot.getAttribute('height')) {
    const viewBox = svgRoot.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        svgRoot.setAttribute('width', String(parts[2]));
        svgRoot.setAttribute('height', String(parts[3]));
      }
    } else {
      svgRoot.setAttribute('width', '1024');
      svgRoot.setAttribute('height', '1024');
    }
  }

  const serializer = new XMLSerializer();
  const safeSvgString = serializer.serializeToString(svgRoot);
  return new Blob([safeSvgString], { type: 'image/svg+xml;charset=utf-8' });
}
