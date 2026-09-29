import React, { useState } from 'react';
import { BRAND } from '../data/brand';
import { useNavigation } from '../context/NavigationContext';
import { BackButton } from '../components/BackButton';
import { ChevronDown, MessageCircle, HelpCircle } from 'lucide-react';

export const FAQPage: React.FC = () => {
  const { navigate } = useNavigation();

  const faqs = [
    {
      q: 'Do you offer Cash on Delivery?',
      a: 'Yes. Bubaé accepts Cash on Delivery across Bangladesh. You pay the full order amount when the courier hands over your package.',
    },
    {
      q: 'Do I need to pay in advance?',
      a: 'No. No advance product payment is required. Customers also do not need to pay an advance delivery fee to confirm an order.',
    },
    {
      q: 'Can I return my order?',
      a: 'No. Bubaé does not accept product returns once an order has been placed and delivered. All sales are final.',
    },
    {
      q: 'Can I exchange a product?',
      a: 'No. Bubaé does not offer product exchanges. Please ensure you check the measurements on our Size Guide before confirming your order.',
    },
    {
      q: 'Can I change my size after ordering?',
      a: 'Please carefully select your size before placing the order. Because Bubaé does not offer exchanges, customers should check the size guide before ordering. If your order has not been dispatched yet, message us promptly on WhatsApp to check if a size adjustment is still possible.',
    },
    {
      q: 'How can I contact Bubaé?',
      a: 'You can contact us directly through WhatsApp at +880 1345-599300 or reach out to our official Instagram (@bubae_3), TikTok (@bubae_3), and Facebook pages.',
    },
    {
      q: 'Can I order directly through WhatsApp?',
      a: 'Yes! Every product page features an "ORDER VIA WHATSAPP" button which automatically prepares your product details, size, and color in a message ready to send to +8801345599300.',
    },
    {
      q: 'Where does Bubaé deliver and what are the delivery charges?',
      a: 'Bubaé is based in Sylhet and delivers nationwide across Bangladesh with 100% Cash on Delivery. Official delivery rates: Inside Sylhet Main Town (৳80), Outside Sylhet Main Town (৳115), Sunamganj and Maulvibazar (৳135), and Outside Sylhet (৳155). Delivery charges are automatically determined from your delivery location at checkout.',
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-8">
      {/* Top Navigation Row: Back Button */}
      <div className="flex items-center justify-start">
        <BackButton />
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs uppercase font-bold tracking-widest text-[#EC4899]">
          Common Questions
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
          Everything you need to know about shopping with Bubaé, payments, sizing, and policies.
        </p>
      </div>

      {/* Accordion List */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs divide-y divide-stone-100">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="py-4 first:pt-0 last:pb-0">
              <button
                onClick={() => toggle(idx)}
                className="w-full text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-stone-900 hover:text-[#BE185D] transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-[#EC4899]' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="mt-3 text-xs sm:text-sm text-stone-600 leading-relaxed pr-6 animate-in fade-in duration-150">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Direct Contact Card */}
      <div className="p-8 rounded-2xl bg-[#FFF0F3] border border-[#F9CAD5] text-center space-y-3">
        <HelpCircle className="w-8 h-8 text-[#EC4899] mx-auto" />
        <h3 className="text-lg font-serif font-bold text-stone-900">
          Have another question?
        </h3>
        <p className="text-xs text-stone-600 max-w-md mx-auto">
          We are available on WhatsApp to answer any question about product availability, fabrics, and styling.
        </p>
        <div className="pt-2">
          <a
            href={BRAND.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-black font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-sm"
          >
            <MessageCircle className="w-4 h-4 fill-black" />
            <span>Chat on WhatsApp (+880 1345-599300)</span>
          </a>
        </div>
      </div>
    </div>
  );
};
