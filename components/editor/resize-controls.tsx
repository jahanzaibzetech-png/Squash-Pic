'use client';

import React from 'react';
import { Lock, Unlock, Maximize2, Frame, Sparkles } from 'lucide-react';
import { useImageWorkspace } from '@/hooks/use-image-workspace';
import { RESIZE_PRESETS } from '@/lib/image/format-utils';
import { calculateTargetDimensions } from '@/lib/image/resize-image';
import { CanvasFitMode, ResizeMode } from '@/types/image';

const PAD_SWATCHES = [
  { hex: '#FFFFFF', label: 'White' },
  { hex: '#F7F5F0', label: 'Paper' },
  { hex: '#171A24', label: 'Ink' },
  { hex: '#000000', label: 'Black' },
];

export function ResizeControls({ forceExpanded = false }: { forceExpanded?: boolean }) {
  const { settings, updateResizeSettings, selectedItem } = useImageWorkspace();
  const { resize } = settings;

  const refWidth = selectedItem?.width || 1920;
  const refHeight = selectedItem?.height || 1080;
  const aspect = refWidth / refHeight;

  const isSmartPadActive =
    resize.fitMode === 'contain-solid' || resize.fitMode === 'contain-blur';

  const handleWidthChange = (valStr: string) => {
    if (!valStr.trim()) {
      updateResizeSettings({ width: null });
      return;
    }
    const newW = Math.max(1, Math.min(16384, Math.round(Number(valStr))));
    if (resize.lockAspectRatio && !isSmartPadActive) {
      const newH = Math.max(1, Math.round(newW / aspect));
      updateResizeSettings({ width: newW, height: newH });
    } else {
      updateResizeSettings({ width: newW });
    }
  };

  const handleHeightChange = (valStr: string) => {
    if (!valStr.trim()) {
      updateResizeSettings({ height: null });
      return;
    }
    const newH = Math.max(1, Math.min(16384, Math.round(Number(valStr))));
    if (resize.lockAspectRatio && !isSmartPadActive) {
      const newW = Math.max(1, Math.round(newH * aspect));
      updateResizeSettings({ height: newH, width: newW });
    } else {
      updateResizeSettings({ height: newH });
    }
  };

  const toggleLockAspect = () => {
    const nextLock = !resize.lockAspectRatio;
    if (nextLock && resize.width && !isSmartPadActive) {
      updateResizeSettings({
        lockAspectRatio: true,
        height: Math.max(1, Math.round(resize.width / aspect)),
      });
    } else {
      updateResizeSettings({ lockAspectRatio: nextLock });
    }
  };

  const handleFitModeSelect = (fitMode: CanvasFitMode) => {
    if (fitMode !== 'scale') {
      // Default to a 1080x1080 square canvas if width/height match source aspect ratio and mode is dimensions
      const w = resize.width || 1080;
      const h = resize.height || 1080;
      updateResizeSettings({
        enabled: true,
        fitMode,
        width: w,
        height: h,
      });
    } else {
      updateResizeSettings({ fitMode });
    }
  };

  const computedPreview = calculateTargetDimensions(refWidth, refHeight, resize);

  const modes: { id: ResizeMode; label: string }[] = [
    { id: 'dimensions', label: 'Exact px' },
    { id: 'preset', label: 'Presets' },
    { id: 'percentage', label: 'Scale %' },
    { id: 'max-bounds', label: 'Max Fit' },
  ];

  const fitOptions: { id: CanvasFitMode; label: string; desc: string }[] = [
    {
      id: 'scale',
      label: 'Scale',
      desc: 'Standard proportional resize without added canvas borders.',
    },
    {
      id: 'contain-solid',
      label: 'Solid Pad',
      desc: 'Center inside target canvas (e.g. 1080×1080) and fill margins with a solid color.',
    },
    {
      id: 'contain-blur',
      label: 'Blur Pad',
      desc: 'Center inside target canvas with a Gaussian-blurred backdrop of your image.',
    },
  ];

  return (
    <div className="space-y-3.5">
      {!forceExpanded && (
        <div className="flex items-center justify-between">
          <label
            htmlFor="enable-resize-toggle"
            className="text-xs font-semibold text-[#171A24] tracking-tight cursor-pointer"
          >
            Resize & Canvas Fit
          </label>
          <input
            id="enable-resize-toggle"
            type="checkbox"
            checked={resize.enabled}
            onChange={(e) => {
              const enabled = e.target.checked;
              updateResizeSettings({
                enabled,
                mode: enabled && resize.mode === 'none' ? 'dimensions' : resize.mode,
                width: resize.width || refWidth,
                height: resize.height || refHeight,
              });
            }}
            className="w-4 h-4 accent-[#171A24] rounded cursor-pointer"
          />
        </div>
      )}

      {(resize.enabled || forceExpanded) && (
        <div className="space-y-3.5 pt-1">
          {/* Segmented mode selector */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#F7F5F0] border border-[#E5E2DA] rounded-lg">
            {modes.map((m) => {
              const active = resize.mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    updateResizeSettings({
                      enabled: true,
                      mode: m.id,
                      width: resize.width || refWidth,
                      height: resize.height || refHeight,
                    })
                  }
                  className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#171A24] text-[#FFFFFF]'
                      : 'text-[#6E7280] hover:text-[#171A24]'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Mode: Dimensions or Max Bounds */}
          {(resize.mode === 'dimensions' || resize.mode === 'max-bounds') && (
            <div className="space-y-2.5">
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <label
                    htmlFor="resize-width-input"
                    className="block text-[11px] font-medium text-[#6E7280]"
                  >
                    {isSmartPadActive
                      ? 'Canvas Width (px)'
                      : resize.mode === 'max-bounds'
                      ? 'Max Width (px)'
                      : 'Width (px)'}
                  </label>
                  <input
                    id="resize-width-input"
                    type="number"
                    min={1}
                    max={16384}
                    value={resize.width ?? ''}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    placeholder={String(refWidth)}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-[#FFFFFF] border border-[#E5E2DA] rounded-md focus:outline-none focus:border-[#171A24]"
                  />
                </div>

                {resize.mode === 'dimensions' && !isSmartPadActive && (
                  <button
                    type="button"
                    onClick={toggleLockAspect}
                    className={`p-2 rounded-md border transition-colors cursor-pointer ${
                      resize.lockAspectRatio
                        ? 'bg-[#171A24] text-[#D7FF64] border-[#171A24]'
                        : 'bg-[#F7F5F0] text-[#6E7280] border-[#E5E2DA] hover:text-[#171A24]'
                    }`}
                    title={
                      resize.lockAspectRatio
                        ? 'Aspect ratio locked'
                        : 'Aspect ratio unlocked'
                    }
                    aria-label="Toggle aspect ratio lock"
                  >
                    {resize.lockAspectRatio ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Unlock className="w-4 h-4" />
                    )}
                  </button>
                )}

                <div className="flex-1 space-y-1">
                  <label
                    htmlFor="resize-height-input"
                    className="block text-[11px] font-medium text-[#6E7280]"
                  >
                    {isSmartPadActive
                      ? 'Canvas Height (px)'
                      : resize.mode === 'max-bounds'
                      ? 'Max Height (px)'
                      : 'Height (px)'}
                  </label>
                  <input
                    id="resize-height-input"
                    type="number"
                    min={1}
                    max={16384}
                    value={resize.height ?? ''}
                    onChange={(e) => handleHeightChange(e.target.value)}
                    placeholder={String(refHeight)}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-[#FFFFFF] border border-[#E5E2DA] rounded-md focus:outline-none focus:border-[#171A24]"
                  />
                </div>
              </div>

              {/* Quick canvas frame ratios when in dimensions mode */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-[#6E7280] mr-1">Quick frame:</span>
                {[
                  { label: '1080×1080 (1:1)', w: 1080, h: 1080 },
                  { label: '1600×1600 (Shop)', w: 1600, h: 1600 },
                  { label: '1920×1080 (16:9)', w: 1920, h: 1080 },
                ].map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() =>
                      updateResizeSettings({
                        enabled: true,
                        width: q.w,
                        height: q.h,
                      })
                    }
                    className="px-2 py-0.5 text-[11px] font-mono tabular-nums bg-[#F7F5F0] text-[#171A24] border border-[#E5E2DA] rounded hover:border-[#171A24] transition-colors cursor-pointer"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode: Percentage */}
          {resize.mode === 'percentage' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6E7280]">Scale Percentage</span>
                <span className="font-mono font-bold tabular-nums text-[#171A24]">
                  {resize.percentage}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={200}
                step={5}
                value={resize.percentage}
                onChange={(e) =>
                  updateResizeSettings({
                    enabled: true,
                    percentage: Number(e.target.value),
                  })
                }
                className="w-full h-2 bg-[#E5E2DA] rounded-lg appearance-none cursor-pointer accent-[#171A24]"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[25, 50, 75, 100, 150].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => updateResizeSettings({ enabled: true, percentage: pct })}
                    className={`px-2.5 py-1 text-xs font-mono tabular-nums rounded border transition-colors cursor-pointer ${
                      resize.percentage === pct
                        ? 'bg-[#171A24] text-[#FFFFFF] border-[#171A24]'
                        : 'bg-[#FFFFFF] text-[#171A24] border-[#E5E2DA] hover:border-[#171A24]'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode: Presets */}
          {resize.mode === 'preset' && (
            <div className="space-y-1.5">
              {RESIZE_PRESETS.map((preset) => {
                const isSelected = resize.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      updateResizeSettings({
                        enabled: true,
                        presetId: preset.id,
                      })
                    }
                    className={`w-full text-left p-2.5 rounded-md border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#171A24] text-[#FFFFFF] border-[#171A24]'
                        : 'bg-[#FFFFFF] text-[#171A24] border-[#E5E2DA] hover:border-[#171A24]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>{preset.label}</span>
                      <span
                        className={`font-mono tabular-nums ${
                          isSelected ? 'text-[#D7FF64]' : 'text-[#6E7280]'
                        }`}
                      >
                        {preset.width}×{preset.height}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        isSelected ? 'text-[#F7F5F0]/80' : 'text-[#6E7280]'
                      }`}
                    >
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Smart Padding & Canvas Fit ("Contain with Background") */}
          {resize.mode !== 'percentage' && (
            <div className="pt-3 border-t border-[#E5E2DA] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#171A24]">
                  Canvas Fit & Smart Padding
                </span>
                <span className="text-[11px] font-mono text-[#6E7280]">
                  {resize.fitMode === 'scale'
                    ? 'Proportional'
                    : resize.fitMode === 'contain-solid'
                    ? 'Solid Backdrop'
                    : 'Blurred Backdrop'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {fitOptions.map((opt) => {
                  const active = resize.fitMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleFitModeSelect(opt.id)}
                      className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#171A24] text-[#FFFFFF] border-[#171A24]'
                          : 'bg-[#F7F5F0]/70 text-[#171A24] border-[#E5E2DA] hover:border-[#171A24]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
                        {opt.id === 'scale' && <Maximize2 className="w-3 h-3 shrink-0" />}
                        {opt.id === 'contain-solid' && <Frame className="w-3 h-3 shrink-0 text-[#D7FF64]" />}
                        {opt.id === 'contain-blur' && <Sparkles className="w-3 h-3 shrink-0 text-[#8178FF]" />}
                        <span>{opt.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-[#6E7280] leading-relaxed">
                {fitOptions.find((f) => f.id === resize.fitMode)?.desc}
              </p>

              {/* Solid Pad Color Swatches */}
              {resize.fitMode === 'contain-solid' && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {PAD_SWATCHES.map((s) => {
                    const selected =
                      resize.padColor.toLowerCase() === s.hex.toLowerCase();
                    return (
                      <button
                        key={s.hex}
                        type="button"
                        onClick={() => updateResizeSettings({ padColor: s.hex })}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#171A24] text-[#FFFFFF] border-[#171A24]'
                            : 'bg-[#FFFFFF] text-[#171A24] border-[#E5E2DA] hover:border-[#171A24]'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-xs border border-[#171A24]/20 shrink-0"
                          style={{ backgroundColor: s.hex }}
                        />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}

                  <label className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-[#E5E2DA] bg-[#FFFFFF] text-xs font-mono cursor-pointer hover:border-[#171A24]">
                    <input
                      type="color"
                      value={resize.padColor}
                      onChange={(e) => updateResizeSettings({ padColor: e.target.value })}
                      className="w-3.5 h-3.5 border-0 p-0 bg-transparent cursor-pointer"
                      aria-label="Custom canvas padding color"
                    />
                    <span>{resize.padColor.toUpperCase()}</span>
                  </label>
                </div>
              )}

              {/* Inset Margin % Slider when Smart Padding is active */}
              {isSmartPadActive && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#6E7280]">Inner Frame Margin</span>
                    <span className="font-mono font-semibold tabular-nums text-[#171A24]">
                      {resize.padMarginPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    step={1}
                    value={resize.padMarginPercent}
                    onChange={(e) =>
                      updateResizeSettings({ padMarginPercent: Number(e.target.value) })
                    }
                    className="w-full h-1.5 bg-[#E5E2DA] rounded-lg appearance-none cursor-pointer accent-[#171A24]"
                  />
                </div>
              )}
            </div>
          )}

          {/* Prevent enlargement & Aspect ratio checkboxes */}
          <div className="space-y-2 pt-2 border-t border-[#E5E2DA]">
            {!isSmartPadActive && (
              <label className="flex items-center justify-between gap-2 text-xs text-[#171A24] cursor-pointer select-none">
                <span>Lock aspect ratio</span>
                <input
                  type="checkbox"
                  checked={resize.lockAspectRatio}
                  onChange={toggleLockAspect}
                  className="w-4 h-4 accent-[#171A24] rounded cursor-pointer"
                />
              </label>
            )}

            <label className="flex items-center justify-between gap-2 text-xs text-[#171A24] cursor-pointer select-none">
              <span>Do not enlarge smaller images</span>
              <input
                type="checkbox"
                checked={resize.preventEnlargement}
                onChange={(e) =>
                  updateResizeSettings({ preventEnlargement: e.target.checked })
                }
                className="w-4 h-4 accent-[#171A24] rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Live dimension readout */}
          <div className="p-2.5 rounded-lg bg-[#F7F5F0] border border-[#E5E2DA] flex flex-col gap-1 text-xs font-mono tabular-nums">
            <div className="flex items-center justify-between">
              <span className="text-[#6E7280]">
                Source: {refWidth}×{refHeight}
              </span>
              <span className="text-[#171A24] font-semibold">
                Canvas: {computedPreview.width}×{computedPreview.height}
              </span>
            </div>
            {isSmartPadActive && (
              <div className="flex items-center justify-between text-[11px] text-[#8178FF]">
                <span>Centered Image:</span>
                <span>
                  {computedPreview.innerWidth}×{computedPreview.innerHeight} px (at {computedPreview.offsetX},{computedPreview.offsetY})
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
