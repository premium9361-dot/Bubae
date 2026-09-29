import React, { useState } from 'react';
import { BRAND } from '../data/brand';
import { MessageCircle } from 'lucide-react';

export const FloatingWhatsApp: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
      {/* Tooltip */}
      <div
        className={`hidden sm:block bg-stone-900 text-white text-xs font-medium py-1.5 px-3 rounded-lg shadow-lg transition-all duration-200 pointer-events-none ${
          showTooltip ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}
      >
        Chat with Bubaé
      </div>

      {/* Floating Button with Ping Effect */}
      <div className="relative flex items-center justify-center">
        {/* Subtle ping pulse ring every 3 seconds */}
        <span
          className="absolute inset-0 rounded-full bg-[#25D366] animate-ping-3s pointer-events-none"
          aria-hidden="true"
        />

        <a
          href={BRAND.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="relative z-10 w-14 h-14 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-hidden"
          aria-label="Chat with Bubaé on WhatsApp"
        >
          <MessageCircle className="w-7 h-7 fill-white stroke-none text-[#25D366]" />

          {/* Active online beacon */}
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5" aria-hidden="true">
            <span className="animate-ping-3s absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-300 border-2 border-white shadow-xs" />
          </span>
        </a>
      </div>
    </div>
  );
};
