import React, { useEffect, useState } from 'react';
import { BubaeLogo } from './BubaeLogo';
import { useNavigation } from '../context/NavigationContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Search, Heart, ShoppingBag, Menu, X, ArrowRight } from 'lucide-react';
import { fetchCategories } from '../services/products';
import { subscribeToStore } from '../services/localStore';
import { Category } from '../types';

interface HeaderProps {
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const { currentPath, navigate, openCategory } = useNavigation();
  const { itemCount, openCart } = useCart();
  const { wishlistIds } = useWishlist();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartAnimate, setCartAnimate] = useState(false);

  useEffect(() => {
    fetchCategories().then(setCategories);
    const unsubscribe = subscribeToStore(() => {
      fetchCategories().then(setCategories);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Trigger subtle scale pulse when cart count changes
  useEffect(() => {
    if (itemCount > 0) {
      setCartAnimate(true);
      const timer = setTimeout(() => setCartAnimate(false), 400);
      return () => clearTimeout(timer);
    }
  }, [itemCount]);

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-500 ${
        isScrolled
          ? 'bg-[#FAF6F4]/92 backdrop-blur-md shadow-xs border-b border-[#ECD6DD]'
          : 'bg-[#FAF6F4] border-b border-[#F4E3E8]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          {/* Mobile Left: Menu Toggle */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-800 hover:text-[#D94676] transition-colors focus:outline-hidden cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Bubaé Wordmark Identity */}
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <BubaeLogo tone="dark" />
          </div>

          {/* Center Navigation (Desktop): Shop, Pants, T-Shirts, Oversized T-Shirts */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-10 text-xs uppercase tracking-[0.16em] font-medium text-stone-700">
            <button
              onClick={() => navigate('/shop')}
              className={`hover-underline-animation hover:text-stone-900 transition-colors py-1 cursor-pointer ${
                currentPath === '/shop' ? 'text-stone-950 font-bold' : ''
              }`}
            >
              Shop All
            </button>

            {/* Dynamic categories from database */}
            {categories.map(cat => {
              const isActive = currentPath === `/category/${cat.slug}` || currentPath === `/${cat.slug}`;
              return (
                <button
                  key={cat.slug}
                  onClick={() => openCategory(cat.slug)}
                  className={`hover-underline-animation hover:text-stone-900 transition-colors py-1 cursor-pointer ${
                    isActive ? 'text-stone-950 font-bold' : ''
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons: Search, Wishlist, Cart */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Search */}
            <button
              onClick={onOpenSearch}
              className="p-2 text-stone-700 hover:text-[#D94676] transition-colors cursor-pointer rounded-full hover:bg-[#FCE8EE]/50 active:scale-90"
              aria-label="Search collection"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Wishlist */}
            <button
              onClick={() => navigate('/wishlist')}
              className="relative p-2 text-stone-700 hover:text-[#D94676] transition-colors cursor-pointer rounded-full hover:bg-[#FCE8EE]/50 active:scale-90"
              aria-label="Wishlist"
              title="Saved items"
            >
              <Heart
                className={`w-4 h-4 transition-transform duration-300 ${
                  wishlistIds.length > 0 ? 'text-[#D94676] fill-[#D94676]' : ''
                }`}
              />
              {wishlistIds.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D94676] ring-2 ring-[#FAF6F4]" />
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={openCart}
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full text-stone-800 hover:text-stone-950 bg-[#F5E2E8]/60 hover:bg-[#F5E2E8] transition-all cursor-pointer border border-[#ECD3DC] active:scale-95 ${
                cartAnimate ? 'scale-105 shadow-xs' : ''
              }`}
              aria-label="Shopping bag"
              title="View shopping bag"
            >
              <ShoppingBag className="w-4 h-4 text-stone-800" />
              <span className="text-xs font-semibold tabular-nums text-stone-900">
                {itemCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF6F4] border-b border-[#ECD6DD] px-5 py-6 space-y-5 animate-in slide-in-from-top-3 duration-300">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-[#A8657B] font-semibold block px-2 mb-2">
              Browse Collection
            </span>

            <button
              onClick={() => {
                navigate('/shop');
                closeMobile();
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-stone-900 hover:bg-[#F8E5EB] flex items-center justify-between"
            >
              <span>Shop All Apparel</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D94676]" />
            </button>

            {categories.map(cat => (
              <button
                key={cat.slug}
                onClick={() => {
                  openCategory(cat.slug);
                  closeMobile();
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-stone-700 hover:text-stone-950 hover:bg-[#F8E5EB] flex items-center justify-between"
              >
                <span>{cat.name}</span>
                <span className="text-xs text-stone-400">View</span>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-[#ECD6DD] space-y-2 text-xs text-stone-600">
            <button
              onClick={() => {
                navigate('/about');
                closeMobile();
              }}
              className="block w-full text-left px-3 py-1.5 hover:text-stone-950"
            >
              Our Story & Philosophy
            </button>
            <button
              onClick={() => {
                navigate('/size-guide');
                closeMobile();
              }}
              className="block w-full text-left px-3 py-1.5 hover:text-stone-950"
            >
              Size Guide
            </button>
            <button
              onClick={() => {
                navigate('/delivery');
                closeMobile();
              }}
              className="block w-full text-left px-3 py-1.5 hover:text-stone-950"
            >
              Cash on Delivery Information
            </button>
            <button
              onClick={() => {
                navigate('/return-policy');
                closeMobile();
              }}
              className="block w-full text-left px-3 py-1.5 text-rose-700 font-medium"
            >
              No Return / No Exchange Policy
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
