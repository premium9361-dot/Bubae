import React, { useState } from 'react';
import { BRAND } from '../data/brand';
import { BubaeLogo } from '../components/BubaeLogo';
import { BackButton } from '../components/BackButton';
import {
  MessageCircle,
  Instagram,
  Facebook,
  ExternalLink,
  Truck,
  ShieldAlert,
  Send,
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [inquiryTopic, setInquiryTopic] = useState('Order & Delivery');
  const [message, setMessage] = useState('');

  const handleSendViaWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    const text = `Hello Bubaé Team,

Name: ${name}
Topic: ${inquiryTopic}

Message:
${message}`;

    const url = `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-8 sm:space-y-12">
      {/* Top Navigation Row: Back Button */}
      <div className="flex items-center justify-start">
        <BackButton />
      </div>

      {/* Page Header */}
      <div className="text-center space-y-3">
        <span className="text-xs uppercase font-bold tracking-widest text-[#EC4899]">
          Get in Touch
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-stone-900">
          Let's Talk
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
          We are always happy to help with sizing recommendations, style questions, and order confirmations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Side: Contact Channels */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main WhatsApp Card */}
          <div className="bg-[#191919] text-white p-6 sm:p-8 rounded-2xl shadow-md border border-stone-800 space-y-4">
            <span className="text-[11px] uppercase font-bold tracking-widest text-[#F9CAD5]">
              Primary Contact Channel
            </span>
            <h2 className="text-2xl font-serif font-bold">
              Chat on WhatsApp
            </h2>
            <p className="text-xs text-stone-300 leading-relaxed">
              For fastest response regarding sizing, product inquiries, or Cash on Delivery order confirmation:
            </p>
            <div className="text-lg font-bold text-[#F9CAD5] tabular-nums">
              {BRAND.phoneDisplay}
            </div>
            <div>
              <a
                href={BRAND.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-black font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-sm"
              >
                <MessageCircle className="w-4 h-4 fill-black" />
                <span>Open WhatsApp Chat</span>
              </a>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-stone-900 pb-2 border-b border-stone-100">
              Official Social Profiles
            </h3>

            <div className="space-y-3">
              <a
                href={BRAND.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#FFF8F9] transition-colors border border-stone-100 text-xs font-semibold text-stone-800"
              >
                <div className="flex items-center gap-2.5">
                  <Instagram className="w-4 h-4 text-[#E1306C]" />
                  <span>Instagram @bubae_3</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
              </a>

              <a
                href={BRAND.social.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#FFF8F9] transition-colors border border-stone-100 text-xs font-semibold text-stone-800"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-black text-sm">🎵</span>
                  <span>TikTok @bubae_3</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
              </a>

              <a
                href={BRAND.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-[#FFF8F9] transition-colors border border-stone-100 text-xs font-semibold text-stone-800"
              >
                <div className="flex items-center gap-2.5">
                  <Facebook className="w-4 h-4 text-[#1877F2]" />
                  <span>Facebook Official Page</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
              </a>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="p-4 rounded-xl bg-[#FFF0F3] border border-[#F9CAD5] text-xs text-stone-700 flex items-start gap-2.5">
            <Truck className="w-4 h-4 text-[#EC4899] shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 block">Cash on Delivery</strong>
              No advance payment is required for ordering Bubaé products anywhere in Bangladesh.
            </div>
          </div>
        </div>

        {/* Right Side: Direct Inquiry Box */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900 mb-1">
              Send a Quick Message
            </h2>
            <p className="text-xs text-stone-500">
              Fill out the form below to initiate an instant WhatsApp chat with our customer support.
            </p>
          </div>

          <form onSubmit={handleSendViaWhatsApp} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Your Name <span className="text-[#EC4899]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Tanzila Ahmed"
                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#EC4899] text-stone-800 bg-[#FFF8F9]/40"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Topic of Inquiry
              </label>
              <select
                value={inquiryTopic}
                onChange={e => setInquiryTopic(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#EC4899] text-stone-800 bg-white"
              >
                <option value="Sizing & Fit Advice">Sizing & Fit Advice</option>
                <option value="Order & Delivery">Order & Delivery Information</option>
                <option value="Product Availability">Product Availability</option>
                <option value="General Question">General Question</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Message / Question <span className="text-[#EC4899]">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Write your question about our clothing, sizes, or styling..."
                className="w-full p-3 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#EC4899] text-stone-800 bg-[#FFF8F9]/40"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#191919] hover:bg-black text-[#FFF0F3] font-bold text-xs sm:text-sm py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4 text-[#F9CAD5]" />
              <span>SEND MESSAGE TO WHATSAPP</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
