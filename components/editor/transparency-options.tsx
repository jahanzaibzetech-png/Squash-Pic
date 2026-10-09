'use client';

import React from 'react';
import { useImageWorkspace } from '@/hooks/use-image-workspace';

const SWATCHES = [
  { hex: '#FFFFFF', label: 'Pure White' },
  { hex: '#F7F5F0', label: 'Warm Paper' },
  { hex: '#171A24', label: 'Deep Ink' },
  { hex: '#000000', label: 'Jet Black' },
];

export function TransparencyOptions() {
  const { settings, updateSettings, queue } = useImageWorkspace();

  const anyTransparentInQueue = queue.some((i) => i.hasTransparency);
  const isExportingJpeg = settings.outputFormat === 'jpeg';

  if (!isExportingJpeg && !anyTransparentInQueue) {
    return null;
  }

  return (
    <div className="space-y-2.5 pt-3 border-t border-[#E5E2DA]">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#171A24] tracking-tight">
          Transparency Matte Background (JPEG)
        </label>
        <span className="text-xs font-mono tabular-nums text-[#6E7280]">
          {settings.backgroundColor.toUpperCase()}
        </span>
      </div>

      <p className="text-xs text-[#6E7280] leading-relaxed">
        JPEG does not support alpha transparency. Transparent pixels are composited over this matte color.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {SWATCHES.map((swatch) => {
          const isSelected =
            settings.backgroundColor.toLowerCase() === swatch.hex.toLowerCase();
          return (
            <button
              key={swatch.hex}
              type="button"
              onClick={() => updateSettings({ backgroundColor: swatch.hex })}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                isSelected
                  ? 'border-[#171A24] bg-[#171A24] text-[#FFFFFF]'
                  : 'border-[#E5E2DA] bg-[#FFFFFF] text-[#171A24] hover:border-[#171A24]'
              }`}
            >
              <span
                className="w-3 h-3 rounded-sm border border-[#171A24]/20 shrink-0"
                style={{ backgroundColor: swatch.hex }}
              />
              <span>{swatch.label}</span>
            </button>
          );
        })}

        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#E5E2DA] bg-[#FFFFFF] text-xs font-mono cursor-pointer hover:border-[#171A24]">
          <input
            type="color"
            value={settings.backgroundColor}
            onChange={(e) => updateSettings({ backgroundColor: e.target.value })}
            className="w-4 h-4 border-0 p-0 bg-transparent cursor-pointer"
            aria-label="Custom background hex color"
          />
          <span>Custom</span>
        </label>
      </div>
    </div>
  );
}
