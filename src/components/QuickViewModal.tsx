import React, { useState, useEffect } from 'react';
import { Product, ProductColor, ProductSize } from '../types';
import { useCart } from '../context/CartContext';
import { useNavigation } from '../context/NavigationContext';
import { BRAND } from '../data/brand';
import { X, Check, ShoppingBag, MessageCircle, AlertTriangle, Ruler } from 'lucide-react';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenSizeGuide: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onOpenSizeGuide,
}) => {
  if (!product) return null;

  const { addToCart } = useCart();
  const { openProduct } = useNavigation();

  const productImages: string[] = product.images && product.images.length > 0
    ? product.images
    : [product.image_url, product.second_image_url, product.third_image_url].filter(Boolean) as string[];

  const productColors: ProductColor[] = product.colors && product.colors.length > 0
    ? product.colors
    : [{ name: product.color || 'Standard', hex: '#F8C8D4' }];

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<ProductColor>(productColors[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(productImages[0] || product.image_url);
  const [addedNotice, setAddedNotice] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      const imgs = product.images && product.images.length > 0
        ? product.images
        : [product.image_url, product.second_image_url, product.third_image_url].filter(Boolean) as string[];
      const cols = product.colors && product.colors.length > 0
        ? product.colors
        : [{ name: product.color || 'Standard', hex: '#F8C8D4' }];
      setSelectedSize('');
      setSelectedColor(cols[0]);
      setActiveImage(imgs[0] || product.image_url);
      setQuantity(1);
      setSizeError(null);
    }
  }, [product]);

  const currentSizeStock = selectedSize && product.sizeStock
    ? (product.sizeStock[selectedSize] ?? 0)
    : 0;

  const handleSelectSize = (size: string) => {
    const sStock = product.sizeStock?.[size] ?? 0;
    if (sStock <= 0) return; // unselectable
    setSelectedSize(size);
    setSizeError(null);
    setQuantity(prev => {
      if (prev > sStock) return Math.max(1, sStock);
      return prev < 1 ? 1 : prev;
    });
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError('Please select a size first.');
      return;
    }
    const res = addToCart(product, selectedSize, selectedColor.name, quantity);
    if (res.success) {
      setSizeError(null);
      setAddedNotice(true);
      setTimeout(() => {
        setAddedNotice(false);
        onClose();
      }, 1200);
    } else if (res.error) {
      setSizeError(res.error);
    }
  };

  // WhatsApp Order message formatting:
  const generateWhatsAppUrl = () => {
    const text = `Hello Bubaé,

I would like to order:

Product:
${product.name}

Size:
${selectedSize}

Color:
${selectedColor.name}

Quantity:
${quantity}

Price:
৳${(product.price * quantity).toLocaleString()}

Delivery:
Cash on Delivery

Policy:
I agree to the No Return / No Exchange policy.

Please confirm the order.`;

    return `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  const oldPriceVal = product.old_price ?? product.oldPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#F9CAD5]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-stone-700 hover:text-black transition-colors cursor-pointer border border-stone-200"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          {/* Images Gallery */}
          <div className="space-y-3">
            <div className="aspect-[4/5] w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
            </div>

            {productImages.length > 1 && (
              <div className="flex gap-2">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-16 h-20 rounded-md overflow-hidden border-2 cursor-pointer transition-colors ${
                      activeImage === img ? 'border-[#EC4899]' : 'border-transparent opacity-70'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details & Selection */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold mb-1">
                {product.categoryName || product.category.replace('-', ' ')}
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mb-2">
                {product.name}
              </h2>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-2xl font-bold text-stone-900 tabular-nums">
                  ৳{product.price.toLocaleString()}
                </span>
                {oldPriceVal && (
                  <span className="text-sm text-stone-400 line-through tabular-nums">
                    ৳{oldPriceVal.toLocaleString()}
                  </span>
                )}
                {product.discount && (
                  <span className="text-xs bg-[#FFF0F3] text-[#EC4899] font-bold px-2 py-0.5 rounded-sm border border-[#F9CAD5]">
                    {product.discount}
                  </span>
                )}
              </div>

              <p className="text-xs text-stone-600 line-clamp-2 mb-4 leading-relaxed">
                {product.description}
              </p>

              {/* Color Selection */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-stone-700 mb-2">
                  Color: <span className="font-normal text-stone-500">{selectedColor.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {productColors.map(col => (
                    <button
                      key={col.name}
                      onClick={() => setSelectedColor(col)}
                      className={`relative w-8 h-8 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                        selectedColor.name === col.name
                          ? 'border-[#EC4899] scale-110 shadow-xs'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                      style={{ backgroundColor: col.hex || '#F8C8D4' }}
                      title={col.name}
                    >
                      {selectedColor.name === col.name && (
                        <Check className="w-3.5 h-3.5 text-stone-900 stroke-[2.5]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-stone-700">
                    Size: {selectedSize ? (
                      <strong className="text-stone-900 font-bold">{selectedSize}</strong>
                    ) : (
                      <span className="text-[#BE185D] font-normal italic">Select an available size</span>
                    )}
                  </span>
                  <button
                    onClick={onOpenSizeGuide}
                    className="text-xs text-[#EC4899] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Size Guide</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => {
                    const sStock = product.sizeStock?.[size] ?? 0;
                    const isAvailable = sStock > 0;
                    const isSelected = selectedSize === size;

                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => handleSelectSize(size)}
                        className={`min-w-10 h-10 px-3 text-xs font-semibold rounded-lg border transition-all ${
                          !isAvailable
                            ? 'bg-stone-100/70 text-stone-400 border-stone-200 line-through cursor-not-allowed opacity-45'
                            : isSelected
                            ? 'bg-stone-900 text-[#FFF0F3] border-stone-900 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400 cursor-pointer'
                        }`}
                        title={!isAvailable ? `${size} is currently out of stock` : `Select size ${size}`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>

                {sizeError && (
                  <p className="mt-2 text-xs text-[#BE185D] font-medium">{sizeError}</p>
                )}
              </div>

              {/* Quantity - Revealed ONLY after size selection */}
              {selectedSize ? (
                <div className="mb-4 animate-in fade-in duration-200">
                  <span className="text-xs font-semibold text-stone-700 block mb-2">Quantity</span>
                  <div className="flex items-center border border-stone-200 rounded-lg w-28">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className={`w-8 h-8 flex items-center justify-center transition-colors ${
                        quantity <= 1 ? 'text-stone-300 cursor-not-allowed' : 'text-stone-600 hover:bg-stone-100 cursor-pointer'
                      }`}
                    >
                      -
                    </button>
                    <span className="flex-1 text-center text-xs font-bold text-stone-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(currentSizeStock, quantity + 1))}
                      disabled={quantity >= currentSizeStock}
                      className={`w-8 h-8 flex items-center justify-center transition-colors ${
                        quantity >= currentSizeStock ? 'text-stone-300 cursor-not-allowed' : 'text-stone-600 hover:bg-stone-100 cursor-pointer'
                      }`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-2.5 bg-stone-50 rounded-lg border border-dashed border-stone-200 text-xs text-stone-500">
                  Select a size to choose quantity.
                </div>
              )}

              {/* Strict No-Return Notice */}
              <div className="p-3 bg-[#FFF0F3] rounded-xl border border-[#F9CAD5] mb-4 text-[11px] text-stone-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#EC4899] shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Policy:</strong> We do not offer returns or exchanges. Please double-check sizing before placing order.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleAddToCart}
                className="w-full py-3.5 px-4 bg-[#2E151E] hover:bg-black text-[#FFF0F4] text-xs font-bold uppercase tracking-[0.16em] rounded-full transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {addedNotice ? (
                  <>
                    <Check className="w-4 h-4 text-[#25D366]" />
                    <span>Added to Bag!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-[#F9CAD5]" />
                    <span>{selectedSize ? 'Add to Shopping Bag' : 'Select a Size'}</span>
                  </>
                )}
              </button>

              {selectedSize ? (
                <a
                  href={generateWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-black text-xs font-bold uppercase tracking-[0.16em] rounded-full transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2 shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 fill-black" />
                  <span>Order via WhatsApp (COD)</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setSizeError('Please select a size first before ordering.')}
                  className="w-full py-3.5 px-4 bg-[#25D366]/60 text-stone-800 text-xs font-bold uppercase tracking-[0.16em] rounded-full flex items-center justify-center gap-2 opacity-80 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-stone-800" />
                  <span>Select Size for WhatsApp Order</span>
                </button>
              )}

              <div className="text-center pt-1">
                <button
                  onClick={() => {
                    onClose();
                    openProduct(product.slug);
                  }}
                  className="text-xs text-stone-500 hover:text-black underline"
                >
                  View full product details →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
