'use client';

import React, { useState } from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
}

export function BrandLogo({ size = 'md', variant = 'dark' }: BrandLogoProps) {
  const [imgError, setImgError] = useState(false);

  const boxSizes = {
    sm: 'w-6 h-6 rounded-md',
    md: 'w-8 h-8 rounded-lg',
    lg: 'w-10 h-10 rounded-lg',
  }[size];

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }[size];

  const textColor = variant === 'dark' ? 'text-[#FFFFFF]' : 'text-[#171A24]';

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      <span
        className={`${boxSizes} relative overflow-hidden bg-[#171A24] border border-[#2A2E3D] flex items-center justify-center shrink-0 shadow-xs`}
      >
        {!imgError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src="/src/assets/images/squash_brand_logo_1791555366653.jpg"
            alt="squash logo"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover scale-110"
          />
        ) : (
          <span className="w-3.5 h-3.5 rounded-xs border-2 border-[#D7FF64] rotate-45" />
        )}
      </span>
      <span
        className={`font-display ${textSizes} font-extrabold tracking-tight ${textColor}`}
      >
        squash
      </span>
    </span>
  );
}
