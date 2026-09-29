import React, { useState, useMemo, useEffect, useRef } from 'react';
import { fetchProducts } from '../services/products';
import { Product } from '../types';
import { useNavigation } from '../context/NavigationContext';
import { Search, X, ArrowRight } from 'lucide-react';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const { openProduct } = useNavigation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProducts({ forCustomer: true }).then(setAllProducts);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const filteredProducts = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return allProducts.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.color && p.color.toLowerCase().includes(q))
    );
  }, [query, allProducts]);

  const popularSearches = ['Cargo Pants', 'Blush Trousers', 'Minimalist T-Shirt', 'Oversized Tee', 'Pants'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl border border-[#F9CAD5] animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-black rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Close search"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Search Bar Input */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pants, oversized t-shirts, minimal tees..."
            className="w-full pl-11 pr-4 py-3.5 bg-[#FFF8F9] rounded-xl border border-[#F9CAD5] focus:outline-hidden focus:border-[#EC4899] focus:ring-2 focus:ring-[#F9CAD5]/50 text-sm text-stone-900 placeholder:text-stone-400 font-medium"
          />
        </div>

        {/* Popular Tags when query is empty */}
        {!query.trim() && (
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 block">
              Popular Searches
            </span>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map(term => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-3 py-1.5 rounded-full bg-[#FFF0F3] hover:bg-[#FFE4EB] text-stone-700 text-xs font-medium transition-colors border border-[#F9CAD5]/60 cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {query.trim() && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-100">
              <span>Results for "{query}"</span>
              <span>{filteredProducts.length} items found</span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-stone-500">
                <p className="text-sm font-medium text-stone-800">No products found</p>
                <p className="text-xs mt-1 text-stone-400">
                  Try searching for "pants", "cargo", "t-shirt", or "oversized".
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto pr-1">
                {filteredProducts.map(product => {
                  const oldPriceVal = product.old_price ?? product.oldPrice;
                  return (
                    <div
                      key={product.id}
                      onClick={() => {
                        onClose();
                        openProduct(product.slug);
                      }}
                      className="py-3 flex items-center gap-4 hover:bg-[#FFF8F9] px-2 rounded-xl transition-colors cursor-pointer group"
                    >
                      <img
                        src={product.image_url || product.images?.[0] || ''}
                        alt={product.name}
                        className="w-14 h-16 object-cover rounded-lg border border-stone-100 shrink-0 bg-stone-50"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-medium">
                          {product.categoryName || product.category.replace('-', ' ')}
                        </span>
                        <h4 className="text-sm font-semibold text-stone-900 group-hover:text-[#BE185D] transition-colors truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-sm font-bold text-stone-900 tabular-nums">
                            ৳{product.price.toLocaleString()}
                          </span>
                          {oldPriceVal && (
                            <span className="text-xs text-stone-400 line-through tabular-nums">
                              ৳{oldPriceVal.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-[#EC4899] group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
