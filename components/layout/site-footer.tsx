import React from 'react';
import Link from 'next/link';
import { Code2 } from 'lucide-react';
import { BrandLogo } from './brand-logo';

export function SiteFooter() {
  return (
    <footer className="bg-[#F7F5F0] border-t border-[#E5E2DA] text-[#171A24]">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-10 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#E5E2DA]">
          <div className="space-y-2">
            <Link href="/" className="inline-block">
              <BrandLogo size="sm" variant="light" />
            </Link>
            <p className="text-xs text-[#6E7280] max-w-md">
              Smaller files. Sharper workflow. Local-first browser image converter, compressor, and resizer.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-[#6E7280]">
            <Link href="/convert" className="hover:text-[#171A24] transition-colors">
              Convert
            </Link>
            <Link href="/compress" className="hover:text-[#171A24] transition-colors">
              Compress
            </Link>
            <Link href="/resize" className="hover:text-[#171A24] transition-colors">
              Resize
            </Link>
            <Link href="/about" className="hover:text-[#171A24] transition-colors">
              About
            </Link>
            <Link href="/privacy" className="hover:text-[#171A24] transition-colors">
              Privacy
            </Link>
          </div>
        </div>

        {/* Highlighted Creator Attribution Bar */}
        <div className="rounded-xl bg-[#171A24] text-[#F7F5F0] px-5 py-4 border border-[#262A38] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#D7FF64] text-[#171A24] flex items-center justify-center shrink-0">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-[#F7F5F0]/70 font-mono">
                DESIGNED & ENGINEERED BY
              </p>
              <p className="font-display text-sm sm:text-base font-extrabold tracking-tight text-[#FFFFFF]">
                Made by <span className="text-[#D7FF64] underline decoration-[#D7FF64]/50 underline-offset-4">Alqama-Dev</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono tabular-nums text-[#F7F5F0]/75">
            <span>© {new Date().getFullYear()} squash</span>
            <span aria-hidden="true">·</span>
            <span>WebP · AVIF · JPEG · PNG · GIF · BMP · SVG</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
