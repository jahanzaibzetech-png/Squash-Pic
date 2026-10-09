'use client';

import React, { useEffect, useState } from 'react';
import {
  Play,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
} from 'lucide-react';
import { ToolMode } from '@/types/image';
import { useImageWorkspace } from '@/hooks/use-image-workspace';
import { Dropzone } from '@/components/upload/dropzone';
import { ImageQueue } from '@/components/upload/image-queue';
import { FormatSelector } from '@/components/editor/format-selector';
import { CompressionPresets } from '@/components/editor/compression-presets';
import { QualityControl } from '@/components/editor/quality-control';
import { ResizeControls } from '@/components/editor/resize-controls';
import { TransparencyOptions } from '@/components/editor/transparency-options';
import { FilenamePatternBuilder } from '@/components/editor/filename-pattern-builder';
import { ImageComparison } from '@/components/comparison/image-comparison';
import { ResultSummary } from '@/components/results/result-summary';
import { PWAInstallButton } from '@/components/pwa/pwa-install-controls';
import { formatBytes } from '@/lib/image/format-utils';

interface ImageWorkspaceProps {
  initialMode?: ToolMode;
  showModeTabs?: boolean;
}

export function ImageWorkspace({
  initialMode,
  showModeTabs = true,
}: ImageWorkspaceProps) {
  const {
    queue,
    selectedItem,
    settings,
    setToolMode,
    updateSettings,
    resetSettings,
    processAll,
    processSingle,
    isProcessingBatch,
    sessionHistory,
    maxFileSizeMb,
    setMaxFileSizeMb,
    autoProcess,
    setAutoProcess,
  } = useImageWorkspace();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPreUploadSettings, setShowPreUploadSettings] = useState(false);

  useEffect(() => {
    if (initialMode) {
      setToolMode(initialMode);
    }
  }, [initialMode, setToolMode]);

  const primaryActionLabel =
    settings.mode === 'convert'
      ? queue.length > 1
        ? `Re-convert ${queue.length} Images`
        : 'Re-convert Image'
      : settings.mode === 'compress'
      ? queue.length > 1
        ? `Re-compress ${queue.length} Images`
        : 'Re-compress Image'
      : queue.length > 1
      ? `Re-resize ${queue.length} Images`
      : 'Re-resize Image';

  const modeTabs: { id: ToolMode; label: string; summary: string }[] = [
    {
      id: 'convert',
      label: 'Convert',
      summary: 'Convert between WebP, AVIF, PNG, and JPEG.',
    },
    {
      id: 'compress',
      label: 'Compress',
      summary: 'Shrink file sizes with calibrated quality presets.',
    },
    {
      id: 'resize',
      label: 'Resize',
      summary: 'Scale pixel dimensions with locked aspect ratio.',
    },
  ];

  return (
    <section id="workspace-anchor" className="space-y-5">
      {/* Minimalist Mode Switcher Bar */}
      {showModeTabs && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Image Optimization Mode"
            className="inline-flex items-center gap-1 p-1 bg-[#FFFFFF] border border-[#E5E2DA] rounded-xl self-start"
          >
            {modeTabs.map((tab) => {
              const isActive = settings.mode === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  type="button"
                  onClick={() => setToolMode(tab.id)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#171A24] text-[#D7FF64]'
                      : 'text-[#6E7280] hover:text-[#171A24]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 text-xs text-[#6E7280]">
            <span>{modeTabs.find((t) => t.id === settings.mode)?.summary}</span>
            {queue.length === 0 && (
              <button
                type="button"
                onClick={() => setShowPreUploadSettings((s) => !s)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-[#171A24] bg-[#FFFFFF] border border-[#E5E2DA] rounded-lg hover:border-[#171A24] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {showPreUploadSettings ? 'Hide options' : 'Options'}
              </button>
            )}
            <PWAInstallButton />
          </div>
        </div>
      )}

      {/* Empty State: Focused Full-Width Minimalist Dropzone + Optional Collapsible Settings */}
      {queue.length === 0 ? (
        <div className="space-y-4">
          <Dropzone />

          {showPreUploadSettings && (
            <div className="rounded-xl border border-[#E5E2DA] bg-[#FFFFFF] p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DA]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#171A24]" />
                  <h3 className="font-display text-sm font-bold text-[#171A24] tracking-tight">
                    Default {settings.mode.charAt(0).toUpperCase() + settings.mode.slice(1)} Settings
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={resetSettings}
                  className="inline-flex items-center gap-1 text-xs text-[#6E7280] hover:text-[#171A24] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {settings.mode === 'convert' && (
                  <>
                    <FormatSelector />
                    <QualityControl />
                  </>
                )}

                {settings.mode === 'compress' && (
                  <>
                    <CompressionPresets />
                    <QualityControl />
                  </>
                )}

                {settings.mode === 'resize' && (
                  <>
                    <ResizeControls forceExpanded />
                    <FormatSelector />
                  </>
                )}
              </div>

              <FilenamePatternBuilder />
            </div>
          )}
        </div>
      ) : (
        /* Active Two-Column Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (Batch Summary + Queue + Comparison) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5">
            <ResultSummary />

            <ImageQueue />

            {selectedItem && (
              <ImageComparison
                item={selectedItem}
                onProcessItem={() => processSingle(selectedItem.id)}
              />
            )}

            <Dropzone compact />
          </div>

          {/* Right Column (Minimalist Sticky Settings Sidebar) */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20 rounded-xl border border-[#E5E2DA] bg-[#FFFFFF] p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DA]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#171A24]" />
                <h3 className="font-display text-sm font-bold text-[#171A24] tracking-tight">
                  Settings
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <label
                  className="inline-flex items-center gap-1.5 text-xs text-[#6E7280] cursor-pointer select-none"
                  title="Automatically re-process images when you change any setting"
                >
                  <input
                    type="checkbox"
                    checked={autoProcess}
                    onChange={(e) => setAutoProcess(e.target.checked)}
                    className="w-3.5 h-3.5 accent-[#171A24] rounded cursor-pointer"
                  />
                  <Zap className="w-3 h-3 text-[#8178FF]" />
                  <span>Auto</span>
                </label>

                <button
                  type="button"
                  onClick={resetSettings}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#6E7280] hover:text-[#171A24] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>
            </div>

            {/* Primary contextual controls based on active mode */}
            {settings.mode === 'convert' && (
              <>
                <FormatSelector />
                <QualityControl />
                <TransparencyOptions />
                <div className="pt-3 border-t border-[#E5E2DA]">
                  <ResizeControls />
                </div>
              </>
            )}

            {settings.mode === 'compress' && (
              <>
                <CompressionPresets />
                <QualityControl />
                {!settings.preserveOriginalFormatInCompress && <FormatSelector />}
                <TransparencyOptions />
                <div className="pt-3 border-t border-[#E5E2DA]">
                  <ResizeControls />
                </div>
              </>
            )}

            {settings.mode === 'resize' && (
              <>
                <ResizeControls forceExpanded />
                <div className="pt-3 border-t border-[#E5E2DA]">
                  <FormatSelector />
                </div>
                <QualityControl />
                <TransparencyOptions />
              </>
            )}

            <FilenamePatternBuilder />

            {/* Collapsible Advanced Options */}
            <div className="pt-3 border-t border-[#E5E2DA]">
              <button
                type="button"
                onClick={() => setShowAdvanced((s) => !s)}
                className="w-full flex items-center justify-between text-xs font-semibold text-[#6E7280] hover:text-[#171A24] py-1 cursor-pointer transition-colors"
                aria-expanded={showAdvanced}
              >
                <span>Advanced Options</span>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-3 p-3.5 rounded-lg bg-[#F7F5F0] border border-[#E5E2DA] text-xs">
                  <label className="flex items-start justify-between gap-3 cursor-pointer select-none">
                    <div>
                      <span className="font-medium text-[#171A24] block">
                        Keep original if output is larger
                      </span>
                      <span className="text-[11px] text-[#6E7280]">
                        Retains original bytes if re-encoding increases size in the same format.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.keepOriginalIfLarger}
                      onChange={(e) =>
                        updateSettings({ keepOriginalIfLarger: e.target.checked })
                      }
                      className="w-4 h-4 mt-0.5 accent-[#171A24] rounded cursor-pointer shrink-0"
                    />
                  </label>

                  <div className="pt-2 border-t border-[#E5E2DA] flex items-center justify-between gap-2">
                    <label htmlFor="max-mb-limit" className="font-medium text-[#171A24]">
                      Max File Size Limit
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        id="max-mb-limit"
                        type="number"
                        min={5}
                        max={150}
                        value={maxFileSizeMb}
                        onChange={(e) =>
                          setMaxFileSizeMb(Math.max(5, Math.min(150, Number(e.target.value))))
                        }
                        className="w-16 px-2 py-1 font-mono tabular-nums bg-[#FFFFFF] border border-[#E5E2DA] rounded text-right"
                      />
                      <span className="font-mono text-[#6E7280]">MB</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={processAll}
              disabled={isProcessingBatch || queue.length === 0}
              className="w-full py-2.5 px-4 rounded-lg bg-[#171A24] text-[#FFFFFF] font-display text-xs font-bold tracking-tight hover:bg-[#2A2F42] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessingBatch ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D7FF64]" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-[#D7FF64] fill-current" />
                  {primaryActionLabel}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Compact Session History (Only shown when queue is empty and history exists) */}
      {queue.length === 0 && sessionHistory.length > 0 && (
        <div className="pt-4">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-semibold text-[#6E7280]">
              Recent in this session
            </h3>
            <span className="text-xs font-mono tabular-nums text-[#6E7280]">
              {sessionHistory.length} processed
            </span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[#E5E2DA] bg-[#FFFFFF]">
            <table className="w-full text-left border-collapse text-xs">
              <tbody className="divide-y divide-[#E5E2DA] font-mono tabular-nums">
                {sessionHistory.slice(0, 4).map((h) => (
                  <tr key={h.id} className="hover:bg-[#F7F5F0]/40">
                    <td className="py-2.5 px-4 font-sans font-medium text-[#171A24] truncate max-w-[200px]">
                      {h.outputName}
                    </td>
                    <td className="py-2.5 px-4 text-[#6E7280]">{h.dimensions}</td>
                    <td className="py-2.5 px-4 text-right text-[#6E7280]">
                      {formatBytes(h.originalSize)} → <strong className="text-[#171A24]">{formatBytes(h.outputSize)}</strong>
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-semibold ${
                        h.savingsPercent >= 0 ? 'text-[#227A55]' : 'text-[#C53E4D]'
                      }`}
                    >
                      {h.savingsPercent >= 0
                        ? `−${h.savingsPercent.toFixed(1)}%`
                        : `+${Math.abs(h.savingsPercent).toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
