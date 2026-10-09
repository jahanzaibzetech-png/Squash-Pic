'use client';

import React from 'react';
import {
  Download,
  Trash2,
  Play,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { ProcessingSettings, QueuedImage } from '@/types/image';
import {
  formatBytes,
  OUTPUT_FORMATS,
  resolveCompressOutputFormat,
} from '@/lib/image/format-utils';
import { formatDisplayName } from '@/lib/image/detect-format';
import { estimateOutputSizeBytes } from '@/lib/image/convert-image';
import { calculateTargetDimensions } from '@/lib/image/resize-image';
import { downloadProcessedFile } from '@/lib/download/download-file';

interface ImageQueueItemProps {
  item: QueuedImage;
  settings: ProcessingSettings;
  isSelected: boolean;
  avifSupported: boolean;
  onSelect: () => void;
  onProcess: () => void;
  onRemove: () => void;
}

export function ImageQueueItem({
  item,
  settings,
  isSelected,
  avifSupported,
  onSelect,
  onProcess,
  onRemove,
}: ImageQueueItemProps) {
  const estimatedBytes = estimateOutputSizeBytes(item, settings);
  const targetDims = calculateTargetDimensions(item.width, item.height, settings.resize);

  let targetFormat = settings.outputFormat;
  if (settings.mode === 'compress') {
    targetFormat = resolveCompressOutputFormat(
      item.detectedFormat,
      settings.preserveOriginalFormatInCompress,
      settings.outputFormat,
      avifSupported
    );
  } else if (settings.mode === 'resize') {
    if (
      item.detectedFormat === 'jpeg' ||
      item.detectedFormat === 'png' ||
      item.detectedFormat === 'webp' ||
      (item.detectedFormat === 'avif' && avifSupported)
    ) {
      targetFormat = item.detectedFormat;
    }
  }

  const res = item.result;
  const allWarnings = res ? res.warnings : item.warnings;

  return (
    <div
      onClick={onSelect}
      className={`group rounded-lg border transition-colors p-3.5 sm:p-4 cursor-pointer ${
        isSelected
          ? 'bg-[#FFFFFF] border-[#171A24] ring-1 ring-[#171A24]'
          : 'bg-[#FFFFFF] border-[#E5E2DA] hover:border-[#171A24]/50'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Thumbnail + File info */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          <div className="relative w-14 h-14 rounded-md overflow-hidden border border-[#E5E2DA] bg-checkerboard shrink-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={res?.url || item.previewUrl}
              alt={item.originalName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <p
                className="text-sm font-semibold text-[#171A24] truncate"
                title={item.originalName}
              >
                {item.originalName}
              </p>
            </div>

            {/* Clean unboxed metadata with typographic separators */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono tabular-nums text-[#6E7280]">
              <span className="text-[#171A24] font-medium">
                {formatDisplayName(item.detectedFormat)}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {item.width}×{item.height}
              </span>
              <span aria-hidden="true">·</span>
              <span>{formatBytes(item.originalSize)}</span>
              {item.hasTransparency && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Alpha</span>
                </>
              )}
              {item.isAnimated && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#C53E4D]">Animated</span>
                </>
              )}
            </div>

            {/* Target / Result line */}
            {res ? (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono tabular-nums">
                <span className="text-[#227A55] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  {OUTPUT_FORMATS[res.format].label}
                </span>
                <span aria-hidden="true" className="text-[#6E7280]">
                  ·
                </span>
                <span className="text-[#171A24]">
                  {res.width}×{res.height}
                </span>
                <span aria-hidden="true" className="text-[#6E7280]">
                  ·
                </span>
                <span className="font-semibold text-[#171A24]">
                  {formatBytes(res.sizeBytes)}
                </span>
                <span aria-hidden="true" className="text-[#6E7280]">
                  ·
                </span>
                {res.savingsBytes > 0 ? (
                  <span className="text-[#227A55] font-semibold">
                    −{res.savingsPercent.toFixed(1)}% ({formatBytes(res.savingsBytes)} saved)
                  </span>
                ) : res.savingsBytes === 0 ? (
                  <span className="text-[#6E7280]">0% change (Original kept)</span>
                ) : (
                  <span className="text-[#C53E4D] font-medium">
                    +{Math.abs(res.savingsPercent).toFixed(1)}% larger
                  </span>
                )}
                <span aria-hidden="true" className="text-[#6E7280]">
                  ·
                </span>
                <span className="text-[#6E7280]">{res.durationMs}ms</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono tabular-nums text-[#6E7280]">
                <span>Target: {OUTPUT_FORMATS[targetFormat].label}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {targetDims.width}×{targetDims.height}
                </span>
                <span aria-hidden="true">·</span>
                <span>Est. ~{formatBytes(estimatedBytes)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div
          className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5E2DA]"
          onClick={(e) => e.stopPropagation()}
        >
          {item.status === 'processing' || item.status === 'queued' ? (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#171A24] bg-[#F7F5F0] rounded-md"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8178FF]" />
              {item.status === 'processing' ? 'Processing...' : 'Queued'}
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={onSelect}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#F7F5F0] text-[#171A24] border border-[#171A24]/30'
                    : 'text-[#6E7280] hover:text-[#171A24] hover:bg-[#F7F5F0]'
                }`}
                title="Inspect before and after comparison"
              >
                <Eye className="w-3.5 h-3.5" />
                Compare
              </button>

              <button
                type="button"
                onClick={onProcess}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#171A24] bg-[#F7F5F0] border border-[#E5E2DA] rounded-md hover:border-[#171A24] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                title="Process this image with current settings"
              >
                <Play className="w-3.5 h-3.5" />
                {res ? 'Re-run' : 'Process'}
              </button>

              {res && (
                <button
                  type="button"
                  onClick={() => downloadProcessedFile(res)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#D7FF64] text-[#171A24] rounded-md hover:bg-[#c8f542] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              )}

              <button
                type="button"
                onClick={onRemove}
                className="p-1.5 text-[#6E7280] hover:text-[#C53E4D] hover:bg-[#C53E4D]/10 rounded-md transition-colors cursor-pointer"
                aria-label={`Remove ${item.originalName} from queue`}
                title="Remove from queue"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Inline Warnings & Errors */}
      {item.error && (
        <div
          role="alert"
          className="mt-3 pt-2.5 border-t border-[#C53E4D]/20 flex items-start gap-2 text-xs text-[#C53E4D]"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{item.error}</span>
        </div>
      )}

      {!item.error && allWarnings.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-[#E5E2DA] space-y-1">
          {allWarnings.map((w, idx) => (
            <div
              key={`${w.code}-${idx}`}
              className="flex items-start gap-2 text-xs text-[#6E7280]"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#171A24] shrink-0 mt-0.5" />
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
