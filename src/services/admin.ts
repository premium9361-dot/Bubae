import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product, Order, OrderStatus, ProductVariant, OrderEditHistoryEntry, Category } from '../types';
import { LocalStore, ensureProductVariants, subscribeToStore } from './localStore';

export interface DashboardStats {
  totalProducts: number;
  availableProducts: number;
  outOfStockProducts: number;
  pendingOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
}

export interface MonthlyRevenueItem {
  month: string;
  shortMonth: string;
  year: number;
  revenue: number;
  ordersCount: number;
}

export interface RevenueAnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  monthlyBreakdown: MonthlyRevenueItem[];
}

// ==========================================
// HIGH-SPEED IN-MEMORY CACHE LAYER
// Prevents redundant network requests and eliminates loading spinners
// ==========================================
let cachedAdminProducts: Product[] | null = null;
let cachedAdminProductsTime = 0;

let cachedAdminOrders: Order[] | null = null;
let cachedAdminOrdersTime = 0;

let cachedAdminCategories: Category[] | null = null;
let cachedAdminCategoriesTime = 0;

let cachedAdminStats: DashboardStats | null = null;
let cachedAdminStatsTime = 0;

let cachedAdminAnalytics: RevenueAnalyticsData | null = null;
let cachedAdminAnalyticsTime = 0;

const CACHE_TTL_MS = 60_000; // 60 seconds TTL

export function adminInvalidateProductsCache() {
  cachedAdminProducts = null;
  cachedAdminProductsTime = 0;
  cachedAdminStats = null;
}

export function adminInvalidateOrdersCache() {
  cachedAdminOrders = null;
  cachedAdminOrdersTime = 0;
  cachedAdminStats = null;
  cachedAdminAnalytics = null;
}

export function adminInvalidateAllCache() {
  cachedAdminProducts = null;
  cachedAdminProductsTime = 0;
  cachedAdminOrders = null;
  cachedAdminOrdersTime = 0;
  cachedAdminCategories = null;
  cachedAdminCategoriesTime = 0;
  cachedAdminStats = null;
  cachedAdminStatsTime = 0;
  cachedAdminAnalytics = null;
  cachedAdminAnalyticsTime = 0;
}

// Automatically sync when LocalStore emits a mutation
subscribeToStore(() => {
  // If an external mutation occurred, refresh cached arrays from LocalStore without dropping references
  const localProds = LocalStore.getProducts();
  if (localProds && localProds.length > 0) {
    cachedAdminProducts = localProds;
  }
  const localOrds = LocalStore.getOrders();
  if (localOrds && localOrds.length > 0) {
    cachedAdminOrders = localOrds;
  }
  cachedAdminStats = null;
  cachedAdminAnalytics = null;
});

// ==========================================
// SYNCHRONOUS 0ms GETTERS
// Allows every admin page to render immediately on mount with zero delay
// ==========================================

export function adminGetLocalProducts(): Product[] {
  if (cachedAdminProducts && cachedAdminProducts.length > 0) {
    return cachedAdminProducts;
  }
  const local = LocalStore.getProducts();
  cachedAdminProducts = local;
  cachedAdminProductsTime = Date.now();
  return local;
}

export function adminGetLocalCategories(): Category[] {
  if (cachedAdminCategories && cachedAdminCategories.length > 0) {
    return cachedAdminCategories;
  }
  const local = LocalStore.getCategories();
  cachedAdminCategories = local;
  cachedAdminCategoriesTime = Date.now();
  return local;
}

export function adminGetLocalOrders(): Order[] {
  if (cachedAdminOrders && cachedAdminOrders.length > 0) {
    return cachedAdminOrders;
  }
  const local = LocalStore.getOrders();
  cachedAdminOrders = local;
  cachedAdminOrdersTime = Date.now();
  return local;
}

export function adminGetLocalDashboardStats(): DashboardStats {
  if (cachedAdminStats && Date.now() - cachedAdminStatsTime < CACHE_TTL_MS) {
    return cachedAdminStats;
  }

  const products = adminGetLocalProducts();
  const orders = adminGetLocalOrders();

  const outOfStock = products.filter(p => p.stock <= 0 || !p.is_available).length;
  const available = products.filter(p => p.stock > 0 && p.is_available).length;

  const pending = orders.filter(o => o.status === 'Pending').length;
  const confirmed = orders.filter(o => o.status === 'Confirmed').length;
  const delivered = orders.filter(o => o.status === 'Delivered').length;

  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  const stats: DashboardStats = {
    totalProducts: products.length,
    availableProducts: available,
    outOfStockProducts: outOfStock,
    pendingOrders: pending,
    confirmedOrders: confirmed,
    deliveredOrders: delivered,
    totalRevenue,
  };

  cachedAdminStats = stats;
  cachedAdminStatsTime = Date.now();
  return stats;
}

