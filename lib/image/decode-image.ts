import { SupportedInputFormat } from '@/types/image';
import { MAX_CANVAS_DIMENSION, MAX_CANVAS_PIXELS, sanitizeSvgBlob } from './validate-image';

export interface DecodedImageSource {
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  hasTransparency: boolean;
  cleanup: () => void;
}

/**
 * Decodes a File or Blob into a drawable Canvas source (ImageBitmap or HTMLImageElement),
 * verifies canvas memory boundaries, and checks whether actual transparent pixels exist.
 */
export async function decodeImageFile(
  file: File,
  format: SupportedInputFormat,
  hasAlphaHeader: boolean
): Promise<DecodedImageSource> {
  let targetBlob: Blob = file;

  if (format === 'svg') {
    targetBlob = await sanitizeSvgBlob(file);
  }

  // Prefer createImageBitmap for non-SVG raster images when supported
  if (format !== 'svg' && typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(targetBlob);
      const width = bitmap.width;
      const height = bitmap.height;

      validateDimensions(width, height, file.name);

      const hasTransparency = hasAlphaHeader ? await sampleTransparency(bitmap, width, height) : false;

      return {
        source: bitmap,
        width,
        height,
        hasTransparency,
        cleanup: () => {
          try {
            bitmap.close();
          } catch {
            // Ignore already closed
          }
        },
      };
    } catch {
      // Fall through to HTMLImageElement decoding if createImageBitmap fails on specific format
    }
  }

  // Fallback / SVG path via HTMLImageElement
  const objectUrl = URL.createObjectURL(targetBlob);
  try {
    const img = await loadImageElement(objectUrl);
    const width = img.naturalWidth || img.width || 1024;
    const height = img.naturalHeight || img.height || 1024;

    validateDimensions(width, height, file.name);

    const hasTransparency =
      format === 'svg' || (hasAlphaHeader ? await sampleTransparency(img, width, height) : false);

    return {
      source: img,
      width,
      height,
      hasTransparency,
      cleanup: () => {
        URL.revokeObjectURL(objectUrl);
      },
    };
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    const message =
      err instanceof Error
        ? err.message
        : `Failed to decode "${file.name}". The image file appears to be corrupted or uses an unsupported encoding profile.`;
    throw new Error(message);
  }
}

function validateDimensions(width: number, height: number, filename: string): void {
  if (!width || !height || width <= 0 || height <= 0) {
    throw new Error(`"${filename}" has invalid image dimensions (${width}×${height}).`);
  }
  if (width > MAX_CANVAS_DIMENSION || height > MAX_CANVAS_DIMENSION) {
    throw new Error(
      `"${filename}" (${width}×${height} px) exceeds the maximum browser canvas dimension limit of ${MAX_CANVAS_DIMENSION} px.`
    );
  }
  if (width * height > MAX_CANVAS_PIXELS) {
    const mp = ((width * height) / 1_000_000).toFixed(1);
    throw new Error(
      `"${filename}" (${mp} MP) exceeds the safe browser memory limit of 64 MP.`
    );
  }
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(
        new Error(
          'Browser image decoder could not read this file. It may be corrupted or truncated.'
        )
      );
    img.src = url;
  });
}

/**
 * Downsamples image onto a small 64x64 inspection canvas to detect if any pixel has alpha < 255.
 */
async function sampleTransparency(
  source: ImageBitmap | HTMLImageElement,
  width: number,
  height: number
): Promise<boolean> {
  try {
    const sampleW = Math.min(64, width);
    const sampleH = Math.min(64, height);
    const canvas = document.createElement('canvas');
    canvas.width = sampleW;
    canvas.height = sampleH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;

    ctx.drawImage(source, 0, 0, sampleW, sampleH);
    const { data } = ctx.getImageData(0, 0, sampleW, sampleH);
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 250) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}
