'use client';

import React, { useCallback, useRef, useState } from 'react';
import {
  MoveHorizontal,
  RotateCcw,
  Play,
  Download,
  Sun,
  Moon,
} from 'lucide-react';
import { QueuedImage } from '@/types/image';
import { formatBytes, OUTPUT_FORMATS } from '@/lib/image/format-utils';
import { formatDisplayName } from '@/lib/image/detect-format';
import { downloadProcessedFile } from '@/lib/download/download-file';

interface ImageComparisonProps {
  item: QueuedImage;
  onProcessItem: () => void;
}

export function ImageComparison({ item, onProcessItem }: ImageComparisonProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const [darkBackdrop, setDarkBackdrop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const updatePositionFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const pct = (relX / Math.max(1, rect.width)) * 100;
    setSliderPos(Math.round(pct * 10) / 10);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updatePositionFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    updatePositionFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSliderPos((p) => Math.max(0, p - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSliderPos((p) => Math.min(100, p + 5));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSliderPos(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSliderPos(100);
    }
  };

  const res = item.result;

  return (
    <div className="rounded-lg border border-[#E5E2DA] bg-[#FFFFFF] overflow-hidden">
      {/* Top comparison bar */}
      <div className="px-4 py-3 border-b border-[#E5E2DA] flex flex-wrap items-center justify-between gap-3 bg-[#F7F5F0]/50">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-[#171A24]">
            Quality Comparison Inspector
          </span>
          <span aria-hidden="true" className="text-[#6E7280]">
            ·
          </span>
          <span className="font-mono tabular-nums text-[#6E7280] truncate max-w-[220px]">
            {item.originalName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDarkBackdrop((d) => !d)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#171A24] bg-[#FFFFFF] border border-[#E5E2DA] rounded hover:border-[#171A24] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Switch checkerboard backdrop contrast"
          >
            {darkBackdrop ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {darkBackdrop ? 'Light Grid' : 'Dark Grid'}
          </button>

          {res && (
            <button
              type="button"
              onClick={() => setSliderPos(50)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#171A24] bg-[#FFFFFF] border border-[#E5E2DA] rounded hover:border-[#171A24] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Reset comparison divider to 50%"
            >
              <RotateCcw className="w-3 h-3" />
              50/50
            </button>
          )}
        </div>
      </div>

      {/* Viewport */}
      {res ? (
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onKeyDown={handleKeyDown}
          role="slider"
          aria-label="Before and after image quality comparison slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(sliderPos)}
          tabIndex={0}
          className={`relative w-full h-[280px] sm:h-[380px] select-none overflow-hidden cursor-ew-resize touch-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#8178FF] ${
            darkBackdrop ? 'bg-checkerboard-dark' : 'bg-checkerboard'
          }`}
        >
          {/* Layer 1 (Full width): Processed Output ("After") */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={res.url}
            alt={`Processed ${item.originalName}`}
            referrerPolicy="no-referrer"
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />

          {/* Layer 2 (Clipped to sliderPos%): Original Input ("Before") */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.previewUrl}
              alt={`Original ${item.originalName}`}
              referrerPolicy="no-referrer"
              draggable={false}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Vertical Divider Line & Handle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#D7FF64] shadow-[0_0_0_1px_rgba(23,26,36,0.5)] pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#171A24] text-[#D7FF64] border-2 border-[#D7FF64] flex items-center justify-center shadow-md">
              <MoveHorizontal className="w-4 h-4" />
            </div>
          </div>

          {/* Corner Labels */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-[#171A24]/85 text-[#FFFFFF] text-xs font-mono tabular-nums pointer-events-none">
            Original · {formatDisplayName(item.detectedFormat)} · {formatBytes(item.originalSize)}
          </div>
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-[#171A24]/85 text-[#D7FF64] text-xs font-mono tabular-nums pointer-events-none">
            Output · {OUTPUT_FORMATS[res.format].label} · {formatBytes(res.sizeBytes)}
          </div>
        </div>
      ) : (
        <div
          className={`relative w-full h-[260px] sm:h-[340px] flex flex-col items-center justify-center p-6 ${
            darkBackdrop ? 'bg-checkerboard-dark' : 'bg-checkerboard'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.previewUrl}
            alt={item.originalName}
            referrerPolicy="no-referrer"
            className="max-h-[190px] sm:max-h-[240px] w-auto object-contain rounded"
          />

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 bg-[#171A24] text-[#FFFFFF] px-4 py-2.5 rounded-md shadow-sm">
            <span className="text-xs text-[#F7F5F0]/90">
              Process this image to unlock interactive side-by-side quality comparison.
            </span>
            <button
              type="button"
              onClick={onProcessItem}
              disabled={item.status === 'processing'}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-[#D7FF64] text-[#171A24] rounded hover:bg-[#c8f542] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-3 h-3" />
              {item.status === 'processing' ? 'Processing...' : 'Process Now'}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Telemetry & Comparison Metrics */}
      <div className="px-4 py-3 border-t border-[#E5E2DA] bg-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono tabular-nums">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#6E7280]">
          <span>
            Before: <strong className="text-[#171A24]">{item.width}×{item.height}</strong> ({formatBytes(item.originalSize)})
          </span>
          {res && (
            <>
              <span aria-hidden="true">→</span>
              <span>
                After: <strong className="text-[#171A24]">{res.width}×{res.height}</strong> ({formatBytes(res.sizeBytes)})
              </span>
              <span aria-hidden="true">·</span>
              <span className={res.savingsBytes >= 0 ? 'text-[#227A55] font-semibold' : 'text-[#C53E4D] font-semibold'}>
                {res.savingsBytes >= 0
                  ? `−${res.savingsPercent.toFixed(1)}% (${formatBytes(res.savingsBytes)} saved)`
                  : `+${Math.abs(res.savingsPercent).toFixed(1)}% larger`}
              </span>
            </>
          )}
        </div>

        {res && (
          <button
            type="button"
            onClick={() => downloadProcessedFile(res)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-sans font-semibold bg-[#171A24] text-[#FFFFFF] rounded-md hover:bg-[#2A2F42] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#D7FF64]" />
            Download {res.filename}
          </button>
        )}
      </div>
    </div>
  );
}
