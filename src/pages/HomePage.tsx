import React, { useEffect, useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { fetchProducts, fetchCategories } from '../services/products';
import { subscribeToStore } from '../services/localStore';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { BubaeLogo, BubaeBowIcon } from '../components/BubaeLogo';
import { SocialButtons } from '../components/SocialButtons';
import { ArrowRight, Sparkles, ShieldAlert, Truck, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { ScrollReveal } from '../components/ScrollReveal';

// Editorial image assets
import heroTexture from '../assets/images/hero_silk_drape_texture_1790542868225.jpg';
import editorialStillLife from '../assets/images/editorial_fashion_still_life_1790542881850.jpg';
import editorialMood from '../assets/images/editorial_mood_texture_1790542894832.jpg';

interface HomePageProps {
  onQuickView: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onQuickView }) => {
  const { navigate, openCategory } = useNavigation();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [prods, cats] = await Promise.all([
        fetchProducts({ forCustomer: true }),
        fetchCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setLoading(false);
    }

    loadData();

    // Re-fetch automatically when inventory or products change in Admin
    const unsubscribe = subscribeToStore(() => {
      loadData();
    });

    return unsubscribe;
  }, []);

  const displayedProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="space-y-0 text-stone-900 selection:bg-[#F2D5DE] selection:text-[#2E151E]">
      {/* ========================================================================= */}
      {/* 1. BRAND-FOCUSED EDITORIAL HERO (DEEP DUSTY-ROSE PALETTE)                  */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#381B24] via-[#46232F] to-[#2E151E] text-[#FFF0F4] pt-12 pb-24 sm:pt-20 sm:pb-32">
        {/* Soft Background Silk Texture Layer with Low Opacity */}
        <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay">
          <img
            src={heroTexture}
            alt=""
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="w-full h-full object-cover object-center filter saturate-50"
          />
        </div>

        {/* Ambient Subtle Glow Orbs */}
        <div className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-[#D94676]/15 blur-3xl pointer-events-none animate-pulse-subtle" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-[#824458]/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Brand Tagline & Delivery Notice */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#6E394A]/40 pb-4 mb-12 sm:mb-16 gap-2 text-xs"
          >
            <div className="flex items-center gap-2 tracking-[0.2em] uppercase font-light text-[#E8CCD5]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D94676]" />
              <span>Independent Girls' Fashion Label</span>
            </div>
            <div className="flex items-center gap-3 text-[#F2D5DE] font-medium tracking-wide">
              <span>Nationwide Cash on Delivery</span>
              <span className="opacity-40">/</span>
              <span>No Advance Payment</span>
            </div>
          </motion.div>

          {/* Hero Composition: Editorial Typography & Layered Brand Elements */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Headline, Tagline, and CTA */}
            <div className="lg:col-span-7 space-y-8">
              {/* Brand Wordmark & Bow Motif Accent */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-3"
              >
                <BubaeLogo variant="editorial" tone="light" />
              </motion.div>

              {/* Editorial Large Headline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-3"
              >
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-light tracking-tight text-[#FFF2F5] leading-[1.08] text-balance">
                  Modern fashion <br />
                  <span className="italic font-normal text-[#F2D5DE]">within your budget.</span>
                </h1>
              </motion.div>

              {/* Supporting Copy */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-sm sm:text-base text-[#D4B8C1] leading-relaxed max-w-lg font-light"
              >
                Curated wide-leg cargo pants, tailored trousers, minimalist cotton tees, and relaxed oversized fits. Thoughtfully designed for everyday ease and feminine sophistication.
              </motion.p>

              {/* Premium Rounded CTA & Secondary Navigation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6"
              >
                <button
                  onClick={() => navigate('/shop')}
                  className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#FAF6F4] text-[#2E151E] hover:bg-[#FFF2F5] text-xs font-bold uppercase tracking-[0.16em] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_12px_30px_-5px_rgba(217,70,118,0.35)] cursor-pointer active:scale-[0.98]"
                >
                  <span>SHOP COLLECTION</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#D94676] group-hover:translate-x-1.5 transition-transform duration-300" />
                </button>

                <button
                  onClick={() => openCategory('pants')}
                  className="text-xs uppercase tracking-[0.16em] font-medium text-[#F2D5DE] hover:text-white py-2 px-3 hover-underline-animation transition-colors cursor-pointer"
                >
                  Explore Pants
                </button>
              </motion.div>

              {/* Social Channels Preview in Hero */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.7 }}
                className="pt-6 border-t border-[#6E394A]/40"
              >
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#A8657B] font-medium mb-3">
                  Connect with Bubaé
                </div>
                <SocialButtons variant="dark-surface" />
              </motion.div>
            </div>

            {/* Right Column: Layered Editorial Still-Life & Ribbon Accents (No generic AI girl) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative"
            >
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Asymmetric Background Soft Frame */}
                <div className="absolute -inset-3 rounded-2xl bg-gradient-to-tr from-[#6E394A]/40 to-[#D94676]/20 blur-md" />

                {/* Primary Editorial Still-Life Card */}
                <div className="relative rounded-2xl overflow-hidden bg-[#4A2432] border border-[#7A3F50]/60 shadow-2xl">
                  <img
                    src={editorialStillLife}
                    alt="Bubaé fashion campaign still life"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="w-full aspect-[4/5] object-cover object-center filter contrast-105"
                  />

                  {/* Editorial Caption Tag at Bottom */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2E151E] via-[#2E151E]/70 to-transparent p-6 text-left space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#D94676] font-semibold block">
                      Core Edition
                    </span>
                    <h3 className="font-serif text-lg text-white font-light">
                      Pants, Minimalist & Oversized Tees
                    </h3>
                    <p className="text-xs text-[#E8CCD5]/80 font-light">
                      Crafted from fine cotton blends · Starting at ৳1,190
                    </p>
                  </div>
                </div>

                {/* Floating Ribbon Accent Badge */}
                <div className="absolute -top-4 -right-4 bg-[#FAF6F4] text-[#2E151E] p-3.5 rounded-2xl shadow-xl border border-[#F2D5DE] hidden sm:flex items-center gap-2.5">
                  <BubaeBowIcon size={24} />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold block">100% COD</span>
                    <span className="text-[#824458]">Pay upon delivery</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. PRODUCT CATALOG SECTION (WARM CREAM & SOFT BLUSH VISUAL MOOD)           */}
      {/* ========================================================================= */}
      <section className="bg-[#FAF6F4] py-20 sm:py-28 bg-grain-texture">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Editorial Header */}
          <ScrollReveal variant="fade-up" duration={700}>
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E8CCD5] pb-6 gap-6">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium text-[#93576A] mb-2">
                  <BubaeBowIcon size={16} />
                  <span>The Current Catalog</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-light text-stone-900 tracking-tight">
                  Curated Everyday Wear
                </h2>
              </div>

              {/* Editorial Category Links: SHOP BY PANTS · T-SHIRTS · OVERSIZED T-SHIRTS */}
              <div className="flex flex-wrap items-center gap-5 sm:gap-8 text-xs uppercase tracking-[0.16em] font-medium text-stone-600">
                <span className="text-stone-400 font-normal">Filter by:</span>

                <button
                  onClick={() => setActiveCategory('all')}
                  className={`hover-underline-animation cursor-pointer py-1 transition-colors ${
                    activeCategory === 'all'
                      ? 'text-stone-950 font-bold text-[#D94676]'
                      : 'hover:text-stone-950'
                  }`}
                >
                  All Pieces
                </button>

                {categories.map(cat => (
                  <button
                    key={cat.slug}
                    onClick={() => setActiveCategory(cat.slug)}
                    className={`hover-underline-animation cursor-pointer py-1 transition-colors ${
                      activeCategory === cat.slug
                        ? 'text-stone-950 font-bold text-[#D94676]'
                        : 'hover:text-stone-950'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Product Grid (Large Breathing Images, Minimal Unboxed Underneath) */}
          {loading ? (
            /* Elegant Skeleton Loaders in Bubaé Palette */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="space-y-3 animate-pulse">
                  <div className="w-full aspect-[4/5] bg-[#F2D5DE]/40 rounded-2xl" />
                  <div className="h-3 w-16 bg-[#F2D5DE]/60 rounded-full" />
                  <div className="h-4 w-3/4 bg-[#E8CCD5] rounded-full" />
                  <div className="h-4 w-20 bg-[#E8CCD5]/80 rounded-full" />
                </div>
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <p className="text-2xl font-serif text-stone-700 italic">“Nothing here yet.”</p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                No active products found in this category. Check back soon for fresh arrivals.
              </p>
              <button
                onClick={() => setActiveCategory('all')}
                className="px-6 py-2.5 rounded-full bg-stone-900 text-white text-xs font-semibold hover:bg-black transition-colors"
              >
                View All Categories
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
              {displayedProducts.map((product, idx) => (
                <ScrollReveal
                  key={product.id}
                  variant="fade-up"
                  delay={(idx % 4) * 75}
                  duration={650}
                >
                  <ProductCard
                    product={product}
                    onQuickView={onQuickView}
                  />
                </ScrollReveal>
              ))}
            </div>
          )}

          {/* View All Collection Banner */}
          <ScrollReveal variant="fade-up" delay={150} duration={600} className="pt-8 text-center">
            <button
              onClick={() => navigate('/shop')}
              className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full border border-[#D94676] text-[#2E151E] hover:bg-[#FCE8EE] text-xs uppercase tracking-[0.16em] font-semibold transition-all duration-300 hover:scale-102 cursor-pointer shadow-xs"
            >
              <span>EXPLORE ALL APPAREL</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D94676]" />
            </button>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. VISUAL EDITORIAL CAMPAIGN SECTION (DEEP ROSE VISUAL MOOD)               */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#4C2532] via-[#5A2C3C] to-[#421E2A] text-[#FFF0F4] py-24 sm:py-32">
        <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay">
          <img
            src={editorialMood}
            alt=""
            className="w-full h-full object-cover filter saturate-50"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <ScrollReveal variant="fade-up" duration={750} className="lg:col-span-7 space-y-6">
              <span className="text-xs uppercase tracking-[0.25em] text-[#F472B6] font-medium flex items-center gap-2">
                <BubaeBowIcon size={18} />
                <span>Bubaé Philosophy</span>
              </span>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-light text-white leading-tight">
                Made for your everyday.
              </h2>

              <p className="text-base sm:text-lg text-[#F2D5DE] font-light leading-relaxed max-w-xl">
                Modern pieces designed to fit your style, your mood and your budget. Thoughtful cuts that transition effortlessly from campus and casual meetups to dinner dates.
              </p>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => navigate('/shop')}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#FAF6F4] text-[#2E151E] hover:bg-[#FFF2F5] text-xs uppercase tracking-[0.16em] font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                >
                  <span>EXPLORE BUBAÉ</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#D94676]" />
                </button>

                <button
                  onClick={() => navigate('/about')}
                  className="text-xs uppercase tracking-[0.16em] text-[#F2D5DE] hover:text-white px-4 py-2 hover-underline-animation cursor-pointer"
                >
                  Read Our Story
                </button>
              </div>
            </ScrollReveal>

            {/* Editorial Highlight Strip */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ScrollReveal variant="fade-up" delay={100} duration={650}>
                <div className="bg-[#381B24]/80 backdrop-blur-md p-6 rounded-2xl border border-[#6E394A]/40 space-y-2 h-full">
                  <span className="text-[11px] uppercase tracking-wider text-[#D94676] font-bold block">
                    01. Cash on Delivery
                  </span>
                  <h4 className="text-sm font-semibold text-white">Zero Advance Payment</h4>
                  <p className="text-xs text-[#D4B8C1] leading-relaxed">
                    Confirm online, receive at your doorstep across Sylhet & all Bangladesh, pay cash to the rider.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal variant="fade-up" delay={200} duration={650}>
                <div className="bg-[#381B24]/80 backdrop-blur-md p-6 rounded-2xl border border-[#6E394A]/40 space-y-2 h-full">
                  <span className="text-[11px] uppercase tracking-wider text-[#D94676] font-bold block">
                    02. Honest Pricing
                  </span>
                  <h4 className="text-sm font-semibold text-white">Fashion for Everyone</h4>
                  <p className="text-xs text-[#D4B8C1] leading-relaxed">
                    Trendy, premium-feeling garments made accessible without luxury markups.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal variant="fade-up" delay={300} duration={650} className="sm:col-span-2">
                <div className="bg-[#381B24]/80 backdrop-blur-md p-6 rounded-2xl border border-[#6E394A]/40 space-y-2">
                  <span className="text-[11px] uppercase tracking-wider text-[#F472B6] font-bold block">
                    03. Exact Sizing
                  </span>
                  <h4 className="text-sm font-semibold text-white">Measured to Fit</h4>
                  <p className="text-xs text-[#D4B8C1] leading-relaxed">
                    Due to our strict no-return policy, each garment comes with clear size guides so you always receive the right fit.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. BRAND VALUES STRIP (SOFT BLUSH ACCENT VISUAL MOOD)                     */}
      {/* ========================================================================= */}
      <section className="bg-[#FCE8EE]/50 border-y border-[#ECD3DC] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-[#ECD3DC]">
            <ScrollReveal variant="fade-up" delay={0} duration={600} className="px-4 py-2 space-y-1">
              <span className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 block">
                Cash on Delivery
              </span>
              <p className="text-xs text-stone-600">
                Official delivery: Inside Sylhet ৳80, Outside Main Town ৳115, Sunamganj & Maulvibazar ৳135, Outside Sylhet ৳155.
              </p>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={120} duration={600} className="px-4 py-2 space-y-1">
              <span className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 block">
                Direct WhatsApp Confirmation
              </span>
              <p className="text-xs text-stone-600">
                Confirm order details directly with our team at +8801345599300.
              </p>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={240} duration={600} className="px-4 py-2 space-y-1">
              <span className="text-xs font-serif font-bold uppercase tracking-wider text-stone-900 block">
                No Return & No Exchange
              </span>
              <p className="text-xs text-stone-600">
                All sales final. Please review the size chart before placing orders.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
};
