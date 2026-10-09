'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import {
  CompressionPreset,
  FormatCapability,
  ImageWarning,
  OutputFormat,
  ProcessingSettings,
  QueuedImage,
  SessionHistoryItem,
  ToolMode,
} from '@/types/image';
import { MAX_FILE_SIZE_BYTES, MAX_QUEUE_FILES, validateImageFile } from '@/lib/image/validate-image';
import { decodeImageFile } from '@/lib/image/decode-image';
import { getAllFormatCapabilities } from '@/lib/image/format-utils';
import { processImageItem } from '@/lib/image/convert-image';
import { createSampleImages } from '@/lib/image/sample-images';

export const DEFAULT_SETTINGS: ProcessingSettings = {
  mode: 'convert',
  outputFormat: 'webp',
  preserveOriginalFormatInCompress: false,
  quality: 82,
  compressionPreset: 'balanced',
  targetSizeKb: null,
  backgroundColor: '#FFFFFF',
  stripMetadata: true,
  keepOriginalIfLarger: true,
  filenamePattern: '{name}-{mode}',
  resize: {
    enabled: false,
    mode: 'dimensions',
    width: null,
    height: null,
    percentage: 75,
    lockAspectRatio: true,
    preventEnlargement: true,
    presetId: 'web-hd',
    fitMode: 'scale',
    padColor: '#FFFFFF',
    padMarginPercent: 0,
  },
};

