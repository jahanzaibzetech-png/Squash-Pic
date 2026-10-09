'use client';

import React from 'react';
import { FileText, RotateCcw } from 'lucide-react';
import { useImageWorkspace } from '@/hooks/use-image-workspace';
import { buildOutputFilename } from '@/lib/image/format-utils';
import { calculateTargetDimensions } from '@/lib/image/resize-image';

const PATTERN_PRESETS = [
  { label: 'Default', pattern: '{name}-{mode}' },
  { label: 'With Dimensions', pattern: '{name}-{width}x{height}' },
  { label: 'Full Spec', pattern: '{name}-{width}x{height}-q{quality}' },
  { label: 'Sequential Batch', pattern: 'product-{index}' },
];

const TOKENS = [
  { token: '{name}', desc: 'Original name' },
  { token: '{width}x{height}', desc: 'Dimensions' },
  { token: 'q{quality}', desc: 'Quality' },
  { token: '{index}', desc: '01, 02...' },
  { token: '{mode}', desc: 'Action' },
  { token: '{date}', desc: 'YYYY-MM-DD' },
];

export function FilenamePatternBuilder() {
  const { settings, updateSettings, selectedItem } = useImageWorkspace();

  const sampleName = selectedItem?.originalName || 'studio-photo.jpg';
  const refW = selectedItem?.width || 1920;
  const refH = selectedItem?.height || 1080;
  const dims = calculateTargetDimensions(refW, refH, settings.resize);

  const previewFilename = buildOutputFilename(
    sampleName,
    settings.outputFormat,
    settings.mode,
    {
      pattern: settings.filenamePattern,
      width: dims.width,
      height: dims.height,
      quality: settings.quality,
      index: 1,
    }
  );

  const appendToken = (tokenStr: string) => {
    const current = settings.filenamePattern.trim();
    const next = current ? `${current}-${tokenStr}` : tokenStr;
    updateSettings({ filenamePattern: next });
  };

  return (
    <div className="space-y-3 pt-3 border-t border-[#E5E2DA]">
      <div className="flex items-center justify-between">
        <label
          htmlFor="filename-pattern-input"
          className="text-xs font-semibold text-[#171A24] tracking-tight flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5 text-[#8178FF]" />
          <span>Output Filename Pattern</span>
        </label>
        {settings.filenamePattern !== '{name}-{mode}' && (
          <button
            type="button"
            onClick={() => updateSettings({ filenamePattern: '{name}-{mode}' })}
            className="inline-flex items-center gap-1 text-[11px] text-[#6E7280] hover:text-[#171A24] cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Default
          </button>
        )}
      </div>

      {/* Input box */}
      <input
        id="filename-pattern-input"
        type="text"
        value={settings.filenamePattern}
        onChange={(e) => updateSettings({ filenamePattern: e.target.value })}
        placeholder="{name}-{mode}"
        className="w-full px-3 py-2 text-xs font-mono bg-[#FFFFFF] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#171A24]"
      />

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-1.5">
        {PATTERN_PRESETS.map((p) => {
          const isSelected = settings.filenamePattern === p.pattern;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => updateSettings({ filenamePattern: p.pattern })}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#171A24] text-[#D7FF64] border-[#171A24]'
                  : 'bg-[#FFFFFF] text-[#6E7280] border-[#E5E2DA] hover:text-[#171A24] hover:border-[#171A24]'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Clickable Tokens */}
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-[11px] text-[#6E7280] mr-1">Insert token:</span>
        {TOKENS.map((t) => (
          <button
            key={t.token}
            type="button"
            onClick={() => appendToken(t.token)}
            className="px-2 py-0.5 text-[11px] font-mono bg-[#F7F5F0] text-[#171A24] border border-[#E5E2DA] rounded hover:border-[#8178FF] transition-colors cursor-pointer"
            title={`Append ${t.desc} token`}
          >
            +{t.token}
          </button>
        ))}
      </div>

      {/* Live Preview */}
      <div className="p-2.5 rounded-lg bg-[#F7F5F0] border border-[#E5E2DA] flex items-center justify-between gap-2 text-xs font-mono tabular-nums">
        <span className="text-[#6E7280] shrink-0">Preview:</span>
        <span className="text-[#171A24] font-semibold truncate" title={previewFilename}>
          {previewFilename}
        </span>
      </div>
    </div>
  );
}
