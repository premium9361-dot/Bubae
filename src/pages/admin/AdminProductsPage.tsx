import React, { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from './AdminLayout';
import {
  adminGetLocalProducts,
  adminGetLocalCategories,
  adminFetchProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminUploadProductImage,
} from '../../services/admin';
import { fetchCategories } from '../../services/products';
import { Product, Category } from '../../types';
import { subscribeToStore } from '../../services/localStore';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Upload,
  Check,
  AlertCircle,
  ExternalLink,
  Package,
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';

export const AdminProductsPage: React.FC = () => {
  const { navigate } = useNavigation();

  // Instantaneous initial mount with 0ms synchronous local/cached state
  const [products, setProducts] = useState<Product[]>(() => adminGetLocalProducts());
  const [categories, setCategories] = useState<Category[]>(() => adminGetLocalCategories());
  const [loading, setLoading] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'out-of-stock'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const f = params.get('filter');
      if (f === 'in-stock' || f === 'out-of-stock') {
        setStockFilter(f);
      }
    }
  }, []);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'pants',
    color: 'Black',
    price: 1590,
    old_price: 1990 as number | undefined,
    sizes: ['M', 'L', 'XL'] as string[],
    sizeStock: { M: 10, L: 15, XL: 20 } as Record<string, number>,
    description: '',
    image_url: '',
    second_image_url: '',
    is_available: true,
    featured: false,
    display_order: 1,
  });

  // Background non-blocking sync: NEVER shows "Loading catalog..." if products already exist
  useEffect(() => {
    let isMounted = true;

    async function syncCatalog() {
      try {
        const [prods, cats] = await Promise.all([
          adminFetchProducts(),
          fetchCategories(),
        ]);
        if (isMounted) {
          setProducts(prods);
          setCategories(cats);
        }
      } catch (err) {
        console.warn('Silent catalog sync error:', err);
      }
    }

    syncCatalog();
    const unsub = subscribeToStore(() => {
      if (isMounted) {
        setProducts(adminGetLocalProducts());
        setCategories(adminGetLocalCategories());
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      slug: '',
      category: categories[0]?.slug || 'pants',
      color: 'Black',
      price: 1590,
      old_price: 1990,
      sizes: ['M', 'L', 'XL'],
      sizeStock: { M: 10, L: 15, XL: 20 },
      description: '',
      image_url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1000&q=85',
      second_image_url: '',
      is_available: true,
      featured: false,
      display_order: products.length + 1,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    const initialSizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['M', 'L'];
    const initialSizeStock: Record<string, number> = { ...(product.sizeStock || {}) };
    initialSizes.forEach(s => {
      if (initialSizeStock[s] === undefined) {
        initialSizeStock[s] = Math.max(0, Math.floor(product.stock / initialSizes.length));
      }
    });

    setFormData({
      name: product.name,
      slug: product.slug,
      category: product.category,
      color: product.color || 'Black',
      price: product.price,
      old_price: product.old_price || undefined,
      sizes: initialSizes,
      sizeStock: initialSizeStock,
      description: product.description || '',
      image_url: product.image_url,
      second_image_url: product.second_image_url || '',
      is_available: product.is_available,
      featured: product.featured || false,
      display_order: product.display_order ?? 1,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    setFormData(prev => ({
      ...prev,
      name,
      slug: editingProduct ? prev.slug : generatedSlug,
    }));
  };

  const toggleSize = (size: string) => {
    setFormData(prev => {
      const exists = prev.sizes.includes(size);
      if (exists) {
        const nextSizes = prev.sizes.filter(s => s !== size);
        const nextStock = { ...prev.sizeStock };
        delete nextStock[size];
        return {
          ...prev,
          sizes: nextSizes,
          sizeStock: nextStock,
        };
      } else {
        const nextSizes = [...prev.sizes, size];
        return {
          ...prev,
          sizes: nextSizes,
          sizeStock: {
            ...prev.sizeStock,
            [size]: prev.sizeStock[size] !== undefined ? prev.sizeStock[size] : 10,
          },
        };
      }
    });
  };

  const handleSizeStockChange = (size: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      sizeStock: {
        ...prev.sizeStock,
        [size]: isNaN(value) ? 0 : Math.max(0, value),
      },
    }));
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const result = await adminUploadProductImage(file);
    setUploadingImage(false);

    if (result.success && result.url) {
      setFormData(prev => ({ ...prev, image_url: result.url! }));
    } else {
      setFormError(result.error || 'Failed to process image');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Product title is required.');
      return;
    }
    if (!formData.image_url.trim()) {
      setFormError('Product primary image URL is required.');
      return;
    }
    if (formData.sizes.length === 0) {
      setFormError('Please select at least one available size.');
      return;
    }

    const totalStock = Object.values(formData.sizeStock).reduce((sum, n) => sum + (Number(n) || 0), 0);
    const isAvailable = totalStock > 0 && formData.is_available !== false;

    setIsSubmitting(true);
    setFormError(null);

    if (editingProduct) {
      // Optimistic update in UI
      const updatedProductObj: Product = {
        ...editingProduct,
        name: formData.name,
        slug: formData.slug,
        category: formData.category,
        price: Number(formData.price),
        old_price: Number(formData.old_price) || undefined,
        stock: totalStock,
        color: formData.color,
        sizes: formData.sizes,
        sizeStock: formData.sizeStock,
        description: formData.description,
        image_url: formData.image_url,
        second_image_url: formData.second_image_url || undefined,
        is_available: isAvailable,
        featured: formData.featured,
        display_order: Number(formData.display_order),
      };

      setProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedProductObj : p));
      setIsModalOpen(false);
      setIsSubmitting(false);
      setActionSuccess(`Updated "${formData.name}" successfully!`);
      setTimeout(() => setActionSuccess(null), 3000);

      // Background persist
      await adminUpdateProduct(editingProduct.id, updatedProductObj);
    } else {
      const newProductPayload = {
        name: formData.name,
        slug: formData.slug || `bubae-${Date.now()}`,
        category: formData.category,
        price: Number(formData.price),
        old_price: Number(formData.old_price) || undefined,
        stock: totalStock,
        color: formData.color,
        sizes: formData.sizes,
        sizeStock: formData.sizeStock,
        description: formData.description,
        image_url: formData.image_url,
        second_image_url: formData.second_image_url || undefined,
        is_available: isAvailable,
        featured: formData.featured,
        display_order: Number(formData.display_order),
      };

      const res = await adminCreateProduct(newProductPayload);
      setIsSubmitting(false);

      if (res.success && res.product) {
        setProducts(prev => [res.product!, ...prev.filter(p => p.id !== res.product!.id)]);
        setIsModalOpen(false);
        setActionSuccess(`Created "${formData.name}" successfully!`);
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        setFormError(res.error || 'Failed to create product.');
      }
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    // Optimistic deletion
    setProducts(prev => prev.filter(p => p.id !== id));
    setActionSuccess(`Removed "${name}" from catalog`);
    setTimeout(() => setActionSuccess(null), 2500);
    await adminDeleteProduct(id);
  };

  const handleToggleAvailability = async (product: Product) => {
    const newAvailable = !product.is_available;
    // Optimistic UI update
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_available: newAvailable } : p));
    await adminUpdateProduct(product.id, { is_available: newAvailable });
  };

  // Instant client-side memoized filtering
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.color && p.color.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'all' || p.category === selectedCategory;

      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'in-stock' && p.stock > 0 && p.is_available) ||
        (stockFilter === 'out-of-stock' && (p.stock <= 0 || !p.is_available));

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredProducts, currentPage]);

  return (
    <AdminLayout activeTab="products">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-[#BE185D] font-bold">
              Inventory & Catalog
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
              Manage Products
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Add new apparel, manage size inventory, adjust prices, and toggle public storefront visibility.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] bg-stone-900 hover:bg-black text-[#FFF0F3] text-xs font-semibold rounded-xl transition-all cursor-pointer self-stretch sm:self-auto shadow-sm active:scale-98"
          >
            <Plus className="w-4 h-4 text-[#F9CAD5]" />
            <span>Add New Product</span>
          </button>
        </div>

        {/* Action Success Banner */}
        {actionSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search products by title, category, or color..."
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D] bg-stone-50/50"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 text-xs rounded-xl border border-stone-200 bg-white text-stone-700 focus:outline-hidden focus:border-[#BE185D] min-h-[40px]"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Stock status filter */}
            <select
              value={stockFilter}
              onChange={e => {
                setStockFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 text-xs rounded-xl border border-stone-200 bg-white text-stone-700 focus:outline-hidden focus:border-[#BE185D] min-h-[40px]"
            >
              <option value="all">All Stock Status ({products.length})</option>
              <option value="in-stock">In Stock ({products.filter(p => p.stock > 0 && p.is_available).length})</option>
              <option value="out-of-stock">Out of Stock ({products.filter(p => p.stock <= 0 || !p.is_available).length})</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs overflow-hidden">
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-500 space-y-2">
              <Package className="w-8 h-8 text-stone-300 mx-auto" />
              <p>No products found matching your filter criteria.</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#BE185D] font-semibold hover:underline cursor-pointer"
                >
                  Clear search query
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-[#FFF9FA] text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-100 font-medium">
                  <tr>
                    <th className="py-3.5 px-4">Item</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Inventory / Stock</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {paginatedProducts.map(product => {
                    const isOutOfStock = product.stock <= 0 || !product.is_available;
                    return (
                      <tr key={product.id} className="hover:bg-[#FFFDFE] transition-colors">
                        {/* Thumbnail & Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-12 h-14 object-cover rounded-md bg-stone-100 border border-stone-200 shrink-0"
                            />
                            <div>
                              <div className="font-semibold text-stone-900">{product.name}</div>
                              <div className="text-[10px] text-stone-500 font-mono">/{product.slug}</div>
                              {product.featured && (
                                <span className="inline-block mt-0.5 text-[9px] uppercase tracking-wider text-[#BE185D] font-bold">
                                  ★ Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="capitalize bg-stone-100 px-2 py-0.5 rounded text-[11px] text-stone-700">
                            {product.category.replace('-', ' ')}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900">৳{product.price.toLocaleString()}</div>
                          {product.old_price && (
                            <div className="text-[10px] text-stone-400 line-through">
                              ৳{product.old_price.toLocaleString()}
                            </div>
                          )}
                        </td>

                        {/* Stock Management with Breakdown */}
                        <td className="py-3 px-4">
                          <div className="space-y-1.5">
                            <span
                              className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-full inline-block border ${
                                product.stock > 5
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : product.stock > 0
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {product.stock} units total
                            </span>

                            <div className="flex flex-wrap gap-1 max-w-[240px]">
                              {product.sizes?.map(s => {
                                const sStock = product.sizeStock?.[s] !== undefined ? product.sizeStock[s] : 0;
                                return (
                                  <span
                                    key={s}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                                      sStock > 0
                                        ? 'bg-stone-50 text-stone-800 border-stone-200'
                                        : 'bg-rose-50/70 text-rose-500 border-rose-200 line-through opacity-75'
                                    }`}
                                    title={`Size ${s}: ${sStock} units in inventory`}
                                  >
                                    {s}: {sStock}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </td>

                        {/* Availability Toggle */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleAvailability(product)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-full text-[11px] font-semibold transition-colors cursor-pointer border active:scale-95 ${
                              !isOutOfStock
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${!isOutOfStock ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                            <span>{!isOutOfStock ? 'Available' : 'Hidden / Sold Out'}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/product/${product.slug}`)}
                              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="View in Store"
                              aria-label="View product in storefront"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(product)}
                              className="p-2 text-stone-500 hover:text-[#BE185D] hover:bg-[#FFF0F3] rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Edit Product"
                              aria-label="Edit product details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Delete Product"
                              aria-label="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} items
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 disabled:opacity-40 hover:bg-stone-50 cursor-pointer"
                >
                  Previous
                </button>
                <span className="px-2 font-mono">{currentPage} / {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 disabled:opacity-40 hover:bg-stone-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create / Edit Product Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-stone-200 max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#BE185D] tracking-widest">
                    {editingProduct ? 'Edit Catalog Item' : 'New Product Addition'}
                  </span>
                  <h2 className="text-xl font-serif font-bold text-stone-900">
                    {editingProduct ? 'Update Product Details' : 'Add New Apparel Item'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProduct} className="space-y-5 text-xs">
                {/* 1. Product Name & Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="font-semibold text-stone-800 block">
                      1. Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => handleNameChange(e.target.value)}
                      placeholder="e.g. Black Cargo Pants"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D] text-sm font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-stone-800 block text-stone-600">
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={e => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="black-cargo-pants"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 font-mono text-[11px] focus:outline-hidden focus:border-[#BE185D]"
                    />
                  </div>
                </div>

                {/* 2. Category & 3. Color */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-stone-800 block">
                      2. Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D] bg-white capitalize font-medium min-h-[44px]"
                    >
                      {categories.map(c => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-stone-800 block">
                      3. Color *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.color}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                      placeholder="e.g. Black, Blush Pink, Milk White"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D] font-medium min-h-[44px]"
                    />
                  </div>
                </div>

                {/* 4. Price & 5. Original Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-stone-800 block">
                      4. Price (BDT ৳) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-semibold">৳</span>
                      <input
                        type="number"
                        required
                        min={99}
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                        placeholder="1590"
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D] font-semibold min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-stone-800 block">
                      5. Original Price (৳)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-semibold">৳</span>
                      <input
                        type="number"
                        min={0}
                        value={formData.old_price || ''}
                        onChange={e => setFormData({ ...formData, old_price: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="1990 (Optional crossed out)"
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D] min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Stock Section (Size-wise stock management) */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-stone-900 uppercase tracking-wider text-xs">
                        6. Stock — Available Sizes *
                      </label>
                      <span className="text-[11px] text-stone-500 font-medium">
                        Select any combination
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {['S', 'M', 'L', 'XL', 'XXL'].map(size => {
                        const selected = formData.sizes.includes(size);
                        return (
                          <button
                            type="button"
                            key={size}
                            onClick={() => toggleSize(size)}
                            className={`min-w-12 h-11 px-3.5 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                              selected
                                ? 'bg-stone-900 text-white border-stone-900 shadow-xs ring-2 ring-stone-900/10'
                                : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400 hover:bg-stone-100/50'
                            }`}
                          >
                            [ {size} ]
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Size Inventory Cards */}
                  {formData.sizes.length > 0 ? (
                    <div className="space-y-3 pt-3 border-t border-stone-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                          Size Inventory
                        </span>
                        <span className="text-[11px] font-mono font-bold text-[#BE185D] bg-[#FFF0F4] px-2.5 py-0.5 rounded-full border border-[#F9CAD5]">
                          Total: {Object.values(formData.sizeStock).reduce((sum, n) => sum + (Number(n) || 0), 0)} units
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {formData.sizes.map(size => {
                          const stockUnits = formData.sizeStock[size] !== undefined ? formData.sizeStock[size] : 10;
                          return (
                            <div
                              key={size}
                              className="p-3 bg-white rounded-xl border border-stone-300 shadow-2xs space-y-2 relative"
                            >
                              <div className="flex items-center justify-between border-b border-stone-100 pb-1">
                                <span className="font-mono font-bold text-stone-900 text-sm">{size}</span>
                                <button
                                  type="button"
                                  onClick={() => toggleSize(size)}
                                  className="text-stone-400 hover:text-rose-600 transition-colors p-1 rounded-md cursor-pointer"
                                  title={`Remove size ${size}`}
                                  aria-label={`Remove size ${size}`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div>
                                <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">
                                  Stock Units
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  required
                                  value={stockUnits}
                                  onChange={e => handleSizeStockChange(size, Number(e.target.value))}
                                  placeholder="0"
                                  className="w-full px-2.5 py-2 rounded-lg border border-stone-200 bg-stone-50 font-mono text-xs font-bold text-stone-900 focus:outline-hidden focus:border-[#BE185D] focus:bg-white"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                      Please select at least one size above (e.g. [ M ], [ L ]) to enter inventory stock.
                    </div>
                  )}
                </div>

                {/* Primary Image URL & File Upload */}
                <div className="space-y-2">
                  <label className="font-semibold text-stone-800 flex items-center justify-between">
                    <span>Primary Image URL *</span>
                    <label className="text-[11px] text-[#BE185D] hover:underline cursor-pointer flex items-center gap-1 py-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload Image File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.image_url}
                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D] min-h-[44px]"
                  />
                  {formData.image_url && (
                    <div className="flex items-center gap-3 pt-1">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-10 h-12 object-cover rounded-md border border-stone-200"
                      />
                      <span className="text-[11px] text-stone-500 truncate max-w-sm">
                        Preview: {formData.image_url}
                      </span>
                    </div>
                  )}
                </div>

                {/* Secondary Image URL (Optional) */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-800">Hover / Secondary Image URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.second_image_url}
                    onChange={e => setFormData({ ...formData, second_image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D] min-h-[44px]"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-stone-800">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Fabric details, fit description, styling suggestions..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D]"
                  />
                </div>

                {/* Toggles: Featured & Available */}
                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={formData.is_available}
                      onChange={e => setFormData({ ...formData, is_available: e.target.checked })}
                      className="w-4 h-4 rounded text-[#BE185D] focus:ring-[#BE185D]"
                    />
                    <span className="font-medium text-stone-800">Visible in Public Store</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={e => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 rounded text-[#BE185D] focus:ring-[#BE185D]"
                    />
                    <span className="font-medium text-stone-800">Feature on Homepage</span>
                  </label>
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 min-h-[44px] border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 min-h-[44px] bg-stone-900 hover:bg-black text-[#FFF0F3] rounded-xl font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Publish Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
