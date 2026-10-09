import { SupportedInputFormat } from '@/types/image';

export interface FormatDetectionResult {
  format: SupportedInputFormat;
  mimeType: string;
  extensionMismatch: boolean;
  isAnimated: boolean;
  hasAlphaHeader: boolean;
}

const EXTENSION_TO_FORMAT: Record<string, SupportedInputFormat> = {
  jpg: 'jpeg',
  jpeg: 'jpeg',
  jpe: 'jpeg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
  gif: 'gif',
  bmp: 'bmp',
  svg: 'svg',
  heic: 'heic',
  heif: 'heic',
};

/**
 * Inspects actual binary magic bytes (and header structure) of a File/Blob
 * rather than trusting the filename extension or browser File.type.
 */
export async function detectImageFormat(file: File): Promise<FormatDetectionResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const expectedFromExt = EXTENSION_TO_FORMAT[ext] || 'unknown';

  const sliceSize = Math.min(file.size, 4096);
  const buffer = await file.slice(0, sliceSize).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  let detected: SupportedInputFormat = 'unknown';
  let isAnimated = false;
  let hasAlphaHeader = false;

  // 1. Check PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 26 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    detected = 'png';
    // IHDR color type is at offset 25: 4 = grayscale+alpha, 6 = RGBA
    const colorType = bytes[25];
    if (colorType === 4 || colorType === 6) {
      hasAlphaHeader = true;
    }
    // Check for tRNS or acTL (APNG) in initial chunks
    const asciiHeader = new TextDecoder('latin1').decode(bytes);
    if (asciiHeader.includes('tRNS')) {
      hasAlphaHeader = true;
    }
    if (asciiHeader.includes('acTL')) {
      isAnimated = true;
    }
  }
  // 2. Check JPEG: FF D8 FF
  else if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    detected = 'jpeg';
  }
  // 3. Check GIF: "GIF87a" or "GIF89a"
  else if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    detected = 'gif';
    hasAlphaHeader = true;
    isAnimated = await checkGifAnimation(file);
  }
  // 4. Check WebP: "RIFF" .... "WEBP"
  else if (
    bytes.length >= 16 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    detected = 'webp';
    const chunkHeader = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
    if (chunkHeader === 'VP8X' && bytes.length >= 21) {
      const flags = bytes[20];
      if ((flags & 0x10) !== 0) hasAlphaHeader = true;
      if ((flags & 0x02) !== 0) isAnimated = true;
    } else if (chunkHeader === 'VP8L') {
      hasAlphaHeader = true;
    }
  }
  // 5. Check BMP: "BM"
  else if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    detected = 'bmp';
  }
  // 6. Check ISO Base Media File Format (AVIF / HEIC): "ftyp" at bytes 4..7
  else if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
    if (brand === 'avif' || brand === 'avis' || brand === 'mif1') {
      const fullHeader = new TextDecoder('latin1').decode(bytes.slice(0, 64)).toLowerCase();
      if (fullHeader.includes('avif') || fullHeader.includes('avis')) {
        detected = 'avif';
        hasAlphaHeader = true;
        if (brand === 'avis') isAnimated = true;
      } else if (
        fullHeader.includes('heic') ||
        fullHeader.includes('heix') ||
        fullHeader.includes('hevc') ||
        fullHeader.includes('mif1')
      ) {
        detected = 'heic';
      }
    } else if (brand.startsWith('hei') || brand === 'hevc') {
      detected = 'heic';
    }
  }
  // 7. Check SVG (text based XML / <svg)
  else {
    const textSample = new TextDecoder('utf-8', { fatal: false })
      .decode(bytes.slice(0, 1024))
      .trim()
      .toLowerCase();
    if (
      textSample.includes('<svg') &&
      (textSample.startsWith('<?xml') ||
        textSample.startsWith('<svg') ||
        textSample.startsWith('<!doctype svg') ||
        textSample.includes('xmlns="http://www.w3.org/2000/svg"'))
    ) {
      detected = 'svg';
      hasAlphaHeader = true;
    }
  }

  const extensionMismatch =
    detected !== 'unknown' && expectedFromExt !== 'unknown' && detected !== expectedFromExt;

  return {
    format: detected,
    mimeType: formatToMimeType(detected),
    extensionMismatch,
    isAnimated,
    hasAlphaHeader,
  };
}

/**
 * Scans up to the first 128KB of a GIF file to count frame descriptors (0x2C)
 * or NETSCAPE2.0 loop extensions.
 */
async function checkGifAnimation(file: File): Promise<boolean> {
  const maxBytes = Math.min(file.size, 131072);
  const buffer = await file.slice(0, maxBytes).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const ascii = new TextDecoder('latin1').decode(bytes);
  if (ascii.includes('NETSCAPE2.0') || ascii.includes('ANIMEXTS1.0')) {
    return true;
  }

  // Count Graphic Control Extension (0x21 0xF9) blocks
  let gceCount = 0;
  for (let i = 0; i < bytes.length - 2; i++) {
    if (bytes[i] === 0x21 && bytes[i + 1] === 0xf9) {
      gceCount++;
      if (gceCount > 1) return true;
    }
  }
  return false;
}

export function formatToMimeType(format: SupportedInputFormat): string {
  switch (format) {
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'avif':
      return 'image/avif';
    case 'gif':
      return 'image/gif';
    case 'bmp':
      return 'image/bmp';
    case 'svg':
      return 'image/svg+xml';
    case 'heic':
      return 'image/heic';
    default:
      return 'application/octet-stream';
  }
}

export function formatDisplayName(format: SupportedInputFormat): string {
  switch (format) {
    case 'jpeg':
      return 'JPEG';
    case 'png':
      return 'PNG';
    case 'webp':
      return 'WebP';
    case 'avif':
      return 'AVIF';
    case 'gif':
      return 'GIF';
    case 'bmp':
      return 'BMP';
    case 'svg':
      return 'SVG';
    case 'heic':
      return 'HEIC';
    default:
      return 'Unknown';
  }
}
