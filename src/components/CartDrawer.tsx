import React from 'react';
import { useCart } from '../context/CartContext';
import { useNavigation } from '../context/NavigationContext';
import { BubaeBowIcon } from './BubaeLogo';
import { X, ShoppingBag, Trash2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    items,
    itemCount,
    subtotal,
    deliveryEstimate,
    deliveryLocation,
    total,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    cartError,
  } = useCart();

  const { navigate } = useNavigation();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF6F4] shadow-2xl flex flex-col border-l border-[#ECD3DC]">
          {/* Header */}
          <div className="p-5 border-b border-[#ECD3DC] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <BubaeBowIcon size={18} />
              <h2 className="text-sm uppercase tracking-wider font-bold text-stone-900">
                Shopping Bag ({itemCount})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 text-stone-400 hover:text-black rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Banner */}
          {cartError && (
            <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{cartError}</span>
            </div>
          )}

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-[#ECD3DC]">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#FCE8EE] flex items-center justify-center text-[#D94676]">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-serif font-light text-stone-900">
                    “Your bag is empty.”
                  </h3>
                  <p className="text-[13px] text-[#6B4E5A] max-w-xs mx-auto leading-relaxed font-normal">
                    Explore Bubaé's latest collections of pants, minimalist tees and oversized fits.
                  </p>
                </div>
                <button
                  onClick={() => {
                    closeCart();
                    navigate('/shop');
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#2E151E] hover:bg-black text-[#FFF0F4] text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:-translate-y-0.5 cursor-pointer shadow-sm"
                >
                  <span>Start Shopping</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#D94676]" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="pt-4 first:pt-0 flex gap-4">
                    <img
                      src={item.product.image_url || item.product.images?.[0] || ''}
                      alt={item.product.name}
                      className="w-18 h-22 object-cover rounded-xl border border-stone-200 shrink-0 bg-stone-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs sm:text-sm font-serif font-medium text-stone-900 line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-stone-400 hover:text-rose-500 p-1 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-0.5">
                        <span>Size: <strong className="text-stone-800">{item.selectedSize}</strong></span>
                        <span>·</span>
                        <span>Color: <strong className="text-stone-800">{typeof item.selectedColor === 'string' ? item.selectedColor : item.selectedColor?.name || 'Standard'}</strong></span>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-stone-300 rounded-full overflow-hidden bg-white">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2.5 py-0.5 text-xs text-stone-600 hover:bg-stone-100"
                          >
                            -
                          </button>
                          <span className="px-2 py-0.5 text-xs font-bold text-stone-900 tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2.5 py-0.5 text-xs text-stone-600 hover:bg-stone-100"
                          >
                            +
                          </button>
                        </div>

                        {/* Price */}
                        <span className="text-xs sm:text-sm font-semibold text-stone-900 tabular-nums">
                          ৳{(item.unitPrice * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Totals & Checkout */}
          {items.length > 0 && (
            <div className="p-5 border-t border-[#ECD3DC] bg-white space-y-3.5">
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900 tabular-nums">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span>Delivery Charge</span>
                  <span className="font-medium text-stone-600">
                    Calculated at checkout
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone-200 text-sm font-bold text-stone-900">
                  <span>Bag Subtotal</span>
                  <span className="text-base text-[#D94676] tabular-nums font-serif">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Cash On Delivery & No Return Banner */}
              <div className="p-2.5 rounded-xl bg-[#FFF0F4] border border-[#F9CAD5] text-[11px] text-stone-700 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D94676] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-stone-900 block">Cash on Delivery (No Advance)</span>
                  Pay upon delivery. Bubaé operates on a strict No Return / No Exchange policy.
                </div>
              </div>

              {/* Checkout Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => {
                    closeCart();
                    navigate('/cart');
                  }}
                  className="w-full text-xs font-semibold py-3 px-3 rounded-full border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-center transition-colors cursor-pointer active:scale-[0.98]"
                >
                  View Full Bag
                </button>
                <button
                  onClick={() => {
                    closeCart();
                    navigate('/checkout');
                  }}
                  className="group w-full text-xs font-semibold py-3 px-3 rounded-full bg-[#2E151E] hover:bg-black text-[#FFF0F4] text-center transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#D94676] group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
