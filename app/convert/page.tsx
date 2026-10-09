import type { Metadata } from 'next';
import { ImageWorkspace } from '@/components/workspace/image-workspace';

export const metadata: Metadata = {
  title: 'Image Format Converter — Convert PNG, JPG, WebP, AVIF & SVG',
  description:
    'Convert images between WebP, AVIF, PNG, and JPEG directly in your browser. Preserve alpha transparency or apply custom matte backgrounds when exporting to JPEG.',
  alternates: {
    canonical: '/convert',
  },
};

export default function ConvertPage() {
  return (
    <div className="max-w-[1360px] mx-auto px-5 sm:px-8 py-10 space-y-10">
      <div className="border-b border-[#E5E2DA] pb-6 space-y-2">
        <p className="text-xs font-mono text-[#6E7280]">
          Workspace / Format Converter · Local Browser Pipeline
        </p>
        <h1
          className="font-display text-2xl sm:text-4xl font-extrabold text-[#171A24] tracking-tight"
          style={{ textWrap: 'balance' }}
        >
          Image Format Converter
        </h1>
        <p className="text-sm sm:text-base text-[#6E7280] max-w-2xl">
          Transcode JPEG, PNG, WebP, AVIF, GIF, BMP, and SVG images into modern web formats with real binary verification and batch ZIP downloads.
        </p>
      </div>

      <ImageWorkspace initialMode="convert" showModeTabs={true} />
    </div>
  );
}
