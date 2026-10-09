import type { Metadata } from 'next';
import { ImageWorkspace } from '@/components/workspace/image-workspace';

export const metadata: Metadata = {
  title: 'Image Compressor — Reduce JPEG, PNG, WebP & AVIF File Size',
  description:
    'Compress images locally with Balanced, Small File, High Quality, and Lossless presets. Set target KB budgets and inspect quality with a live before-and-after slider.',
  alternates: {
    canonical: '/compress',
  },
};

export default function CompressPage() {
  return (
    <div className="max-w-[1360px] mx-auto px-5 sm:px-8 py-10 space-y-10">
      <div className="border-b border-[#E5E2DA] pb-6 space-y-2">
        <p className="text-xs font-mono text-[#6E7280]">
          Workspace / Image Compressor · Local Browser Pipeline
        </p>
        <h1
          className="font-display text-2xl sm:text-4xl font-extrabold text-[#171A24] tracking-tight"
          style={{ textWrap: 'balance' }}
        >
          Image Compressor
        </h1>
        <p className="text-sm sm:text-base text-[#6E7280] max-w-2xl">
          Reduce image byte weight using calibrated quality presets or a target KB budget, then verify visual sharpness side by side before downloading.
        </p>
      </div>

      <ImageWorkspace initialMode="compress" showModeTabs={true} />
    </div>
  );
}
