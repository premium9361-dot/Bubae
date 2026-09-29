import React, { useState, useEffect } from 'react';
import { fetchProductBySlug, fetchProducts, getCachedProductBySlug } from '../services/products';
import { Product, ProductColor, ProductSize } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useNavigation } from '../context/NavigationContext';
import { BRAND } from '../data/brand';
import { ProductCard } from '../components/ProductCard';
import { BackButton } from '../components/BackButton';
import {
  Heart,
  ShoppingBag,
  MessageCircle,
  Truck,
  ShieldAlert,
  Ruler,
  Check,
  ChevronRight,
  AlertCircle,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

interface ProductDetailPageProps {
  slug: string;
  onOpenSizeGuide: () => void;
  onQuickView: (product: Product) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  slug,
  onOpenSizeGuide,
  onQuickView,
}) => {
  const { navigate } = useNavigation();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // Instant zero-wait cache lookup for immediate rendering
  const cachedInitial = getCachedProductBySlug(slug, true);
  const [product, setProduct] = useState<Product | null>(cachedInitial);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!cachedInitial);

  const [selectedImage, setSelectedImage] = useState<string>(() => {
    if (!cachedInitial) return '';
    const images = cachedInitial.images && cachedInitial.images.length > 0
      ? cachedInitial.images
      : [cachedInitial.image_url, cachedInitial.second_image_url, cachedInitial.third_image_url].filter(Boolean) as string[];
    return images[0] || cachedInitial.image_url;
  });
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<ProductColor>(() => {
    if (!cachedInitial) return { name: 'Blush Pink', hex: '#F8C8D4' };
    const colors = cachedInitial.colors && cachedInitial.colors.length > 0
      ? cachedInitial.colors
      : [{ name: cachedInitial.color || 'Standard', hex: '#F8C8D4' }];
    return colors[0];
  });
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'fabric' | 'delivery' | 'policy'>('description');
  const [addedToast, setAddedToast] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      // If product was not in cache, trigger loading state
      if (!product) {
        setLoading(true);
      }

      const prod = await fetchProductBySlug(slug, true);
      if (!isMounted) return;

      if (prod) {
        setProduct(prod);
        const images = prod.images && prod.images.length > 0
          ? prod.images
          : [prod.image_url, prod.second_image_url, prod.third_image_url].filter(Boolean) as string[];
        
        // Preserve selectedImage if already valid
        setSelectedImage(prev => prev || images[0] || prod.image_url);
        // Customer MUST explicitly pick size
        setSelectedSize('');
        setQuantity(1);
        setSizeError(null);

        const colors = prod.colors && prod.colors.length > 0
          ? prod.colors
          : [{ name: prod.color || 'Standard', hex: '#F8C8D4' }];
        setSelectedColor(colors[0]);
        setLoading(false);

        // Load related items in background without blocking main product
        fetchProducts({ category: prod.category, forCustomer: true }).then(related => {
          if (isMounted) {
            setRelatedProducts(related.filter(r => r.id !== prod.id).slice(0, 4));
          }
        });
      } else {
        setProduct(null);
        setLoading(false);
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Premium Fashion Skeleton Loading Experience
  if (loading && !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-pulse">
        <div className="h-6 w-32 bg-[#F2D5DE]/50 rounded-md mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[4/5] w-full rounded-2xl bg-[#F5EBEF] border border-[#F9CAD5]/40" />
            <div className="flex gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-20 aspect-[4/5] rounded-xl bg-[#F5EBEF]" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <div className="h-4 w-24 bg-[#F2D5DE]/60 rounded-sm" />
            <div className="h-8 w-3/4 bg-[#E8CCD5]/60 rounded-md" />
            <div className="h-7 w-28 bg-[#E8CCD5]/40 rounded-md" />
            <div className="h-24 w-full bg-[#FAF2F4] rounded-xl" />
            <div className="space-y-3 pt-4 border-t border-stone-100">
              <div className="h-4 w-28 bg-[#F2D5DE]/60 rounded-sm" />
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-10 w-12 bg-[#F2D5DE]/40 rounded-xl" />
                ))}
              </div>
            </div>
            <div className="h-14 w-full bg-[#3A1B24]/10 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-serif font-bold text-stone-900">Product Not Available</h2>
        <p className="text-xs text-stone-500">
          This item might have sold out or is currently unavailable in the store catalog.
        </p>
        <button
          onClick={() => navigate('/shop')}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-stone-900 text-[#FFF0F3] text-xs font-semibold rounded-lg hover:bg-black transition-colors cursor-pointer active:scale-98"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Browse All Apparel</span>
        </button>
      </div>
    );
  }

  const productImages: string[] = product.images && product.images.length > 0
    ? product.images
    : [product.image_url, product.second_image_url, product.third_image_url].filter(Boolean) as string[];

  const productColors: ProductColor[] = product.colors && product.colors.length > 0
    ? product.colors
    : [{ name: product.color || 'Standard', hex: '#F8C8D4' }];

  const isWishlisted = isInWishlist(product.id);
  const oldPriceVal = product.old_price ?? product.oldPrice;

  const handleSelectSize = (size: string) => {
    const stockForSize = product?.sizeStock?.[size] ?? 0;
    if (stockForSize <= 0) return; // Out of stock size is unselectable

    setSelectedSize(size);
    setSizeError(null);

    // Dynamic constraint: automatically clamp quantity if switching from a higher stock size
    setQuantity(prev => {
      if (prev > stockForSize) {
        return Math.max(1, stockForSize);
      }
      return prev < 1 ? 1 : prev;
    });
  };

  const currentSizeStock = selectedSize && product?.sizeStock
    ? (product.sizeStock[selectedSize] ?? 0)
    : 0;

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError('Please select a size before adding to your shopping bag.');
      return;
    }
    const result = addToCart(product, selectedSize, selectedColor.name, quantity);
    if (result.success) {
      setSizeError(null);
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 2000);
    } else if (result.error) {
      setSizeError(result.error);
    }
  };

  const generateWhatsAppUrl = () => {
    if (!selectedSize) return '#';
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

Total Amount:
৳${(product.price * quantity).toLocaleString()}

Payment:
Cash on Delivery

Policy:
I agree to the No Return / No Exchange policy.

Please confirm the order.`;

    return `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Top Navigation Row: Back Button & Breadcrumbs */}
      <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
        <BackButton />
        <nav className="hidden sm:flex items-center gap-2 text-xs text-stone-500 truncate">
          <button onClick={() => navigate('/')} className="hover:text-black cursor-pointer">
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <button onClick={() => navigate('/shop')} className="hover:text-black cursor-pointer">
            Shop
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <button
            onClick={() => navigate(`/category/${product.category}`)}
            className="hover:text-black cursor-pointer capitalize"
          >
            {product.categoryName || product.category.replace('-', ' ')}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-stone-900 font-medium truncate max-w-xs">{product.name}</span>
        </nav>
      </div>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
        {/* Left Side: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-[#FAF2F4] border border-[#F9CAD5]/60 shadow-xs">
            <img
              src={selectedImage || product.image_url}
              alt={product.name}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="w-full h-full object-cover object-center transition-all duration-300"
            />
            {product.discount && (
              <span className="absolute top-4 left-4 bg-[#EC4899] text-white text-xs font-bold px-2.5 py-1 rounded-sm shadow-xs tracking-wider">
                {product.discount}
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {productImages.length > 1 && (
            <div className="flex gap-3">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 sm:w-24 aspect-[4/5] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedImage === img
                      ? 'border-[#EC4899] scale-102 shadow-sm'
                      : 'border-stone-200 hover:border-stone-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product Details & Purchase Module */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#EC4899] uppercase tracking-wider">
                {product.categoryName || product.category.replace('-', ' ')}
              </span>
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-2 rounded-full border transition-colors cursor-pointer ${
                  isWishlisted
                    ? 'bg-[#FFF0F3] border-[#F9CAD5] text-[#EC4899]'
                    : 'border-stone-200 text-stone-600 hover:border-stone-400'
                }`}
                aria-label="Wishlist"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 leading-tight">
              {product.name}
            </h1>

            {/* Pricing */}
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums">
                ৳{product.price.toLocaleString()}
              </span>
              {oldPriceVal && (
                <span className="text-base text-stone-400 line-through tabular-nums">
                  ৳{oldPriceVal.toLocaleString()}
                </span>
              )}
              {oldPriceVal && oldPriceVal > product.price && (
                <span className="text-xs bg-[#FFF0F3] text-[#EC4899] font-bold px-2 py-0.5 rounded-sm border border-[#F9CAD5]">
                  Save ৳{(oldPriceVal - product.price).toLocaleString()}
                </span>
              )}
            </div>

            <p className="mt-4 text-xs sm:text-sm text-stone-600 leading-relaxed">
              {product.description}
            </p>

            {/* Color Selector */}
            <div className="mt-6">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                Color:{' '}
                <span className="font-normal text-stone-900 normal-case">{selectedColor.name}</span>
              </div>
              <div className="flex items-center gap-2.5">
                {productColors.map(color => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    className={`relative w-9 h-9 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                      selectedColor.name === color.name
                        ? 'border-[#EC4899] scale-110 shadow-xs'
                        : 'border-stone-200 hover:border-stone-400'
                    }`}
                    style={{ backgroundColor: color.hex || '#F8C8D4' }}
                    title={color.name}
                  >
                    {selectedColor.name === color.name && (
                      <Check className="w-4 h-4 text-stone-900 stroke-[2.5]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector with REQUIRED WARNING */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Size: {selectedSize ? (
                    <strong className="text-stone-900 font-bold">{selectedSize}</strong>
                  ) : (
                    <span className="text-[#BE185D] font-normal normal-case italic">Select an available size</span>
                  )}
                </span>
                <button
                  onClick={onOpenSizeGuide}
                  className="text-xs text-[#EC4899] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Size Guide</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {product.sizes.map(size => {
                  const stock = product.sizeStock?.[size] ?? 0;
                  const isAvailable = stock > 0;
                  const isSelected = selectedSize === size;

                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => handleSelectSize(size)}
                      className={`min-w-12 h-11 px-4 text-xs font-bold rounded-xl border transition-all ${
                        !isAvailable
                          ? 'bg-stone-100/70 text-stone-400 border-stone-200 line-through cursor-not-allowed opacity-45'
                          : isSelected
                          ? 'bg-[#2E151E] text-[#FFF0F4] border-[#2E151E] shadow-sm'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400 hover:bg-[#FFF5F8] cursor-pointer'
                      }`}
                      title={!isAvailable ? `${size} is currently out of stock` : `Select size ${size}`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>

              {sizeError && (
                <div className="mt-2 text-xs text-[#BE185D] font-medium flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{sizeError}</span>
                </div>
              )}

              {/* CRITICAL NO RETURN NOTICE */}
              <div className="mt-3.5 p-3 rounded-xl bg-[#FFF0F3] border border-[#F9CAD5] text-xs text-stone-700 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-[#BE185D] shrink-0 mt-0.5" />
                <span className="leading-snug">
                  <strong className="text-[#BE185D] font-bold">Important Size Selection:</strong> Bubaé maintains a strict <strong>No Return & No Exchange policy</strong>. Please confirm your measurements using our size guide before completing the order.
                </span>
              </div>
            </div>

            {/* Quantity Selector - Revealed ONLY after selecting a size */}
            {selectedSize ? (
              <div className="mt-6 flex items-center gap-4 animate-in fade-in duration-200">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700">Quantity</span>
                <div className="flex items-center border border-stone-300 rounded-xl overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className={`px-3.5 py-2 transition-colors ${
                      quantity <= 1 ? 'text-stone-300 cursor-not-allowed' : 'text-stone-600 hover:bg-stone-100 cursor-pointer'
                    }`}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-xs font-bold text-stone-900 tabular-nums min-w-[2.5rem] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(currentSizeStock, quantity + 1))}
                    disabled={quantity >= currentSizeStock}
                    className={`px-3.5 py-2 transition-colors ${
                      quantity >= currentSizeStock ? 'text-stone-300 cursor-not-allowed' : 'text-stone-600 hover:bg-stone-100 cursor-pointer'
                    }`}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 p-3 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-xs text-stone-500">
                Please select an available size to choose quantity.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-stone-200">
            <button
              onClick={handleAddToCart}
              className={`w-full py-4 px-6 font-bold text-xs uppercase tracking-[0.16em] rounded-full transition-all duration-300 flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] ${
                !selectedSize
                  ? 'bg-[#3A1B24] hover:bg-[#2E151E] text-[#FFF0F4] cursor-pointer'
                  : 'bg-[#2E151E] hover:bg-black text-[#FFF0F4] cursor-pointer hover:-translate-y-0.5'
              }`}
            >
              {addedToast ? (
                <>
                  <Check className="w-4 h-4 text-[#25D366]" />
                  <span>Added to Shopping Bag!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>{selectedSize ? 'Add to Shopping Bag' : 'Select a Size to Add'}</span>
                </>
              )}
            </button>

            {selectedSize ? (
              <a
                href={generateWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#20ba59] text-black font-bold text-xs uppercase tracking-[0.16em] rounded-full transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-md"
              >
                <MessageCircle className="w-4 h-4 fill-black" />
                <span>Order via WhatsApp (Cash on Delivery)</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setSizeError('Please select a size first before ordering.')}
                className="w-full py-4 px-6 bg-[#25D366]/60 text-stone-800 font-bold text-xs uppercase tracking-[0.16em] rounded-full flex items-center justify-center gap-2.5 cursor-pointer opacity-80 active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4 fill-stone-800" />
                <span>Select a Size to Order via WhatsApp</span>
              </button>
            )}
          </div>

          {/* Key Trust Signals */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-stone-600">
            <div className="p-3 bg-white rounded-xl border border-stone-200 flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-[#BE185D] shrink-0" />
              <span>Nationwide Cash on Delivery</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-stone-200 flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#BE185D] shrink-0" />
              <span>100% Quality Checked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section: Description, Fabric, Delivery, Policy */}
      <div className="border-t border-stone-200 pt-10 mb-16">
        <div className="flex border-b border-stone-200 gap-8 mb-6 overflow-x-auto text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'description'
                ? 'border-[#EC4899] text-black'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            Description & Details
          </button>
          <button
            onClick={() => setActiveTab('fabric')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'fabric'
                ? 'border-[#EC4899] text-black'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            Fabric & Care
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'delivery'
                ? 'border-[#EC4899] text-black'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            Delivery & COD
          </button>
          <button
            onClick={() => setActiveTab('policy')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors text-rose-600 ${
              activeTab === 'policy'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent opacity-80 hover:opacity-100'
            }`}
          >
            No Return / No Exchange
          </button>
        </div>

        {/* Tab Content */}
        <div className="text-xs sm:text-sm text-stone-700 leading-relaxed max-w-3xl">
          {activeTab === 'description' && (
            <div className="space-y-4">
              <p>{product.description}</p>
              {product.details && product.details.length > 0 && (
                <div>
                  <h4 className="font-bold text-stone-900 mb-2">Key Features:</h4>
                  <ul className="list-disc list-inside space-y-1 text-stone-600">
                    {product.details.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'fabric' && (
            <div className="space-y-4">
              <div>
                <strong className="text-stone-900 block mb-1">Fabric Composition:</strong>
                <p className="text-stone-600">{product.fabric || 'Premium 100% Breathable Cotton / Tailored Blend'}</p>
              </div>
              {product.careInstructions && product.careInstructions.length > 0 ? (
                <div>
                  <h4 className="font-bold text-stone-900 mb-2">Care Instructions:</h4>
                  <ul className="list-disc list-inside space-y-1 text-stone-600">
                    {product.careInstructions.map((care, idx) => (
                      <li key={idx}>{care}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div>
                  <h4 className="font-bold text-stone-900 mb-2">Care Instructions:</h4>
                  <ul className="list-disc list-inside space-y-1 text-stone-600">
                    <li>Cold machine wash or gentle hand wash</li>
                    <li>Do not bleach or tumble dry</li>
                    <li>Warm iron inside-out</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="space-y-3">
              <h4 className="font-bold text-stone-900">Cash on Delivery Across Bangladesh</h4>
              <p>
                All Bubaé orders are delivered via <strong>Cash on Delivery (COD)</strong>. You do NOT need to pay any advance product price or advance delivery fee. You pay the delivery rider upon arrival.
              </p>
              <div className="p-3 bg-[#FFF0F3] rounded-xl border border-[#F9CAD5] text-xs text-stone-800 space-y-1">
                <div>
                  <strong>Official Delivery Charges:</strong> Inside Sylhet Main Town ৳80 · Outside Sylhet Main Town ৳115 · Sunamganj & Maulvibazar ৳135 · Outside Sylhet ৳155.
                </div>
                <div className="text-[11px] text-stone-500">
                  Full amount payable upon doorstep delivery via Cash on Delivery (no advance payment).
                </div>
              </div>
            </div>
          )}

          {activeTab === 'policy' && (
            <div className="space-y-3 bg-[#FFF0F3] p-5 rounded-2xl border border-[#F9CAD5]">
              <h4 className="font-bold text-[#BE185D] text-base">
                No Return & No Exchange Policy
              </h4>
              <p>
                Bubaé does <strong>NOT accept product returns</strong> and does <strong>NOT offer product exchanges</strong> after an order has been placed and delivered.
              </p>
              <p>
                Because all sales are final, please double-check your sizing and preferred color using our size guide before confirming your order.
              </p>
              <button
                onClick={onOpenSizeGuide}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#EC4899] hover:underline pt-1 cursor-pointer"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Open Sizing Table</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-stone-100">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#BE185D] font-bold">
                You May Also Love
              </span>
              <h3 className="text-xl font-serif font-bold text-stone-900 mt-0.5">
                Related Apparel
              </h3>
            </div>
            <button
              onClick={() => navigate('/shop')}
              className="text-xs font-semibold text-[#BE185D] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map(relProduct => (
              <ProductCard
                key={relProduct.id}
                product={relProduct}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
