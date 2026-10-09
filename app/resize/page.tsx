import type { Metadata } from 'next';
import { ImageWorkspace } from '@/components/workspace/image-workspace';

export const metadata: Metadata = {
  title: 'Image Resizer — Scale Dimensions by Pixels, Percentage or Presets',
  description:
    'Resize images online with locked aspect ratio, enlargement protection, percentage scaling, and presets for Full HD, Social Square, and E-Commerce storefronts.',
  alternates: {
    canonical: '/resize',
  },
};

export default function ResizePage() {
  return (
    <div className="max-w-[1360px] mx-auto px-5 sm:px-8 py-10 space-y-10">
      <div className="border-b border-[#E5E2DA] pb-6 space-y-2">
        <p className="text-xs font-mono text-[#6E7280]">
          Workspace / Dimension Resizer · Multi-Step High-Quality Downsampling
        </p>
        <h1
          className="font-display text-2xl sm:text-4xl font-extrabold text-[#171A24] tracking-tight"
          style={{ textWrap: 'balance' }}
        >
          Image Resizer
        </h1>
        <p className="text-sm sm:text-base text-[#6E7280] max-w-2xl">
          Scale single images or entire batches by exact pixel dimensions, percentage, maximum bounding box, or publishing presets with automatic aspect ratio lock.
        </p>
      </div>

      <ImageWorkspace initialMode="resize" showModeTabs={true} />
    </div>
  );
}
