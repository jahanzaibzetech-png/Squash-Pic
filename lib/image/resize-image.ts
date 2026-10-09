import { CanvasFitMode, ProcessingSettings } from '@/types/image';
import { MAX_CANVAS_DIMENSION, MAX_CANVAS_PIXELS } from './validate-image';
import { RESIZE_PRESETS } from './format-utils';

export interface ComputedDimensions {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  offsetX: number;
  offsetY: number;
  fitMode: CanvasFitMode;
  padColor: string;
  wasResized: boolean;
  scaleFactor: number;
}

/**
 * Calculates target output dimensions and inner contained placement based on user resize settings,
 * aspect ratio lock, enlargement protection, and Smart Padding / Canvas Fit mode.
 */
export function calculateTargetDimensions(
  originalWidth: number,
  originalHeight: number,
  resizeConfig: ProcessingSettings['resize']
): ComputedDimensions {
  const fitMode: CanvasFitMode = resizeConfig.fitMode || 'scale';
  const padColor = resizeConfig.padColor || '#FFFFFF';
  const padMarginPct = Math.max(0, Math.min(25, resizeConfig.padMarginPercent || 0));

  if (!resizeConfig.enabled || resizeConfig.mode === 'none') {
    return {
      width: originalWidth,
      height: originalHeight,
      innerWidth: originalWidth,
      innerHeight: originalHeight,
      offsetX: 0,
      offsetY: 0,
      fitMode: 'scale',
      padColor,
      wasResized: false,
      scaleFactor: 1,
    };
  }

  const aspect = originalWidth / originalHeight;
  let targetW = originalWidth;
  let targetH = originalHeight;

  // Smart Padding / Canvas Fit mode ("contain-solid" or "contain-blur")
  const isContainCanvasFit =
    (fitMode === 'contain-solid' || fitMode === 'contain-blur') &&
    (resizeConfig.mode === 'preset' ||
      resizeConfig.mode === 'dimensions' ||
      resizeConfig.mode === 'max-bounds');

  if (isContainCanvasFit) {
    let frameW = originalWidth;
    let frameH = originalHeight;

    if (resizeConfig.mode === 'preset') {
      const preset = RESIZE_PRESETS.find((p) => p.id === resizeConfig.presetId);
      if (preset) {
        frameW = preset.width;
        frameH = preset.height;
      }
    } else {
      frameW = resizeConfig.width || originalWidth;
      frameH = resizeConfig.height || frameW;
    }

    frameW = Math.min(MAX_CANVAS_DIMENSION, Math.max(1, frameW));
    frameH = Math.min(MAX_CANVAS_DIMENSION, Math.max(1, frameH));

    const marginRatio = Math.max(0.2, 1 - (padMarginPct * 2) / 100);
    const availW = Math.max(1, frameW * marginRatio);
    const availH = Math.max(1, frameH * marginRatio);

    const containScale = Math.min(availW / originalWidth, availH / originalHeight);
    const finalScale = resizeConfig.preventEnlargement
      ? Math.min(1, containScale)
      : containScale;

    const innerW = Math.max(1, Math.round(originalWidth * finalScale));
    const innerH = Math.max(1, Math.round(originalHeight * finalScale));
    const offsetX = Math.round((frameW - innerW) / 2);
    const offsetY = Math.round((frameH - innerH) / 2);

    return {
      width: frameW,
      height: frameH,
      innerWidth: innerW,
      innerHeight: innerH,
      offsetX,
      offsetY,
      fitMode,
      padColor,
      wasResized: true,
      scaleFactor: finalScale,
    };
  }

  // Standard Scale / Proportional / Exact resize modes
  if (resizeConfig.mode === 'percentage') {
    const pct = Math.max(1, Math.min(200, resizeConfig.percentage || 100));
    if (resizeConfig.preventEnlargement && pct > 100) {
      targetW = originalWidth;
      targetH = originalHeight;
    } else {
      targetW = Math.max(1, Math.round((originalWidth * pct) / 100));
      targetH = Math.max(1, Math.round((originalHeight * pct) / 100));
    }
  } else if (resizeConfig.mode === 'preset') {
    const preset = RESIZE_PRESETS.find((p) => p.id === resizeConfig.presetId);
    if (preset) {
      if (resizeConfig.lockAspectRatio) {
        const scale = Math.min(preset.width / originalWidth, preset.height / originalHeight);
        const finalScale = resizeConfig.preventEnlargement ? Math.min(1, scale) : scale;
        targetW = Math.max(1, Math.round(originalWidth * finalScale));
        targetH = Math.max(1, Math.round(originalHeight * finalScale));
      } else {
        targetW = resizeConfig.preventEnlargement
          ? Math.min(originalWidth, preset.width)
          : preset.width;
        targetH = resizeConfig.preventEnlargement
          ? Math.min(originalHeight, preset.height)
          : preset.height;
      }
    }
  } else if (resizeConfig.mode === 'max-bounds') {
    const maxW = resizeConfig.width || originalWidth;
    const maxH = resizeConfig.height || originalHeight;
    const scale = Math.min(maxW / originalWidth, maxH / originalHeight);
    const finalScale = resizeConfig.preventEnlargement ? Math.min(1, scale) : scale;
    targetW = Math.max(1, Math.round(originalWidth * finalScale));
    targetH = Math.max(1, Math.round(originalHeight * finalScale));
  } else if (resizeConfig.mode === 'dimensions') {
    const reqW = resizeConfig.width;
    const reqH = resizeConfig.height;

    if (reqW && reqH) {
      if (resizeConfig.lockAspectRatio) {
        targetW = reqW;
        targetH = Math.max(1, Math.round(reqW / aspect));
      } else {
        targetW = reqW;
        targetH = reqH;
      }
    } else if (reqW && !reqH) {
      targetW = reqW;
      targetH = resizeConfig.lockAspectRatio
        ? Math.max(1, Math.round(reqW / aspect))
        : originalHeight;
    } else if (!reqW && reqH) {
      targetH = reqH;
      targetW = resizeConfig.lockAspectRatio
        ? Math.max(1, Math.round(reqH * aspect))
        : originalWidth;
    }

    if (resizeConfig.preventEnlargement) {
      if (targetW > originalWidth || targetH > originalHeight) {
        if (resizeConfig.lockAspectRatio) {
          targetW = originalWidth;
          targetH = originalHeight;
        } else {
          targetW = Math.min(targetW, originalWidth);
          targetH = Math.min(targetH, originalHeight);
        }
      }
    }
  }

  // Clamp to safe browser canvas boundaries
  targetW = Math.min(MAX_CANVAS_DIMENSION, Math.max(1, targetW));
  targetH = Math.min(MAX_CANVAS_DIMENSION, Math.max(1, targetH));

  if (targetW * targetH > MAX_CANVAS_PIXELS) {
    const clampScale = Math.sqrt(MAX_CANVAS_PIXELS / (targetW * targetH));
    targetW = Math.max(1, Math.floor(targetW * clampScale));
    targetH = Math.max(1, Math.floor(targetH * clampScale));
  }

  const wasResized = targetW !== originalWidth || targetH !== originalHeight;
  return {
    width: targetW,
    height: targetH,
    innerWidth: targetW,
    innerHeight: targetH,
    offsetX: 0,
    offsetY: 0,
    fitMode: 'scale',
    padColor,
    wasResized,
    scaleFactor: targetW / originalWidth,
  };
}

