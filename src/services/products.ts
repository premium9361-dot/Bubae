import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Category, Product, ProductVariant } from '../types';
import { LocalStore, ensureProductVariants, subscribeToStore } from './localStore';

// In-memory cache for fast page transitions
let cachedProducts: Product[] | null = null;
let cachedProductsTimestamp = 0;
let cachedCategories: Category[] | null = null;
let cachedCategoriesTimestamp = 0;
const CACHE_TTL_MS = 120_000; // 2 minutes

export function invalidateProductsCache() {
  cachedProducts = null;
  cachedProductsTimestamp = 0;
  cachedCategories = null;
  cachedCategoriesTimestamp = 0;
}

// Automatically clear in-memory cache whenever store state updates
subscribeToStore(() => {
  invalidateProductsCache();
});

// Synchronous product lookup for instant product detail page mounting
export function getCachedProductBySlug(slug: string, forCustomer = true): Product | null {
  if (cachedProducts && cachedProducts.length > 0) {
    const match = cachedProducts.find(p => p.slug === slug);
    if (match) {
      if (forCustomer && (!match.is_available || match.stock <= 0)) {
        return null;
      }
      return match;
    }
  }

  // Check LocalStore
  const localList = LocalStore.getProducts();
  const found = localList.find(p => p.slug === slug);
  if (found) {
    const verified = ensureProductVariants(found);
    if (forCustomer && (!verified.is_available || verified.stock <= 0)) {
      return null;
    }
    return verified;
  }

  return null;
}

// Synchronous fast getters for zero-delay storefront and shop page rendering
export function getLocalCustomerProducts(): Product[] {
  const list = cachedProducts || LocalStore.getProducts();
  return list
    .map(p => ensureProductVariants(p))
    .filter(p => p.is_available && p.stock > 0);
}

export function getLocalCategories(): Category[] {
  return cachedCategories || LocalStore.getCategories();
}

export async function fetchCategories(): Promise<Category[]> {
  const now = Date.now();
  if (cachedCategories && now - cachedCategoriesTimestamp < CACHE_TTL_MS) {
    return cachedCategories;
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        LocalStore.saveCategories(data);
        cachedCategories = data;
        cachedCategoriesTimestamp = now;
        return data;
      }
    } catch (err) {
      console.warn('Supabase categories fetch fallback:', err);
    }
  }

  const local = LocalStore.getCategories();
  cachedCategories = local;
  cachedCategoriesTimestamp = now;
  return local;
}

export async function fetchProducts(options?: {
  category?: string;
  forCustomer?: boolean;
}): Promise<Product[]> {
  const forCustomer = options?.forCustomer !== false; // default true for customer safety
  const now = Date.now();

  // If fetching all products for customer, check cache
  if (
    (!options?.category || options.category === 'all') &&
    forCustomer &&
    cachedProducts &&
    now - cachedProductsTimestamp < CACHE_TTL_MS
  ) {
    return cachedProducts;
  }

  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('products').select('*, variants:product_variants(*)');

      if (options?.category && options.category !== 'all') {
        query = query.eq('category', options.category);
      }

      query = query.order('display_order', { ascending: true }).order('created_at', { ascending: false });

      const { data, error } = await query;

      if (!error && data) {
        let products: Product[] = data.map((item: any) => {
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

        // Customer constraint: ONLY is_available = true AND at least one size variant has stock > 0
        if (forCustomer) {
          products = products.filter(p => p.is_available && p.stock > 0);
        }

        // Cache all products when loaded
        if (!options?.category || options.category === 'all') {
          if (forCustomer) {
            cachedProducts = products;
            cachedProductsTimestamp = now;
          }
        }

        return products;
      }
    } catch (err) {
      console.warn('Supabase products fetch fallback:', err);
    }
  }

  // Local fallback
  let localProducts = LocalStore.getProducts();

  // If customer view, strictly enforce is_available = true AND stock > 0
  if (forCustomer) {
    localProducts = localProducts.filter(p => p.is_available && p.stock > 0);
  }

  if (options?.category && options.category !== 'all') {
    localProducts = localProducts.filter(p => p.category === options.category);
  }

  const sorted = localProducts.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  if ((!options?.category || options.category === 'all') && forCustomer) {
    cachedProducts = sorted;
    cachedProductsTimestamp = now;
  }
  return sorted;
}

export async function fetchProductBySlug(slug: string, forCustomer = true): Promise<Product | null> {
  // Check fast cache first
  const fastMatch = getCachedProductBySlug(slug, forCustomer);
  if (fastMatch) {
    return fastMatch;
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, variants:product_variants(*)')
        .eq('slug', slug)
        .single();

      if (!error && data) {
        let sizeStock: Record<string, number> = {};
        if (Array.isArray(data.variants) && data.variants.length > 0) {
          data.variants.forEach((v: ProductVariant) => {
            sizeStock[v.size] = Number(v.stock) || 0;
          });
        }
        const product = ensureProductVariants({
          ...data,
          sizeStock: Object.keys(sizeStock).length > 0 ? sizeStock : data.sizeStock,
        });

        if (forCustomer && (!product.is_available || product.stock <= 0)) {
          return null;
        }

        return product;
      }
    } catch (err) {
      console.warn('Supabase product slug fetch fallback:', err);
    }
  }

  const all = LocalStore.getProducts();
  const found = all.find(p => p.slug === slug);
  if (!found) return null;
  const verified = ensureProductVariants(found);
  if (forCustomer && (!verified.is_available || verified.stock <= 0)) {
    return null;
  }
  return verified;
}
