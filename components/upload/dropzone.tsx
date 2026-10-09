'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, FolderOpen, ImagePlus, Plus } from 'lucide-react';
import { useImageWorkspace } from '@/hooks/use-image-workspace';
import { MAX_QUEUE_FILES } from '@/lib/image/validate-image';
import { OutputFormat } from '@/types/image';
import { OUTPUT_FORMATS } from '@/lib/image/format-utils';

interface DropzoneProps {
  compact?: boolean;
}

export function Dropzone({ compact = false }: DropzoneProps) {
  const {
    addFiles,
    loadSampleFiles,
    maxFileSizeMb,
    settings,
    updateSettings,
    formatCapabilities,
  } = useImageWorkspace();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for clipboard image paste across the workspace
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            const ext = file.type.split('/')[1] || 'png';
            const namedFile = new File(
              [file],
              file.name && file.name !== 'image.png'
                ? file.name
                : `clipboard-paste-${Date.now()}.${ext}`,
              { type: file.type }
            );
            imageFiles.push(namedFile);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        addFiles(imageFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await addFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleSampleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoadingSamples(true);
    try {
      await loadSampleFiles();
    } finally {
      setIsLoadingSamples(false);
    }
  };

  if (compact) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`flex flex-wrap items-center justify-between gap-4 px-4 py-3.5 rounded-xl border border-dashed transition-colors cursor-pointer ${
          isDragging
            ? 'border-[#8178FF] bg-[#8178FF]/5'
            : 'border-[#E5E2DA] bg-[#FFFFFF] hover:border-[#171A24]/40'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/bmp,image/svg+xml"
          onChange={handleFileChange}
          className="sr-only"
          aria-label="Add more images to queue"
        />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F7F5F0] border border-[#E5E2DA] flex items-center justify-center text-[#171A24] shrink-0">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-[#171A24]">
              Drop more images here or paste from clipboard
            </p>
          </div>
        </div>
        <span className="px-3 py-1.5 text-xs font-semibold bg-[#F7F5F0] text-[#171A24] border border-[#E5E2DA] rounded-lg hover:border-[#171A24] transition-colors whitespace-nowrap shrink-0">
          Add Files
        </span>
      </div>
    );
  }

  const quickFormats: OutputFormat[] = ['webp', 'jpeg', 'png', 'avif'];

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      aria-label="Drop your images here or browse files from your device"
      className={`group relative rounded-xl border transition-all cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8178FF] ${
        isDragging
          ? 'border-[#8178FF] bg-[#8178FF]/5 ring-2 ring-[#8178FF]/20'
          : 'border-[#E5E2DA] bg-[#FFFFFF] hover:border-[#171A24]/50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/bmp,image/svg+xml"
        onChange={handleFileChange}
        className="sr-only"
      />

      <div className="px-6 py-10 sm:py-14 flex flex-col items-center text-center max-w-xl mx-auto space-y-5">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${
            isDragging
              ? 'bg-[#D7FF64] border-[#171A24] text-[#171A24]'
              : 'bg-[#F7F5F0] border-[#E5E2DA] text-[#171A24] group-hover:bg-[#D7FF64] group-hover:border-[#171A24]'
          }`}
        >
          <Upload className="w-5 h-5" />
        </div>

        <div className="space-y-1.5">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#171A24] tracking-tight">
            Drop images here, or click to browse
          </h2>
          <p className="text-sm text-[#6E7280]">
            Supports pasting directly from clipboard (Ctrl+V / ⌘V). Up to {MAX_QUEUE_FILES} files at once.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#171A24] text-[#FFFFFF] rounded-lg hover:bg-[#2A2F42] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-[#D7FF64]" />
            Choose Images
          </button>

          <button
            type="button"
            onClick={handleSampleClick}
            disabled={isLoadingSamples}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#F7F5F0] text-[#171A24] border border-[#E5E2DA] rounded-lg hover:border-[#171A24] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            <ImagePlus className="w-4 h-4 text-[#8178FF]" />
            {isLoadingSamples ? 'Loading...' : 'Try Sample Images'}
          </button>
        </div>
      </div>

      {/* Minimalist bottom bar with quick output format selector */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="px-5 py-3.5 border-t border-[#E5E2DA] bg-[#F7F5F0]/50 rounded-b-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center gap-2">
          <span className="text-[#6E7280] font-medium">Output format:</span>
          <div className="inline-flex items-center gap-1 p-0.5 bg-[#FFFFFF] border border-[#E5E2DA] rounded-lg">
            {quickFormats.map((fmt) => {
              const cap = formatCapabilities.find((c) => c.format === fmt);
              const supported = cap ? cap.browserEncodingSupported : true;
              const isSelected = settings.outputFormat === fmt;
              return (
                <button
                  key={fmt}
                  type="button"
                  disabled={!supported}
                  onClick={() => updateSettings({ outputFormat: fmt })}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 ${
                    isSelected
                      ? 'bg-[#171A24] text-[#D7FF64]'
                      : 'text-[#6E7280] hover:text-[#171A24]'
                  }`}
                >
                  {OUTPUT_FORMATS[fmt].label}
                </button>
              );
            })}
          </div>
        </div>

        <span className="font-mono tabular-nums text-[#6E7280]">
          JPEG · PNG · WebP · AVIF · GIF · SVG · Max {maxFileSizeMb} MB
        </span>
      </div>
    </div>
  );
}
