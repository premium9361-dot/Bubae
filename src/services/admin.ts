import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product, Order, OrderStatus, ProductVariant, OrderEditHistoryEntry } from '../types';
import { LocalStore, ensureProductVariants } from './localStore';

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

export async function adminFetchDashboardStats(): Promise<DashboardStats> {
  // Parallel lightweight projection queries for near-instant dashboard loading
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

        return {
          totalProducts: products.length,
          availableProducts: available,
          outOfStockProducts: outOfStock,
          pendingOrders: pending,
          confirmedOrders: confirmed,
          deliveredOrders: delivered,
          totalRevenue,
        };
      }
    } catch (err) {
      console.warn('Optimized dashboard stats fallback:', err);
    }
  }

  // Fast local calculation
  const products = LocalStore.getProducts();
  const orders = LocalStore.getOrders();

  const outOfStock = products.filter(p => p.stock <= 0 || !p.is_available).length;
  const available = products.filter(p => p.stock > 0 && p.is_available).length;

  const pending = orders.filter(o => o.status === 'Pending').length;
  const confirmed = orders.filter(o => o.status === 'Confirmed').length;
  const delivered = orders.filter(o => o.status === 'Delivered').length;

  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  return {
    totalProducts: products.length,
    availableProducts: available,
    outOfStockProducts: outOfStock,
    pendingOrders: pending,
    confirmedOrders: confirmed,
    deliveredOrders: delivered,
    totalRevenue,
  };
}

export async function adminFetchRevenueAnalytics(): Promise<RevenueAnalyticsData> {
  const orders = await adminFetchOrders();
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

  // Ensure recent 6 months are represented
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

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    monthlyBreakdown,
  };
}

export async function adminFetchOrderDetails(orderId: string): Promise<Order | null> {
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

  const all = LocalStore.getOrders();
  return all.find(o => o.id === orderId) || null;
}

export async function adminUpdateOrder(
  orderId: string,
  updates: Partial<Order>,
  changedBy = 'Admin'
): Promise<{ success: boolean; order?: Order; error?: string }> {
  const orders = await adminFetchOrders();
  const current = orders.find(o => o.id === orderId);
  if (!current) {
    return { success: false, error: 'Order not found.' };
  }

  const fieldLabels: Record<string, string> = {
    customer_name: 'Customer Name',
    phone: 'Phone Number',
    address: 'Order Address',
    district: 'District / City',
    area: 'Area / Upazila',
    order_number: 'Order Number',
  };

  const newHistoryEntries: OrderEditHistoryEntry[] = [];
  const now = new Date().toISOString();

  Object.entries(updates).forEach(([key, val]) => {
    if (fieldLabels[key] && String((current as any)[key] ?? '') !== String(val ?? '')) {
      newHistoryEntries.push({
        id: 'hist_' + Math.random().toString(36).substring(2, 9),
        field: key,
        field_label: fieldLabels[key],
        previous_value: String((current as any)[key] ?? ''),
        new_value: String(val ?? ''),
        changed_at: now,
        changed_by: changedBy,
      });
    }
  });

  const existingHistory = current.edit_history || [];
  const updatedHistory = [...newHistoryEntries, ...existingHistory];

  const fullUpdates: Partial<Order> = {
    ...updates,
    edit_history: updatedHistory,
    updated_at: now,
  };

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
          order_number: fullUpdates.order_number ?? current.order_number,
          notes: fullUpdates.notes !== undefined ? fullUpdates.notes : current.notes,
          updated_at: now,
        })
        .eq('id', orderId);
    } catch (err) {
      console.warn('Supabase update order note:', err);
    }
  }

  const updatedOrder = LocalStore.updateOrder(orderId, fullUpdates);
  return { success: true, order: updatedOrder || ({ ...current, ...fullUpdates } as Order) };
}

export async function adminFetchProducts(): Promise<Product[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, variants:product_variants(*)')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((item: any) => {
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
      }
    } catch (err) {
      console.warn('Admin fetch products fallback:', err);
    }
  }

  return LocalStore.getProducts();
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

  if (isSupabaseConfigured) {
    try {
      // 1. Insert product record
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
        // 2. Insert variants
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
        LocalStore.addProduct(fullProduct);
        return { success: true, product: fullProduct };
      }
    } catch (err: any) {
      console.warn('Supabase product insert error:', err);
    }
  }

  // Local fallback
  const created = LocalStore.addProduct({
    ...payload,
    sizeStock,
  });
  return { success: true, product: created };
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
        // Upsert variants in product_variants table
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
        return { success: true, product: fullProduct };
      }
    } catch (err) {
      console.warn('Supabase product update fallback:', err);
    }
  }

  const updated = LocalStore.updateProduct(id, {
    ...updates,
    sizeStock,
    stock: totalStock,
    is_available: (totalStock ?? 1) > 0 && isAvailable,
  });

  if (updated) {
    return { success: true, product: updated };
  }
  return { success: false, error: 'Product not found.' };
}

export async function adminUpdateSizeStock(
  productId: string,
  size: string,
  newStock: number
): Promise<{ success: boolean; product?: Product; error?: string }> {
  const products = await adminFetchProducts();
  const target = products.find(p => p.id === productId);
  if (!target) return { success: false, error: 'Product not found' };

  const nextSizeStock = { ...(target.sizeStock || {}), [size]: Math.max(0, newStock) };
  return adminUpdateProduct(productId, { sizeStock: nextSizeStock });
}

export async function adminDeleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) {
        LocalStore.deleteProduct(id);
        return { success: true };
      }
    } catch (err) {
      console.warn('Supabase product delete fallback:', err);
    }
  }

  LocalStore.deleteProduct(id);
  return { success: true };
}

export async function adminUploadProductImage(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  // If Supabase Storage is configured, attempt bucket upload
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

  // Local fallback: generate Base64 data URL
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
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        LocalStore.saveOrders(data as Order[]);
        return data as Order[];
      }
    } catch (err) {
      console.warn('Supabase orders fetch fallback:', err);
    }
  }

  return LocalStore.getOrders();
}

export async function adminUpdateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (!error) {
        LocalStore.updateOrderStatus(orderId, status);
        return { success: true };
      }
    } catch (err) {
      console.warn('Supabase order status update fallback:', err);
    }
  }

  LocalStore.updateOrderStatus(orderId, status);
  return { success: true };
}
