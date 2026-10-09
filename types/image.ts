export type SupportedInputFormat =
  | 'jpeg'
  | 'png'
  | 'webp'
  | 'avif'
  | 'gif'
  | 'bmp'
  | 'svg'
  | 'heic'
  | 'unknown';

export type OutputFormat = 'webp' | 'jpeg' | 'png' | 'avif';

export type ToolMode = 'convert' | 'compress' | 'resize';

export type CompressionPreset = 'balanced' | 'small' | 'high' | 'lossless' | 'custom';

export type ResizeMode = 'none' | 'dimensions' | 'percentage' | 'max-bounds' | 'preset';

export type CanvasFitMode = 'scale' | 'contain-solid' | 'contain-blur';

export interface ResizePresetOption {
  id: string;
  label: string;
  width: number;
  height: number;
  description: string;
}

export interface ProcessingSettings {
  mode: ToolMode;
  outputFormat: OutputFormat;
  preserveOriginalFormatInCompress: boolean;
  quality: number; // 1 - 100
  compressionPreset: CompressionPreset;
  targetSizeKb: number | null; // Optional target file size in KB
  backgroundColor: string; // Hex color used when flattening alpha to JPEG
  stripMetadata: boolean; // Canvas pipeline naturally strips EXIF; documented clearly
  keepOriginalIfLarger: boolean;
  filenamePattern: string; // e.g. "{name}-{mode}" or "{name}-{width}x{height}-q{quality}"
  resize: {
    enabled: boolean;
    mode: ResizeMode;
    width: number | null;
    height: number | null;
    percentage: number; // 10 - 200
    lockAspectRatio: boolean;
    preventEnlargement: boolean;
    presetId: string | null;
    fitMode: CanvasFitMode;
    padColor: string;
    padMarginPercent: number; // 0 - 25
  };
}

export type JobStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'error' | 'cancelled';

export interface ImageWarning {
  code:
    | 'TRANSPARENCY_FLATTENED'
    | 'ANIMATION_FLATTENED'
    | 'EXTENSION_MISMATCH'
    | 'OUTPUT_LARGER'
    | 'KEPT_ORIGINAL'
    | 'TARGET_SIZE_UNREACHABLE'
    | 'AVIF_FALLBACK_NOTICE';
  message: string;
}

export interface ProcessedResult {
  blob: Blob;
  url: string;
  filename: string;
  format: OutputFormat;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  savingsBytes: number;
  savingsPercent: number;
  isLargerThanOriginal: boolean;
  keptOriginal: boolean;
  durationMs: number;
  warnings: ImageWarning[];
}

export interface QueuedImage {
  id: string;
  file: File;
  originalName: string;
  originalSize: number;
  detectedFormat: SupportedInputFormat;
  extensionMismatch: boolean;
  previewUrl: string;
  width: number;
  height: number;
  hasTransparency: boolean;
  isAnimated: boolean;
  status: JobStatus;
  error: string | null;
  warnings: ImageWarning[];
  result: ProcessedResult | null;
  customSettings?: Partial<ProcessingSettings>;
  addedAt: number;
}

export interface FormatCapability {
  format: OutputFormat;
  mimeType: string;
  extension: string;
  label: string;
  tagline: string;
  useCase: string;
  supportsTransparency: boolean;
  supportsLossyQuality: boolean;
  supportsLossless: boolean;
  browserEncodingSupported: boolean;
  notes: string;
}

export interface SessionHistoryItem {
  id: string;
  originalName: string;
  outputName: string;
  originalFormat: SupportedInputFormat;
  outputFormat: OutputFormat;
  originalSize: number;
  outputSize: number;
  savingsPercent: number;
  dimensions: string;
  completedAt: number;
}
