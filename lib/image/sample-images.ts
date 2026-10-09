/**
 * Generates real, rich test images in-browser via HTML5 Canvas so users can immediately
 * test transparent PNG to JPEG/WebP conversion, high-resolution JPEG compression, and batch resizing
 * even before picking local files.
 */
export async function createSampleImages(): Promise<File[]> {
  const files: File[] = [];

  // 1. High-resolution studio botanical & geometric poster (JPEG, 1600x1200)
  const photoCanvas = document.createElement('canvas');
  photoCanvas.width = 1600;
  photoCanvas.height = 1200;
  const pCtx = photoCanvas.getContext('2d');
  if (pCtx) {
    const grad = pCtx.createLinearGradient(0, 0, 1600, 1200);
    grad.addColorStop(0, '#171A24');
    grad.addColorStop(0.55, '#2A2F42');
    grad.addColorStop(1, '#5851DB');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 1600, 1200);

    // Warm sun disc & architectural rings
    const radial = pCtx.createRadialGradient(1120, 420, 40, 1120, 420, 460);
    radial.addColorStop(0, '#D7FF64');
    radial.addColorStop(0.45, '#8178FF');
    radial.addColorStop(1, 'rgba(23, 26, 36, 0)');
    pCtx.fillStyle = radial;
    pCtx.beginPath();
    pCtx.arc(1120, 420, 460, 0, Math.PI * 2);
    pCtx.fill();

    // Fine grid lines for sharp compression comparison
    pCtx.strokeStyle = 'rgba(247, 245, 240, 0.14)';
    pCtx.lineWidth = 2;
    for (let x = 100; x < 1600; x += 100) {
      pCtx.beginPath();
      pCtx.moveTo(x, 0);
      pCtx.lineTo(x, 1200);
      pCtx.stroke();
    }
    for (let y = 100; y < 1200; y += 100) {
      pCtx.beginPath();
      pCtx.moveTo(0, y);
      pCtx.lineTo(1600, y);
      pCtx.stroke();
    }

    // Architectural card specimen
    pCtx.fillStyle = '#F7F5F0';
    pCtx.fillRect(140, 680, 620, 380);
    pCtx.fillStyle = '#171A24';
    pCtx.font = 'bold 54px sans-serif';
    pCtx.fillText('SPECIMEN 01 / STUDIO', 190, 790);
    pCtx.fillStyle = '#6E7280';
    pCtx.font = '28px monospace';
    pCtx.fillText('1600 × 1200 PX · 24-BIT RGB', 190, 855);
    pCtx.fillStyle = '#227A55';
    pCtx.fillRect(190, 910, 240, 16);
    pCtx.fillStyle = '#8178FF';
    pCtx.fillRect(450, 910, 180, 16);

    const jpegBlob = await new Promise<Blob | null>((r) =>
      photoCanvas.toBlob(r, 'image/jpeg', 0.96)
    );
    if (jpegBlob) {
      files.push(
        new File([jpegBlob], 'studio-architecture-specimen.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now(),
        })
      );
    }
  }

  // 2. Transparent Alpha Badge & UI Iconography Graphic (PNG with genuine alpha channel, 1200x900)
  const alphaCanvas = document.createElement('canvas');
  alphaCanvas.width = 1200;
  alphaCanvas.height = 900;
  const aCtx = alphaCanvas.getContext('2d');
  if (aCtx) {
    aCtx.clearRect(0, 0, 1200, 900);

    // Floating geometric layers over transparent background
    aCtx.fillStyle = '#171A24';
    aCtx.beginPath();
    aCtx.roundRect(180, 130, 840, 640, 36);
    aCtx.fill();

    aCtx.fillStyle = '#D7FF64';
    aCtx.beginPath();
    aCtx.arc(420, 450, 175, 0, Math.PI * 2);
    aCtx.fill();

    aCtx.fillStyle = 'rgba(129, 120, 255, 0.85)';
    aCtx.beginPath();
    aCtx.arc(580, 450, 175, 0, Math.PI * 2);
    aCtx.fill();

    aCtx.fillStyle = '#FFFFFF';
    aCtx.font = 'bold 46px sans-serif';
    aCtx.fillText('ALPHA CHANNEL TEST', 340, 250);
    aCtx.font = '24px monospace';
    aCtx.fillStyle = '#D7FF64';
    aCtx.fillText('TRANSPARENT PNG · RGBA 32-BIT', 340, 690);

    const pngBlob = await new Promise<Blob | null>((r) =>
      alphaCanvas.toBlob(r, 'image/png')
    );
    if (pngBlob) {
      files.push(
        new File([pngBlob], 'transparent-ui-badge.png', {
          type: 'image/png',
          lastModified: Date.now(),
        })
      );
    }
  }

  return files;
}
