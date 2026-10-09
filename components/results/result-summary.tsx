'use client';

import React, { useState } from 'react';
import { Archive, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useImageWorkspace } from '@/hooks/use-image-workspace';
import { formatBytes } from '@/lib/image/format-utils';
import { downloadBatchAsZip } from '@/lib/download/download-zip';

export function ResultSummary() {
  const { queue } = useImageWorkspace();
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [copiedStats, setCopiedStats] = useState(false);

  const completedItems = queue.filter((i) => i.status === 'completed' && i.result);
  if (completedItems.length === 0) return null;

  const totalOriginalBytes = completedItems.reduce((acc, i) => acc + i.originalSize, 0);
  const totalOutputBytes = completedItems.reduce(
    (acc, i) => acc + (i.result?.sizeBytes || 0),
    0
  );
  const netSavedBytes = totalOriginalBytes - totalOutputBytes;
  const netSavedPercent =
    totalOriginalBytes > 0 ? (netSavedBytes / totalOriginalBytes) * 100 : 0;

  const handleZipDownload = async () => {
    setIsExportingZip(true);
    try {
      const count = await downloadBatchAsZip(completedItems);
      toast.success(`Packaged ${count} optimized ${count === 1 ? 'image' : 'images'} into ZIP archive.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create ZIP archive.';
      toast.error(msg);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleCopyStats = async () => {
    const summaryText = [
      `squash Batch Optimization Report`,
      `Files processed: ${completedItems.length}`,
      `Original total: ${formatBytes(totalOriginalBytes)}`,
      `Optimized total: ${formatBytes(totalOutputBytes)}`,
      `Net change: ${netSavedBytes >= 0 ? `-${netSavedPercent.toFixed(1)}% (${formatBytes(netSavedBytes)} saved)` : `+${Math.abs(netSavedPercent).toFixed(1)}%`}`,
      ...completedItems.map(
        (i) =>
          `- ${i.originalName} (${formatBytes(i.originalSize)}) -> ${i.result!.filename} (${formatBytes(i.result!.sizeBytes)})`
      ),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedStats(true);
      toast.success('Batch statistics copied to clipboard.');
      setTimeout(() => setCopiedStats(false), 2000);
    } catch {
      toast.error('Clipboard access was denied by browser.');
    }
  };

  return (
    <div className="rounded-lg bg-[#171A24] text-[#F7F5F0] p-4 sm:p-5 border border-[#2A2E3D]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-[#D7FF64]">
            <span>BATCH SUMMARY</span>
            <span aria-hidden="true">·</span>
            <span>
              {completedItems.length} of {queue.length} processed
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 pt-1 font-mono tabular-nums">
            <div>
              <span className="text-xs text-[#F7F5F0]/70 block">Original Total</span>
              <span className="text-base font-bold text-[#FFFFFF]">
                {formatBytes(totalOriginalBytes)}
              </span>
            </div>
            <span className="text-[#F7F5F0]/40">→</span>
            <div>
              <span className="text-xs text-[#F7F5F0]/70 block">Optimized Total</span>
              <span className="text-base font-bold text-[#D7FF64]">
                {formatBytes(totalOutputBytes)}
              </span>
            </div>
            <span className="text-[#F7F5F0]/40">·</span>
            <div>
              <span className="text-xs text-[#F7F5F0]/70 block">Net Delta</span>
              <span className="text-base font-bold text-[#FFFFFF]">
                {netSavedBytes >= 0
                  ? `−${netSavedPercent.toFixed(1)}% (${formatBytes(netSavedBytes)} saved)`
                  : `+${Math.abs(netSavedPercent).toFixed(1)}%`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCopyStats}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#2A2F42] text-[#F7F5F0] rounded-md hover:bg-[#363C52] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedStats ? (
              <Check className="w-3.5 h-3.5 text-[#D7FF64]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copiedStats ? 'Copied Report' : 'Copy Stats'}
          </button>

          <button
            type="button"
            onClick={handleZipDownload}
            disabled={isExportingZip}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#D7FF64] text-[#171A24] rounded-md hover:bg-[#c8f542] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Archive className="w-4 h-4" />
            {isExportingZip
              ? 'Building ZIP...'
              : `Download All as ZIP (${completedItems.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
