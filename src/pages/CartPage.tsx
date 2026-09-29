import React from 'react';
import { useCart } from '../context/CartContext';
import { useNavigation } from '../context/NavigationContext';
import { BubaeBowIcon } from '../components/BubaeLogo';
import { BackButton } from '../components/BackButton';
import { Trash2, ShoppingBag, ArrowRight, ShieldAlert, Truck, ChevronLeft } from 'lucide-react';
import { DELIVERY_ZONES } from '../data/brand';

export const CartPage: React.FC = () => {
  const {
    items,
    itemCount,
    subtotal,
    deliveryEstimate,
    deliveryLocation,
    total,
    removeFromCart,
    updateQuantity,
    clearCart,
    setDeliveryLocation,
  } = useCart();

  const { navigate } = useNavigation();

  if (items.length === 0) {
    return (
      <div className="bg-[#FAF6F4] min-h-[70vh] flex flex-col justify-center px-4 py-16 bg-grain-texture">
        <div className="max-w-md w-full mx-auto mb-6 flex justify-start">
          <BackButton />
        </div>
        <div className="max-w-md w-full mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#FCE8EE] flex items-center justify-center mx-auto text-[#D94676] shadow-xs">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#A8657B]">
              Shopping Bag
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-light text-stone-900 tracking-tight">
              “Your bag is empty.”
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-light leading-relaxed max-w-sm mx-auto">
              Explore Bubaé's latest collections of pants, minimalist tees and oversized fits. Modern fashion within your budget!
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
              <span>Shopping Bag</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-light text-stone-900 tracking-tight">
              Review Bag ({itemCount})
            </h1>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-stone-400 hover:text-rose-500 transition-colors cursor-pointer self-start sm:self-auto"
          >
            Clear bag
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Items List */}
          <div className="lg:col-span-8 bg-white/80 backdrop-blur-xs rounded-2xl border border-[#ECD3DC] p-6 sm:p-8 shadow-xs divide-y divide-[#ECD3DC]">
            {items.map(item => (
              <div key={item.id} className="py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                <img
                  src={item.product.image_url || item.product.images?.[0] || ''}
                  alt={item.product.name}
                  className="w-24 h-30 object-cover rounded-xl border border-stone-200 shrink-0 bg-stone-50"
                />

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-[#93576A] uppercase font-semibold tracking-wider">
                    {item.product.categoryName || item.product.category}
                  </span>
                  <h3 className="text-base font-serif font-medium text-stone-900">
                    {item.product.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                    <span>Size: <strong className="text-stone-800">{item.selectedSize}</strong></span>
                    <span>·</span>
                    <span>Color: <strong className="text-stone-800">{typeof item.selectedColor === 'string' ? item.selectedColor : item.selectedColor?.name || 'Standard'}</strong></span>
                  </div>
                  <div className="text-xs text-stone-400 mt-1">
                    Unit Price: ৳{item.unitPrice.toLocaleString()}
                  </div>
                </div>

                {/* Quantity Controls & Total */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4">
                  <div className="flex items-center border border-stone-300 rounded-full overflow-hidden bg-white">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-3 py-1 text-xs text-stone-600 hover:bg-stone-100 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-bold text-stone-900 tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-3 py-1 text-xs text-stone-600 hover:bg-stone-100 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-base font-semibold text-stone-900 tabular-nums">
                      ৳{(item.unitPrice * item.quantity).toLocaleString()}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-stone-400 hover:text-rose-500 p-1 cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary & Checkout Box */}
          <div className="lg:col-span-4 bg-white/90 backdrop-blur-xs rounded-2xl border border-[#ECD3DC] p-6 sm:p-8 space-y-6 shadow-xs sticky top-28">
            <h2 className="text-lg font-serif font-medium text-stone-900 pb-3 border-b border-[#ECD3DC]">
              Order Summary
            </h2>

            {/* Official Delivery Notice */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#FFF5F8] to-[#FFF0F4] border border-[#F9CAD5] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#BE185D] flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#EC4899]" />
                  Delivery Charge
                </span>
                <span className="text-[10px] text-stone-500 bg-white/80 px-2 py-0.5 rounded-full border border-stone-200">
                  Cash on Delivery
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Automatically calculated at checkout from your address:
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-medium text-stone-800">
                <div className="bg-white/80 p-1.5 rounded border border-[#F9CAD5]/40">
                  <span className="text-stone-500 block text-[9.5px]">Inside Main Town</span>
                  <span className="font-bold text-[#BE185D]">৳80</span>
                </div>
                <div className="bg-white/80 p-1.5 rounded border border-[#F9CAD5]/40">
                  <span className="text-stone-500 block text-[9.5px]">Outside Main Town</span>
                  <span className="font-bold text-[#BE185D]">৳115</span>
                </div>
                <div className="bg-white/80 p-1.5 rounded border border-[#F9CAD5]/40">
                  <span className="text-stone-500 block text-[9.5px]">Sunamganj/Maulvibazar</span>
                  <span className="font-bold text-[#BE185D]">৳135</span>
                </div>
                <div className="bg-white/80 p-1.5 rounded border border-[#F9CAD5]/40">
                  <span className="text-stone-500 block text-[9.5px]">Outside Sylhet</span>
                  <span className="font-bold text-[#BE185D]">৳155</span>
                </div>
              </div>
            </div>

            {/* Calculations */}
            <div className="space-y-2 text-xs text-stone-600 pt-2 border-t border-stone-100">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-stone-900 tabular-nums">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Delivery</span>
                <span className="font-medium text-stone-800 tabular-nums">
                  Calculated at checkout
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-stone-200 text-sm font-bold text-stone-900">
                <span>Subtotal (Before Delivery)</span>
                <span className="text-xl text-[#D94676] tabular-nums font-serif">৳{subtotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Cash on Delivery Notice */}
            <div className="p-3.5 rounded-xl bg-[#FFF0F4] border border-[#F9CAD5] text-xs text-stone-700 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#D94676]">
                <Truck className="w-4 h-4" />
                <span>Cash on Delivery Only</span>
              </div>
              <p className="text-[11px] leading-relaxed text-stone-600">
                No advance payment is needed. You pay the rider upon package arrival. All sales final (No Return/Exchange).
              </p>
            </div>

            {/* Checkout Action */}
            <button
              onClick={() => navigate('/checkout')}
              className="group w-full py-4 px-6 bg-[#2E151E] hover:bg-black text-[#FFF0F4] text-xs font-bold uppercase tracking-[0.16em] rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4 text-[#D94676] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/shop')}
              className="w-full text-center text-xs text-stone-500 hover:text-black hover:underline cursor-pointer pt-1"
            >
              ← Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
