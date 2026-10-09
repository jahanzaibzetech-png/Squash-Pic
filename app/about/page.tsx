import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BrandLogo } from '@/components/layout/brand-logo';

export const metadata: Metadata = {
  title: 'About squash — Local-First Image Utility Architecture',
  description:
    'Learn how squash converts, compresses, and resizes images directly in the browser without user accounts, cloud uploads, or misleading compression claims.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-[1040px] mx-auto px-5 sm:px-8 py-12 sm:py-16 space-y-12">
      <div className="border-b border-[#E5E2DA] pb-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <BrandLogo size="lg" variant="light" />
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#171A24] text-[#FFFFFF] text-xs font-mono">
            <span className="text-[#F7F5F0]/70">Created by</span>
            <strong className="text-[#D7FF64] font-bold">Alqama-Dev</strong>
          </div>
        </div>
        <h1
          className="font-display text-3xl sm:text-5xl font-extrabold text-[#171A24] tracking-tight"
          style={{ textWrap: 'balance' }}
        >
          Smaller files. Sharper workflow.
        </h1>
        <p className="text-base sm:text-lg text-[#6E7280] max-w-2xl leading-relaxed">
          squash (crafted by <strong className="text-[#171A24]">Alqama-Dev</strong> under the PixelForge project) is a local-first image optimization workspace designed for web developers, designers, e-commerce teams, and everyday users who want fast, predictable image conversion without installing desktop software or uploading private files to third-party servers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg bg-[#FFFFFF] border border-[#E5E2DA] space-y-2.5">
          <h2 className="font-display text-lg font-bold text-[#171A24]">
            01. Genuine Binary Format Detection
          </h2>
          <p className="text-sm text-[#6E7280] leading-relaxed">
            Many online converters rely solely on file extensions, failing silently when a WebP image is saved with a <code className="font-mono text-[#171A24]">.jpg</code> suffix. squash inspects the first 4 KB of binary magic bytes to determine the true container format, color type, and alpha channel presence before decoding.
          </p>
        </div>

        <div className="p-6 rounded-lg bg-[#FFFFFF] border border-[#E5E2DA] space-y-2.5">
          <h2 className="font-display text-lg font-bold text-[#171A24]">
            02. Verified Output Encoders
          </h2>
          <p className="text-sm text-[#6E7280] leading-relaxed">
            Per the HTML5 Canvas specification, if a browser does not support encoding a requested MIME type (such as <code className="font-mono text-[#171A24]">image/avif</code> on older browsers), it silently falls back to <code className="font-mono text-[#171A24]">image/png</code>. squash tests your browser&apos;s encoder capabilities upfront and verifies every output Blob&apos;s MIME type so you never download a mislabeled file.
          </p>
        </div>

        <div className="p-6 rounded-lg bg-[#FFFFFF] border border-[#E5E2DA] space-y-2.5">
          <h2 className="font-display text-lg font-bold text-[#171A24]">
            03. Honest Compression Math
          </h2>
          <p className="text-sm text-[#6E7280] leading-relaxed">
            All reported byte savings are calculated directly from the actual <code className="font-mono text-[#171A24]">File.size</code> and output <code className="font-mono text-[#171A24]">Blob.size</code>. When re-encoding an already heavily compressed image would increase its file size, squash reports the exact increase or automatically retains your original bytes when requested.
          </p>
        </div>

        <div className="p-6 rounded-lg bg-[#FFFFFF] border border-[#E5E2DA] space-y-2.5">
          <h2 className="font-display text-lg font-bold text-[#171A24]">
            04. Safe SVG Rasterization
          </h2>
          <p className="text-sm text-[#6E7280] leading-relaxed">
            When rasterizing SVG vector files to PNG, WebP, or JPEG, squash parses the XML in an isolated DOMParser, strips executable <code className="font-mono text-[#171A24]">&lt;script&gt;</code> tags, inline event handlers, and external network references, and renders the sanitized vector graphic onto a high-DPI canvas.
          </p>
        </div>
      </div>

      {/* Known Browser & Format Limitations */}
      <div className="rounded-lg bg-[#171A24] text-[#F7F5F0] p-6 sm:p-8 space-y-4">
        <h2 className="font-display text-xl font-bold text-[#FFFFFF]">
          Transparent Browser & Format Limitations
        </h2>
        <ul className="space-y-2.5 text-sm text-[#F7F5F0]/85 list-disc pl-5 leading-relaxed">
          <li>
            <strong className="text-[#D7FF64]">Animated GIF & Animated WebP:</strong> Standard browser Canvas rendering operates on single 2D bitmap frames. When an animated image is uploaded, squash detects the animation headers and warns you that the exported file will contain the static first frame.
          </li>
          <li>
            <strong className="text-[#D7FF64]">AVIF Encoding Support:</strong> Native <code className="font-mono">image/avif</code> encoding is supported in modern Chromium and Firefox releases; if your browser lacks an AV1 canvas encoder, the AVIF output option is clearly marked as unsupported by your browser rather than faked.
          </li>
          <li>
            <strong className="text-[#D7FF64]">Apple HEIC / HEIF Inputs:</strong> Because HEIC relies on patent-encumbered HEVC codecs not bundled in cross-platform browsers, HEIC files are detected via ISO Base Media <code className="font-mono">ftyp</code> headers and rejected with instructions to export as JPEG or PNG first.
          </li>
          <li>
            <strong className="text-[#D7FF64]">Canvas Memory Ceiling:</strong> To prevent mobile and desktop browser tab crashes, individual images are capped at 16,384 × 16,384 pixels (and 64 megapixels total area), and batch queues run with a concurrency limit of 3 parallel jobs.
          </li>
        </ul>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#E5E2DA]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-[#171A24] text-[#FFFFFF] rounded-md hover:bg-[#2A2F42] transition-colors"
        >
          Open Image Workspace
          <ArrowRight className="w-3.5 h-3.5 text-[#D7FF64]" />
        </Link>
        <Link
          href="/privacy"
          className="text-xs font-medium text-[#6E7280] hover:text-[#171A24] underline"
        >
          Read Local Processing & Privacy Policy →
        </Link>
      </div>
    </div>
  );
}
