import React from 'react';

interface BubaeLogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'badge' | 'text-only' | 'editorial';
  withTagline?: boolean;
  tone?: 'dark' | 'light' | 'rose';
}

export const BubaeBowIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 24,
}) => (
  <svg
    width={size}
    height={Math.round(size * 0.8)}
    viewBox="0 0 40 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block ${className}`}
  >
    {/* Left Loop */}
    <path
      d="M17 14C11 8 4 9 3 13C2 17 9 20 17 16Z"
      fill="#D94676"
      stroke="#BE185D"
      strokeWidth="0.8"
    />
    <path
      d="M15 14C10 11 6 12 5 14C4 16 9 17 15 15Z"
      fill="#F472B6"
    />
    {/* Right Loop */}
    <path
      d="M23 14C29 8 36 9 37 13C38 17 31 20 23 16Z"
      fill="#D94676"
      stroke="#BE185D"
      strokeWidth="0.8"
    />
    <path
      d="M25 14C30 11 34 12 35 14C36 16 31 17 25 15Z"
      fill="#F472B6"
    />
    {/* Left Ribbon Tail */}
    <path
      d="M17 17L12 28L15 25L18 29L19 17Z"
      fill="#BE185D"
      stroke="#9D174D"
      strokeWidth="0.8"
    />
    {/* Right Ribbon Tail */}
    <path
      d="M23 17L28 28L25 25L22 29L21 17Z"
      fill="#BE185D"
      stroke="#9D174D"
      strokeWidth="0.8"
    />
    {/* Knot */}
    <rect
      x="16"
      y="11.5"
      width="8"
      height="7"
      rx="3.5"
      fill="#BE185D"
      stroke="#9D174D"
      strokeWidth="0.8"
    />
    <ellipse cx="20" cy="15" rx="2.5" ry="2" fill="#FBCFE8" />
  </svg>
);

export const BubaeLogo: React.FC<BubaeLogoProps> = ({
  className = '',
  variant = 'compact',
  withTagline = false,
  tone = 'dark',
}) => {
  const textColor =
    tone === 'light'
      ? 'text-[#FFF2F5]'
      : tone === 'rose'
      ? 'text-[#FDE2E8]'
      : 'text-[#1F1418]';

  const taglineColor =
    tone === 'light'
      ? 'text-[#F3CBD7]'
      : tone === 'rose'
      ? 'text-[#E8A5B8]'
      : 'text-[#876671]';

  if (variant === 'badge') {
    return (
      <div
        className={`relative inline-flex flex-col items-center justify-center bg-[#542836] text-[#FFF0F4] p-5 rounded-2xl shadow-sm border border-[#7A3F50]/40 select-none ${className}`}
      >
        <div className="relative flex items-center justify-center">
          <span className="font-script text-4xl sm:text-5xl tracking-normal text-[#FFF2F5] leading-none pt-1 pr-3">
            Bubaé
          </span>
          <div className="absolute -bottom-2.5 right-0 transform translate-x-1 translate-y-1">
            <BubaeBowIcon size={26} />
          </div>
        </div>
        {withTagline && (
          <span className="text-[10px] tracking-widest uppercase font-medium text-[#F3CBD7] mt-2.5">
            Modern fashion within your budget
          </span>
        )}
      </div>
    );
  }

  if (variant === 'editorial') {
    return (
      <div className={`inline-flex flex-col items-start select-none ${className}`}>
        <div className="relative inline-flex items-center">
          <span className={`font-script text-6xl sm:text-7xl lg:text-8xl tracking-normal leading-none pt-2 pr-6 ${textColor}`}>
            Bubaé
          </span>
          <div className="absolute -bottom-2 right-1 transform translate-x-1 translate-y-1">
            <BubaeBowIcon size={38} />
          </div>
        </div>
        {withTagline && (
          <span className={`text-xs sm:text-sm tracking-[0.25em] uppercase font-light mt-3 ${taglineColor}`}>
            Modern fashion within your budget
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-start select-none ${className}`}>
      <div className="relative inline-flex items-center">
        <span className={`font-script text-3xl sm:text-4xl tracking-wide leading-none pt-1 pr-4 transition-colors ${textColor}`}>
          Bubaé
        </span>
        <div className="absolute -bottom-1.5 right-0 transform translate-x-0.5">
          <BubaeBowIcon size={22} />
        </div>
      </div>
      {withTagline && (
        <span className={`text-[10px] tracking-widest uppercase font-medium transition-colors mt-1 ${taglineColor}`}>
          Modern fashion within your budget
        </span>
      )}
    </div>
  );
};