export function adminGetLocalRecentOrders(limit = 5): Order[] {
  return adminGetLocalOrders().slice(0, limit);
}

export function adminGetLocalRevenueAnalytics(): RevenueAnalyticsData {
  if (cachedAdminAnalytics && Date.now() - cachedAdminAnalyticsTime < CACHE_TTL_MS) {
    return cachedAdminAnalytics;
  }

  const orders = adminGetLocalOrders();
  const validOrders = orders.filter(o => o.status !== 'Cancelled');
  const totalRevenue = validOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const totalOrders = validOrders.length;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const monthMap = new Map<string, { month: string; shortMonth: string; year: number; revenue: number; ordersCount: number; timestamp: number }>();

  // Ensure recent 6 months are always represented
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthMap.set(key, {
      month: monthNames[d.getMonth()],
      shortMonth: shortMonthNames[d.getMonth()],
      year: d.getFullYear(),
      revenue: 0,
      ordersCount: 0,
      timestamp: d.getTime(),
    });
  }

  validOrders.forEach(o => {
    const d = new Date(o.created_at);
    if (!isNaN(d.getTime())) {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const amount = Number(o.total_amount) || 0;
      const existing = monthMap.get(key);
      if (existing) {
        existing.revenue += amount;
        existing.ordersCount += 1;
      } else {
        monthMap.set(key, {
          month: monthNames[d.getMonth()],
          shortMonth: shortMonthNames[d.getMonth()],
          year: d.getFullYear(),
          revenue: amount,
          ordersCount: 1,
          timestamp: d.getTime(),
        });
      }
    }
  });

  const monthlyBreakdown = Array.from(monthMap.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(({ month, shortMonth, year, revenue, ordersCount }) => ({
      month,
      shortMonth,
      year,
      revenue,
      ordersCount,
    }));

  const result: RevenueAnalyticsData = {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    monthlyBreakdown,
  };

  cachedAdminAnalytics = result;
  cachedAdminAnalyticsTime = Date.now();
  return result;
}

// ==========================================
// ASYNC SERVICE METHODS (CACHED + REVALIDATED)
// ==========================================

export async function adminFetchDashboardStats(): Promise<DashboardStats> {
  const now = Date.now();
  if (cachedAdminStats && now - cachedAdminStatsTime < 30_000) {
    return cachedAdminStats;
  }

  // Parallel lightweight projection queries for near-instant dashboard sync
  if (isSupabaseConfigured) {
    try {
      const [prodsRes, ordersRes] = await Promise.all([
        supabase.from('products').select('stock, is_available'),
        supabase.from('orders').select('status, total_amount'),
      ]);

      if (!prodsRes.error && prodsRes.data && !ordersRes.error && ordersRes.data) {
        const products = prodsRes.data;
        const orders = ordersRes.data;

        const outOfStock = products.filter(p => Number(p.stock) <= 0 || !p.is_available).length;
        const available = products.filter(p => Number(p.stock) > 0 && p.is_available).length;

        const pending = orders.filter(o => o.status === 'Pending').length;
        const confirmed = orders.filter(o => o.status === 'Confirmed').length;
        const delivered = orders.filter(o => o.status === 'Delivered').length;

        const totalRevenue = orders
          .filter(o => o.status !== 'Cancelled')
          .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

        const stats: DashboardStats = {
          totalProducts: products.length,
          availableProducts: available,
          outOfStockProducts: outOfStock,
          pendingOrders: pending,
          confirmedOrders: confirmed,
          deliveredOrders: delivered,
          totalRevenue,
        };

        cachedAdminStats = stats;
        cachedAdminStatsTime = now;
        return stats;
      }
    } catch (err) {
      console.warn('Optimized dashboard stats fallback:', err);
    }
  }

  return adminGetLocalDashboardStats();
}

