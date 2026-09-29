import React, { useState } from 'react';
import { BRAND } from '../data/brand';
import { useNavigation } from '../context/NavigationContext';
import { BackButton } from '../components/BackButton';
import { ShieldAlert, Ruler, MessageCircle, ArrowRight } from 'lucide-react';

export const SizeGuidePage: React.FC = () => {
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');
  const { navigate } = useNavigation();

  const standardSizes = [
    { size: 'S', bustIn: '34 - 35', waistIn: '27 - 28', hipsIn: '37 - 38', lengthIn: '38 - 40', bustCm: '86 - 89', waistCm: '68 - 71', hipsCm: '94 - 96' },
    { size: 'M', bustIn: '36 - 37', waistIn: '29 - 30', hipsIn: '39 - 40', lengthIn: '40 - 42', bustCm: '91 - 94', waistCm: '74 - 76', hipsCm: '99 - 102' },
    { size: 'L', bustIn: '38 - 40', waistIn: '31 - 33', hipsIn: '41 - 43', lengthIn: '42 - 44', bustCm: '96 - 102', waistCm: '79 - 84', hipsCm: '104 - 109' },
    { size: 'XL', bustIn: '41 - 43', waistIn: '34 - 36', hipsIn: '44 - 46', lengthIn: '44 - 46', bustCm: '104 - 109', waistCm: '86 - 91', hipsCm: '112 - 117' },
    { size: 'XXL', bustIn: '44 - 46', waistIn: '37 - 39', hipsIn: '47 - 49', lengthIn: '46 - 48', bustCm: '112 - 117', waistCm: '94 - 99', hipsCm: '119 - 124' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-8">
      {/* Top Navigation Row: Back Button */}
      <div className="flex items-center justify-start">
        <BackButton />
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs uppercase font-bold tracking-widest text-[#EC4899]">
          Fit & Measurements
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900">
          Bubaé Size Guide
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
          Accurate sizing is essential because Bubaé operates on a strict No Return & No Exchange policy.
        </p>
      </div>

      {/* Critical Alert */}
      <div className="p-5 rounded-2xl bg-[#FFF0F3] border border-[#F9CAD5] flex items-start gap-4 shadow-xs">
        <ShieldAlert className="w-6 h-6 text-[#EC4899] shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-stone-800 leading-relaxed">
          <strong className="text-[#BE185D] block text-sm mb-1">
            Important Notice Regarding Returns & Exchanges
          </strong>
          Bubaé does NOT accept returns or offer product exchanges once an order has been delivered. Please measure yourself with a standard measuring tape and refer to the table below before confirming your size.
        </div>
      </div>

      {/* Size Chart Container */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-[#EC4899]" />
            <h2 className="text-lg font-serif font-bold text-stone-900">
              Women's Apparel Measurement Chart
            </h2>
          </div>

          {/* Unit Toggle */}
          <div className="inline-flex p-1 bg-stone-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setUnit('inches')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                unit === 'inches' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Inches (in)
            </button>
            <button
              onClick={() => setUnit('cm')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                unit === 'cm' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Centimeters (cm)
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FFF8F9] border-b border-stone-200 text-stone-700">
                <th className="py-3.5 px-4 font-bold">Standard Size</th>
                <th className="py-3.5 px-4 font-semibold">Bust</th>
                <th className="py-3.5 px-4 font-semibold">Waist</th>
                <th className="py-3.5 px-4 font-semibold">Hips</th>
                <th className="py-3.5 px-4 font-semibold">Average Length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-600">
              {standardSizes.map(row => (
                <tr key={row.size} className="hover:bg-[#FFF9FB] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-stone-900">{row.size}</td>
                  <td className="py-3.5 px-4 tabular-nums">
                    {unit === 'inches' ? `${row.bustIn}"` : `${row.bustCm} cm`}
                  </td>
                  <td className="py-3.5 px-4 tabular-nums">
                    {unit === 'inches' ? `${row.waistIn}"` : `${row.waistCm} cm`}
                  </td>
                  <td className="py-3.5 px-4 tabular-nums">
                    {unit === 'inches' ? `${row.hipsIn}"` : `${row.hipsCm} cm`}
                  </td>
                  <td className="py-3.5 px-4 tabular-nums">{row.lengthIn}"</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* How to Measure Instructions */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
        <h3 className="text-lg font-serif font-bold text-stone-900">
          How to Measure Accurately
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-stone-600 leading-relaxed">
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-[#FFF0F3] text-[#EC4899] font-bold flex items-center justify-center text-xs mb-2">
              1
            </span>
            <strong className="text-stone-900 block text-sm">Bust Circumference</strong>
            <p>
              Wrap the measuring tape around the fullest part of your bust, ensuring the tape remains horizontal across your back.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-[#FFF0F3] text-[#EC4899] font-bold flex items-center justify-center text-xs mb-2">
              2
            </span>
            <strong className="text-stone-900 block text-sm">Natural Waist</strong>
            <p>
              Find your natural crease by bending slightly to one side. Measure around this narrowest point above your belly button.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-[#FFF0F3] text-[#EC4899] font-bold flex items-center justify-center text-xs mb-2">
              3
            </span>
            <strong className="text-stone-900 block text-sm">Hips Measurement</strong>
            <p>
              Stand straight with your heels together and measure around the fullest circumference of your hips and seat.
            </p>
          </div>
        </div>
      </div>

      {/* Direct Assistance CTA */}
      <div className="text-center p-8 bg-[#FFF8F9] rounded-2xl border border-[#F9CAD5] space-y-3">
        <h4 className="text-base font-serif font-bold text-stone-900">
          Still Have Questions About Sizing?
        </h4>
        <p className="text-xs text-stone-600 max-w-md mx-auto">
          Send us your measurements via WhatsApp and our sizing team will recommend the right fit for you before you order.
        </p>
        <a
          href={BRAND.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-black font-bold text-xs py-3 px-6 rounded-xl transition-all shadow-sm"
        >
          <MessageCircle className="w-4 h-4 fill-black" />
          <span>Chat with Sizing Specialist (+880 1345-599300)</span>
        </a>
      </div>
    </div>
  );
};
