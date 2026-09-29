import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigation } from '../context/NavigationContext';
import { BRAND } from '../data/brand';
import { submitOrder } from '../services/orders';
import {
  calculateDelivery,
  BANGLADESH_DISTRICTS,
  SYLHET_AREAS,
  SYLHET_MAIN_TOWN_VALUE,
} from '../services/delivery';
import { BackButton } from '../components/BackButton';
import {
  Truck,
  CheckCircle2,
  MessageCircle,
  ShoppingBag,
  ArrowRight,
  AlertTriangle,
  Loader2,
  Lock,
  MapPin,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { items, subtotal, clearCart, setDeliveryLocation } = useCart();
  const { navigate } = useNavigation();

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState<string>('Sylhet');
  const [sylhetArea, setSylhetArea] = useState<string>(SYLHET_MAIN_TOWN_VALUE);
  const [notes, setNotes] = useState('');
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedOrderSummary, setSubmittedOrderSummary] = useState<any>(null);

  // Authoritative automatic delivery calculation derived strictly from location
  const activeCalc = calculateDelivery(district, district === 'Sylhet' ? sylhetArea : undefined);
  const total = subtotal + activeCalc.charge;

  // Keep CartContext synchronized with the authoritative delivery calculation
  useEffect(() => {
    setDeliveryLocation(activeCalc.zone, activeCalc.charge);
  }, [district, sylhetArea, activeCalc.zone, activeCalc.charge, setDeliveryLocation]);

  if (items.length === 0 && !isSubmitted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 sm:py-16 text-center space-y-6">
        <div className="flex items-center justify-start">
          <BackButton />
        </div>
        <div className="w-16 h-16 rounded-full bg-[#FFF0F3] flex items-center justify-center mx-auto text-[#EC4899]">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-stone-900">
          Your Shopping Bag is Empty
        </h1>
        <p className="text-xs text-stone-600">
          Please add items to your cart before proceeding to checkout.
        </p>
        <div>
          <button
            onClick={() => navigate('/shop')}
            className="px-6 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-black transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  // Handle Order Placement
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!agreedToPolicy) {
      setSubmitError('Please check the agreement to Bubaé’s No Return / No Exchange policy.');
      return;
    }

    if (!fullName.trim() || !phoneNumber.trim() || !address.trim() || !district.trim()) {
      setSubmitError('Please complete all required fields (Name, Phone number, and Delivery address).');
      return;
    }

    if (district === 'Sylhet' && !sylhetArea.trim()) {
      setSubmitError('Please select your Area / Upazila in Sylhet District.');
      return;
    }

    setIsSubmitting(true);

    // Final authoritative delivery recalculation right before submission
    const authoritativeCalc = calculateDelivery(district, district === 'Sylhet' ? sylhetArea : undefined);
    const areaValue = district === 'Sylhet' ? sylhetArea : district;
    const finalOrderTotal = subtotal + authoritativeCalc.charge;

    const itemsSummary = items
      .map(i => {
        const colorName = typeof i.selectedColor === 'string' ? i.selectedColor : (i.selectedColor as any)?.name || 'Default';
        return `• ${i.product.name} (Size: ${i.selectedSize}, Color: ${colorName}, Qty: ${i.quantity}) - ৳${(
          i.unitPrice * i.quantity
        ).toLocaleString()}`;
      })
      .join('\n');

    // Call real order submission service (authoritative validation is re-enforced on backend)
    const result = await submitOrder({
      customer_name: fullName.trim(),
      phone: phoneNumber.trim(),
      address: address.trim(),
      area: areaValue,
      district: district,
      delivery_area: authoritativeCalc.zone,
      delivery_charge: authoritativeCalc.charge,
      notes: notes.trim() || undefined,
      policy_accepted: agreedToPolicy,
      items: items.map(i => ({
        product_id: i.product.id,
        size: i.selectedSize,
        color: typeof i.selectedColor === 'string' ? i.selectedColor : (i.selectedColor as any)?.name || 'Default',
        quantity: i.quantity,
      })),
    });

    setIsSubmitting(false);

    if (!result.success) {
      setSubmitError(result.error || 'Failed to place Cash on Delivery order. Please try again.');
      return;
    }

    const orderId = result.order_number || result.order?.order_number || ('BUB-' + Math.floor(100000 + Math.random() * 900000));

    // Build the exact WhatsApp message
    const whatsappMessage = `NEW BUBAÉ ORDER

Order ID: ${orderId}

Customer:
${fullName.trim()}

Phone:
${phoneNumber.trim()}

Delivery Address:
${address.trim()}, ${district}
${district === 'Sylhet' ? `Area / Upazila: ${sylhetArea}\n` : ''}${notes.trim() ? `Note: ${notes.trim()}\n` : ''}
Delivery Zone:
${authoritativeCalc.zone}

Product(s):
${itemsSummary}

Product Subtotal:
৳${subtotal.toLocaleString()}

Delivery Charge:
৳${authoritativeCalc.charge} (Automatically calculated)

Total Payable (COD):
৳${finalOrderTotal.toLocaleString()}

Payment:
Cash on Delivery

Policy:
Customer agrees to No Return / No Exchange.

Please confirm the order.`;

    const waUrl = `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(
      whatsappMessage
    )}`;

    setSubmittedOrderSummary({
      orderId,
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      address: `${address.trim()}, ${district}`,
      district,
      area: areaValue,
      deliveryZone: authoritativeCalc.zone,
      deliveryCharge: authoritativeCalc.charge,
      subtotal,
      items: [...items],
      total: finalOrderTotal,
      waUrl,
    });

    setIsSubmitted(true);
    clearCart();
  };

  // Order Confirmed View
  if (isSubmitted && submittedOrderSummary) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 text-center space-y-6">
        <div className="flex items-center justify-start">
          <BackButton variant="secondary" label="Back to Store" />
        </div>

        <div className="w-16 h-16 rounded-full bg-[#E8F8EE] flex items-center justify-center mx-auto text-[#25D366]">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-bold tracking-widest text-[#EC4899]">
            Order Submitted
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            Thank You, {submittedOrderSummary.fullName}!
          </h1>
          <p className="text-xs text-stone-500">
            Order Reference: <strong className="text-stone-800">{submittedOrderSummary.orderId}</strong>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#F9CAD5] p-6 text-left space-y-4 shadow-sm">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-sm font-bold text-stone-900">Cash on Delivery Confirmation</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              No advance payment is needed. Please keep ৳{submittedOrderSummary.total.toLocaleString()} ready upon package arrival.
            </p>
          </div>

          <div className="space-y-2 text-xs text-stone-600">
            <div>
              <span className="font-semibold text-stone-700">Delivery Address:</span>{' '}
              {submittedOrderSummary.address}
            </div>
            <div>
              <span className="font-semibold text-stone-700">Contact Phone:</span>{' '}
              {submittedOrderSummary.phoneNumber}
            </div>
            <div>
              <span className="font-semibold text-stone-700">Delivery Zone:</span>{' '}
              {submittedOrderSummary.deliveryZone}
            </div>
            {submittedOrderSummary.district === 'Sylhet' && (
              <div>
                <span className="font-semibold text-stone-700">Sylhet Area / Upazila:</span>{' '}
                {submittedOrderSummary.area}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-stone-100">
            <span className="font-semibold text-xs text-stone-700 block mb-2">Ordered Items:</span>
            <div className="space-y-1.5 text-xs text-stone-600">
              {submittedOrderSummary.items.map((item: any, idx: number) => {
                const colorLabel = typeof item.selectedColor === 'string' ? item.selectedColor : item.selectedColor?.name || 'Default';
                return (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {item.product.name} ({item.selectedSize}, {colorLabel}) × {item.quantity}
                    </span>
                    <span className="font-medium text-stone-900 tabular-nums">
                      ৳{(item.unitPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 space-y-1.5 text-xs text-stone-600">
            <div className="flex justify-between">
              <span>Product Subtotal:</span>
              <span className="font-medium text-stone-900 tabular-nums">
                ৳{(submittedOrderSummary.subtotal || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charge ({submittedOrderSummary.deliveryZone}):</span>
              <span className="font-medium text-stone-900 tabular-nums">
                ৳{submittedOrderSummary.deliveryCharge}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-between font-bold text-stone-900 text-sm">
            <span>Total Payable (COD):</span>
            <span className="text-[#BE185D] text-base tabular-nums">
              ৳{submittedOrderSummary.total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* WhatsApp Manual Confirm Button */}
        <div className="space-y-3 pt-2">
          <p className="text-xs text-stone-600">
            If WhatsApp didn't open automatically, click below to confirm your order details directly with Bubaé:
          </p>
          <a
            href={submittedOrderSummary.waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba59] text-black font-bold text-xs sm:text-sm py-3.5 px-8 rounded-full shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            <MessageCircle className="w-4 h-4 fill-black" />
            <span>Open WhatsApp to Confirm Order</span>
          </a>
        </div>

        <div>
          <button
            onClick={() => navigate('/shop')}
            className="text-xs text-stone-500 hover:text-stone-900 underline font-medium cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <BackButton />
        <span className="text-xs uppercase font-bold tracking-widest text-[#EC4899]">
          100% Cash on Delivery
        </span>
      </div>

      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
          Confirm Your Order
        </h1>
        <p className="text-xs text-stone-500">
          Enter your delivery details below. The correct delivery charge is determined automatically from your location.
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
        {/* Left Form: Customer Details */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <h2 className="text-base font-serif font-bold text-stone-900 pb-2 border-b border-stone-100 flex items-center justify-between">
            <span>1. Customer & Delivery Information</span>
            <span className="text-[11px] font-sans font-normal text-stone-400">All fields required</span>
          </h2>

          <div className="space-y-4 text-xs">
            {/* Full Name */}
            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Full Name <span className="text-[#EC4899]">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Afia Rahman"
                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#EC4899] text-stone-800 bg-[#FFF8F9]/40"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Phone Number (For COD Delivery Confirmation) <span className="text-[#EC4899]">*</span>
              </label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="e.g. 017XXXXXXXX or 018XXXXXXXX"
                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#EC4899] text-stone-800 bg-[#FFF8F9]/40"
              />
            </div>

            {/* Structured District / City Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-stone-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#EC4899]" />
                  <span>District / City</span>
                  <span className="text-[#EC4899]">*</span>
                </label>
                <span className="text-[11px] text-stone-500 font-normal">Location determines delivery charge</span>
              </div>
              <select
                value={district}
                onChange={e => {
                  const newDistrict = e.target.value;
                  setDistrict(newDistrict);
                  if (newDistrict === 'Sylhet' && !sylhetArea) {
                    setSylhetArea(SYLHET_MAIN_TOWN_VALUE);
                  }
                }}
                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#EC4899] text-stone-800 bg-white cursor-pointer text-xs font-medium"
              >
                {BANGLADESH_DISTRICTS.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Sylhet Structured Secondary Selection: Area / Upazila */}
            {district === 'Sylhet' && (
              <div className="p-3.5 rounded-xl bg-[#FFF8F9] border border-[#F9CAD5] space-y-2">
                <label className="font-semibold text-stone-800 block">
                  Area / Upazila (Sylhet District) <span className="text-[#EC4899]">*</span>
                </label>
                <select
                  value={sylhetArea}
                  onChange={e => setSylhetArea(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#EC4899] text-stone-800 bg-white cursor-pointer text-xs font-medium"
                >
                  {SYLHET_AREAS.map(a => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Inside Sylhet Main Town is ৳80. All other areas & Upazilas in Sylhet are ৳115.
                </p>
              </div>
            )}

            {/* Read-Only Automatic Delivery Calculation Display (Locked - Customer cannot modify) */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#FFF5F8] to-[#FFF0F3] border border-[#F9CAD5] space-y-2.5 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#BE185D] flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#EC4899]" />
                  Delivery Charge
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-600 bg-white/90 px-2 py-0.5 rounded-full border border-stone-200">
                  <Lock className="w-2.5 h-2.5 text-stone-400" />
                  {activeCalc.estDays}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-0.5">
                <div>
                  <div className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                    <span>{activeCalc.zone}</span>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    {district === 'Sylhet' ? `${sylhetArea}, Sylhet` : district}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold text-[#BE185D] tabular-nums font-serif">
                    ৳{activeCalc.charge}
                  </div>
                  <span className="text-[10px] text-stone-500 block">Cash on Delivery</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#F9CAD5]/60 flex items-center justify-between text-[11px] text-stone-500">
                <span>Automatically determined from your delivery location.</span>
                <span className="text-[10px] font-semibold text-[#BE185D] bg-white px-1.5 py-0.5 rounded border border-[#F9CAD5]/60">
                  Locked
                </span>
              </div>
            </div>

            {/* Detailed Street Address */}
            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Full Street / Apartment / House Address <span className="text-[#EC4899]">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="House No, Road No, Sector / Area, Post Office / Landmark"
                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#EC4899] text-stone-800 bg-[#FFF8F9]/40"
              />
            </div>

            {/* Special Instructions */}
            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Special Delivery Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Call before delivery / deliver after 2 PM"
                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#EC4899] text-stone-800 bg-[#FFF8F9]/40"
              />
            </div>
          </div>

          {/* Payment Method Notice */}
          <div className="pt-4 border-t border-stone-100">
            <h3 className="text-sm font-bold text-stone-900 mb-3">
              2. Payment Method
            </h3>
            <div className="p-4 rounded-xl border-2 border-[#191919] bg-[#FFF8F9] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#191919] flex items-center justify-center text-white text-[10px] font-bold">
                  ✓
                </div>
                <div>
                  <span className="font-bold text-xs text-stone-900 block">
                    Cash on Delivery (COD)
                  </span>
                  <span className="text-[11px] text-stone-500">
                    No advance payment required. Pay full amount when package is received.
                  </span>
                </div>
              </div>
              <Truck className="w-5 h-5 text-[#EC4899]" />
            </div>
          </div>
        </div>

        {/* Right Summary & Policy Acknowledgment */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#F9CAD5] p-6 sm:p-8 shadow-xs space-y-6 sticky top-24">
          <h2 className="text-lg font-serif font-bold text-stone-900 pb-3 border-b border-stone-100">
            Order Summary
          </h2>

          {/* Items Preview */}
          <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto pr-1">
            {items.map(item => {
              const colorName = typeof item.selectedColor === 'string' ? item.selectedColor : (item.selectedColor as any)?.name || 'Default';
              const imgUrl = item.product.image_url || (item.product as any).images?.[0] || '';
              return (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={imgUrl}
                      alt={item.product.name}
                      className="w-12 h-14 object-cover rounded-md border border-stone-200 shrink-0 bg-stone-50"
                    />
                    <div>
                      <h4 className="font-semibold text-stone-900 line-clamp-1">{item.product.name}</h4>
                      <span className="text-stone-500 text-[11px]">
                        {item.selectedSize} · {colorName} · Qty: {item.quantity}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-stone-900 tabular-nums">
                    ৳{(item.unitPrice * item.quantity).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Pricing Totals */}
          <div className="space-y-2.5 text-xs text-stone-600 pt-3 border-t border-stone-100">
            <div className="flex justify-between items-center">
              <span>Product Subtotal</span>
              <span className="font-semibold text-stone-900 tabular-nums">৳{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-stone-800 font-medium">Delivery</span>
                <span className="text-[11px] text-stone-500 block">
                  {activeCalc.zone}
                </span>
              </div>
              <span className="font-semibold text-stone-900 tabular-nums">
                ৳{activeCalc.charge}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2.5 border-t border-stone-200 text-sm font-bold text-stone-900">
              <span>Total Payable at Doorstep</span>
              <span className="text-xl text-[#BE185D] tabular-nums font-serif">৳{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Submission Error Banner */}
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* CRITICAL POLICY NOTICE & MANDATORY CHECKBOX */}
          <div className="p-4 rounded-xl bg-[#FFF0F3] border border-[#F9CAD5] space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-[#EC4899] shrink-0 mt-0.5" />
              <div className="text-xs text-stone-800 leading-relaxed">
                <strong className="text-[#BE185D] block mb-1 uppercase font-bold tracking-wide">
                  Important Customer Notice
                </strong>
                Please note: Bubaé currently offers Cash on Delivery only. We do not accept returns or exchanges. Please make sure you select the correct product, size and color before placing your order.
              </div>
            </div>

            {/* Mandatory Checkbox */}
            <label className="flex items-start gap-2.5 pt-2 border-t border-[#F9CAD5]/60 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={agreedToPolicy}
                onChange={e => setAgreedToPolicy(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded-sm accent-[#EC4899] text-white cursor-pointer"
              />
              <span className="text-xs font-semibold text-stone-900">
                I understand and agree to Bubaé's No Return / No Exchange policy.
              </span>
            </label>
          </div>

          {/* Place COD Order Button */}
          <button
            type="submit"
            disabled={!agreedToPolicy || isSubmitting}
            className={`group w-full font-bold text-xs sm:text-sm py-4 px-6 rounded-full shadow-md transition-all duration-300 flex items-center justify-center gap-2 active:scale-[0.98] ${
              agreedToPolicy && !isSubmitting
                ? 'bg-[#2E151E] hover:bg-black text-[#FFF0F4] hover:-translate-y-0.5 cursor-pointer shadow-md hover:shadow-lg'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed opacity-75'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 text-[#F9CAD5] animate-spin" />
                <span>Placing Order...</span>
              </>
            ) : (
              <>
                <span>Place Order (Cash on Delivery)</span>
                <ArrowRight className="w-4 h-4 text-[#D94676] group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {!agreedToPolicy && (
            <p className="text-[11px] text-center text-stone-400">
              Please check the No Return / No Exchange agreement to enable order submission.
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