export async function adminFetchRevenueAnalytics(): Promise<RevenueAnalyticsData> {
  // Use instant calculation from cached orders whenever available
  if (cachedAdminOrders && cachedAdminOrders.length > 0 && Date.now() - cachedAdminOrdersTime < CACHE_TTL_MS) {
    return adminGetLocalRevenueAnalytics();
  }

  // Otherwise fetch orders and calculate
  await adminFetchOrders();
  return adminGetLocalRevenueAnalytics();
}

export async function adminFetchOrderDetails(orderId: string): Promise<Order | null> {
  // First check in-memory orders cache
  const cached = adminGetLocalOrders().find(o => o.id === orderId);
  if (cached && cached.items && cached.items.length > 0) {
    return cached;
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('id', orderId)
        .single();

      if (!error && data) {
        return data as Order;
      }
    } catch (err) {
      console.warn('Supabase fetch order details fallback:', err);
    }
  }

  return cached || null;
}

export async function adminFetchProducts(): Promise<Product[]> {
  const now = Date.now();
  // Return cached products if within TTL to avoid duplicate Supabase requests
  if (cachedAdminProducts && now - cachedAdminProductsTime < CACHE_TTL_MS) {
    return cachedAdminProducts;
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, variants:product_variants(*)')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && data) {
        const products = data.map((item: any) => {
          let sizeStock: Record<string, number> = {};
          if (Array.isArray(item.variants) && item.variants.length > 0) {
            item.variants.forEach((v: ProductVariant) => {
              sizeStock[v.size] = Number(v.stock) || 0;
            });
          }
          return ensureProductVariants({
            ...item,
            sizeStock: Object.keys(sizeStock).length > 0 ? sizeStock : item.sizeStock,
          });
        });

        cachedAdminProducts = products;
        cachedAdminProductsTime = now;
        LocalStore.saveProducts(products);
        return products;
      }
    } catch (err) {
      console.warn('Admin fetch products fallback:', err);
    }
  }

  return adminGetLocalProducts();
}

export async function adminCreateProduct(
  productData: Omit<Product, 'id' | 'created_at'>
): Promise<{ success: boolean; product?: Product; error?: string }> {
  const sizeStock = productData.sizeStock || {};
  const totalStock = Object.keys(sizeStock).length > 0
    ? Object.values(sizeStock).reduce((sum, n) => sum + (Number(n) || 0), 0)
    : Number(productData.stock) || 0;
  const isAvailable = totalStock > 0 && (productData.is_available !== false);

  const payload = {
    ...productData,
    stock: totalStock,
    is_available: isAvailable,
    sizes: Object.keys(sizeStock).length > 0 ? Object.keys(sizeStock) : productData.sizes,
  };

  // Optimistically store in local store immediately
  const localCreated = LocalStore.addProduct({
    ...payload,
    sizeStock,
  });

  // Update in-memory cache
  if (cachedAdminProducts) {
    cachedAdminProducts = [localCreated, ...cachedAdminProducts.filter(p => p.id !== localCreated.id)];
  }
  adminInvalidateProductsCache();

  if (isSupabaseConfigured) {
    try {
      const { data: createdProduct, error: prodError } = await supabase
        .from('products')
        .insert([{
          name: payload.name,
          slug: payload.slug,
          category: payload.category,
          price: payload.price,
          old_price: payload.old_price,
          image_url: payload.image_url,
          second_image_url: payload.second_image_url,
          third_image_url: payload.third_image_url,
          color: payload.color,
          sizes: payload.sizes,
          description: payload.description,
          stock: totalStock,
          is_available: isAvailable,
          featured: payload.featured,
          display_order: payload.display_order,
        }])
        .select()
        .single();

      if (!prodError && createdProduct) {
        if (Object.keys(sizeStock).length > 0) {
          const variantRows = Object.entries(sizeStock).map(([size, stk]) => ({
            product_id: createdProduct.id,
            size,
            stock: Number(stk) || 0,
          }));
          await supabase.from('product_variants').insert(variantRows);
        }

        const fullProduct = ensureProductVariants({
          ...createdProduct,
          sizeStock,
        });
        LocalStore.updateProduct(localCreated.id, fullProduct);
        if (cachedAdminProducts) {
          cachedAdminProducts = cachedAdminProducts.map(p => p.id === localCreated.id ? fullProduct : p);
        }
        return { success: true, product: fullProduct };
      }
    } catch (err: any) {
      console.warn('Supabase product insert error:', err);
    }
  }

  return { success: true, product: localCreated };
}

