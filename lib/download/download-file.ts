import { ProcessedResult } from '@/types/image';

/**
 * Triggers a real browser file download from a ProcessedResult Blob.
 */
export function downloadProcessedFile(result: ProcessedResult): void {
  const tempUrl = URL.createObjectURL(result.blob);
  const anchor = document.createElement('a');
  anchor.href = tempUrl;
  anchor.download = result.filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Revoke temporary download URL after browser initiates download
  setTimeout(() => {
    URL.revokeObjectURL(tempUrl);
  }, 3000);
}
