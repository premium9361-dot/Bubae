import React from 'react';
import { useNavigation } from '../context/NavigationContext';
import { BubaeBowIcon } from './BubaeLogo';

export const PolicyBanner: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <div className="bg-[#361722] text-[#FBEAF0] text-xs py-2.5 px-4 border-b border-[#4E2432] transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-[#E8CCD5] text-[11px] tracking-wide">
          <BubaeBowIcon size={14} />
          <span>Nationwide Cash on Delivery (No Advance Charge)</span>
        </div>

        <div className="flex-1 flex items-center justify-center gap-2 font-medium tracking-wide text-xs">
          <span className="font-serif italic text-[#F2D5DE]">Bubaé</span>
          <span className="text-white/40">·</span>
          <span>“Modern fashion within your budget”</span>
          <span className="hidden sm:inline text-white/40">·</span>
          <button
            onClick={() => navigate('/return-policy')}
            className="hidden sm:inline text-[#F472B6] hover:underline underline-offset-2 cursor-pointer font-medium text-[11px]"
          >
            Final Sale (No Return/Exchange)
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-3 text-[#E8CCD5] text-[11px]">
          <a
            href="https://wa.me/8801345599300"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Direct WhatsApp: +880 1345-599300
          </a>
        </div>
      </div>
    </div>
  );
};
