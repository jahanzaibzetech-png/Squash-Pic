'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useImageWorkspace } from '@/hooks/use-image-workspace';
import { BrandLogo } from './brand-logo';

export function SiteHeader() {
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addFiles } = useImageWorkspace();

  const navItems = [
    { href: '/convert', label: 'Convert' },
    { href: '/compress', label: 'Compress' },
    { href: '/resize', label: 'Resize' },
    { href: '/about', label: 'About' },
    { href: '/privacy', label: 'Privacy' },
  ];

  const handleHeaderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await addFiles(e.target.files);
      e.target.value = '';
      const workspaceEl = document.getElementById('workspace-anchor');
      if (workspaceEl) {
        workspaceEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#171A24] text-[#F7F5F0] border-b border-[#262A38]">
      <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-8 px-5 sm:px-8 h-16">
        {/* Zone 1: Brand lockup */}
        <Link
          href="/"
          className="hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D7FF64] rounded-md"
        >
          <BrandLogo size="md" variant="dark" />
        </Link>

        {/* Zone 2: 5 concise single-line text links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#F7F5F0]/75"
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  isActive
                    ? 'text-[#FFFFFF] border-[#D7FF64]'
                    : 'border-transparent hover:text-[#FFFFFF]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/bmp,image/svg+xml"
            onChange={handleHeaderUpload}
            className="sr-only"
            aria-label="Upload images from header"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-xs font-semibold bg-[#D7FF64] text-[#171A24] rounded-lg hover:bg-[#c8f542] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D7FF64]"
          >
            Upload Images
          </button>
        </div>
      </div>

      {/* Mobile horizontal navigation strip */}
      <nav
        aria-label="Mobile Navigation"
        className="flex md:hidden items-center gap-5 px-5 py-2 overflow-x-auto border-t border-[#262A38] text-xs font-medium text-[#F7F5F0]/75"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                isActive ? 'text-[#D7FF64] font-semibold' : 'hover:text-[#FFFFFF]'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
