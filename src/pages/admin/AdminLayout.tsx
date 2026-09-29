import React from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { BubaeLogo } from '../../components/BubaeLogo';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  ExternalLink,
  LogOut,
  Database,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Settings,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'products' | 'orders' | 'settings';
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab }) => {
  const { navigate } = useNavigation();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/bubae-studio');
  };

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col md:flex-row text-stone-900 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-[#F7D8E2]/60 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#F7D8E2]/40 flex items-center justify-between">
          <div className="cursor-pointer" onClick={() => navigate('/bubae-studio/dashboard')}>
            <BubaeLogo className="scale-90 origin-left" />
            <span className="block text-[10px] tracking-widest uppercase font-semibold text-[#BE185D] mt-1">
              Bubaé Studio
            </span>
          </div>
        </div>

        {/* Supabase Status Banner */}
        <div className="px-5 py-3 bg-[#FFF5F8] border-b border-[#F7D8E2]/40 text-xs">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-[#BE185D]" />
            <span className="font-medium text-stone-800">Supabase Backend</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-stone-500">
            {isSupabaseConfigured ? (
              <>
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Connected to gewdfuwqtnnovascvmmq</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-amber-600" />
                <span className="text-stone-600">Local Cache / Active Sync Mode</span>
              </>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5 flex-1">
          <button
            onClick={() => navigate('/bubae-studio/dashboard')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium tracking-wide transition-colors cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#FFF0F3] text-[#BE185D] font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => navigate('/bubae-studio/products')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium tracking-wide transition-colors cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#FFF0F3] text-[#BE185D] font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products & Inventory</span>
          </button>

          <button
            onClick={() => navigate('/bubae-studio/orders')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium tracking-wide transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#FFF0F3] text-[#BE185D] font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Customer Orders (COD)</span>
          </button>

          <button
            onClick={() => navigate('/bubae-studio/settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium tracking-wide transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#FFF0F3] text-[#BE185D] font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Security & Settings</span>
          </button>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#F7D8E2]/40 space-y-2">
          {/* View Public Storefront */}
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-[#BE185D]" />
              <span>View Live Store</span>
            </span>
            <span className="text-[10px] text-stone-600 uppercase font-mono">Storefront</span>
          </button>

          {/* User Info & Clear Logout Button */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span className="truncate max-w-[120px] font-mono text-[11px] font-semibold text-stone-700" title={user?.username || user?.email || 'BUBAE2008'}>
              {user?.username || user?.email || 'BUBAE2008'}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-stone-600 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
              title="End Administrator Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

