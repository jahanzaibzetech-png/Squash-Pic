'use client';

import React from 'react';
import { CompressionPreset } from '@/types/image';
import { useImageWorkspace } from '@/hooks/use-image-workspace';

const PRESET_DEFINITIONS: {
  id: CompressionPreset;
  label: string;
  qualityNote: string;
  description: string;
}[] = [
  {
    id: 'balanced',
    label: 'Balanced',
    qualityNote: 'Q78',
    description: 'Good visual quality with meaningful file-size reduction.',
  },
  {
    id: 'small',
    label: 'Small File',
    qualityNote: 'Q56',
    description: 'Prioritize smaller output files for fast page loads.',
  },
  {
    id: 'high',
    label: 'High Quality',
    qualityNote: 'Q90',
    description: 'Keep visual appearance very close to the original.',
  },
  {
    id: 'lossless',
    label: 'Lossless',
    qualityNote: 'Q100',
    description: 'Retain maximum pixel fidelity without quantization loss.',
  },
];

export function CompressionPresets() {
  const { settings, applyCompressionPreset, updateSettings } = useImageWorkspace();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#171A24] tracking-tight">
          Compression Preset
        </label>
        <span className="text-xs font-mono tabular-nums text-[#6E7280]">
          {settings.compressionPreset === 'custom'
            ? `Custom (Q${settings.quality})`
            : settings.compressionPreset.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {PRESET_DEFINITIONS.map((preset) => {
          const isActive = settings.compressionPreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyCompressionPreset(preset.id)}
              className={`text-left p-2.5 rounded-lg border transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#171A24] text-[#FFFFFF] border-[#171A24]'
                  : 'bg-[#F7F5F0]/60 text-[#171A24] border-[#E5E2DA] hover:border-[#171A24]'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold whitespace-nowrap shrink-0">
                  {preset.label}
                </span>
                <span
                  className={`text-[11px] font-mono tabular-nums ${
                    isActive ? 'text-[#D7FF64]' : 'text-[#6E7280]'
                  }`}
                >
                  {preset.qualityNote}
                </span>
              </div>
              <p
                className={`text-[11px] mt-1 leading-snug ${
                  isActive ? 'text-[#F7F5F0]/80' : 'text-[#6E7280]'
                }`}
              >
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>

      {settings.mode === 'compress' && (
        <label className="flex items-center justify-between gap-3 pt-2 text-xs text-[#171A24] cursor-pointer select-none">
          <span>Keep original format when supported (JPEG, PNG, WebP, AVIF)</span>
          <input
            type="checkbox"
            checked={settings.preserveOriginalFormatInCompress}
            onChange={(e) =>
              updateSettings({ preserveOriginalFormatInCompress: e.target.checked })
            }
            className="w-4 h-4 accent-[#171A24] rounded cursor-pointer"
          />
        </label>
      )}
    </div>
  );
}
