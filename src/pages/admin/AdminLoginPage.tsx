import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { BubaeLogo } from '../../components/BubaeLogo';
import { Lock, User, ArrowRight, ArrowLeft, Shield } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { signIn, error } = useAuth();
  const { navigate } = useNavigation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!username.trim() || !password.trim()) {
      setLocalError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    const result = await signIn(username, password);
    setLoading(false);

    if (result.success) {
      navigate('/bubae-studio/dashboard');
    } else {
      setLocalError(result.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F4] flex flex-col justify-center items-center px-4 py-12 bg-grain-texture">
      {/* Return to store */}
      <div className="w-full max-w-md mb-6">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs text-stone-600 hover:text-black font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Storefront</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl border border-[#F7D8E2]/80 shadow-md p-8 sm:p-10 space-y-6">
        {/* Brand identity & Visual Hierarchy */}
        <div className="text-center space-y-3.5">
          <div className="flex justify-center">
            <BubaeLogo />
          </div>
          <div className="space-y-1.5">
            {/* Small premium eyebrow / label */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0F3] border border-[#F9CAD5]/60 text-[#BE185D] text-[10.5px] font-semibold tracking-[0.2em] uppercase">
              <Shield className="w-3 h-3 text-[#BE185D]" />
              <span>Bubaé Studio</span>
            </div>

            {/* Main heading */}
            <h1 className="text-2xl sm:text-[26px] font-serif font-bold text-stone-900 tracking-tight pt-1">
              Admin Management
            </h1>

            {/* Premium supporting text */}
            <p className="text-[13px] text-[#705660] font-normal leading-relaxed max-w-xs mx-auto">
              Authorized access only. Sign in to manage store operations.
            </p>
          </div>
        </div>

        {/* Error message */}
        {(localError || error) && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span className="leading-snug">{localError || error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-semibold text-stone-700 block">
              Username <span className="text-[#BE185D]">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoComplete="off"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D] focus:ring-2 focus:ring-[#BE185D]/10 text-xs bg-stone-50/50 hover:bg-white text-stone-900 transition-all duration-200 placeholder:text-stone-400 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-semibold text-stone-700 block">
              Password <span className="text-[#BE185D]">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                autoComplete="off"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D] focus:ring-2 focus:ring-[#BE185D]/10 text-xs bg-stone-50/50 hover:bg-white text-stone-900 transition-all duration-200 placeholder:text-stone-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-stone-900 hover:bg-black text-[#FFF0F3] font-bold tracking-[0.16em] uppercase text-[11px] rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-sm disabled:opacity-50 mt-3"
          >
            <span>{loading ? 'Authenticating...' : 'Login'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Premium bottom security note */}
        <div className="pt-2 text-center">
          <p className="text-[11.5px] text-[#7A616B] leading-relaxed tracking-normal font-normal">
            Protected area. Session activity and active devices are securely tracked.
          </p>
        </div>
      </div>
    </div>
  );
};


