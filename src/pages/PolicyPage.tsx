import React from 'react';
import { BRAND } from '../data/brand';
import { useNavigation } from '../context/NavigationContext';
import { BackButton } from '../components/BackButton';
import { ShieldAlert, AlertTriangle, CheckCircle, Ruler, MessageCircle, ArrowRight } from 'lucide-react';

export const PolicyPage: React.FC = () => {
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
          Transparency & Terms
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900">
          No Return & No Exchange Policy
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
          Please review our sales policies carefully before placing your order with Bubaé.
        </p>
      </div>

      {/* Main Notice Box */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#FFF0F3] border-2 border-[#F9CAD5] shadow-xs space-y-4">
        <div className="flex items-center gap-3 text-[#BE185D]">
          <ShieldAlert className="w-7 h-7 shrink-0" />
          <h2 className="text-xl sm:text-2xl font-serif font-bold">
            All Sales Are Final: No Returns & No Exchanges
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-stone-800 leading-relaxed">
          Bubaé does <strong>NOT accept product returns</strong> and does <strong>NOT offer product exchanges</strong> after an order has been placed and delivered.
        </p>

        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
          Our core brand mission is providing <em>“Modern fashion within your budget”</em>. By maintaining a lean, direct Cash on Delivery fulfillment model without reverse logistics overheads, we are able to provide high-quality feminine designs at fair, accessible prices.
        </p>
      </div>

      {/* 3 Essential Customer Responsibilities */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
        <h3 className="text-lg font-serif font-bold text-stone-900 pb-3 border-b border-stone-100">
          Before Placing Your Order
        </h3>

        <div className="space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#EC4899] shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 block mb-0.5">1. Check the Size Chart Carefully</strong>
              <p className="text-stone-600">
                Please measure your bust, waist, hips, and preferred garment length before choosing your size. We provide detailed measurements in both inches and centimeters.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#EC4899] shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 block mb-0.5">2. Confirm Product Specifications & Color</strong>
              <p className="text-stone-600">
                Review the fabric details, styling photos, and color palette provided on each product page. Make sure you select the exact color and variation you intend to keep.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-[#EC4899] shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 block mb-0.5">3. Cash on Delivery Obligation</strong>
              <p className="text-stone-600">
                Because no advance payment is required, customers agree to accept and pay the full order amount in cash when the delivery agent arrives with the sealed package.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sizing Assistance Banner */}
      <div className="bg-stone-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-xs uppercase font-bold tracking-widest text-[#F9CAD5]">
            Need Help Choosing?
          </span>
          <h4 className="text-xl font-serif font-bold">Unsure which size fits you best?</h4>
          <p className="text-xs text-stone-300 max-w-md">
            Our team will gladly guide you with measurements and sizing recommendations over WhatsApp before you submit your order.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate('/size-guide')}
            className="px-5 py-2.5 bg-white text-stone-900 text-xs font-bold rounded-xl hover:bg-[#FFF0F3] transition-colors cursor-pointer"
          >
            Open Size Guide
          </button>
          <a
            href={BRAND.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-[#25D366] text-black text-xs font-bold rounded-xl hover:bg-[#20ba59] transition-colors flex items-center justify-center gap-1.5"
          >
            <MessageCircle className="w-4 h-4 fill-black" />
            <span>WhatsApp Us</span>
          </a>
        </div>
      </div>
    </div>
  );
};
