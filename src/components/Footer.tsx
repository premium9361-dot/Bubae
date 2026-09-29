import React, { useEffect, useState } from 'react';
import { BubaeLogo, BubaeBowIcon } from './BubaeLogo';
import { useNavigation } from '../context/NavigationContext';
import { BRAND } from '../data/brand';
import { SocialButtons } from './SocialButtons';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { fetchCategories } from '../services/products';
import { Category } from '../types';
import { ScrollReveal } from './ScrollReveal';

export const Footer: React.FC = () => {
  const { navigate, openCategory } = useNavigation();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  return (
    <footer className="bg-gradient-to-b from-[#341722] via-[#2A131B] to-[#200E15] text-[#F5E2E8] pt-20 pb-12 border-t border-[#542836]">
      <ScrollReveal variant="fade-up" duration={700}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-12 border-b border-[#522534]">
          {/* Brand Info & Tagline */}
          <div className="lg:col-span-5 space-y-5">
            <div className="cursor-pointer inline-block" onClick={() => navigate('/')}>
              <BubaeLogo variant="editorial" tone="light" />
            </div>

            <p className="text-sm text-[#D8B6C1] font-light leading-relaxed max-w-sm">
              Modern, stylish and feminine fashion designed for everyday moments. Crafted for girls who love clean, aesthetic and budget-friendly apparel.
            </p>

            {/* Interactive Social Buttons (Section 10 & 30) */}
            <div className="pt-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#A8657B] font-semibold block mb-3">
                Official Social Channels
              </span>
              <SocialButtons variant="dark-surface" />
            </div>
          </div>

          {/* Quick Collection Links */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-white flex items-center gap-1.5">
              <BubaeBowIcon size={14} />
              <span>Collection</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-[#D8B6C1]">
              <li>
                <button
                  onClick={() => navigate('/shop')}
                  className="hover:text-white transition-colors hover-underline-animation cursor-pointer"
                >
                  Shop All
                </button>
              </li>
              {categories.map(cat => (
                <li key={cat.slug}>
                  <button
                    onClick={() => openCategory(cat.slug)}
                    className="hover:text-white transition-colors hover-underline-animation cursor-pointer capitalize"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => navigate('/wishlist')}
                  className="hover:text-white transition-colors hover-underline-animation cursor-pointer"
                >
                  Wishlist
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-white">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs text-[#D8B6C1]">
              <li>
                <button
                  onClick={() => navigate('/size-guide')}
                  className="hover:text-white transition-colors hover-underline-animation cursor-pointer"
                >
                  Size Guide & Measurements
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/delivery')}
                  className="hover:text-white transition-colors hover-underline-animation cursor-pointer"
                >
                  Cash on Delivery (COD)
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/return-policy')}
                  className="hover:text-white text-rose-300 transition-colors hover-underline-animation cursor-pointer font-medium"
                >
                  No Return / No Exchange
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/faq')}
                  className="hover:text-white transition-colors hover-underline-animation cursor-pointer"
                >
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/contact')}
                  className="hover:text-white transition-colors hover-underline-animation cursor-pointer"
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* WhatsApp Direct Order & Policy Callout */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-white">
              Direct Inquiries
            </h4>
            <p className="text-xs text-[#D8B6C1] leading-relaxed">
              Order directly through our verified WhatsApp line for Cash on Delivery across Bangladesh:
            </p>

            <a
              href={BRAND.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-black font-semibold text-xs transition-all duration-300 hover:-translate-y-0.5 shadow-md"
            >
              <MessageCircle className="w-4 h-4 fill-black" />
              <span>{BRAND.whatsappNumberFormatted}</span>
            </a>

            <div className="pt-2 text-[11.5px] text-[#C49DA9] leading-relaxed font-normal">
              Bubaé operates strictly on Cash on Delivery nationwide. No advance payments or upfront delivery fees required.
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Location Metadata */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#B8929E] pt-2 border-t border-[#461F2C]/60 mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="tracking-wide">© 2026 Bubaé. Modern fashion within your budget.</p>
            <span className="hidden sm:inline text-[#6E394A]">·</span>
            <span className="text-[11.5px] text-[#A87E8C]">
              Developed by{' '}
              <a
                href="https://instagram.com/prime.web.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#E5B8C5] hover:text-[#FFF0F4] font-medium transition-all duration-200 underline decoration-[#824458]/70 hover:decoration-[#F05788] underline-offset-4 hover:-translate-y-px inline-block"
              >
                Prime
              </a>
            </span>
          </div>

          <div className="flex items-center gap-3.5 text-[#A87E8C] text-[11px] font-medium tracking-[0.14em] uppercase">
            <span>Sylhet, Bangladesh</span>
            <span>·</span>
            <span>Nationwide COD</span>
            <span>·</span>
            <span>All Sales Final</span>
          </div>
        </div>
      </div>
    </ScrollReveal>
  </footer>
  );
};
