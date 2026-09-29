import React, { useState, useMemo, useEffect } from 'react';
import { fetchProducts, fetchCategories } from '../services/products';
import { subscribeToStore } from '../services/localStore';
import { ProductCard } from '../components/ProductCard';
import { Product, Category } from '../types';
import { BubaeBowIcon } from '../components/BubaeLogo';
import { BackButton } from '../components/BackButton';
import { Filter, X, SlidersHorizontal, RotateCcw, ArrowRight } from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';

interface ShopPageProps {
  initialCategory?: string;
  isNewArrivalsOnly?: boolean;
  onQuickView: (product: Product) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  initialCategory,
  onQuickView,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-low' | 'price-high'>('featured');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const standardSizes = ['S', 'M', 'L', 'XL', 'XXL'];

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

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

    const unsubscribe = subscribeToStore(() => {
      loadData();
    });

    return unsubscribe;
  }, []);

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedSizes([]);
    setSearchQuery('');
    setSortBy('featured');
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }

      // Size filter
      if (selectedSizes.length > 0) {
        const hasMatchingSize = product.sizes?.some(s => selectedSizes.includes(s));
        if (!hasMatchingSize) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesCat = product.category.toLowerCase().includes(q);
        const matchesDesc = (product.description || '').toLowerCase().includes(q);
        const matchesColor = (product.color || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesDesc && !matchesColor) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      }
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [products, selectedCategory, selectedSizes, sortBy, searchQuery]);

  const activeCategoryTitle = useMemo(() => {
    if (selectedCategory === 'all') return 'All Apparel';
    const found = categories.find(c => c.slug === selectedCategory);
    return found ? found.name : 'All Apparel';
  }, [selectedCategory, categories]);

  return (
    <div className="bg-[#FAF6F4] min-h-screen py-6 sm:py-12 bg-grain-texture">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Top Navigation Row: Back Button */}
        <div className="flex items-center justify-start">
          <BackButton />
        </div>

        {/* Editorial Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium text-[#93576A]">
            <BubaeBowIcon size={16} />
            <span>The Collection</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-light text-stone-900 tracking-tight">
            {activeCategoryTitle}
          </h1>
          <p className="text-xs sm:text-[13.5px] text-[#6B4E5A] font-normal leading-relaxed max-w-md mx-auto">
            Modern fashion within your budget. Cash on Delivery across all 64 districts in Bangladesh.
          </p>
        </div>

        {/* Editorial Category Pill / Text Navigation Bar */}
        <div className="flex justify-center border-b border-[#E8CCD5] pb-4 overflow-x-auto">
          <div className="flex items-center gap-6 sm:gap-10 text-xs uppercase tracking-[0.16em] font-medium">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`hover-underline-animation py-1.5 transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'text-stone-950 font-bold text-[#D94676]'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Pieces
            </button>

            {categories.map(cat => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`hover-underline-animation py-1.5 transition-colors cursor-pointer ${
                  selectedCategory === cat.slug
                    ? 'text-stone-950 font-bold text-[#D94676]'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Controls & Sort Strip */}
        <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-[#ECD3DC] flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
          {/* Active filter count / Mobile trigger */}
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 rounded-full border border-stone-300 text-xs font-semibold text-stone-800"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            <span className="text-[12px] text-[#6B4E5A] font-medium tracking-wide">
              Showing <strong className="text-stone-900 font-semibold">{filteredProducts.length}</strong> pieces
            </span>
          </div>

          {/* Quick Sort Dropdown */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <span className="text-[11px] uppercase tracking-wider text-[#7A5B67] font-semibold hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-4 py-2 rounded-full border border-stone-200 bg-white text-xs font-medium text-stone-800 focus:outline-hidden focus:border-[#D94676] cursor-pointer"
            >
              <option value="featured">Featured First</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Main Grid & Desktop Sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-10 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden md:block col-span-1 bg-white/80 backdrop-blur-xs p-6 rounded-2xl border border-[#ECD3DC] space-y-6 sticky top-28 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <span className="text-xs uppercase tracking-wider font-bold text-stone-900">
                Filter Apparel
              </span>
              {(selectedCategory !== 'all' || selectedSizes.length > 0 || searchQuery.trim() !== '') && (
                <button
                  onClick={resetFilters}
                  className="text-[11px] text-[#D94676] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Size Filter */}
            <div className="space-y-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-700 block">
                Size
              </span>
              <div className="flex flex-wrap gap-2">
                {standardSizes.map(size => {
                  const active = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`min-w-9 h-9 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        active
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trust Notice */}
            <div className="p-3.5 rounded-xl bg-[#FFF0F4] border border-[#F9CAD5] text-[11px] text-stone-700 leading-relaxed">
              <strong className="block text-[#D94676] mb-1 font-semibold">Cash on Delivery Notice:</strong>
              Nationwide delivery. Inside Sylhet ৳80, Outside Main Town ৳115, Sunamganj & Maulvibazar ৳135, Outside Sylhet ৳155. No advance payment required.
            </div>
          </aside>

          {/* Product Grid Area */}
          <div className="col-span-1 md:col-span-3">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="space-y-3 animate-pulse">
                    <div className="w-full aspect-[4/5] bg-[#F2D5DE]/40 rounded-2xl" />
                    <div className="h-3 w-16 bg-[#F2D5DE]/60 rounded-full" />
                    <div className="h-4 w-3/4 bg-[#E8CCD5] rounded-full" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white/90 p-12 sm:p-16 text-center rounded-2xl border border-[#ECD3DC] space-y-4 shadow-2xs">
                <p className="text-2xl sm:text-3xl font-serif text-stone-800 italic">“Your edit is waiting.”</p>
                <p className="text-[13px] text-[#6B4E5A] leading-relaxed max-w-sm mx-auto font-normal">
                  No products match your selected filter criteria. Try adjusting your size or budget filters to view available pieces.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2.5 rounded-full bg-stone-900 text-white text-xs font-semibold hover:bg-black transition-all duration-300 cursor-pointer shadow-xs hover:shadow-sm"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                {filteredProducts.map((product, idx) => (
                  <ScrollReveal
                    key={product.id}
                    variant="fade-up"
                    delay={(idx % 3) * 75}
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
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xs bg-white h-full p-6 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  Filter Catalog
                </span>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 text-stone-400 hover:text-black cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-700 block">
                  Category
                </span>
                <div className="space-y-1 text-xs">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left py-2 px-3 rounded-lg ${
                      selectedCategory === 'all'
                        ? 'bg-[#FFF0F4] text-[#D94676] font-bold'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    All Apparel
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.slug}
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`w-full text-left py-2 px-3 rounded-lg capitalize ${
                        selectedCategory === cat.slug
                          ? 'bg-[#FFF0F4] text-[#D94676] font-bold'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-700 block">
                  Sizes
                </span>
                <div className="flex flex-wrap gap-2">
                  {standardSizes.map(size => {
                    const active = selectedSizes.includes(size);
                    return (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`min-w-9 h-9 px-2.5 rounded-lg text-xs font-semibold border ${
                          active
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-white text-stone-700 border-stone-200'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 bg-stone-900 text-white rounded-full text-xs font-bold uppercase tracking-wider"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
