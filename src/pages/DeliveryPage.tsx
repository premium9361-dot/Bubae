import React from 'react';
import { BRAND } from '../data/brand';
import { useNavigation } from '../context/NavigationContext';
import { BackButton } from '../components/BackButton';
import { Truck, CheckCircle2, ShieldCheck, MapPin, MessageCircle, AlertCircle } from 'lucide-react';

export const DeliveryPage: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-8">
      {/* Top Navigation Row: Back Button */}
      <div className="flex items-center justify-start">
        <BackButton />
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs uppercase font-bold tracking-widest text-[#EC4899]">
          Shipping Information
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900">
          Delivery Policy & Information
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
          Nationwide Cash on Delivery across Bangladesh. No advance payment required.
        </p>
      </div>

      {/* Main Highlights Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-[#F9CAD5] shadow-xs space-y-2 text-center">
          <div className="w-12 h-12 rounded-full bg-[#FFF0F3] text-[#EC4899] flex items-center justify-center mx-auto mb-3">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-900">Cash on Delivery (COD)</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Every Bubaé order is delivered through COD. You only pay when your parcel arrives in your hands.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-[#F9CAD5] shadow-xs space-y-2 text-center">
          <div className="w-12 h-12 rounded-full bg-[#FFF0F3] text-[#EC4899] flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-900">Zero Advance Payment</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Customers do NOT need to send any product payment or delivery charge in advance.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-[#F9CAD5] shadow-xs space-y-2 text-center">
          <div className="w-12 h-12 rounded-full bg-[#FFF0F3] text-[#EC4899] flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-900">Nationwide Coverage</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Bubaé is based in Sylhet, Bangladesh. Delivering across Sylhet, Sunamganj, Maulvibazar, and all districts and upazilas throughout Bangladesh.
          </p>
        </div>
      </div>

      {/* Detailed Delivery Rules */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-xl font-serif font-bold text-stone-900 pb-3 border-b border-stone-100">
          How Delivery Works
        </h2>

        <div className="space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#FFF0F3] text-[#EC4899] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <div>
              <strong className="text-stone-900 block mb-0.5">Place Your Order Online or via WhatsApp</strong>
              <p className="text-stone-600">
                Select your desired pieces, verify your size with our size chart, and submit your shipping details.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#FFF0F3] text-[#EC4899] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <div>
              <strong className="text-stone-900 block mb-0.5">Order Confirmation</strong>
              <p className="text-stone-600">
                Our support team will verify your address, phone number, and selected sizes via WhatsApp before dispatch.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#FFF0F3] text-[#EC4899] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <div>
              <strong className="text-stone-900 block mb-0.5">Pay on Arrival</strong>
              <p className="text-stone-600">
                The courier representative delivers your package. You inspect the parcel seal and pay the total order amount in cash.
              </p>
            </div>
          </div>
        </div>

        {/* Delivery Charges Notice */}
        <div className="pt-4 border-t border-stone-100 space-y-3">
          <h3 className="text-base font-bold text-stone-900">
            Official Delivery Charges
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Bubaé's official delivery rates across Bangladesh with 100% Cash on Delivery:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {BRAND.deliveryZones.map(zone => (
              <div key={zone.name} className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/80 hover:border-[#F9CAD5] transition-colors">
                <span className="text-xs font-bold text-stone-900 block">{zone.name}</span>
                <span className="text-sm font-bold text-[#BE185D] block mt-1.5">{zone.feeText}</span>
                <span className="text-[11px] text-stone-500 mt-1 block">Est: {zone.estDays}</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-stone-500 italic">
            *Delivery charge is automatically calculated at checkout and collected on doorstep delivery.
          </p>
        </div>
      </div>

      {/* Strict Policy Reminder */}
      <div className="p-6 rounded-2xl bg-[#FFF0F3] border border-[#F9CAD5] flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-[#EC4899] shrink-0 mt-0.5" />
        <div className="text-xs text-stone-800 leading-relaxed space-y-1">
          <strong className="text-base font-serif font-bold text-[#BE185D] block">
            Reminder: No Return / No Exchange Policy
          </strong>
          <p>
            Please note that Bubaé does not accept returns or offer exchanges once an order is delivered. Please inspect size charts and color choices carefully prior to confirming delivery.
          </p>
        </div>
      </div>

      {/* Inquiry */}
      <div className="text-center">
        <p className="text-xs text-stone-600 mb-3">
          Have an inquiry regarding delivery in your specific area?
        </p>
        <a
          href={BRAND.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-black font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-sm"
        >
          <MessageCircle className="w-4 h-4 fill-black" />
          <span>Ask on WhatsApp (+880 1345-599300)</span>
        </a>
      </div>
    </div>
  );
};
