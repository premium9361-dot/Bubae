import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryEstimate: number | null;
  deliveryLocation: string;
  total: number;
  isCartOpen: boolean;
  cartError: string | null;
  setCartError: (err: string | null) => void;
  addToCart: (product: Product, size: string, color: string, quantity?: number) => { success: boolean; error?: string };
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, newQty: number) => { success: boolean; error?: string };
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setDeliveryLocation: (zone: string, fee: number | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'bubae_cart_v3';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [deliveryLocation, setDeliveryLocationState] = useState<string>('Inside Sylhet');
  const [deliveryEstimate, setDeliveryEstimate] = useState<number | null>(80);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Could not save cart to localStorage', e);
    }
  }, [items]);

  const addToCart = (product: Product, size: string, color: string, quantity = 1) => {
    setCartError(null);

    // 1. Mandatory size validation
    const trimmedSize = (size || '').trim();
    if (!trimmedSize) {
      const errorMsg = 'Please select a size before adding to bag.';
      setCartError(errorMsg);
      return { success: false, error: errorMsg };
    }

    // 2. Check SIZE-SPECIFIC stock
    const sizeStock = product.sizeStock?.[trimmedSize] !== undefined
      ? product.sizeStock[trimmedSize]
      : (product.variants?.find(v => v.size === trimmedSize)?.stock ?? product.stock ?? 0);

    if (sizeStock <= 0) {
      const errorMsg = `Size ${trimmedSize} is currently out of stock.`;
      setCartError(errorMsg);
      return { success: false, error: errorMsg };
    }

    if (quantity > sizeStock) {
      // Never reveal exact stock count to customer
      const errorMsg = 'Requested quantity exceeds available stock.';
      setCartError(errorMsg);
      return { success: false, error: errorMsg };
    }

    // 3. Different sizes of the same product create separate items!
    const cartItemId = `${product.id}-${trimmedSize}-${color}`;
    let success = true;
    let errorMsg: string | undefined;

    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === cartItemId);
      if (existingIndex > -1) {
        const nextQty = prev[existingIndex].quantity + quantity;
        if (nextQty > sizeStock) {
          success = false;
          errorMsg = 'Requested quantity exceeds available stock.';
          return prev;
        }
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          quantity: nextQty,
        };
        return copy;
      }
      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          product,
          selectedSize: trimmedSize,
          selectedColor: color,
          quantity,
          unitPrice: product.price,
        },
      ];
    });

    if (!success && errorMsg) {
      setCartError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsCartOpen(true);
    return { success: true };
  };

  const removeFromCart = (cartItemId: string) => {
    setItems(prev => prev.filter(item => item.id !== cartItemId));
    setCartError(null);
  };

  const updateQuantity = (cartItemId: string, newQty: number) => {
    setCartError(null);
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return { success: true };
    }

    let success = true;
    let errorMsg: string | undefined;

    setItems(prev =>
      prev.map(item => {
        if (item.id === cartItemId) {
          const sizeStock = item.product.sizeStock?.[item.selectedSize] !== undefined
            ? item.product.sizeStock[item.selectedSize]
            : (item.product.variants?.find(v => v.size === item.selectedSize)?.stock ?? item.product.stock ?? 10);

          if (newQty > sizeStock) {
            success = false;
            errorMsg = 'Cannot add more. Maximum available reached.';
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );

    if (!success && errorMsg) {
      setCartError(errorMsg);
      return { success: false, error: errorMsg };
    }

    return { success: true };
  };

  const clearCart = () => {
    setItems([]);
    setCartError(null);
  };

  const setDeliveryLocation = (zone: string, fee: number | null) => {
    setDeliveryLocationState(zone);
    setDeliveryEstimate(fee);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const total = subtotal + (deliveryEstimate ?? 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        deliveryEstimate,
        deliveryLocation,
        total,
        isCartOpen,
        cartError,
        setCartError,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openCart: () => setIsCartOpen(true),
        closeCart: () => {
          setIsCartOpen(false);
          setCartError(null);
        },
        setDeliveryLocation,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
