'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import { ImageWorkspace } from '@/components/workspace/image-workspace';
import { BrandLogo } from '@/components/layout/brand-logo';

const FORMAT_MATRIX = [
  {
    name: 'WebP',
    role: 'Input & Output',
    transparency: 'Yes (8-bit alpha)',
    compression: 'Lossy & Lossless',
    bestFor: 'Modern web assets, product catalogs, and UI graphics replacing PNG & JPEG.',
  },
  {
    name: 'JPEG / JPG',
    role: 'Input & Output',
    transparency: 'No (Matte fill applied)',
    compression: 'Lossy (DCT)',
    bestFor: 'Photographs, universal email compatibility, and CMS uploads.',
  },
  {
    name: 'PNG',
    role: 'Input & Output',
    transparency: 'Yes (Full RGBA)',
    compression: 'Lossless + Palette',
    bestFor: 'Logos, screenshots, crisp typography, and source graphics.',
  },
  {
    name: 'AVIF',
    role: 'Input & Output*',
    transparency: 'Yes',
    compression: 'Next-gen AV1',
    bestFor: 'High-efficiency photographic delivery (*encoding requires browser AV1 support).',
  },
  {
    name: 'SVG',
    role: 'Input (Safe Rasterize)',
    transparency: 'Yes',
    compression: 'Vector to Raster',
    bestFor: 'Converting vector logos and icons into high-DPI PNG, WebP, or JPEG bitmaps.',
  },
  {
    name: 'GIF & BMP',
    role: 'Input Only',
    transparency: 'GIF (1-bit)',
    compression: 'Transcode to WebP/PNG',
    bestFor: 'Modernizing legacy uncompressed bitmaps or extracting static frames.',
  },
];

const FAQS = [
  {
    q: 'Are my images uploaded to a server during conversion or compression?',
    a: 'No. Every image you select is decoded, resized, and encoded directly inside your web browser using local memory (File API, createImageBitmap, and HTML5 Canvas). Your images never leave your device.',
  },
  {
    q: 'What happens when I convert a transparent PNG or WebP to JPEG?',
    a: 'Because the JPEG specification does not support an alpha channel, transparent pixels cannot be stored directly. squash detects transparent regions and composites them over your chosen matte background color (Pure White #FFFFFF by default, or any custom hex color you select).',
  },
  {
    q: 'Why can compressed output occasionally be larger than the original file?',
    a: 'If a source JPEG is already saved at very low quality and you re-encode it at higher quality, or if you convert a photograph into lossless PNG, the resulting byte size can increase. When compressing within the same format, our "Keep original if output is larger" safeguard automatically retains your smaller source file.',
  },
  {
    q: 'How does squash detect corrupted or misnamed files?',
    a: 'Instead of trusting the filename extension (.jpg or .png), squash inspects the binary magic bytes at the start of each file. If a file is renamed incorrectly, we warn you and decode the true underlying format.',
  },
];

