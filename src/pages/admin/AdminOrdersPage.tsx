import React, { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from './AdminLayout';
import {
  adminGetLocalOrders,
  adminFetchOrders,
  adminUpdateOrderStatus,
  adminUpdateOrderDetails,
} from '../../services/admin';
import { Order, OrderStatus, OrderEditHistoryEntry } from '../../types';
import { subscribeToStore } from '../../services/localStore';
import {
  Search,
  ShoppingBag,
  Eye,
  Edit2,
  History,
  X,
  Phone,
  MessageCircle,
  Check,
  Copy,
  User,
  Package,
} from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  // Synchronous 0ms initial load from memory/cache
  const [orders, setOrders] = useState<Order[]>(() => adminGetLocalOrders());
  const [loading, setLoading] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');

  // Selected Order for Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalTab, setModalTab] = useState<'details' | 'edit' | 'history'>('details');
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Quick Copy Feedback State
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Edit Mode Form State
  const [editFormData, setEditFormData] = useState<Partial<Order>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const statuses: OrderStatus[] = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

  // Silent background revalidation: updates UI without disrupting admin interactions
  useEffect(() => {
    let isMounted = true;

    async function syncOrders() {
      try {
        const freshOrders = await adminFetchOrders();
        if (isMounted) {
          setOrders(freshOrders);
        }
      } catch (err) {
        console.warn('Quiet orders sync fallback:', err);
      }
    }

    syncOrders();
    const unsub = subscribeToStore(() => {
      if (isMounted) {
        setOrders(adminGetLocalOrders());
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // Synchronize URL parameters (e.g. /bubae-studio/orders?status=Pending or ?order=id)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const st = params.get('status') as OrderStatus | null;
      if (st && statuses.includes(st)) {
        setStatusFilter(st);
      }
      const ordParam = params.get('order');
      if (ordParam) {
        const found = orders.find(o => o.id === ordParam || o.order_number === ordParam);
        if (found) {
          openOrderModal(found, 'details');
        }
      }
    }
  }, [orders]);

  // Robust clipboard copy with fallback for all browser contexts
  const copyToClipboard = async (text: string, fieldKey: string) => {
    if (!text || !text.trim()) return;
    const valueToCopy = text.trim();

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(valueToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = valueToCopy;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedField(fieldKey);
      setTimeout(() => {
        setCopiedField(prev => (prev === fieldKey ? null : prev));
      }, 2000);
    } catch (err) {
      console.warn('Clipboard writeText failed, using fallback:', err);
      try {
        const textArea = document.createElement('textarea');
        textArea.value = valueToCopy;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedField(fieldKey);
        setTimeout(() => {
          setCopiedField(prev => (prev === fieldKey ? null : prev));
        }, 2000);
      } catch (fallbackErr) {
        console.error('Failed to copy text:', fallbackErr);
      }
    }
  };

  // Helper to combine full delivery address accurately without losing info
  const getFullAddress = (order: Order): string => {
    const parts: string[] = [];
    if (order.address?.trim()) {
      parts.push(order.address.trim());
    }
    if (order.area?.trim() && !parts.some(p => p.toLowerCase().includes(order.area!.toLowerCase()))) {
      parts.push(order.area.trim());
    }
    if (order.district?.trim() && !parts.some(p => p.toLowerCase().includes(order.district!.toLowerCase()))) {
      parts.push(order.district.trim());
    }
    return parts.join(', ');
  };

  const openOrderModal = (order: Order, tab: 'details' | 'edit' | 'history' = 'details') => {
    setSelectedOrder(order);
    setModalTab(tab);
    setEditSuccessMsg(null);
    setEditError(null);
    setEditFormData({
      customer_name: order.customer_name,
      phone: order.phone,
      address: order.address,
      district: order.district,
      area: order.area || '',
      delivery_charge: order.delivery_charge ?? 155,
      total_amount: order.total_amount,
      status: order.status,
      notes: order.notes || '',
    });
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    // 1. Optimistic UI update immediately
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => (prev ? { ...prev, status: newStatus } : null));
    }

    // 2. Background sync
    setUpdatingStatusId(orderId);
    await adminUpdateOrderStatus(orderId, newStatus);
    setUpdatingStatusId(null);
  };

  const handleSaveOrderEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    if (!editFormData.customer_name?.trim()) {
      setEditError('Customer name is required.');
      return;
    }
    if (!editFormData.phone?.trim()) {
      setEditError('Phone number is required.');
      return;
    }
    if (!editFormData.address?.trim()) {
      setEditError('Delivery address is required.');
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);

    // Optimistic local update
    const optimisticUpdatedOrder: Order = {
      ...selectedOrder,
      ...editFormData,
      updated_at: new Date().toISOString(),
    };

    setOrders(prev => prev.map(o => o.id === selectedOrder.id ? optimisticUpdatedOrder : o));
    setSelectedOrder(optimisticUpdatedOrder);
    setEditSuccessMsg('Order updated successfully!');

    // Background sync
    const res = await adminUpdateOrderDetails(selectedOrder.id, editFormData);
    setIsSavingEdit(false);

    if (res.success && res.order) {
      setSelectedOrder(res.order);
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? res.order! : o));
      setTimeout(() => {
        setEditSuccessMsg(null);
        setModalTab('details');
      }, 1000);
    } else {
      setEditError(res.error || 'Failed to update order.');
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Shipped':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  const formatWhatsAppPhone = (phone: string) => {
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.startsWith('880')) return digits;
    if (digits.startsWith('01')) return `880${digits.substring(1)}`;
    return digits;
  };

  const getCustomerWhatsAppUrl = (order: Order) => {
    const formattedPhone = formatWhatsAppPhone(order.phone);
    const message = `Hello ${order.customer_name}, this is Bubaé regarding your Cash on Delivery order #${order.order_number}. Current status: ${order.status}. Total amount: ৳${Number(order.total_amount).toLocaleString()}.`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  // Instant client-side memoized filter
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(order => {
      const matchesSearch =
        !q ||
        order.order_number.toLowerCase().includes(q) ||
        order.customer_name.toLowerCase().includes(q) ||
        order.phone.includes(q) ||
        (order.district && order.district.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  return (
    <AdminLayout activeTab="orders">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-[#BE185D] font-bold">
              Fulfillment & Deliveries
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
              Customer Orders (COD)
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Process incoming Cash on Delivery orders, update statuses, and directly contact customers.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs bg-[#FFF5F8] px-3.5 py-2.5 rounded-xl border border-[#F7D8E2]/60 text-[#BE185D] font-semibold">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{orders.length} total orders recorded</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by order #, customer name, phone, or district..."
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D] bg-stone-50/50"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 min-h-[38px] rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All ({orders.length})
            </button>
            {statuses.map(st => {
              const count = orders.filter(o => o.status === st).length;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-2 min-h-[38px] rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {st} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-500 space-y-2">
              <ShoppingBag className="w-8 h-8 text-stone-300 mx-auto" />
              <p>No orders found matching your filter criteria.</p>
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
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="bg-[#FFF9FA] text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-100 font-medium">
                  <tr>
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Customer Details</th>
                    <th className="py-3.5 px-4">Delivery District</th>
                    <th className="py-3.5 px-4">Total Amount</th>
                    <th className="py-3.5 px-4">Order Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-[#FFFDFE] transition-colors">
                      {/* Order Number */}
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openOrderModal(order, 'details')}
                            className="hover:text-[#BE185D] hover:underline text-left cursor-pointer"
                            title="View order details"
                          >
                            {order.order_number}
                          </button>
                          {order.order_number?.trim() && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(order.order_number.trim(), `table_ord_${order.id}`);
                              }}
                              className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                              title="Copy order number"
                              aria-label="Copy order number"
                            >
                              {copiedField === `table_ord_${order.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-stone-500 text-[11px] whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        <div className="text-[10px] text-stone-400">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-stone-900">{order.customer_name}</span>
                          {order.customer_name?.trim() && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(order.customer_name.trim(), `table_name_${order.id}`);
                              }}
                              className="p-1 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                              title="Copy customer name"
                              aria-label="Copy customer name"
                            >
                              {copiedField === `table_name_${order.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                        <div className="font-mono text-stone-600 text-[11px] flex items-center gap-1.5 mt-0.5">
                          {order.phone ? (
                            <a
                              href={`tel:${order.phone.replace(/[^0-9+]/g, '')}`}
                              className="hover:text-[#BE185D] hover:underline"
                              title="Tap to call"
                            >
                              {order.phone}
                            </a>
                          ) : (
                            <span className="text-stone-400 italic">No phone</span>
                          )}
                          {order.phone?.trim() && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(order.phone.trim(), `table_phone_${order.id}`);
                              }}
                              className="p-1 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                              title="Copy phone"
                              aria-label="Copy phone number"
                            >
                              {copiedField === `table_phone_${order.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                          <a
                            href={getCustomerWhatsAppUrl(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#25D366] hover:opacity-80 transition-opacity ml-0.5"
                            title="Chat with Customer on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* District & Area */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-stone-800 block">{order.district}</span>
                        {order.area && order.area !== order.district && (
                          <div className="text-[10px] text-stone-500 truncate max-w-[140px] mt-0.5">
                            {order.area}
                          </div>
                        )}
                        <span className="inline-block mt-0.5 text-[10px] font-bold text-[#BE185D] bg-[#FFF0F3] px-1.5 py-0.5 rounded border border-[#F9CAD5]/60">
                          {order.delivery_area || 'Delivery'}: ৳{order.delivery_charge !== undefined ? order.delivery_charge : 155}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">৳{Number(order.total_amount).toLocaleString()}</div>
                        <span className="text-[10px] text-emerald-700 font-medium">Cash on Delivery</span>
                      </td>

                      {/* Status Selector */}
                      <td className="py-3 px-4">
                        <select
                          value={order.status}
                          disabled={updatingStatusId === order.id}
                          onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer focus:outline-hidden min-h-[36px] ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {statuses.map(st => (
                            <option key={st} value={st} className="bg-white text-stone-900">
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Details and Edit Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openOrderModal(order, 'details')}
                            className="inline-flex items-center gap-1 px-3 py-2 min-h-[36px] rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                          <button
                            onClick={() => openOrderModal(order, 'edit')}
                            className="inline-flex items-center gap-1 px-3 py-2 min-h-[36px] rounded-xl bg-[#FFF0F3] hover:bg-[#FFE0E8] text-[#BE185D] font-medium text-xs transition-colors cursor-pointer"
                            title="Edit Order Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Details, Edit & History Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-stone-200 max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
              {/* Modal Top Header */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#BE185D] tracking-widest">
                    Cash on Delivery Order
                  </span>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <h2 className="text-xl font-serif font-bold text-stone-900">
                      {selectedOrder.order_number}
                    </h2>
                    {selectedOrder.order_number?.trim() && (
                      <button
                        onClick={() => copyToClipboard(selectedOrder.order_number.trim(), 'header_order_number')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 min-h-[34px] rounded-lg text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                          copiedField === 'header_order_number'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-white hover:bg-[#FFF0F3] text-stone-600 hover:text-[#BE185D] border-stone-200'
                        }`}
                        aria-label="Copy order number"
                        title="Copy order number"
                      >
                        {copiedField === 'header_order_number' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Copied ✓</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-stone-500" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getStatusBadge(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-stone-200 pb-2 text-xs font-semibold">
                <button
                  onClick={() => setModalTab('details')}
                  className={`px-3.5 py-2 min-h-[38px] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                    modalTab === 'details'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Overview</span>
                </button>

                <button
                  onClick={() => setModalTab('edit')}
                  className={`px-3.5 py-2 min-h-[38px] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                    modalTab === 'edit'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Order</span>
                </button>

                <button
                  onClick={() => setModalTab('history')}
                  className={`px-3.5 py-2 min-h-[38px] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                    modalTab === 'history'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>
                    Audit History
                    {selectedOrder.edit_history && selectedOrder.edit_history.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#BE185D] text-white text-[10px]">
                        {selectedOrder.edit_history.length}
                      </span>
                    )}
                  </span>
                </button>
              </div>

              {/* TAB 1: OVERVIEW / DETAILS */}
              {modalTab === 'details' && (
                <div className="space-y-6">
                  {/* Customer Details — Mobile-First with Individual Quick Copy Buttons */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider font-bold text-stone-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#BE185D]" />
                        <span>Customer Details</span>
                      </span>
                      <span className="text-[11px] text-stone-500 hidden sm:inline">
                        One-click copy for delivery slips and courier booking
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {/* 1. Customer Name */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-[#FFFDFE] hover:bg-[#FFF9FA] rounded-xl border border-[#F7D8E2]/80 transition-colors">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                            Customer Name
                          </span>
                          <div className="font-bold text-stone-900 text-sm">
                            {selectedOrder.customer_name?.trim() || (
                              <span className="text-stone-400 font-normal italic">Name not available</span>
                            )}
                          </div>
                        </div>

                        {selectedOrder.customer_name?.trim() && (
                          <button
                            onClick={() => copyToClipboard(selectedOrder.customer_name.trim(), 'customer_name')}
                            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs self-start sm:self-auto ${
                              copiedField === 'customer_name'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                : 'bg-white hover:bg-[#FFF5F8] text-stone-700 hover:text-[#BE185D] border border-stone-200 hover:border-[#F9CAD5]'
                            }`}
                            aria-label="Copy customer name"
                            title="Copy customer name"
                          >
                            {copiedField === 'customer_name' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">Copied ✓</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-stone-500" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* 2. Customer Phone Number (Click to Call + Call Button + Copy Button + WhatsApp) */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-[#FFFDFE] hover:bg-[#FFF9FA] rounded-xl border border-[#F7D8E2]/80 transition-colors">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                            Phone Number
                          </span>
                          {selectedOrder.phone?.trim() ? (
                            <a
                              href={`tel:${selectedOrder.phone.replace(/[^0-9+]/g, '')}`}
                              className="font-mono font-bold text-stone-900 text-sm hover:text-[#BE185D] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                              aria-label="Call customer directly"
                              title="Tap to call customer"
                            >
                              <span>{selectedOrder.phone}</span>
                              <Phone className="w-3.5 h-3.5 text-[#BE185D] sm:hidden" />
                            </a>
                          ) : (
                            <span className="text-stone-400 font-mono text-xs italic">Phone not available</span>
                          )}
                        </div>

                        {selectedOrder.phone?.trim() && (
                          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                            {/* Call Button */}
                            <a
                              href={`tel:${selectedOrder.phone.replace(/[^0-9+]/g, '')}`}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs"
                              aria-label="Call customer"
                              title="Open phone dialer"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Call</span>
                            </a>

                            {/* Copy Phone Button */}
                            <button
                              onClick={() => copyToClipboard(selectedOrder.phone.trim(), 'phone')}
                              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs ${
                                copiedField === 'phone'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                  : 'bg-white hover:bg-[#FFF5F8] text-stone-700 hover:text-[#BE185D] border border-stone-200 hover:border-[#F9CAD5]'
                              }`}
                              aria-label="Copy phone number"
                              title="Copy phone number"
                            >
                              {copiedField === 'phone' ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700 font-bold">Copied ✓</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-stone-500" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            {/* WhatsApp Button */}
                            <a
                              href={getCustomerWhatsAppUrl(selectedOrder)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] border border-[#25D366]/30 text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer"
                              aria-label="Chat on WhatsApp"
                              title="Chat with customer on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                              <span className="hidden xs:inline">WhatsApp</span>
                            </a>
                          </div>
                        )}
                      </div>

                      {/* 3. Order Number */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-[#FFFDFE] hover:bg-[#FFF9FA] rounded-xl border border-[#F7D8E2]/80 transition-colors">
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                            Order Number
                          </span>
                          <div className="font-mono font-bold text-stone-900 text-sm">
                            {selectedOrder.order_number || (
                              <span className="text-stone-400 font-normal italic">Order number not available</span>
                            )}
                          </div>
                        </div>

                        {selectedOrder.order_number?.trim() && (
                          <button
                            onClick={() => copyToClipboard(selectedOrder.order_number.trim(), 'order_number')}
                            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs self-start sm:self-auto ${
                              copiedField === 'order_number'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                : 'bg-white hover:bg-[#FFF5F8] text-stone-700 hover:text-[#BE185D] border border-stone-200 hover:border-[#F9CAD5]'
                            }`}
                            aria-label="Copy order number"
                            title="Copy order number"
                          >
                            {copiedField === 'order_number' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">Copied ✓</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-stone-500" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* 4. Billing / Delivery Address */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-3.5 bg-[#FFFDFE] hover:bg-[#FFF9FA] rounded-xl border border-[#F7D8E2]/80 transition-colors">
                        <div className="space-y-1.5 flex-1">
                          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                            Billing / Delivery Address
                          </span>
                          <div className="text-stone-800 text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">
                            {selectedOrder.address?.trim() || (
                              <span className="text-stone-400 italic">Address not provided</span>
                            )}
                          </div>
                          {(selectedOrder.district || selectedOrder.area) && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                              {selectedOrder.district && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FFF0F3] border border-[#F9CAD5]/60 text-stone-800 text-[11px] font-medium">
                                  District: <strong className="ml-1 text-stone-900">{selectedOrder.district}</strong>
                                </span>
                              )}
                              {selectedOrder.area && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-700 text-[11px] font-medium">
                                  Area: <strong className="ml-1 text-stone-900">{selectedOrder.area}</strong>
                                </span>
                              )}
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                                Delivery Zone: <strong className="ml-1">{selectedOrder.delivery_area || selectedOrder.area || 'Standard'}</strong>
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-700 text-[11px] font-medium">
                                Delivery Fee: <strong className="ml-1 text-[#BE185D]">৳{selectedOrder.delivery_charge !== undefined ? selectedOrder.delivery_charge : 155}</strong>
                              </span>
                            </div>
                          )}
                          <div className="text-[11px] text-stone-500 pt-0.5">
                            Payment Method: <span className="font-semibold text-stone-900">Cash on Delivery (COD)</span>
                          </div>
                        </div>

                        {getFullAddress(selectedOrder) && (
                          <button
                            onClick={() => copyToClipboard(getFullAddress(selectedOrder), 'address')}
                            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs self-start sm:self-auto shrink-0 ${
                              copiedField === 'address'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                : 'bg-white hover:bg-[#FFF5F8] text-stone-700 hover:text-[#BE185D] border border-stone-200 hover:border-[#F9CAD5]'
                            }`}
                            aria-label="Copy billing address"
                            title="Copy complete delivery address"
                          >
                            {copiedField === 'address' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">Copied ✓</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-stone-500" />
                                <span>Copy Address</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Special Delivery Notes */}
                  {selectedOrder.notes && (
                    <div className="p-3 bg-stone-50 rounded-xl text-xs border border-stone-200">
                      <span className="font-semibold text-stone-700 block mb-0.5">Customer Delivery Notes:</span>
                      <p className="text-stone-600 italic">"{selectedOrder.notes}"</p>
                    </div>
                  )}

                  {/* Ordered Items List */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-stone-900 uppercase tracking-wider block">
                      Ordered Items ({selectedOrder.items?.length || 1})
                    </span>
                    <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 overflow-hidden text-xs">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, idx) => (
                          <div key={idx} className="p-3.5 flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-stone-900">{item.product_name}</div>
                              <div className="text-[11px] text-stone-500 mt-0.5">
                                Size: <span className="font-semibold text-stone-800">{item.size}</span> · Color: <span className="font-semibold text-stone-800">{item.color}</span> · Qty: {item.quantity}
                              </div>
                            </div>
                            <div className="font-bold text-stone-900 text-sm">
                              ৳{(item.price * item.quantity).toLocaleString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3.5 text-stone-500 text-xs">Items listed in order summary</div>
                      )}
                    </div>
                  </div>

                  {/* Order Summary Breakdown */}
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
                    <div className="flex justify-between text-stone-600">
                      <span>Delivery Zone ({selectedOrder.delivery_area || selectedOrder.area || 'Standard'})</span>
                      <span className="font-medium text-stone-900">৳{selectedOrder.delivery_charge !== undefined ? selectedOrder.delivery_charge : 155}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>Payment Method</span>
                      <span className="font-medium text-stone-900">Cash on Delivery</span>
                    </div>
                    <div className="border-t border-stone-200 pt-2 flex justify-between font-bold text-sm text-stone-900">
                      <span>Total Payable</span>
                      <span className="text-[#BE185D]">৳{Number(selectedOrder.total_amount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EDIT ORDER */}
              {modalTab === 'edit' && (
                <form onSubmit={handleSaveOrderEdit} className="space-y-4 text-xs">
                  {editSuccessMsg && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-medium flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{editSuccessMsg}</span>
                    </div>
                  )}

                  {editError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                      {editError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="font-semibold text-stone-800 block">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.customer_name || ''}
                      onChange={e => setEditFormData({ ...editFormData, customer_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D] min-h-[44px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-stone-800 block">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={editFormData.phone || ''}
                        onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D] font-mono min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-stone-800 block">Order Status</label>
                      <select
                        value={editFormData.status || selectedOrder.status}
                        onChange={e => setEditFormData({ ...editFormData, status: e.target.value as OrderStatus })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D] bg-white min-h-[44px]"
                      >
                        {statuses.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-stone-800 block">Delivery Address *</label>
                    <textarea
                      rows={3}
                      required
                      value={editFormData.address || ''}
                      onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-stone-800 block">District / City</label>
                      <input
                        type="text"
                        value={editFormData.district || ''}
                        onChange={e => setEditFormData({ ...editFormData, district: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D] min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-stone-800 block">Area / Upazila</label>
                      <input
                        type="text"
                        value={editFormData.area || ''}
                        onChange={e => setEditFormData({ ...editFormData, area: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D] min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-stone-800 block">Customer / Internal Notes</label>
                    <textarea
                      rows={2}
                      value={editFormData.notes || ''}
                      onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
                      placeholder="Special instructions or delivery notes..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-[#BE185D]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setModalTab('details')}
                      className="px-4 py-2.5 min-h-[44px] border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEdit}
                      className="px-6 py-2.5 min-h-[44px] bg-stone-900 hover:bg-black text-[#FFF0F3] rounded-xl font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isSavingEdit ? 'Saving...' : 'Save Order Changes'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: AUDIT HISTORY */}
              {modalTab === 'history' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                      Audit Trail
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Recorded modifications made to this order
                    </p>
                  </div>

                  {selectedOrder.edit_history && selectedOrder.edit_history.length > 0 ? (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {selectedOrder.edit_history.map((h: OrderEditHistoryEntry, idx: number) => (
                        <div key={h.id || idx} className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-stone-900">{h.field_label || h.field}</span>
                            <span className="text-stone-500">
                              {new Date(h.changed_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-600 flex items-center gap-1.5 flex-wrap">
                            <span className="line-through text-stone-400 bg-white px-1.5 py-0.5 rounded border border-stone-200">
                              {h.previous_value || 'empty'}
                            </span>
                            <span>→</span>
                            <span className="text-stone-900 font-semibold bg-[#FFF0F3] px-1.5 py-0.5 rounded border border-[#F9CAD5]">
                              {h.new_value}
                            </span>
                            <span className="text-stone-400 text-[10px] ml-auto">by {h.changed_by || 'Admin'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-stone-400 bg-stone-50 rounded-xl border border-stone-100">
                      No edits have been made to this order yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
