import { FormatCapability, OutputFormat, ResizePresetOption, SupportedInputFormat } from '@/types/image';

export const OUTPUT_FORMATS: Record<OutputFormat, Omit<FormatCapability, 'browserEncodingSupported'>> = {
  webp: {
    format: 'webp',
    mimeType: 'image/webp',
    extension: 'webp',
    label: 'WebP',
    tagline: 'Modern web standard',
    useCase: 'Websites, UI assets, e-commerce catalogs, and responsive hero imagery',
    supportsTransparency: true,
    supportsLossyQuality: true,
    supportsLossless: true,
    notes: '25–35% smaller than JPEG at equivalent visual quality with full 8-bit alpha channel support.',
  },
  jpeg: {
    format: 'jpeg',
    mimeType: 'image/jpeg',
    extension: 'jpg',
    label: 'JPEG',
    tagline: 'Universal photo compatibility',
    useCase: 'Photography, email attachments, legacy CMS platforms, and print previews',
    supportsTransparency: false,
    supportsLossyQuality: true,
    supportsLossless: false,
    notes: 'Supported everywhere. Does not support transparency—transparent pixels are filled with your chosen background color.',
  },
  png: {
    format: 'png',
    mimeType: 'image/png',
    extension: 'png',
    label: 'PNG',
    tagline: 'Lossless pixel precision',
    useCase: 'Logos, screenshots, typography, UI diagrams, and transparent graphics',
    supportsTransparency: true,
    supportsLossyQuality: false,
    supportsLossless: true,
    notes: '100% lossless pixel reproduction with full alpha transparency. Larger file sizes for complex photographs.',
  },
  avif: {
    format: 'avif',
    mimeType: 'image/avif',
    extension: 'avif',
    label: 'AVIF',
    tagline: 'Next-gen high compression',
    useCase: 'High-performance web apps, HDR-ready photography, and low-bandwidth delivery',
    supportsTransparency: true,
    supportsLossyQuality: true,
    supportsLossless: false,
    notes: 'Up to 50% smaller than JPEG. Browser encoding requires Chromium/Firefox hardware or software AV1 encoder support.',
  },
};

export const RESIZE_PRESETS: ResizePresetOption[] = [
  {
    id: 'web-hd',
    label: 'Full HD (1920×1080)',
    width: 1920,
    height: 1080,
    description: 'Standard widescreen web hero & presentation banner',
  },
  {
    id: 'social-square',
    label: 'Social Square (1080×1080)',
    width: 1080,
    height: 1080,
    description: 'Instagram, LinkedIn & product carousel square',
  },
  {
    id: 'ecommerce-zoom',
    label: 'Storefront Product (1600×1600)',
    width: 1600,
    height: 1600,
    description: 'Shopify & e-commerce high-DPI zoomable product image',
  },
  {
    id: 'blog-card',
    label: 'Editorial Feature (1200×630)',
    width: 1200,
    height: 630,
    description: 'Open Graph social card & article header',
  },
  {
    id: 'thumbnail',
    label: 'Compact Thumbnail (600×400)',
    width: 600,
    height: 400,
    description: 'Fast-loading preview grid & gallery card',
  },
];

const encoderSupportCache: Partial<Record<OutputFormat, boolean>> = {};

/**
 * Tests whether the current browser natively supports encoding a given MIME type via HTMLCanvasElement.toBlob.
 * Never assumes support without checking the returned Blob's actual MIME type.
 */
export async function checkBrowserEncoderSupport(format: OutputFormat): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  if (encoderSupportCache[format] !== undefined) {
    return encoderSupportCache[format]!;
  }

  const mimeType = OUTPUT_FORMATS[format].mimeType;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.fillStyle = '#171A24';
    ctx.fillRect(0, 0, 2, 2);

    const supported = await new Promise<boolean>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(false);
            return;
          }
          // When a browser doesn't support the requested mimeType, per HTML spec it falls back to image/png
          resolve(blob.type.toLowerCase() === mimeType.toLowerCase());
        },
        mimeType,
        0.8
      );
    });

    encoderSupportCache[format] = supported;
    return supported;
  } catch {
    encoderSupportCache[format] = false;
    return false;
  }
}

export async function getAllFormatCapabilities(): Promise<FormatCapability[]> {
  const formats: OutputFormat[] = ['webp', 'jpeg', 'png', 'avif'];
  const results = await Promise.all(
    formats.map(async (fmt) => {
      const supported = await checkBrowserEncoderSupport(fmt);
      return {
        ...OUTPUT_FORMATS[fmt],
        browserEncodingSupported: supported,
      };
    })
  );
  return results;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${value} ${sizes[i]}`;
}

export function resolveCompressOutputFormat(
  inputFormat: SupportedInputFormat,
  preserveOriginal: boolean,
  fallbackFormat: OutputFormat,
  avifSupported: boolean
): OutputFormat {
  if (!preserveOriginal) return fallbackFormat;

  switch (inputFormat) {
    case 'jpeg':
      return 'jpeg';
    case 'png':
      return 'png';
    case 'webp':
      return 'webp';
    case 'avif':
      return avifSupported ? 'avif' : 'webp';
    default:
      // GIF, BMP, SVG convert to WebP when compressing unless specified
      return 'webp';
  }
}

export interface FilenameBuilderContext {
  pattern?: string;
  width?: number;
  height?: number;
  quality?: number | string;
  index?: number;
}

export function buildOutputFilename(
  originalName: string,
  targetFormat: OutputFormat,
  mode: 'convert' | 'compress' | 'resize',
  context?: FilenameBuilderContext
): string {
  const base =
    originalName
      .replace(/\.[^/.]+$/, '') // strip last extension
      .replace(/[^a-zA-Z0-9._-]/g, '-') // sanitize unsafe chars
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'image';

  const ext = OUTPUT_FORMATS[targetFormat].extension;
  const suffix =
    mode === 'convert' ? 'converted' : mode === 'compress' ? 'compressed' : 'resized';

  const rawPattern = context?.pattern?.trim() || '{name}-{mode}';
  const paddedIndex = String(context?.index ?? 1).padStart(2, '0');
  const dateStr = new Date().toISOString().slice(0, 10);
  const wStr = context?.width ? String(context.width) : '';
  const hStr = context?.height ? String(context.height) : '';
  const qStr =
    targetFormat === 'png'
      ? 'lossless'
      : String(context?.quality ?? 82);

  // Remove trailing .{ext} or .ext if user included it in pattern
  const cleanedPattern = rawPattern
    .replace(/\.?\{ext\}$/i, '')
    .replace(new RegExp(`\\.${ext}$`, 'i'), '');

  const interpolated = cleanedPattern
    .replace(/\{name\}/gi, base)
    .replace(/\{mode\}/gi, suffix)
    .replace(/\{width\}/gi, wStr || 'auto')
    .replace(/\{height\}/gi, hStr || 'auto')
    .replace(/\{quality\}/gi, qStr)
    .replace(/\{format\}/gi, ext)
    .replace(/\{index\}/gi, paddedIndex)
    .replace(/\{date\}/gi, dateStr)
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const finalStem = interpolated || `${base}-${suffix}`;
  return `${finalStem}.${ext}`;
}