export async function adminUpdateProduct(
  id: string,
  updates: Partial<Product>
): Promise<{ success: boolean; product?: Product; error?: string }> {
  const sizeStock = updates.sizeStock;
  let totalStock = updates.stock;

  if (sizeStock && Object.keys(sizeStock).length > 0) {
    totalStock = Object.values(sizeStock).reduce((sum, n) => sum + (Number(n) || 0), 0);
  }

  const isAvailable = updates.is_available !== undefined
    ? updates.is_available
    : (totalStock !== undefined ? totalStock > 0 : true);

  // Optimistic update in LocalStore and in-memory cache
  const updatedLocal = LocalStore.updateProduct(id, {
    ...updates,
    sizeStock,
    stock: totalStock,
    is_available: (totalStock ?? 1) > 0 && isAvailable,
  });

  if (cachedAdminProducts && updatedLocal) {
    cachedAdminProducts = cachedAdminProducts.map(p => p.id === id ? updatedLocal! : p);
  }
  adminInvalidateProductsCache();

  if (isSupabaseConfigured) {
    try {
      const updatePayload: any = {
        updated_at: new Date().toISOString(),
      };
      if (updates.name !== undefined) updatePayload.name = updates.name;
      if (updates.slug !== undefined) updatePayload.slug = updates.slug;
      if (updates.category !== undefined) updatePayload.category = updates.category;
      if (updates.price !== undefined) updatePayload.price = updates.price;
      if (updates.old_price !== undefined) updatePayload.old_price = updates.old_price;
      if (updates.image_url !== undefined) updatePayload.image_url = updates.image_url;
      if (updates.second_image_url !== undefined) updatePayload.second_image_url = updates.second_image_url;
      if (updates.color !== undefined) updatePayload.color = updates.color;
      if (updates.description !== undefined) updatePayload.description = updates.description;
      if (updates.featured !== undefined) updatePayload.featured = updates.featured;
      if (updates.display_order !== undefined) updatePayload.display_order = updates.display_order;
      if (sizeStock) updatePayload.sizes = Object.keys(sizeStock);
      if (totalStock !== undefined) updatePayload.stock = totalStock;
      updatePayload.is_available = (totalStock ?? 1) > 0 && isAvailable;

      const { data, error } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        if (sizeStock) {
          for (const [size, stk] of Object.entries(sizeStock)) {
            await supabase
              .from('product_variants')
              .upsert(
                { product_id: id, size, stock: Number(stk) || 0, updated_at: new Date().toISOString() },
                { onConflict: 'product_id,size' }
              );
          }
        }

        const fullProduct = ensureProductVariants({
          ...data,
          sizeStock: sizeStock || updates.sizeStock,
        });
        LocalStore.updateProduct(id, fullProduct);
        if (cachedAdminProducts) {
          cachedAdminProducts = cachedAdminProducts.map(p => p.id === id ? fullProduct : p);
        }
        return { success: true, product: fullProduct };
      }
    } catch (err) {
      console.warn('Supabase product update fallback:', err);
    }
  }

  if (updatedLocal) {
    return { success: true, product: updatedLocal };
  }
  return { success: false, error: 'Product not found.' };
}

export async function adminUpdateSizeStock(
  productId: string,
  size: string,
  newStock: number
): Promise<{ success: boolean; product?: Product; error?: string }> {
  const currentProds = adminGetLocalProducts();
  const target = currentProds.find(p => p.id === productId);
  if (!target) return { success: false, error: 'Product not found' };

  const nextSizeStock = { ...(target.sizeStock || {}), [size]: Math.max(0, newStock) };
  return adminUpdateProduct(productId, { sizeStock: nextSizeStock });
}

export async function adminDeleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  // Optimistic local delete
  LocalStore.deleteProduct(id);
  if (cachedAdminProducts) {
    cachedAdminProducts = cachedAdminProducts.filter(p => p.id !== id);
  }
  adminInvalidateProductsCache();

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        return { success: true };
      }
    } catch (err) {
      console.warn('Supabase product delete fallback:', err);
    }
  }

  return { success: true };
}

