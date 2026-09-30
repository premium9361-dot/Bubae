import React, { useState } from 'react';
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
  Settings,
  Menu,
  X,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'products' | 'orders' | 'settings';
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab }) => {
  const { navigate } = useNavigation();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/bubae-studio');
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/bubae-studio/dashboard',
    },
    {
      id: 'products',
      label: 'Products & Inventory',
      icon: Package,
      path: '/bubae-studio/products',
    },
    {
      id: 'orders',
      label: 'Customer Orders (COD)',
      icon: ShoppingBag,
      path: '/bubae-studio/orders',
    },
    {
      id: 'settings',
      label: 'Security & Settings',
      icon: Settings,
      path: '/bubae-studio/settings',
    },
  ];

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col md:flex-row text-stone-900 font-sans">
      {/* Mobile Top Header (< md screens) */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F7D8E2]/60 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => handleNavClick('/bubae-studio/dashboard')}
        >
          <BubaeLogo className="scale-80 origin-left" />
          <span className="text-[10px] tracking-widest uppercase font-bold text-[#BE185D]">
            Studio
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Active section pill on mobile */}
          <span className="text-[11px] font-semibold text-[#BE185D] bg-[#FFF0F3] px-2.5 py-1 rounded-full border border-[#F9CAD5]/60 capitalize">
            {activeTab}
          </span>

          {/* Mobile Menu Toggle Button (Min 44px touch target) */}
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="p-2.5 min-h-[44px] min-w-[44px] text-stone-700 hover:text-stone-900 rounded-xl hover:bg-stone-100 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#F7D8E2]/80 px-4 py-3 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 min-h-[44px] rounded-xl text-xs font-semibold tracking-wide transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#FFF0F3] text-[#BE185D]'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
            <button
              onClick={() => handleNavClick('/')}
              className="flex items-center gap-1.5 py-2 px-3 text-xs font-medium text-stone-700 hover:text-[#BE185D] rounded-lg"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#BE185D]" />
              <span>Live Store</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 py-2 px-3 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar Navigation (Hidden on mobile) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-[#F7D8E2]/60 flex-col shrink-0 min-h-screen">
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
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium tracking-wide transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#FFF0F3] text-[#BE185D] font-semibold shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-[#F7D8E2]/40 space-y-2">
          {/* View Public Storefront */}
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-[#BE185D]" />
              <span>View Live Store</span>
            </span>
            <span className="text-[10px] text-stone-500 uppercase font-mono">Storefront</span>
          </button>

          {/* User Info & Clear Logout Button */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span className="truncate max-w-[120px] font-mono text-[11px] font-semibold text-stone-700" title={user?.username || user?.email || 'BUBAE2008'}>
              {user?.username || user?.email || 'BUBAE2008'}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-stone-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