interface WorkspaceContextValue {
  queue: QueuedImage[];
  selectedItemId: string | null;
  selectedItem: QueuedImage | null;
  settings: ProcessingSettings;
  formatCapabilities: FormatCapability[];
  isProcessingBatch: boolean;
  sessionHistory: SessionHistoryItem[];
  maxFileSizeMb: number;
  autoProcess: boolean;
  setAutoProcess: (enabled: boolean) => void;
  setMaxFileSizeMb: (mb: number) => void;
  setSelectedItemId: (id: string | null) => void;
  updateSettings: (partial: Partial<ProcessingSettings>) => void;
  updateResizeSettings: (partial: Partial<ProcessingSettings['resize']>) => void;
  applyCompressionPreset: (preset: CompressionPreset) => void;
  setToolMode: (mode: ToolMode) => void;
  resetSettings: () => void;
  addFiles: (files: FileList | File[]) => Promise<void>;
  loadSampleFiles: () => Promise<void>;
  removeFile: (id: string) => void;
  clearQueue: () => void;
  processAll: () => Promise<void>;
  processSingle: (id: string) => Promise<void>;
  retryFailed: () => Promise<void>;
  cancelBatch: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const BATCH_CONCURRENCY_LIMIT = 3;

export function ImageWorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<QueuedImage[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ProcessingSettings>(DEFAULT_SETTINGS);
  const [formatCapabilities, setFormatCapabilities] = useState<FormatCapability[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryItem[]>([]);
  const [maxFileSizeMb, setMaxFileSizeMb] = useState<number>(50);
  const [autoProcess, setAutoProcess] = useState<boolean>(true);

  const cancelRequestedRef = useRef(false);
  const queueRef = useRef<QueuedImage[]>([]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  // Detect browser format encoding support on mount
  useEffect(() => {
    let mounted = true;
    getAllFormatCapabilities().then((caps) => {
      if (mounted) setFormatCapabilities(caps);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Cleanup all Object URLs on unmount
  useEffect(() => {
    return () => {
      queueRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.result?.url) URL.revokeObjectURL(item.result.url);
      });
    };
  }, []);

  const updateSettings = useCallback((partial: Partial<ProcessingSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateResizeSettings = useCallback((partial: Partial<ProcessingSettings['resize']>) => {
    setSettings((prev) => ({
      ...prev,
      resize: { ...prev.resize, ...partial },
    }));
  }, []);

  const applyCompressionPreset = useCallback((preset: CompressionPreset) => {
    setSettings((prev) => {
      let quality = prev.quality;
      if (preset === 'balanced') quality = 78;
      else if (preset === 'small') quality = 56;
      else if (preset === 'high') quality = 90;
      else if (preset === 'lossless') quality = 100;
      return {
        ...prev,
        compressionPreset: preset,
        quality,
      };
    });
  }, []);

  const setToolMode = useCallback((mode: ToolMode) => {
    setSettings((prev) => {
      const nextResizeEnabled = mode === 'resize' ? true : prev.resize.enabled;
      return {
        ...prev,
        mode,
        resize: {
          ...prev.resize,
          enabled: nextResizeEnabled,
        },
      };
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings((prev) => ({
      ...DEFAULT_SETTINGS,
      mode: prev.mode,
      resize: {
        ...DEFAULT_SETTINGS.resize,
        enabled: prev.mode === 'resize',
      },
    }));
    toast.success('Settings restored to defaults.');
  }, []);

  const addFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const fileArray = Array.from(incoming);
      if (fileArray.length === 0) return;

      const currentCount = queueRef.current.length;
      if (currentCount + fileArray.length > MAX_QUEUE_FILES) {
        toast.error(
          `Queue limit reached (${MAX_QUEUE_FILES} images maximum per batch). Please clear completed items first.`
        );
        return;
      }

      const maxBytes = maxFileSizeMb * 1024 * 1024 || MAX_FILE_SIZE_BYTES;
      const newItems: QueuedImage[] = [];
      let rejectedCount = 0;

      for (const file of fileArray) {
        const validation = await validateImageFile(file, maxBytes);
        if (!validation.valid || !validation.detection) {
          rejectedCount++;
          toast.error(validation.error || `Could not add "${file.name}".`);
          continue;
        }

        const { detection } = validation;
        try {
          const decoded = await decodeImageFile(file, detection.format, detection.hasAlphaHeader);
          const width = decoded.width;
          const height = decoded.height;
          const hasTransparency = decoded.hasTransparency;
          decoded.cleanup();

          const warnings: ImageWarning[] = [];
          if (detection.extensionMismatch) {
            warnings.push({
              code: 'EXTENSION_MISMATCH',
              message: `Filename extension does not match actual ${detection.format.toUpperCase()} binary header.`,
            });
          }

          const previewUrl = URL.createObjectURL(file);
          const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

          newItems.push({
            id,
            file,
            originalName: file.name,
            originalSize: file.size,
            detectedFormat: detection.format,
            extensionMismatch: detection.extensionMismatch,
            previewUrl,
            width,
            height,
            hasTransparency,
            isAnimated: detection.isAnimated,
            status: 'idle',
            error: null,
            warnings,
            result: null,
            addedAt: Date.now(),
          });
        } catch (err) {
          rejectedCount++;
          const msg = err instanceof Error ? err.message : `Failed to decode "${file.name}".`;
          toast.error(msg);
        }
      }

      if (newItems.length > 0) {
        setQueue((prev) => {
          const updated = [...prev, ...newItems];
          return updated;
        });
        setSelectedItemId((prevId) => prevId || newItems[0].id);

        // If resize width/height are null, initialize them from the first image's dimensions
        setSettings((prev) => {
          if (prev.resize.width === null && prev.resize.height === null) {
            return {
              ...prev,
              resize: {
                ...prev.resize,
                width: newItems[0].width,
                height: newItems[0].height,
              },
            };
          }
          return prev;
        });

        if (rejectedCount === 0) {
          toast.success(
            newItems.length === 1
              ? `Added "${newItems[0].originalName}" (${newItems[0].width}×${newItems[0].height})`
              : `Added ${newItems.length} images to workspace.`
          );
        }
      }
    },
    [maxFileSizeMb]
  );

  const loadSampleFiles = useCallback(async () => {
    try {
      const samples = await createSampleImages();
      await addFiles(samples);
    } catch {
      toast.error('Failed to generate sample images.');
    }
  }, [addFiles]);

  const removeFile = useCallback((id: string) => {
    setQueue((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) {
        if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
        if (target.result?.url) URL.revokeObjectURL(target.result.url);
      }
      const next = prev.filter((i) => i.id !== id);
      setSelectedItemId((currentSelected) => {
        if (currentSelected === id) {
          return next[0]?.id || null;
        }
        return currentSelected;
      });
      return next;
    });
  }, []);

  const clearQueue = useCallback(() => {
    cancelRequestedRef.current = true;
    setQueue((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.result?.url) URL.revokeObjectURL(item.result.url);
      });
      return [];
    });
    setSelectedItemId(null);
    setIsProcessingBatch(false);
    toast.info('Workspace queue cleared.');
  }, []);

  const processSingle = useCallback(
    async (id: string) => {
      const target = queueRef.current.find((item) => item.id === id);
      if (!target) return;

      // Mark as processing
      setQueue((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: 'processing', error: null } : item
        )
      );

      try {
        const idxInQueue = queueRef.current.findIndex((item) => item.id === id);
        const result = await processImageItem(target, settings, idxInQueue >= 0 ? idxInQueue + 1 : 1);

        setQueue((prev) =>
          prev.map((item) => {
            if (item.id !== id) return item;
            if (item.result?.url) {
              URL.revokeObjectURL(item.result.url);
            }
            return {
              ...item,
              status: 'completed',
              error: null,
              result,
            };
          })
        );

        setSessionHistory((prev) => [
          {
            id: `${id}-${Date.now()}`,
            originalName: target.originalName,
            outputName: result.filename,
            originalFormat: target.detectedFormat,
            outputFormat: result.format,
            originalSize: target.originalSize,
            outputSize: result.sizeBytes,
            savingsPercent: result.savingsPercent,
            dimensions: `${result.width}×${result.height}`,
            completedAt: Date.now(),
          },
          ...prev.slice(0, 19),
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Image processing failed.';
        setQueue((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: 'error', error: message } : item
          )
        );
        toast.error(message);
      }
    },
    [settings]
  );

  const runBatchOnItems = useCallback(
    async (itemsToRun: QueuedImage[], silent = false) => {
      if (itemsToRun.length === 0) return;

      cancelRequestedRef.current = false;
      setIsProcessingBatch(true);

      const idsToProcess = new Set(itemsToRun.map((i) => i.id));
      setQueue((prev) =>
        prev.map((item) =>
          idsToProcess.has(item.id) ? { ...item, status: 'queued', error: null } : item
        )
      );

      let completedCount = 0;
      let failedCount = 0;
      const pending = [...itemsToRun];

      const workerLoop = async () => {
        while (pending.length > 0 && !cancelRequestedRef.current) {
          const nextItem = pending.shift();
          if (!nextItem) break;

          setQueue((prev) =>
            prev.map((i) => (i.id === nextItem.id ? { ...i, status: 'processing' } : i))
          );

          try {
            const idxInQueue = queueRef.current.findIndex((i) => i.id === nextItem.id);
            const result = await processImageItem(
              nextItem,
              settings,
              idxInQueue >= 0 ? idxInQueue + 1 : 1
            );
            if (cancelRequestedRef.current) {
              URL.revokeObjectURL(result.url);
              setQueue((prev) =>
                prev.map((i) => (i.id === nextItem.id ? { ...i, status: 'cancelled' } : i))
              );
              break;
            }

            completedCount++;
            setQueue((prev) =>
              prev.map((i) => {
                if (i.id !== nextItem.id) return i;
                if (i.result?.url) URL.revokeObjectURL(i.result.url);
                return {
                  ...i,
                  status: 'completed',
                  error: null,
                  result,
                };
              })
            );

            setSessionHistory((prev) => [
              {
                id: `${nextItem.id}-${Date.now()}`,
                originalName: nextItem.originalName,
                outputName: result.filename,
                originalFormat: nextItem.detectedFormat,
                outputFormat: result.format,
                originalSize: nextItem.originalSize,
                outputSize: result.sizeBytes,
                savingsPercent: result.savingsPercent,
                dimensions: `${result.width}×${result.height}`,
                completedAt: Date.now(),
              },
              ...prev.slice(0, 19),
            ]);
          } catch (err) {
            failedCount++;
            const message = err instanceof Error ? err.message : 'Processing failed.';
            setQueue((prev) =>
              prev.map((i) =>
                i.id === nextItem.id ? { ...i, status: 'error', error: message } : i
              )
            );
          }
        }
      };

      const workers = Array.from(
        { length: Math.min(BATCH_CONCURRENCY_LIMIT, itemsToRun.length) },
        () => workerLoop()
      );
      await Promise.all(workers);

      setIsProcessingBatch(false);

      if (silent) return;

      if (cancelRequestedRef.current) {
        toast.info('Batch processing cancelled.');
      } else if (completedCount > 0 && failedCount === 0) {
        toast.success(
          completedCount === 1
            ? 'Image processed.'
            : `Processed ${completedCount} images.`
        );
      } else if (completedCount > 0 && failedCount > 0) {
        toast.warning(`Processed ${completedCount} images; ${failedCount} failed.`);
      } else if (failedCount > 0) {
        toast.error(`Failed to process ${failedCount} ${failedCount === 1 ? 'image' : 'images'}.`);
      }
    },
    [settings]
  );

  // 1. Automatically process newly added (idle) items immediately when autoProcess is enabled
  const idleIdsKey = queue
    .filter((i) => i.status === 'idle')
    .map((i) => i.id)
    .join(',');

  useEffect(() => {
    if (!autoProcess || !idleIdsKey) return;
    const idleItems = queueRef.current.filter((i) => i.status === 'idle');
    if (idleItems.length > 0) {
      runBatchOnItems(idleItems, true);
    }
  }, [autoProcess, idleIdsKey, runBatchOnItems]);

  // 2. Automatically re-process existing items when settings change (debounced 220ms)
  const settingsFingerprint = JSON.stringify(settings);
  const prevSettingsRef = useRef(settingsFingerprint);

  useEffect(() => {
    if (prevSettingsRef.current === settingsFingerprint) return;
    prevSettingsRef.current = settingsFingerprint;

    if (!autoProcess || queueRef.current.length === 0) return;

    const timer = setTimeout(() => {
      const currentItems = queueRef.current;
      if (currentItems.length > 0) {
        runBatchOnItems(currentItems, true);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [autoProcess, settingsFingerprint, runBatchOnItems]);

  const processAll = useCallback(async () => {
    const current = queueRef.current;
    if (current.length === 0) return;
    await runBatchOnItems(current, false);
  }, [runBatchOnItems]);

  const retryFailed = useCallback(async () => {
    const failed = queueRef.current.filter((i) => i.status === 'error' || i.status === 'cancelled');
    if (failed.length === 0) return;
    await runBatchOnItems(failed, false);
  }, [runBatchOnItems]);

  const cancelBatch = useCallback(() => {
    cancelRequestedRef.current = true;
    setQueue((prev) =>
      prev.map((i) =>
        i.status === 'queued' || i.status === 'processing'
          ? { ...i, status: 'cancelled' }
          : i
      )
    );
    setIsProcessingBatch(false);
  }, []);

  const selectedItem =
    queue.find((item) => item.id === selectedItemId) || queue[0] || null;

  return (
    <WorkspaceContext.Provider
      value={{
        queue,
        selectedItemId: selectedItem?.id || null,
        selectedItem,
        settings,
        formatCapabilities,
        isProcessingBatch,
        sessionHistory,
        maxFileSizeMb,
        autoProcess,
        setAutoProcess,
        setMaxFileSizeMb,
        setSelectedItemId,
        updateSettings,
        updateResizeSettings,
        applyCompressionPreset,
        setToolMode,
        resetSettings,
        addFiles,
        loadSampleFiles,
        removeFile,
        clearQueue,
        processAll,
        processSingle,
        retryFailed,
        cancelBatch,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useImageWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useImageWorkspace must be used within an ImageWorkspaceProvider');
  }
  return ctx;
}
