import React from 'react';
import { BRAND } from '../data/brand';
import { ArrowUpRight } from 'lucide-react';

interface SocialButtonsProps {
  variant?: 'dark-surface' | 'light-surface';
  className?: string;
}

export const SocialButtons: React.FC<SocialButtonsProps> = ({
  variant = 'light-surface',
  className = '',
}) => {
  const isDark = variant === 'dark-surface';

  const baseStyle =
    'group relative inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full text-xs font-medium tracking-wide transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 cursor-pointer';

  const instagramStyle = isDark
    ? 'bg-[#3A1B24]/90 text-[#FCE8EE] border border-[#6B3445]/60 hover:border-[#D94676] hover:shadow-[0_8px_20px_-4px_rgba(217,70,118,0.35)] hover:bg-[#48202D]'
    : 'bg-white text-stone-800 border border-[#ECD3DC] hover:border-[#D94676] hover:shadow-[0_8px_20px_-4px_rgba(217,70,118,0.25)] hover:bg-[#FFF5F8]';

  const tiktokStyle = isDark
    ? 'bg-[#3A1B24]/90 text-[#FCE8EE] border border-[#6B3445]/60 hover:border-[#A8657B] hover:shadow-[0_8px_20px_-4px_rgba(168,101,123,0.3)] hover:bg-[#48202D]'
    : 'bg-white text-stone-800 border border-[#ECD3DC] hover:border-[#A8657B] hover:shadow-[0_8px_20px_-4px_rgba(168,101,123,0.2)] hover:bg-[#FFF5F8]';

  const facebookStyle = isDark
    ? 'bg-[#3A1B24]/90 text-[#FCE8EE] border border-[#6B3445]/60 hover:border-[#D94676] hover:shadow-[0_8px_20px_-4px_rgba(217,70,118,0.3)] hover:bg-[#48202D]'
    : 'bg-white text-stone-800 border border-[#ECD3DC] hover:border-[#D94676] hover:shadow-[0_8px_20px_-4px_rgba(217,70,118,0.2)] hover:bg-[#FFF5F8]';

  return (
    <div className={`flex flex-wrap items-center gap-2.5 sm:gap-3 ${className}`}>
      {/* Instagram */}
      <a
        href={BRAND.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseStyle} ${instagramStyle}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#D94676] group-hover:scale-125 transition-transform duration-300" />
        <span>Instagram</span>
        <span className="text-[10px] text-stone-400 group-hover:text-[#D94676] font-mono">@bubae_3</span>
        <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
      </a>

      {/* TikTok */}
      <a
        href={BRAND.tiktok}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseStyle} ${tiktokStyle}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#A8657B] group-hover:scale-125 transition-transform duration-300" />
        <span>TikTok</span>
        <span className="text-[10px] text-stone-400 group-hover:text-[#A8657B] font-mono">@bubae_3</span>
        <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
      </a>

      {/* Facebook */}
      <a
        href={BRAND.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseStyle} ${facebookStyle}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#D94676] group-hover:scale-125 transition-transform duration-300" />
        <span>Facebook</span>
        <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
      </a>
    </div>
  );
};
