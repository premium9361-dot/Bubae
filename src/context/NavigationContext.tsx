import React, { createContext, useContext, useEffect, useState } from 'react';

export type PageRoute = 
  | { name: 'home' }
  | { name: 'shop'; category?: string; query?: string }
  | { name: 'new-arrivals' }
  | { name: 'category'; slug: string }
  | { name: 'product'; slug: string }
  | { name: 'wishlist' }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'about' }
  | { name: 'size-guide' }
  | { name: 'delivery' }
  | { name: 'return-policy' }
  | { name: 'faq' }
  | { name: 'contact' }
  | { name: 'admin-dashboard' }
  | { name: 'admin-products' }
  | { name: 'admin-orders' }
  | { name: 'admin-settings' }
  | { name: 'admin-login' };

interface NavigationContextType {
  route: PageRoute;
  currentPath: string;
  navigate: (path: string, options?: { replace?: boolean; scroll?: boolean }) => void;
  goBack: () => void;
  openProduct: (slug: string) => void;
  openCategory: (slug: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

function parsePath(pathname: string): PageRoute {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  if (!clean || clean === '') {
    return { name: 'home' };
  }

  const parts = clean.split('/');

  // Private Bubaé Studio Admin entry routes (/bubae-studio)
  if (parts[0] === 'bubae-studio') {
    if (!parts[1] || parts[1] === 'login') {
      return { name: 'admin-login' };
    }
    if (parts[1] === 'products') {
      return { name: 'admin-products' };
    }
    if (parts[1] === 'orders') {
      return { name: 'admin-orders' };
    }
    if (parts[1] === 'settings') {
      return { name: 'admin-settings' };
    }
    if (parts[1] === 'dashboard') {
      return { name: 'admin-dashboard' };
    }
    return { name: 'admin-dashboard' };
  }

  // Redirect legacy /admin requests to private login
  if (parts[0] === 'admin') {
    return { name: 'admin-login' };
  }

  if (parts[0] === 'shop') {
    return { name: 'shop' };
  }
  if (parts[0] === 'new-arrivals') {
    return { name: 'new-arrivals' };
  }
  if (parts[0] === 'category' && parts[1]) {
    return { name: 'category', slug: parts[1] };
  }

  // Direct category path shortcuts
  if (['pants', 't-shirts', 'oversized-t-shirts'].includes(parts[0])) {
    return { name: 'category', slug: parts[0] };
  }

  if (parts[0] === 'product' && parts[1]) {
    return { name: 'product', slug: parts[1] };
  }
  if (parts[0] === 'wishlist') {
    return { name: 'wishlist' };
  }
  if (parts[0] === 'cart') {
    return { name: 'cart' };
  }
  if (parts[0] === 'checkout') {
    return { name: 'checkout' };
  }
  if (parts[0] === 'about') {
    return { name: 'about' };
  }
  if (parts[0] === 'size-guide') {
    return { name: 'size-guide' };
  }
  if (parts[0] === 'delivery') {
    return { name: 'delivery' };
  }
  if (parts[0] === 'return-policy' || parts[0] === 'policy') {
    return { name: 'return-policy' };
  }
  if (parts[0] === 'faq') {
    return { name: 'faq' };
  }
  if (parts[0] === 'contact') {
    return { name: 'contact' };
  }

  return { name: 'home' };
}

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [route, setRoute] = useState<PageRoute>(() => parsePath(window.location.pathname));
  const [historyStack, setHistoryStack] = useState<string[]>(() => [window.location.pathname]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      setRoute(parsePath(path));
      setHistoryStack(prev => (prev.length > 1 ? prev.slice(0, -1) : [path]));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string, options?: { replace?: boolean; scroll?: boolean }) => {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    if (options?.replace) {
      window.history.replaceState({}, '', normalized);
      setHistoryStack(prev => (prev.length > 0 ? [...prev.slice(0, -1), normalized] : [normalized]));
    } else {
      window.history.pushState({}, '', normalized);
      setHistoryStack(prev => [...prev, normalized]);
    }
    setCurrentPath(normalized);
    setRoute(parsePath(normalized));

    if (options?.scroll !== false) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };

  const goBack = () => {
    // If there is an internal history stack to pop back
    if (historyStack.length > 1) {
      window.history.back();
    } else if (window.history.length > 1 && typeof document !== 'undefined' && document.referrer && document.referrer.includes(window.location.host)) {
      window.history.back();
    } else {
      // Safe fallback: navigate cleanly to Home
      navigate('/', { scroll: true });
    }
  };

  const openProduct = (slug: string) => {
    navigate(`/product/${slug}`);
  };

  const openCategory = (slug: string) => {
    navigate(`/category/${slug}`);
  };

  return (
    <NavigationContext.Provider value={{ route, currentPath, navigate, goBack, openProduct, openCategory }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
