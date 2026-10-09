import { calculateTargetDimensions } from '../resize-image';
import { buildOutputFilename, formatBytes, resolveCompressOutputFormat } from '../format-utils';
import { processingSettingsSchema } from '../validate-image';
import { DEFAULT_SETTINGS } from '@/hooks/use-image-workspace';

/**
 * Pure unit assertions for resize math, smart padding canvas fit, custom filename pattern tokens,
 * byte formatting, and Zod schema validation.
 */
export function runImagePipelineUnitAssertions(): { passed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      passed++;
    } else {
      failures.push(message);
    }
  };

  // 1. Default output filename building & sanitization
  assert(
    buildOutputFilename('my photo (1).JPG', 'webp', 'convert') === 'my-photo-1-converted.webp',
    'buildOutputFilename should sanitize spaces/parens and append -converted.webp'
  );
  assert(
    buildOutputFilename('hero_banner.png', 'jpeg', 'compress') === 'hero_banner-compressed.jpg',
    'buildOutputFilename should output .jpg extension for jpeg compress'
  );

  // 2. Custom Filename Pattern Builder token interpolation
  assert(
    buildOutputFilename('chair.png', 'webp', 'resize', {
      pattern: '{name}-{width}x{height}-q{quality}',
      width: 1080,
      height: 1080,
      quality: 82,
      index: 1,
    }) === 'chair-1080x1080-q82.webp',
    'buildOutputFilename should interpolate {name}, {width}, {height}, and {quality} tokens'
  );
  assert(
    buildOutputFilename('raw_item.jpg', 'avif', 'convert', {
      pattern: 'product-{index}',
      index: 4,
    }) === 'product-04.avif',
    'buildOutputFilename should zero-pad {index} token in sequential batch naming'
  );

  // 3. Resize math with locked aspect ratio
  const lockedDims = calculateTargetDimensions(1600, 1200, {
    enabled: true,
    mode: 'dimensions',
    width: 800,
    height: null,
    percentage: 100,
    lockAspectRatio: true,
    preventEnlargement: true,
    presetId: null,
    fitMode: 'scale',
    padColor: '#FFFFFF',
    padMarginPercent: 0,
  });
  assert(
    lockedDims.width === 800 && lockedDims.height === 600 && lockedDims.wasResized === true,
    'calculateTargetDimensions should compute 800x600 for 1600x1200 locked aspect'
  );

  // 4. Smart Padding ("Contain with Background") math
  const smartPadDims = calculateTargetDimensions(1600, 800, {
    enabled: true,
    mode: 'dimensions',
    width: 1080,
    height: 1080,
    percentage: 100,
    lockAspectRatio: true,
    preventEnlargement: true,
    presetId: null,
    fitMode: 'contain-solid',
    padColor: '#FFFFFF',
    padMarginPercent: 0,
  });
  assert(
    smartPadDims.width === 1080 &&
      smartPadDims.height === 1080 &&
      smartPadDims.innerWidth === 1080 &&
      smartPadDims.innerHeight === 540 &&
      smartPadDims.offsetY === 270,
    'calculateTargetDimensions in contain-solid mode should center 1080x540 inside a 1080x1080 canvas at offsetY=270'
  );

  // 5. Prevent enlargement safeguard
  const noEnlargeDims = calculateTargetDimensions(600, 400, {
    enabled: true,
    mode: 'dimensions',
    width: 1920,
    height: 1280,
    percentage: 150,
    lockAspectRatio: true,
    preventEnlargement: true,
    presetId: null,
    fitMode: 'scale',
    padColor: '#FFFFFF',
    padMarginPercent: 0,
  });
  assert(
    noEnlargeDims.width === 600 && noEnlargeDims.height === 400 && noEnlargeDims.wasResized === false,
    'calculateTargetDimensions should prevent upscaling when preventEnlargement is true'
  );

  // 6. Format preservation resolution in compress mode
  assert(
    resolveCompressOutputFormat('png', true, 'webp', true) === 'png',
    'resolveCompressOutputFormat should retain png when preserveOriginal is true'
  );
  assert(
    resolveCompressOutputFormat('avif', true, 'webp', false) === 'webp',
    'resolveCompressOutputFormat should fall back to webp when avif encoder is unavailable'
  );

  // 7. Byte formatting
  assert(formatBytes(1024) === '1 KB', 'formatBytes(1024) should return 1 KB');

  // 8. Zod settings validation
  const parsed = processingSettingsSchema.safeParse(DEFAULT_SETTINGS);
  assert(parsed.success === true, 'DEFAULT_SETTINGS should pass Zod schema validation');

  return { passed, failures };
}
