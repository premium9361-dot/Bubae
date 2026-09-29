import React, { useState } from 'react';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SmoothScroll } from './components/SmoothScroll';
import { motion, AnimatePresence } from 'motion/react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { SearchOverlay } from './components/SearchOverlay';
import { QuickViewModal } from './components/QuickViewModal';
import { SizeGuideModal } from './components/SizeGuideModal';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';

import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { WishlistPage } from './pages/WishlistPage';
import { AboutPage } from './pages/AboutPage';
import { SizeGuidePage } from './pages/SizeGuidePage';
import { DeliveryPage } from './pages/DeliveryPage';
import { PolicyPage } from './pages/PolicyPage';
import { FAQPage } from './pages/FAQPage';
import { ContactPage } from './pages/ContactPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';

import { Product } from './types';

const MainLayout: React.FC = () => {
  const { route, currentPath, navigate } = useNavigation();
  const { isAdmin, loading } = useAuth();

  // Modal States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const handleOpenQuickView = (product: Product) => {
    setQuickViewProduct(product);
  };

  const handleCloseQuickView = () => {
    setQuickViewProduct(null);
  };

  // Check if current route is an admin route (/bubae-studio/*)
  const isAdminRoute = route.name.startsWith('admin');

  if (isAdminRoute) {
    if (loading) {
      return (
        <div className="min-h-screen bg-[#1E0F14] text-[#F2D5DE] flex flex-col items-center justify-center text-xs font-medium space-y-3">
          <div className="w-6 h-6 border-2 border-[#BE185D] border-t-transparent rounded-full animate-spin" />
          <span>Verifying Bubaé Studio administrator authorization...</span>
        </div>
      );
    }

    if (route.name === 'admin-login') {
      // If already authenticated as admin, redirect directly to dashboard
      if (isAdmin) {
        return <AdminDashboardPage />;
      }
      return <AdminLoginPage />;
    }

    // Protect all other admin routes (/bubae-studio/dashboard, /bubae-studio/products, etc.)
    // If not authenticated, redirect to /bubae-studio login
    if (!isAdmin) {
      return <AdminLoginPage />;
    }

    switch (route.name) {
      case 'admin-products':
        return <AdminProductsPage />;
      case 'admin-orders':
        return <AdminOrdersPage />;
      case 'admin-settings':
        return <AdminSettingsPage />;
      case 'admin-dashboard':
      default:
        return <AdminDashboardPage />;
    }
  }

  // Customer Storefront Routing
  const renderCurrentPage = () => {
    switch (route.name) {
      case 'home':
        return <HomePage onQuickView={handleOpenQuickView} />;

      case 'shop':
        return <ShopPage onQuickView={handleOpenQuickView} />;

      case 'new-arrivals':
        return <ShopPage isNewArrivalsOnly={true} onQuickView={handleOpenQuickView} />;

      case 'category':
        return <ShopPage initialCategory={route.slug} onQuickView={handleOpenQuickView} />;

      case 'product':
        return (
          <ProductDetailPage
            slug={route.slug}
            onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
            onQuickView={handleOpenQuickView}
          />
        );

      case 'wishlist':
        return <WishlistPage onQuickView={handleOpenQuickView} />;

      case 'cart':
        return <CartPage />;

      case 'checkout':
        return <CheckoutPage />;

      case 'about':
        return <AboutPage />;

      case 'size-guide':
        return <SizeGuidePage />;

      case 'delivery':
        return <DeliveryPage />;

      case 'return-policy':
        return <PolicyPage />;

      case 'faq':
        return <FAQPage />;

      case 'contact':
        return <ContactPage />;

      default:
        return <HomePage onQuickView={handleOpenQuickView} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F4] text-[#1A1215] font-sans selection:bg-[#F2D5DE] selection:text-[#2E151E]">
      {/* Main Sticky Header with Translucent Blur on Scroll */}
      <Header onOpenSearch={() => setIsSearchOpen(true)} />

      {/* Primary Page Content with Subtle Smooth Fade Transition */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPath}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderCurrentPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Deepest Dusty Rose Footer */}
      <Footer />

      {/* Global Cart Slide-Out Drawer */}
      <CartDrawer />

      {/* Global Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Global Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={handleCloseQuickView}
        onOpenSizeGuide={() => {
          handleCloseQuickView();
          setIsSizeGuideOpen(true);
        }}
      />

      {/* Global Sizing Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
      />

      {/* Floating WhatsApp Action Button */}
      <FloatingWhatsApp />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <CartProvider>
          <WishlistProvider>
            <SmoothScroll>
              <MainLayout />
            </SmoothScroll>
          </WishlistProvider>
        </CartProvider>
      </NavigationProvider>
    </AuthProvider>
  );
}