export default function HomePage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Minimalist Hero + Immediate Workspace */}
      <section className="pt-8 sm:pt-12 border-b border-[#E5E2DA]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 space-y-8 pb-14">
          {/* Clean Header Block */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#6E7280]">
                <span className="bg-[#171A24] text-[#D7FF64] font-semibold px-2.5 py-1 rounded-md">
                  Made by Alqama-Dev
                </span>
                <span aria-hidden="true">·</span>
                <span>Local Browser Engine</span>
                <span aria-hidden="true">·</span>
                <span>No Account Required</span>
              </div>
              <h1
                className="font-display font-extrabold text-[#171A24] tracking-tight leading-[1.06]"
                style={{
                  fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
                  textWrap: 'balance',
                }}
              >
                Less weight. More image.
              </h1>
              <p className="text-sm sm:text-base text-[#6E7280] leading-relaxed">
                Convert, compress, and resize images instantly in your browser. Drop files below for automatic local optimization.
              </p>
            </div>

            {/* Quiet Trust Indicators */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[#6E7280]">
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#227A55]" />
                100% On-Device Privacy
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#227A55]" />
                Instant Live Preview
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#227A55]" />
                Batch ZIP Export
              </span>
            </div>
          </div>

          {/* Primary Interactive Workspace */}
          <ImageWorkspace showModeTabs={true} />
        </div>
      </section>

      {/* Minimalist Three-Step Workflow */}
      <section className="max-w-[1280px] mx-auto px-5 sm:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-mono text-[#6E7280]">How It Works</p>
            <h2
              className="font-display text-xl sm:text-2xl font-bold text-[#171A24] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Three steps from raw image to optimized asset
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/convert"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#FFFFFF] text-[#171A24] border border-[#E5E2DA] rounded-lg hover:border-[#171A24] transition-colors whitespace-nowrap shrink-0"
            >
              Converter
              <ArrowRight className="w-3 h-3 text-[#6E7280]" />
            </Link>
            <Link
              href="/compress"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#FFFFFF] text-[#171A24] border border-[#E5E2DA] rounded-lg hover:border-[#171A24] transition-colors whitespace-nowrap shrink-0"
            >
              Compressor
              <ArrowRight className="w-3 h-3 text-[#6E7280]" />
            </Link>
            <Link
              href="/resize"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#FFFFFF] text-[#171A24] border border-[#E5E2DA] rounded-lg hover:border-[#171A24] transition-colors whitespace-nowrap shrink-0"
            >
              Resizer
              <ArrowRight className="w-3 h-3 text-[#6E7280]" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#E5E2DA] space-y-2">
            <span className="font-mono text-xs font-semibold text-[#8178FF]">
              01. Drop or Paste
            </span>
            <h3 className="font-display text-base font-bold text-[#171A24]">
              Instant Magic-Byte Inspection
            </h3>
            <p className="text-xs sm:text-sm text-[#6E7280] leading-relaxed">
              Drop up to 40 images or paste from your clipboard. squash reads binary headers to verify format, resolution, and transparency.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#E5E2DA] space-y-2">
            <span className="font-mono text-xs font-semibold text-[#8178FF]">
              02. Live Optimization
            </span>
            <h3 className="font-display text-base font-bold text-[#171A24]">
              Real-Time Format & Quality Tuning
            </h3>
            <p className="text-xs sm:text-sm text-[#6E7280] leading-relaxed">
              Switch between WebP, JPEG, PNG, and AVIF, adjust quality sliders, or resize dimensions—your output updates automatically.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#FFFFFF] border border-[#E5E2DA] space-y-2">
            <span className="font-mono text-xs font-semibold text-[#8178FF]">
              03. Compare & Export
            </span>
            <h3 className="font-display text-base font-bold text-[#171A24]">
              Side-by-Side Verification & ZIP
            </h3>
            <p className="text-xs sm:text-sm text-[#6E7280] leading-relaxed">
              Slide the before/after divider to inspect sharpness, then download individual files or export everything as a clean ZIP archive.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Format Compatibility Table */}
      <section id="format-guide" className="max-w-[1280px] mx-auto px-5 sm:px-8 space-y-5">
        <div className="space-y-1">
          <p className="text-xs font-mono text-[#6E7280]">Format Compatibility</p>
          <h2
            className="font-display text-xl sm:text-2xl font-bold text-[#171A24] tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            Supported formats and encoding specifications
          </h2>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#E5E2DA] bg-[#FFFFFF]">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#E5E2DA] bg-[#F7F5F0]/70 text-[#171A24] text-xs font-semibold">
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Support</th>
                <th className="py-3 px-4">Transparency</th>
                <th className="py-3 px-4">Encoding</th>
                <th className="py-3 px-4">Best For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DA]">
              {FORMAT_MATRIX.map((row) => (
                <tr key={row.name} className="hover:bg-[#F7F5F0]/40">
                  <td className="py-3 px-4 font-display font-bold text-[#171A24] whitespace-nowrap">
                    {row.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-[#171A24] whitespace-nowrap">
                    {row.role}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-[#6E7280] whitespace-nowrap">
                    {row.transparency}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-[#6E7280] whitespace-nowrap">
                    {row.compression}
                  </td>
                  <td className="py-3 px-4 text-xs text-[#6E7280]">
                    {row.bestFor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Minimalist FAQ Section */}
      <section className="max-w-[1280px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-3">
            <BrandLogo size="sm" variant="light" />
            <h2
              className="font-display text-xl sm:text-2xl font-bold text-[#171A24] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Frequently asked questions
            </h2>
            <p className="text-xs sm:text-sm text-[#6E7280] leading-relaxed">
              Learn more about our zero-upload architecture on the{' '}
              <Link href="/privacy" className="text-[#171A24] underline hover:text-[#8178FF]">
                Privacy page
              </Link>
              .
            </p>
          </div>

          <div className="lg:col-span-8 divide-y divide-[#E5E2DA] rounded-xl border border-[#E5E2DA] bg-[#FFFFFF]">
            {FAQS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={item.q} className="p-4 sm:p-5">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left font-display text-sm font-bold text-[#171A24] cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#6E7280] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#6E7280] shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <p className="mt-2.5 text-xs sm:text-sm text-[#6E7280] leading-relaxed">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
