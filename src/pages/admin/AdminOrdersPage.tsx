import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { adminFetchOrders, adminUpdateOrderStatus } from '../../services/admin';
import { Order, OrderStatus } from '../../types';
import { subscribeToStore } from '../../services/localStore';
import {
  Search,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  MessageCircle,
  Eye,
  X,
  Phone,
  MapPin,
  Calendar,
  FileText,
} from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');

  // Selected Order for Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const statuses: OrderStatus[] = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

  const loadOrders = async () => {
    setLoading(true);
    const ords = await adminFetchOrders();
    setOrders(ords);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
    const unsub = subscribeToStore(() => {
      loadOrders();
    });
    return unsub;
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatusId(orderId);
    await adminUpdateOrderStatus(orderId, newStatus);
    await loadOrders();
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => (prev ? { ...prev, status: newStatus } : null));
    }
    setUpdatingStatusId(null);
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

  // Format Bangladesh phone to international format for WhatsApp
  const formatWhatsAppPhone = (phone: string) => {
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.startsWith('880')) {
      return digits;
    }
    if (digits.startsWith('01')) {
      return `880${digits.substring(1)}`;
    }
    return digits;
  };

  // Generate direct customer WhatsApp link
  const getCustomerWhatsAppUrl = (order: Order) => {
    const formattedPhone = formatWhatsAppPhone(order.phone);
    const message = `Hello ${order.customer_name}, this is Bubaé regarding your Cash on Delivery order #${order.order_number}. Current status: ${order.status}. Total amount: ৳${Number(order.total_amount).toLocaleString()}.`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  // Filtered Orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone.includes(searchQuery) ||
      (order.district && order.district.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout activeTab="orders">
      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
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

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs bg-[#FFF5F8] px-3.5 py-2 rounded-lg border border-[#F7D8E2]/60 text-[#BE185D] font-medium">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{orders.length} total orders recorded</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by order #, customer, or phone..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-200 focus:outline-hidden focus:border-[#BE185D] bg-stone-50/50"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-stone-900 text-white'
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-stone-900 text-white'
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
          {loading ? (
            <div className="p-12 text-center text-xs text-stone-500">Loading orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-500">
              No orders found matching your filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
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
                        {order.order_number}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-stone-500 text-[11px] whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        <div className="text-[10px] text-stone-600">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-900">{order.customer_name}</div>
                        <div className="font-mono text-stone-600 text-[11px] flex items-center gap-1.5 mt-0.5">
                          <span>{order.phone}</span>
                          <a
                            href={getCustomerWhatsAppUrl(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#25D366] hover:opacity-80 transition-opacity"
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
                          <div className="text-[10px] text-stone-600 truncate max-w-[140px] mt-0.5">
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
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer focus:outline-hidden ${getStatusBadge(
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

                      {/* Details Button */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-stone-200 max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-xl my-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#BE185D] tracking-widest">
                    Order Details
                  </span>
                  <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                    <span>{selectedOrder.order_number}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer & Delivery Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#FFF9FA] p-4 rounded-xl border border-[#F7D8E2]/50">
                <div className="space-y-1.5">
                  <div className="text-stone-500 font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#BE185D]" />
                    <span>Customer Contact</span>
                  </div>
                  <div className="font-bold text-stone-900 text-sm">{selectedOrder.customer_name}</div>
                  <div className="font-mono text-stone-700">{selectedOrder.phone}</div>
                  <a
                    href={getCustomerWhatsAppUrl(selectedOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#25D366] font-semibold hover:underline pt-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>

                <div className="space-y-1.5">
                  <div className="text-stone-500 font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#BE185D]" />
                    <span>Delivery Location</span>
                  </div>
                  <div className="text-stone-800 leading-relaxed font-medium">
                    {selectedOrder.address}
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#FFF0F3] border border-[#F9CAD5]/60 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-600 font-medium">District / City:</span>
                      <span className="font-bold text-stone-900">{selectedOrder.district}</span>
                    </div>
                    {selectedOrder.area && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-stone-600 font-medium">Area / Upazila:</span>
                        <span className="font-semibold text-stone-800">{selectedOrder.area}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-[#F9CAD5]/40">
                      <span className="text-stone-600 font-medium">Delivery Zone:</span>
                      <span className="font-bold text-stone-900">
                        {selectedOrder.delivery_area || selectedOrder.area || 'Outside Sylhet'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-600 font-medium">Delivery Charge:</span>
                      <span className="font-bold text-[#BE185D] tabular-nums">
                        ৳{selectedOrder.delivery_charge !== undefined ? selectedOrder.delivery_charge : 155}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-stone-600">
                    Payment Method: <span className="font-semibold">Cash on Delivery (COD)</span>
                  </div>
                </div>
              </div>

              {/* Special Delivery Notes */}
              {selectedOrder.notes && (
                <div className="p-3 bg-stone-50 rounded-lg text-xs border border-stone-200">
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
                      <div key={idx} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-stone-900">{item.product_name}</div>
                          <div className="text-[11px] text-stone-600 mt-0.5">
                            Size: <span className="font-semibold text-stone-800">{item.size}</span> · Color: <span className="font-semibold text-stone-800">{item.color}</span> · Qty: {item.quantity}
                          </div>
                        </div>
                        <div className="font-bold text-stone-900 text-sm">
                          ৳{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-stone-500 text-xs">Items listed in order summary</div>
                  )}
                </div>
              </div>

              {/* Policy Acceptance Banner */}
              <div className="text-[11px] text-stone-500 flex items-center justify-between border-t border-stone-100 pt-3">
                <span>Customer accepted No Return / No Exchange policy</span>
                <span className="text-emerald-700 font-semibold">✓ Verified</span>
              </div>

              {/* Total & Status Selector Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-stone-200">
                <div>
                  <span className="text-xs text-stone-500 block">Total Payable via Cash on Delivery:</span>
                  <span className="text-xl font-bold font-serif text-[#BE185D]">
                    ৳{Number(selectedOrder.total_amount).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-stone-700">Update Status:</label>
                  <select
                    value={selectedOrder.status}
                    onChange={e => handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 bg-white cursor-pointer focus:outline-hidden focus:border-[#BE185D]"
                  >
                    {statuses.map(st => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