/**
 * Draws the source image onto a target canvas using multi-step high-quality downsampling,
 * supporting Smart Padding ("Contain with Solid Background" or "Contain with Blurred Backdrop").
 */
export function renderResizedCanvas(
  source: ImageBitmap | HTMLImageElement,
  sourceWidth: number,
  sourceHeight: number,
  dims: ComputedDimensions,
  fillBackgroundColor: string | null
): HTMLCanvasElement {
  const { width: targetWidth, height: targetHeight, innerWidth, innerHeight, offsetX, offsetY, fitMode, padColor } = dims;

  const destCanvas = document.createElement('canvas');
  destCanvas.width = targetWidth;
  destCanvas.height = targetHeight;

  const isOpaqueBackdrop =
    fillBackgroundColor !== null ||
    fitMode === 'contain-solid' ||
    fitMode === 'contain-blur';

  const destCtx = destCanvas.getContext('2d', { alpha: !isOpaqueBackdrop });

  if (!destCtx) {
    throw new Error('Could not initialize 2D rendering context. Browser memory may be full.');
  }

  destCtx.imageSmoothingEnabled = true;
  destCtx.imageSmoothingQuality = 'high';

  // 1. Render Backdrop Layer
  if (fitMode === 'contain-blur') {
    // Base fill in case of edges
    destCtx.fillStyle = fillBackgroundColor || '#171A24';
    destCtx.fillRect(0, 0, targetWidth, targetHeight);

    // Draw cover-scaled blurred backdrop
    const coverScale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight) * 1.12;
    const coverW = sourceWidth * coverScale;
    const coverH = sourceHeight * coverScale;
    const coverX = (targetWidth - coverW) / 2;
    const coverY = (targetHeight - coverH) / 2;

    destCtx.save();
    destCtx.filter = 'blur(28px) brightness(0.9)';
    destCtx.drawImage(source, 0, 0, sourceWidth, sourceHeight, coverX, coverY, coverW, coverH);
    destCtx.restore();
  } else if (fitMode === 'contain-solid') {
    destCtx.fillStyle = padColor || fillBackgroundColor || '#FFFFFF';
    destCtx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (fillBackgroundColor) {
    destCtx.fillStyle = fillBackgroundColor;
    destCtx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // 2. Step-down scaling if shrinking foreground significantly (>2x reduction) for superior sharpness
  let curWidth = sourceWidth;
  let curHeight = sourceHeight;
  let currentSource: CanvasImageSource = source;

  if (innerWidth < sourceWidth * 0.5 && innerHeight < sourceHeight * 0.5) {
    while (curWidth * 0.5 > innerWidth && curHeight * 0.5 > innerHeight) {
      const nextW = Math.max(innerWidth, Math.floor(curWidth * 0.5));
      const nextH = Math.max(innerHeight, Math.floor(curHeight * 0.5));

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = nextW;
      tempCanvas.height = nextH;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) break;
      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = 'high';
      tempCtx.drawImage(currentSource, 0, 0, curWidth, curHeight, 0, 0, nextW, nextH);

      currentSource = tempCanvas;
      curWidth = nextW;
      curHeight = nextH;
    }
  }

  // 3. Draw Foreground Image at (offsetX, offsetY) with dimensions (innerWidth, innerHeight)
  if (fitMode === 'contain-blur' && (offsetX > 0 || offsetY > 0)) {
    destCtx.save();
    destCtx.shadowColor = 'rgba(0, 0, 0, 0.28)';
    destCtx.shadowBlur = Math.max(12, Math.round(Math.min(targetWidth, targetHeight) * 0.025));
    destCtx.shadowOffsetY = 4;
    destCtx.drawImage(
      currentSource,
      0,
      0,
      curWidth,
      curHeight,
      offsetX,
      offsetY,
      innerWidth,
      innerHeight
    );
    destCtx.restore();
  } else {
    destCtx.drawImage(
      currentSource,
      0,
      0,
      curWidth,
      curHeight,
      offsetX,
      offsetY,
      innerWidth,
      innerHeight
    );
  }

  return destCanvas;
}