export async function adminUploadProductImage(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  if (isSupabaseConfigured) {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `bubae_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `catalog/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        return { success: true, url: publicUrl };
      }
    } catch (err: any) {
      console.warn('Storage upload error:', err);
    }
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({ success: true, url: reader.result as string });
    };
    reader.onerror = () => {
      resolve({ success: false, error: 'Could not process image file.' });
    };
    reader.readAsDataURL(file);
  });
}

export async function adminFetchOrders(): Promise<Order[]> {
  const now = Date.now();
  if (cachedAdminOrders && now - cachedAdminOrdersTime < CACHE_TTL_MS) {
    return cachedAdminOrders;
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const ords = data as Order[];
        cachedAdminOrders = ords;
        cachedAdminOrdersTime = now;
        LocalStore.saveOrders(ords);
        return ords;
      }
    } catch (err) {
      console.warn('Supabase orders fetch fallback:', err);
    }
  }

  return adminGetLocalOrders();
}

export async function adminUpdateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  // Optimistically update local store and in-memory cache
  LocalStore.updateOrderStatus(orderId, status);
  if (cachedAdminOrders) {
    cachedAdminOrders = cachedAdminOrders.map(o =>
      o.id === orderId ? { ...o, status, updated_at: new Date().toISOString() } : o
    );
  }
  adminInvalidateOrdersCache();

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (!error) {
        return { success: true };
      }
    } catch (err) {
      console.warn('Supabase order status update fallback:', err);
    }
  }

  return { success: true };
}

export async function adminUpdateOrderDetails(
  orderId: string,
  updates: Partial<Order>,
  changedBy = 'Admin'
): Promise<{ success: boolean; order?: Order; error?: string }> {
  const orders = adminGetLocalOrders();
  const current = orders.find(o => o.id === orderId);
  if (!current) {
    return { success: false, error: 'Order not found' };
  }

  const fieldLabels: Record<string, string> = {
    customer_name: 'Customer Name',
    phone: 'Phone Number',
    address: 'Delivery Address',
    district: 'District',
    area: 'Area / Upazila',
    delivery_area: 'Delivery Zone',
    delivery_charge: 'Delivery Charge',
    total_amount: 'Total Amount',
    status: 'Order Status',
    notes: 'Notes',
  };

  const newHistoryEntries: OrderEditHistoryEntry[] = [];
  const now = new Date().toISOString();

  for (const [key, label] of Object.entries(fieldLabels)) {
    if (key in updates) {
      const prevVal = String((current as any)[key] ?? '');
      const newVal = String((updates as any)[key] ?? '');
      if (prevVal !== newVal) {
        newHistoryEntries.push({
          id: `edit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          field: key,
          field_label: label,
          previous_value: prevVal,
          new_value: newVal,
          changed_at: now,
          changed_by: changedBy,
        });
      }
    }
  }

  const mergedHistory: OrderEditHistoryEntry[] = [
    ...newHistoryEntries,
    ...(current.edit_history || []),
  ];

  const fullUpdates: Partial<Order> = {
    ...updates,
    edit_history: mergedHistory,
    updated_at: now,
  };

  // Optimistically update in LocalStore and in-memory cache
  const updatedOrder = LocalStore.updateOrder(orderId, fullUpdates);
  if (cachedAdminOrders && updatedOrder) {
    cachedAdminOrders = cachedAdminOrders.map(o => o.id === orderId ? updatedOrder! : o);
  }
  adminInvalidateOrdersCache();

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('orders')
        .update({
          customer_name: fullUpdates.customer_name ?? current.customer_name,
          phone: fullUpdates.phone ?? current.phone,
          address: fullUpdates.address ?? current.address,
          area: fullUpdates.area ?? current.area,
          district: fullUpdates.district ?? current.district,
          delivery_area: fullUpdates.delivery_area ?? current.delivery_area,
          delivery_charge: fullUpdates.delivery_charge ?? current.delivery_charge,
          total_amount: fullUpdates.total_amount ?? current.total_amount,
          status: fullUpdates.status ?? current.status,
          notes: fullUpdates.notes ?? current.notes,
          updated_at: now,
        })
        .eq('id', orderId);
    } catch (err) {
      console.warn('Supabase order update fallback:', err);
    }
  }

  if (updatedOrder) {
    return { success: true, order: updatedOrder };
  }
  return { success: false, error: 'Failed to update order locally' };
}
