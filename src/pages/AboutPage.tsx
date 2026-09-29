import React from 'react';
import { BRAND } from '../data/brand';
import { BRAND_IMAGES } from '../data/products';
import { useNavigation } from '../context/NavigationContext';
import { BubaeLogo } from '../components/BubaeLogo';
import { BackButton } from '../components/BackButton';
import { Heart, Sparkles, Truck, ShieldCheck, ArrowRight } from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';

export const AboutPage: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Top Navigation Row: Back Button */}
      <div className="flex items-center justify-start mb-6">
        <BackButton />
      </div>

      {/* Brand Introduction */}
      <ScrollReveal variant="fade-up" duration={700} className="max-w-3xl mx-auto text-center space-y-4 mb-14">
        <div className="inline-block bg-[#F8C8D4] px-5 py-2.5 rounded-2xl mb-2">
          <BubaeLogo />
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 leading-tight">
          Modern fashion within your budget.
        </h1>
        <p className="font-script text-3xl sm:text-4xl text-[#BE185D]">
          thoughtfully designed for you
        </p>
      </ScrollReveal>

      {/* Main Story & Campaign Image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center mb-16">
        <ScrollReveal variant="scale-subtle" duration={750} className="lg:col-span-6 rounded-3xl overflow-hidden border border-[#F9CAD5] shadow-lg aspect-[4/3] bg-stone-100">
          <img
            src={BRAND_IMAGES.about}
            alt="Bubaé Fashion Studio"
            className="w-full h-full object-cover"
          />
        </ScrollReveal>

        <ScrollReveal variant="fade-up" delay={150} duration={700} className="lg:col-span-6 space-y-5 text-stone-700 leading-relaxed text-sm sm:text-base">
          <span className="text-xs uppercase font-bold tracking-widest text-[#EC4899]">
            The Brand
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
            Feminine, stylish and accessible.
          </h2>
          <p>
            {BRAND.story}
          </p>
          <p>
            We believe that looking modern and polished should not require an extravagant budget. Every collection is thoughtfully curated with breathable fabrics, flattering cuts, and delicate feminine nuances inspired by our soft pink brand heritage.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-4 text-xs font-semibold text-stone-800">
            <div className="p-3 bg-white rounded-xl border border-[#F9CAD5] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#EC4899]" />
              <span>Cash on Delivery Only</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#F9CAD5] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#EC4899]" />
              <span>Transparent Sizing & Policies</span>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Brand Values */}
      <ScrollReveal variant="fade-up" duration={700} className="bg-[#FFF0F3] rounded-3xl p-8 sm:p-12 border border-[#F9CAD5] mb-16">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs uppercase font-bold tracking-widest text-[#EC4899]">
            What Defines Bubaé
          </span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
            Our Core Pillars
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScrollReveal variant="fade-up" delay={100} duration={600} className="bg-white p-6 rounded-2xl border border-[#F9CAD5]/60 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FFF0F3] text-[#EC4899] flex items-center justify-center font-bold">
              ✨
            </div>
            <h4 className="text-base font-bold text-stone-900">Modern & Feminine</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Curated silhouettes from airy midi dresses to chic oversized shirts and tailored co-ord sets.
            </p>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={200} duration={600} className="bg-white p-6 rounded-2xl border border-[#F9CAD5]/60 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FFF0F3] text-[#EC4899] flex items-center justify-center font-bold">
              💗
            </div>
            <h4 className="text-base font-bold text-stone-900">Budget Friendly</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Modern fashion within your budget. Accessible prices without sacrificing aesthetic presentation.
            </p>
          </ScrollReveal>

          <ScrollReveal variant="fade-up" delay={300} duration={600} className="bg-white p-6 rounded-2xl border border-[#F9CAD5]/60 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FFF0F3] text-[#EC4899] flex items-center justify-center font-bold">
              📦
            </div>
            <h4 className="text-base font-bold text-stone-900">Simple COD Shopping</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Straightforward Cash on Delivery with no advance product payment and quick WhatsApp confirmation.
            </p>
          </ScrollReveal>
        </div>
      </ScrollReveal>

      {/* CTA */}
      <ScrollReveal variant="fade-up" duration={600} className="text-center space-y-4">
        <h3 className="text-2xl font-serif font-bold text-stone-900">
          Ready to elevate your everyday style?
        </h3>
        <div>
          <button
            onClick={() => navigate('/shop')}
            className="px-8 py-3.5 rounded-xl bg-[#191919] hover:bg-black text-[#FFF0F3] text-xs sm:text-sm font-bold tracking-wider uppercase transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
          >
            <span>DISCOVER THE COLLECTION</span>
            <ArrowRight className="w-4 h-4 text-[#F9CAD5]" />
          </button>
        </div>
      </ScrollReveal>
    </div>
  );
};
