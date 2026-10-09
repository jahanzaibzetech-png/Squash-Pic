import JSZip from 'jszip';
import { QueuedImage } from '@/types/image';

/**
 * Packages multiple completed image results into a single ZIP archive,
 * automatically deduplicating colliding filenames (e.g. photo-converted.webp, photo-converted-2.webp).
 */
export async function downloadBatchAsZip(
  items: QueuedImage[],
  archiveName = 'squash-optimized-images.zip'
): Promise<number> {
  const completed = items.filter((item) => item.status === 'completed' && item.result?.blob);

  if (completed.length === 0) {
    throw new Error('No processed images are ready for ZIP export.');
  }

  const zip = new JSZip();
  const usedNames = new Map<string, number>();

  for (const item of completed) {
    const res = item.result!;
    let finalName = res.filename;

    const lower = finalName.toLowerCase();
    if (usedNames.has(lower)) {
      const count = usedNames.get(lower)! + 1;
      usedNames.set(lower, count);
      const dotIndex = finalName.lastIndexOf('.');
      if (dotIndex !== -1) {
        finalName = `${finalName.slice(0, dotIndex)}-${count}${finalName.slice(dotIndex)}`;
      } else {
        finalName = `${finalName}-${count}`;
      }
    } else {
      usedNames.set(lower, 1);
    }

    zip.file(finalName, res.blob, { binary: true });
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'STORE', // Images are already compressed; STORE is faster and avoids re-deflating
  });

  const url = URL.createObjectURL(zipBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = archiveName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 5000);

  return completed.length;
}
