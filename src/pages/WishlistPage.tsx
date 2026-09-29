import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useNavigation } from '../context/NavigationContext';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';
import { BubaeBowIcon } from '../components/BubaeLogo';
import { BackButton } from '../components/BackButton';
import { Heart, ArrowRight } from 'lucide-react';

interface WishlistPageProps {
  onQuickView: (product: Product) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onQuickView }) => {
  const { wishlistProducts, clearWishlist } = useWishlist();
  const { navigate } = useNavigation();

  if (wishlistProducts.length === 0) {
    return (
      <div className="bg-[#FAF6F4] min-h-[70vh] flex flex-col justify-center px-4 py-16 bg-grain-texture">
        <div className="max-w-md w-full mx-auto mb-6 flex justify-start">
          <BackButton />
        </div>
        <div className="max-w-md w-full mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#FCE8EE] flex items-center justify-center mx-auto text-[#D94676] shadow-xs">
            <Heart className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#A8657B]">
              Personal Wishlist
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-light text-stone-900 tracking-tight">
              “Your edit is waiting.”
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-light leading-relaxed max-w-sm mx-auto">
              Save your favorite pants, minimalist tees and oversized fits to revisit anytime.
            </p>
          </div>
          <div>
            <button
              onClick={() => navigate('/shop')}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#2E151E] hover:bg-black text-[#FFF0F4] text-xs font-bold uppercase tracking-[0.16em] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D94676]" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF6F4] min-h-screen py-6 sm:py-12 bg-grain-texture">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Top Navigation Row: Back Button */}
        <div className="flex items-center justify-start">
          <BackButton />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-[#E8CCD5] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium text-[#93576A] mb-1.5">
              <BubaeBowIcon size={16} />
              <span>Saved Items</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-light text-stone-900 tracking-tight">
              My Saved Edit ({wishlistProducts.length})
            </h1>
          </div>
          <button
            onClick={clearWishlist}
            className="text-xs text-stone-400 hover:text-[#D94676] transition-colors cursor-pointer self-start sm:self-auto"
          >
            Clear all saved items
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
          {wishlistProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
