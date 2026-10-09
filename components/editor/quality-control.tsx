'use client';

import React from 'react';
import { useImageWorkspace } from '@/hooks/use-image-workspace';
import { OUTPUT_FORMATS } from '@/lib/image/format-utils';

export function QualityControl() {
  const { settings, updateSettings, selectedItem } = useImageWorkspace();

  const activeFormat =
    settings.mode === 'compress' &&
    settings.preserveOriginalFormatInCompress &&
    selectedItem &&
    (selectedItem.detectedFormat === 'jpeg' ||
      selectedItem.detectedFormat === 'png' ||
      selectedItem.detectedFormat === 'webp' ||
      selectedItem.detectedFormat === 'avif')
      ? selectedItem.detectedFormat
      : settings.outputFormat;

  const formatInfo = OUTPUT_FORMATS[activeFormat];

  if (!formatInfo.supportsLossyQuality) {
    return (
      <div className="p-3 rounded-md bg-[#F7F5F0] border border-[#E5E2DA] space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-[#171A24]">
          <span>PNG Lossless Encoding</span>
          <span className="font-mono tabular-nums text-[#227A55]">Lossless</span>
        </div>
        <p className="text-xs text-[#6E7280] leading-relaxed">
          {settings.mode === 'compress' && settings.compressionPreset !== 'lossless'
            ? 'In Compress mode, PNG files use palette level quantization to reduce file size while preserving sharp edges and transparency.'
            : 'Standard PNG conversion is 100% lossless and does not use a lossy quality slider. Switch to WebP or AVIF for smaller file sizes.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="quality-slider"
            className="text-xs font-semibold text-[#171A24] tracking-tight"
          >
            Encoding Quality ({formatInfo.label})
          </label>
          <span className="text-xs font-mono font-bold tabular-nums text-[#171A24] bg-[#D7FF64] px-2 py-0.5 rounded">
            {settings.quality}%
          </span>
        </div>

        <input
          id="quality-slider"
          type="range"
          min={1}
          max={100}
          step={1}
          value={settings.quality}
          onChange={(e) =>
            updateSettings({
              quality: Number(e.target.value),
              compressionPreset: 'custom',
            })
          }
          className="w-full h-2 bg-[#E5E2DA] rounded-lg appearance-none cursor-pointer accent-[#171A24]"
        />

        <div className="flex justify-between text-[11px] font-mono tabular-nums text-[#6E7280]">
          <span>1% (Smallest file)</span>
          <span>75–85% (Recommended)</span>
          <span>100% (Max)</span>
        </div>
      </div>

      {/* Optional target size in KB */}
      <div className="pt-2 border-t border-[#E5E2DA] space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="target-kb-input"
            className="text-xs font-medium text-[#171A24]"
          >
            Target Max File Size (Optional)
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id="target-kb-input"
              type="number"
              min={5}
              max={50000}
              placeholder="Auto"
              value={settings.targetSizeKb ?? ''}
              onChange={(e) => {
                const val = e.target.value.trim();
                updateSettings({
                  targetSizeKb: val ? Math.max(5, Number(val)) : null,
                });
              }}
              className="w-24 px-2.5 py-1 text-xs font-mono tabular-nums bg-[#FFFFFF] border border-[#E5E2DA] rounded focus:outline-none focus:border-[#171A24]"
            />
            <span className="text-xs font-mono text-[#6E7280]">KB</span>
          </div>
        </div>
        <p className="text-[11px] text-[#6E7280]">
          Automatically binary-searches encoder quality to fit under your KB budget when possible.
        </p>
      </div>
    </div>
  );
}
