import React, { useState } from 'react';
import { Product } from '../types';
import { useWishlist } from '../context/WishlistContext';
import { useNavigation } from '../context/NavigationContext';
import { useCart } from '../context/CartContext';
import { Heart, ShoppingBag, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  aspectRatio?: '4/5' | '3/4';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  aspectRatio = '4/5',
}) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { openProduct } = useNavigation();
  const { addToCart } = useCart();

  const [isHovered, setIsHovered] = useState(false);
  const [quickAddNotice, setQuickAddNotice] = useState(false);
  const isWishlisted = isInWishlist(product.id);

  const primaryImage = product.image_url || product.images?.[0] || '';
  const secondaryImage = product.second_image_url || (product.images && product.images.length > 1 ? product.images[1] : null);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultSize = product.sizes?.[0] || 'M';
    const defaultColor = product.color || 'Standard';
    const res = addToCart(product, defaultSize, defaultColor, 1);
    if (res.success) {
      setQuickAddNotice(true);
      setTimeout(() => setQuickAddNotice(false), 1600);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const discountPercent =
    product.old_price && product.old_price > product.price
      ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
      : null;

  return (
    <div
      onClick={() => openProduct(product.slug)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] sm:hover:-translate-y-1 active:scale-[0.985]"
    >
      {/* Editorial Image Container (Generous Breathing Room) */}
      <div
        className={`relative w-full overflow-hidden bg-[#F5EBEF] rounded-xl sm:rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:shadow-[0_12px_28px_-8px_rgba(52,23,34,0.15)] ${
          aspectRatio === '4/5' ? 'aspect-[4/5]' : 'aspect-[3/4]'
        }`}
      >
        {/* Primary Image with Subtle Zoom */}
        <img
          src={primaryImage}
          alt={product.name}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover object-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            secondaryImage && isHovered
              ? 'opacity-0 scale-103'
              : isHovered
              ? 'scale-104'
              : 'scale-100 opacity-100'
          }`}
        />

        {/* Secondary Image Crossfade Reveal */}
        {secondaryImage && (
          <img
            src={secondaryImage}
            alt={`${product.name} alternate view`}
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isHovered ? 'opacity-100 scale-103' : 'opacity-0 scale-100 pointer-events-none'
            }`}
          />
        )}

        {/* Subtle Discount Tag */}
        {discountPercent && (
          <div className="absolute top-3 left-3 bg-[#4A2432]/90 backdrop-blur-xs text-[#FFF0F4] text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full shadow-xs">
            {discountPercent}% OFF
          </div>
        )}

        {/* Wishlist Floating Action Icon */}
        <button
          onClick={handleWishlistClick}
          className={`absolute top-3 right-3 p-2.5 rounded-full transition-all duration-300 ease-out cursor-pointer z-10 active:scale-90 ${
            isWishlisted
              ? 'bg-[#FFF0F4] text-[#D94676] shadow-sm scale-105'
              : 'bg-white/80 backdrop-blur-xs text-stone-700 hover:text-[#D94676] hover:bg-white opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-105 shadow-xs'
          }`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-transform duration-300 ${
              isWishlisted ? 'fill-current scale-110' : ''
            }`}
          />
        </button>

        {/* Quick Add Overlay Pill on Desktop Hover */}
        <div className="absolute inset-x-3 bottom-3 hidden sm:flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
          <button
            onClick={handleQuickAdd}
            className="flex-1 py-2.5 px-3 bg-stone-900/90 hover:bg-stone-900 backdrop-blur-md text-[#FFF0F4] rounded-full text-xs font-semibold tracking-wide transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            {quickAddNotice ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#25D366]" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-[#F9CAD5]" />
                <span>Quick Add</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Clean Product Details Underneath (Editorial Catalog Style) */}
      <div className="pt-3.5 pb-1 space-y-1">
        {/* Subtle Category */}
        <span className="text-[10px] uppercase tracking-[0.18em] font-medium text-[#93576A]">
          {product.category.replace('-', ' ')}
        </span>

        {/* Title */}
        <h3 className="text-sm sm:text-base font-serif font-medium text-stone-900 group-hover:text-[#BE185D] transition-colors leading-snug line-clamp-1">
          {product.name}
        </h3>

        {/* Clean Pricing Baseline */}
        <div className="flex items-baseline gap-2.5 pt-0.5">
          <span className="text-sm sm:text-base font-semibold text-stone-900 tabular-nums">
            ৳{product.price.toLocaleString()}
          </span>
          {product.old_price && product.old_price > product.price && (
            <span className="text-xs text-stone-600 line-through tabular-nums">
              ৳{product.old_price.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
