import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy — 100% Local Browser Image Processing',
  description:
    'Learn how squash processes your images entirely inside your web browser memory without uploading files to any server or storing personal data.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-[960px] mx-auto px-5 sm:px-8 py-12 sm:py-16 space-y-10">
      <div className="border-b border-[#E5E2DA] pb-8 space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-[#227A55]">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero-Upload Client-Side Architecture</span>
        </div>
        <h1
          className="font-display text-3xl sm:text-5xl font-extrabold text-[#171A24] tracking-tight"
          style={{ textWrap: 'balance' }}
        >
          Your images never leave your device.
        </h1>
        <p className="text-base text-[#6E7280] max-w-2xl leading-relaxed">
          squash is engineered so that every step of the image pipeline—validation, decoding, resizing, color quantization, format conversion, and ZIP archiving—executes locally inside your browser tab.
        </p>
      </div>

      <div className="space-y-8 text-sm text-[#171A24] leading-relaxed">
        <section className="p-6 rounded-lg bg-[#FFFFFF] border border-[#E5E2DA] space-y-2">
          <h2 className="font-display text-lg font-bold">
            1. How Image Files Are Processed
          </h2>
          <p className="text-[#6E7280]">
            When you drag, browse, or paste an image into squash, the file is read directly from your local filesystem into browser memory using standard Web APIs (<code className="font-mono text-[#171A24]">File</code>, <code className="font-mono text-[#171A24]">ArrayBuffer</code>, <code className="font-mono text-[#171A24]">createImageBitmap</code>, and <code className="font-mono text-[#171A24]">HTMLCanvasElement.toBlob</code>). No network request containing your image bytes is ever transmitted to our servers or any third-party cloud API.
          </p>
        </section>

        <section className="p-6 rounded-lg bg-[#FFFFFF] border border-[#E5E2DA] space-y-2">
          <h2 className="font-display text-lg font-bold">
            2. Temporary Memory & Object URL Cleanup
          </h2>
          <p className="text-[#6E7280]">
            Preview thumbnails and downloadable outputs use browser-local <code className="font-mono text-[#171A24]">blob:</code> Object URLs backed by RAM. When you remove a file from the queue, clear the workspace, or close the browser tab, squash revokes those Object URLs (<code className="font-mono text-[#171A24]">URL.revokeObjectURL</code>) and releases decoded <code className="font-mono text-[#171A24]">ImageBitmap</code> instances immediately. Nothing is written to persistent storage (<code className="font-mono text-[#171A24]">IndexedDB</code> or <code className="font-mono text-[#171A24]">localStorage</code>).
          </p>
        </section>

        <section className="p-6 rounded-lg bg-[#FFFFFF] border border-[#E5E2DA] space-y-2">
          <h2 className="font-display text-lg font-bold">
            3. Automatic EXIF & GPS Metadata Stripping
          </h2>
          <p className="text-[#6E7280]">
            Photos taken on smartphones and digital cameras frequently contain embedded EXIF metadata—including GPS coordinates, timestamps, and device serial numbers. Because squash redraws pixel data onto a fresh HTML5 Canvas before encoding the output file, embedded EXIF metadata segments are naturally stripped from the exported JPEG, PNG, WebP, or AVIF file.
          </p>
        </section>

        <section className="p-6 rounded-lg bg-[#FFFFFF] border border-[#E5E2DA] space-y-2">
          <h2 className="font-display text-lg font-bold">
            4. Accounts, Cookies, and Analytics
          </h2>
          <p className="text-[#6E7280]">
            squash requires no user registration, login, or tracking cookies. Session history displayed below the workspace exists only in React memory for the duration of your current page visit and disappears as soon as you refresh or close the tab.
          </p>
        </section>
      </div>

      <div className="pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-[#171A24] text-[#FFFFFF] rounded-md hover:bg-[#2A2F42] transition-colors"
        >
          Return to Workspace
          <ArrowRight className="w-3.5 h-3.5 text-[#D7FF64]" />
        </Link>
      </div>
    </div>
  );
}
