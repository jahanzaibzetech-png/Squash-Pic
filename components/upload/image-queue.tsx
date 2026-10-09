'use client';

import React from 'react';
import { useImageWorkspace } from '@/hooks/use-image-workspace';
import { ImageQueueItem } from './image-queue-item';
import { RotateCcw, Trash2, XCircle } from 'lucide-react';

export function ImageQueue() {
  const {
    queue,
    selectedItemId,
    setSelectedItemId,
    settings,
    formatCapabilities,
    processSingle,
    removeFile,
    clearQueue,
    retryFailed,
    cancelBatch,
    isProcessingBatch,
  } = useImageWorkspace();

  if (queue.length === 0) return null;

  const avifCap = formatCapabilities.find((c) => c.format === 'avif');
  const avifSupported = avifCap ? avifCap.browserEncodingSupported : true;
  const failedCount = queue.filter((i) => i.status === 'error' || i.status === 'cancelled').length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-[#6E7280]">
          <span className="font-semibold text-[#171A24] text-sm font-sans">
            Processing Queue
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {queue.length} {queue.length === 1 ? 'file' : 'files'}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {queue.filter((i) => i.status === 'completed').length} completed
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isProcessingBatch && (
            <button
              type="button"
              onClick={cancelBatch}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#C53E4D] bg-[#C53E4D]/10 rounded-md hover:bg-[#C53E4D]/20 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel Batch
            </button>
          )}

          {failedCount > 0 && !isProcessingBatch && (
            <button
              type="button"
              onClick={retryFailed}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#171A24] bg-[#FFFFFF] border border-[#E5E2DA] rounded-md hover:border-[#171A24] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry Failed ({failedCount})
            </button>
          )}

          <button
            type="button"
            onClick={clearQueue}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#6E7280] hover:text-[#C53E4D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Queue
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        {queue.map((item) => (
          <ImageQueueItem
            key={item.id}
            item={item}
            settings={settings}
            isSelected={item.id === selectedItemId}
            avifSupported={avifSupported}
            onSelect={() => setSelectedItemId(item.id)}
            onProcess={() => processSingle(item.id)}
            onRemove={() => removeFile(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
