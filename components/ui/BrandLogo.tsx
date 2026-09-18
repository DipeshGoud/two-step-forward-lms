import React from 'react';
import Image from 'next/image';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  iconOnly?: boolean;
  showAdminBadge?: boolean;
  showTagline?: boolean;
  tagline?: string;
  className?: string;
  priority?: boolean;
}

export default function BrandLogo({
  size = 'md',
  iconOnly = false,
  showAdminBadge = false,
  showTagline = false,
  tagline = 'Enterprise Learning Management System',
  className = '',
  priority = true,
}: BrandLogoProps) {
  // Dimensions calibrated to exact 1997:429 (4.655:1) aspect ratio of the transparent logo
  const logoDimensions = {
    sm: { width: 121, height: 26, className: 'h-[26px] w-auto' },
    md: { width: 154, height: 33, className: 'h-[33px] w-auto' },
    lg: { width: 205, height: 44, className: 'h-11 w-auto' },
    xl: { width: 260, height: 56, className: 'h-[56px] w-auto' },
  }[size];

  // Dimensions for square icon-only mode
  const iconDimensions = {
    sm: { width: 24, height: 24, className: 'w-6 h-6' },
    md: { width: 32, height: 32, className: 'w-8 h-8' },
    lg: { width: 44, height: 44, className: 'w-11 h-11' },
    xl: { width: 56, height: 56, className: 'w-14 h-14' },
  }[size];

  if (iconOnly) {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        <Image
          src="/logo-icon.png"
          alt="TwoStep Forward"
          width={iconDimensions.width}
          height={iconDimensions.height}
          className={`${iconDimensions.className} object-contain`}
          priority={priority}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <div className="inline-flex items-center gap-2.5">
        <Image
          src="/logo.png"
          alt="TwoStep Forward"
          width={logoDimensions.width}
          height={logoDimensions.height}
          className={`${logoDimensions.className} object-contain transition-transform duration-200`}
          priority={priority}
        />

        {showAdminBadge && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-full shadow-3xs shrink-0 self-center">
            Admin
          </span>
        )}
      </div>

      {showTagline && (
        <span className="text-[11px] font-medium text-slate-500 tracking-normal mt-2 text-center">
          {tagline}
        </span>
      )}
    </div>
  );
}
