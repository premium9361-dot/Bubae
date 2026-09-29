import { Category, Product, Order, OrderStatus, ProductVariant } from '../types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_ORDERS } from './mockData';
import { calculateDelivery } from './delivery';

const STORAGE_KEYS = {
  CATEGORIES: 'bubae_db_categories',
  PRODUCTS: 'bubae_db_products_v3',
  ORDERS: 'bubae_db_orders_v3',
  VARIANTS: 'bubae_db_variants_v3',
};

// Listeners for realtime reactive updates across components
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export function subscribeToStore(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyStoreChanged() {
  listeners.forEach(fn => fn());
}

// Helper to ensure each product has valid variants and sizeStock
export function ensureProductVariants(p: Product): Product {
  let sizeStock = { ...(p.sizeStock || {}) };
  const sizes = p.sizes && p.sizes.length > 0 ? p.sizes : ['M', 'L'];

  // If sizeStock is empty, populate from sizes & stock
  if (Object.keys(sizeStock).length === 0) {
    if (p.slug === 'black-cargo-pants') {
      sizeStock = { M: 10, L: 2, XL: 5, XXL: 0 };
    } else {
      const count = sizes.length;
      const baseStock = typeof p.stock === 'number' ? p.stock : 10;
      const perSize = Math.max(0, Math.floor(baseStock / count));
      sizes.forEach((s, idx) => {
        sizeStock[s] = idx === 0 ? baseStock - perSize * (count - 1) : perSize;
      });
    }
  }

  // Ensure all configured sizes have a numeric stock value
  sizes.forEach(s => {
    if (sizeStock[s] === undefined) {
      sizeStock[s] = 0;
    }
  });

  const variants: ProductVariant[] = Object.entries(sizeStock).map(([size, stk]) => ({
    id: `var-${p.id}-${size.toLowerCase()}`,
    product_id: p.id,
    size,
    stock: Number(stk) || 0,
    updated_at: p.updated_at || new Date().toISOString(),
  }));

  const totalStock = Object.values(sizeStock).reduce((sum, n) => sum + (Number(n) || 0), 0);
  const isAvailable = totalStock > 0 && p.is_available !== false;

  return {
    ...p,
    sizes: Object.keys(sizeStock),
    variants,
    sizeStock,
    stock: totalStock,
    is_available: isAvailable,
  };
}

export const LocalStore = {
  getCategories(): Category[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    this.saveCategories(INITIAL_CATEGORIES);
    return INITIAL_CATEGORIES;
  },

  saveCategories(categories: Category[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      notifyStoreChanged();
    } catch (e) {
      console.error(e);
    }
  },

  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (data) {
        const parsed: Product[] = JSON.parse(data);
        return parsed.map(ensureProductVariants);
      }
    } catch (e) {
      console.error(e);
    }
    const initial = INITIAL_PRODUCTS.map(ensureProductVariants);
    this.saveProducts(initial);
    return initial;
  },

  saveProducts(products: Product[]) {
    try {
      const normalized = products.map(ensureProductVariants);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(normalized));
      notifyStoreChanged();
    } catch (e) {
      console.error(e);
    }
  },

  getOrders(): Order[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    this.saveOrders(INITIAL_ORDERS);
    return INITIAL_ORDERS;
  },

  saveOrders(orders: Order[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      notifyStoreChanged();
    } catch (e) {
      console.error(e);
    }
  },

  // Atomic order creation & SIZE-LEVEL inventory deduction
  processOrder(payload: {
    customer_name: string;
    phone: string;
    address: string;
    area: string;
    district: string;
    delivery_area?: string;
    delivery_charge?: number;
    notes?: string;
    policy_accepted: boolean;
    items: Array<{
      product_id: string;
      size: string;
      color: string;
      quantity: number;
    }>;
  }): { success: boolean; order?: Order; error?: string } {
    if (!payload.policy_accepted) {
      return { success: false, error: 'You must agree to the No Return / No Exchange policy.' };
    }

    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: 'Order must contain at least one item.' };
    }

    const currentProducts = this.getProducts();
    const productMap = new Map<string, Product>();
    currentProducts.forEach(p => productMap.set(p.id, { ...p }));

    // 1. Verify SIZE-LEVEL stock for each requested item
    for (const item of payload.items) {
      const prod = productMap.get(item.product_id);
      if (!prod) {
        return { success: false, error: 'Product is no longer available in catalog.' };
      }

      if (!item.size) {
        return { success: false, error: `Please select a size for "${prod.name}".` };
      }

      const sizeStock = prod.sizeStock?.[item.size] ?? 0;

      // Notice: Do NOT reveal exact stock count to customer, per strict requirements!
      if (!prod.is_available || sizeStock < item.quantity) {
        return {
          success: false,
          error: `Sorry, "${prod.name}" in size ${item.size} is no longer available in the requested quantity.`,
        };
      }
    }

    // 2. Deduct stock from the SELECTED SIZE ONLY atomically
    let totalAmount = 0;
    const orderId = 'ord-' + Math.floor(1000 + Math.random() * 9000);
    const orderNumber = 'BUB-' + Math.floor(100000 + Math.random() * 900000);

    const orderItems = payload.items.map((item, idx) => {
      const prod = productMap.get(item.product_id)!;
      const currentSizeStock = prod.sizeStock?.[item.size] ?? 0;
      const nextSizeStock = Math.max(0, currentSizeStock - item.quantity);

      // Deduct ONLY selected size
      prod.sizeStock = {
        ...(prod.sizeStock || {}),
        [item.size]: nextSizeStock,
      };

      if (prod.variants) {
        prod.variants = prod.variants.map(v =>
          v.size === item.size ? { ...v, stock: nextSizeStock } : v
        );
      }

      // Re-sum total product stock
      prod.stock = Object.values(prod.sizeStock).reduce((sum, n) => sum + (Number(n) || 0), 0);

      // If all sizes reach 0, product becomes unavailable
      if (prod.stock <= 0) {
        prod.is_available = false;
      }
      prod.updated_at = new Date().toISOString();

      const itemSubtotal = prod.price * item.quantity;
      totalAmount += itemSubtotal;

      return {
        id: `item-${orderId}-${idx + 1}`,
        order_id: orderId,
        product_id: prod.id,
        product_name: prod.name,
        price: prod.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      };
    });

    // Save updated products with mutated size-level stock
    this.saveProducts(Array.from(productMap.values()));

    // Authoritative delivery calculation: Never trust client-supplied fee
    const deliveryCalc = calculateDelivery(payload.district, payload.area);
    const authoritativeDeliveryZone = deliveryCalc.zone;
    const authoritativeDeliveryCharge = deliveryCalc.charge;
    const finalOrderTotal = totalAmount + authoritativeDeliveryCharge;

    // Create new order record with permanent size and delivery metadata
    const newOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      customer_name: payload.customer_name,
      phone: payload.phone,
      address: payload.address,
      area: payload.area || authoritativeDeliveryZone,
      district: payload.district,
      delivery_area: authoritativeDeliveryZone,
      delivery_charge: authoritativeDeliveryCharge,
      total_amount: finalOrderTotal,
      payment_method: 'Cash on Delivery',
      policy_accepted: true,
      status: 'Pending',
      notes: payload.notes || '',
      created_at: new Date().toISOString(),
      items: orderItems,
    };

    const orders = [newOrder, ...this.getOrders()];
    this.saveOrders(orders);

    return { success: true, order: newOrder };
  },

  updateOrderStatus(orderId: string, status: OrderStatus): boolean {
    const orders = this.getOrders();
    const updated = orders.map(ord =>
      ord.id === orderId ? { ...ord, status, updated_at: new Date().toISOString() } : ord
    );
    this.saveOrders(updated);
    return true;
  },

  updateOrder(orderId: string, updates: Partial<Order>): Order | null {
    const orders = this.getOrders();
    let updatedOrder: Order | null = null;
    const nextOrders = orders.map(ord => {
      if (ord.id === orderId) {
        updatedOrder = {
          ...ord,
          ...updates,
          updated_at: new Date().toISOString(),
        };
        return updatedOrder;
      }
      return ord;
    });
    this.saveOrders(nextOrders);
    return updatedOrder;
  },

  addProduct(productData: Omit<Product, 'id' | 'created_at'>): Product {
    const products = this.getProducts();
    const sizeStock = productData.sizeStock || {};
    const totalStock = Object.keys(sizeStock).length > 0
      ? Object.values(sizeStock).reduce((sum, n) => sum + (Number(n) || 0), 0)
      : Number(productData.stock) || 0;

    const newProduct: Product = ensureProductVariants({
      ...productData,
      id: 'prod-' + Math.random().toString(36).substring(2, 9),
      stock: totalStock,
      is_available: totalStock > 0 && productData.is_available !== false,
      created_at: new Date().toISOString(),
    });

    this.saveProducts([newProduct, ...products]);
    return newProduct;
  },

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const products = this.getProducts();
    let updatedProduct: Product | null = null;
    const nextProducts = products.map(p => {
      if (p.id === id) {
        const nextSizeStock = updates.sizeStock !== undefined ? updates.sizeStock : p.sizeStock;
        const totalStock = nextSizeStock && Object.keys(nextSizeStock).length > 0
          ? Object.values(nextSizeStock).reduce((sum, n) => sum + (Number(n) || 0), 0)
          : updates.stock !== undefined ? Number(updates.stock) : p.stock;

        const nextAvailable = updates.is_available !== undefined
          ? updates.is_available
          : totalStock > 0;

        updatedProduct = ensureProductVariants({
          ...p,
          ...updates,
          sizeStock: nextSizeStock,
          stock: totalStock,
          is_available: totalStock <= 0 ? false : nextAvailable,
          updated_at: new Date().toISOString(),
        });
        return updatedProduct;
      }
      return p;
    });
    this.saveProducts(nextProducts);
    return updatedProduct;
  },

  deleteProduct(id: string): boolean {
    const products = this.getProducts();
    this.saveProducts(products.filter(p => p.id !== id));
    return true;
  },
};
