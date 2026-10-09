'use client';

import React from 'react';
import { OutputFormat } from '@/types/image';
import { OUTPUT_FORMATS } from '@/lib/image/format-utils';
import { useImageWorkspace } from '@/hooks/use-image-workspace';
import { AlertCircle } from 'lucide-react';

export function FormatSelector() {
  const { settings, updateSettings, formatCapabilities } = useImageWorkspace();

  const formats: OutputFormat[] = ['webp', 'jpeg', 'png', 'avif'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#171A24] tracking-tight">
          Target Output Format
        </label>
        <span className="text-xs font-mono tabular-nums text-[#6E7280]">
          .{OUTPUT_FORMATS[settings.outputFormat].extension}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {formats.map((fmt) => {
          const info = OUTPUT_FORMATS[fmt];
          const cap = formatCapabilities.find((c) => c.format === fmt);
          const supported = cap ? cap.browserEncodingSupported : true;
          const isSelected = settings.outputFormat === fmt;

          return (
            <button
              key={fmt}
              type="button"
              disabled={!supported}
              onClick={() => updateSettings({ outputFormat: fmt })}
              className={`text-left p-3 rounded-lg border transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                isSelected
                  ? 'bg-[#171A24] text-[#FFFFFF] border-[#171A24]'
                  : 'bg-[#F7F5F0]/60 text-[#171A24] border-[#E5E2DA] hover:border-[#171A24]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-sm font-bold tracking-tight whitespace-nowrap shrink-0">
                  {info.label}
                </span>
                <span
                  className={`text-[11px] font-mono tabular-nums ${
                    isSelected ? 'text-[#D7FF64]' : 'text-[#6E7280]'
                  }`}
                >
                  {info.supportsTransparency ? 'Alpha' : 'Opaque'}
                </span>
              </div>
              <p
                className={`text-xs mt-1 line-clamp-1 ${
                  isSelected ? 'text-[#F7F5F0]/80' : 'text-[#6E7280]'
                }`}
              >
                {supported ? info.tagline : 'Unsupported by browser'}
              </p>
            </button>
          );
        })}
      </div>

      {/* Format specification readout */}
      <div className="p-3 rounded-md bg-[#F7F5F0] border border-[#E5E2DA] text-xs space-y-1">
        <div className="flex items-center justify-between font-medium text-[#171A24]">
          <span>{OUTPUT_FORMATS[settings.outputFormat].label} Specification</span>
          <span className="font-mono tabular-nums text-[#6E7280]">
            {OUTPUT_FORMATS[settings.outputFormat].supportsTransparency
              ? 'Transparency preserved'
              : 'Flattens transparency'}
          </span>
        </div>
        <p className="text-[#6E7280] leading-relaxed">
          {OUTPUT_FORMATS[settings.outputFormat].notes}
        </p>
      </div>

      {formatCapabilities.some((c) => !c.browserEncodingSupported) && (
        <div className="flex items-start gap-2 text-xs text-[#6E7280] pt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#171A24]" />
          <span>
            Formats marked unsupported lack a native encoder in your current browser version.
          </span>
        </div>
      )}
    </div>
  );
}
