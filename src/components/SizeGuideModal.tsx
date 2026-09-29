import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { BRAND } from '../data/brand';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose }) => {
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');

  if (!isOpen) return null;

  const sizeTable = [
    { size: 'S', bustIn: '34 - 35', waistIn: '27 - 28', hipsIn: '37 - 38', lengthIn: '38 - 40', bustCm: '86 - 89', waistCm: '68 - 71', hipsCm: '94 - 96' },
    { size: 'M', bustIn: '36 - 37', waistIn: '29 - 30', hipsIn: '39 - 40', lengthIn: '40 - 42', bustCm: '91 - 94', waistCm: '74 - 76', hipsCm: '99 - 102' },
    { size: 'L', bustIn: '38 - 40', waistIn: '31 - 33', hipsIn: '41 - 43', lengthIn: '42 - 44', bustCm: '96 - 102', waistCm: '79 - 84', hipsCm: '104 - 109' },
    { size: 'XL', bustIn: '41 - 43', waistIn: '34 - 36', hipsIn: '44 - 46', lengthIn: '44 - 46', bustCm: '104 - 109', waistCm: '86 - 91', hipsCm: '112 - 117' },
    { size: 'XXL', bustIn: '44 - 46', waistIn: '37 - 39', hipsIn: '47 - 49', lengthIn: '46 - 48', bustCm: '112 - 117', waistCm: '94 - 99', hipsCm: '119 - 124' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl border border-[#F9CAD5]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-black rounded-full hover:bg-stone-100 transition-colors"
          aria-label="Close Size Guide"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-left mb-6">
          <span className="text-xs uppercase tracking-wider text-[#EC4899] font-bold">
            Bubaé Size Chart
          </span>
          <h2 className="text-2xl font-serif font-bold text-stone-900 mt-1">
            Standard Measurements Guide
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Compare your body measurements to pick the perfect fit.
          </p>
        </div>

        {/* Crucial Policy Alert */}
        <div className="mb-6 p-4 rounded-xl bg-[#FFF0F3] border border-[#F9CAD5] flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-[#EC4899] shrink-0 mt-0.5" />
          <div className="text-xs text-stone-800 leading-relaxed">
            <span className="font-bold text-[#BE185D] block mb-0.5">
              Important: No Return & No Exchange Policy
            </span>
            Bubaé does not offer product exchanges or returns once delivered. Please take a moment to measure carefully to make sure you select the correct size.
          </div>
        </div>

        {/* Unit Selector */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-stone-700">Measurement Values:</span>
          <div className="inline-flex p-1 bg-stone-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setUnit('inches')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                unit === 'inches' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Inches (in)
            </button>
            <button
              onClick={() => setUnit('cm')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                unit === 'cm' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Centimeters (cm)
            </button>
          </div>
        </div>

        {/* Size Table */}
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-700">
                <th className="py-3 px-4 font-bold">Size</th>
                <th className="py-3 px-4 font-semibold">Bust</th>
                <th className="py-3 px-4 font-semibold">Waist</th>
                <th className="py-3 px-4 font-semibold">Hips</th>
                <th className="py-3 px-4 font-semibold">Avg. Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-600">
              {sizeTable.map(row => (
                <tr key={row.size} className="hover:bg-[#FFF9FB] transition-colors">
                  <td className="py-3 px-4 font-bold text-stone-900">{row.size}</td>
                  <td className="py-3 px-4 tabular-nums">
                    {unit === 'inches' ? `${row.bustIn}"` : `${row.bustCm} cm`}
                  </td>
                  <td className="py-3 px-4 tabular-nums">
                    {unit === 'inches' ? `${row.waistIn}"` : `${row.waistCm} cm`}
                  </td>
                  <td className="py-3 px-4 tabular-nums">
                    {unit === 'inches' ? `${row.hipsIn}"` : `${row.hipsCm} cm`}
                  </td>
                  <td className="py-3 px-4 tabular-nums">
                    {row.lengthIn}"
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Measuring Tips */}
        <div className="mt-5 pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-stone-500">
          <div>
            <strong className="text-stone-700 block mb-0.5">1. Bust</strong>
            Measure around the fullest part of your bust keeping tape parallel.
          </div>
          <div>
            <strong className="text-stone-700 block mb-0.5">2. Waist</strong>
            Measure around your natural narrowest waistline.
          </div>
          <div>
            <strong className="text-stone-700 block mb-0.5">3. Hips</strong>
            Stand with feet together and measure around fullest hip area.
          </div>
        </div>

        {/* WhatsApp Assist */}
        <div className="mt-6 text-center">
          <p className="text-xs text-stone-500 mb-2">
            Still unsure about your size? Our team will gladly assist you before placing your order.
          </p>
          <a
            href={BRAND.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#EC4899] hover:text-[#BE185D] hover:underline"
          >
            <span>Ask sizing assistance on WhatsApp ({BRAND.phoneDisplay})</span>
          </a>
        </div>
      </div>
    </div>
  );
};
