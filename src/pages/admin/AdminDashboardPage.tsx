import React, { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { useNavigation } from '../../context/NavigationContext';
import {
  adminFetchDashboardStats,
  adminFetchOrders,
  adminGetLocalDashboardStats,
  adminGetLocalRecentOrders,
  adminGetLocalRevenueAnalytics,
  DashboardStats,
  RevenueAnalyticsData,
} from '../../services/admin';
import { Order, OrderStatus } from '../../types';
import { subscribeToStore } from '../../services/localStore';
import {
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight,
  X,
  BarChart3,
  Calendar,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { navigate } = useNavigation();

  // Instantaneous initial mount with cached local state (0ms wait)
  const [stats, setStats] = useState<DashboardStats>(() => adminGetLocalDashboardStats());
  const [recentOrders, setRecentOrders] = useState<Order[]>(() => adminGetLocalRecentOrders(5));

  // Revenue Analytics Modal State - Instant computation
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [revenueData, setRevenueData] = useState<RevenueAnalyticsData | null>(() => adminGetLocalRevenueAnalytics());

  useEffect(() => {
    let isMounted = true;

    async function syncDashboardData() {
      try {
        const freshStats = await adminFetchDashboardStats();
        if (isMounted) {
          setStats(freshStats);
        }

        const ords = await adminFetchOrders();
        if (isMounted) {
          setRecentOrders(ords.slice(0, 5));
          setRevenueData(adminGetLocalRevenueAnalytics());
        }
      } catch (err) {
        console.warn('Silent dashboard sync error:', err);
      }
    }

    syncDashboardData();
    const unsub = subscribeToStore(() => {
      if (isMounted) {
        setStats(adminGetLocalDashboardStats());
        setRecentOrders(adminGetLocalRecentOrders(5));
        setRevenueData(adminGetLocalRevenueAnalytics());
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const openRevenueAnalytics = () => {
    // Instantly calculate and open modal with 0ms wait
    setRevenueData(adminGetLocalRevenueAnalytics());
    setIsRevenueModalOpen(true);
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

  return (
    <AdminLayout activeTab="dashboard">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-[#BE185D] font-bold">
              Bubaé Studio Overview
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
              Store Dashboard
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Real-time inventory and Cash on Delivery order processing connected to Supabase.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate('/bubae-studio/products')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-stone-900 hover:bg-black text-[#FFF0F3] text-xs font-semibold rounded-xl transition-all cursor-pointer active:scale-98 shadow-2xs"
            >
              <Plus className="w-4 h-4 text-[#F9CAD5]" />
              <span>Add Product</span>
            </button>
            <button
              onClick={() => navigate('/bubae-studio/orders')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-white border border-[#F7D8E2] hover:bg-[#FFF5F8] text-stone-800 text-xs font-semibold rounded-xl transition-all cursor-pointer active:scale-98 shadow-2xs"
            >
              <ShoppingBag className="w-4 h-4 text-[#BE185D]" />
              <span>View Orders</span>
            </button>
          </div>
        </div>

        {/* KPI Cards Grid - Clickable & Interactive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Revenue - Clickable */}
          <div
            onClick={openRevenueAnalytics}
            className="group bg-white p-5 rounded-2xl border border-stone-200/80 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer space-y-2 relative"
            title="Click to view Monthly Revenue Analytics"
          >
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-medium uppercase tracking-wider group-hover:text-emerald-700 transition-colors">
                COD Revenue
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-serif font-bold text-stone-900">
              ৳{(stats?.totalRevenue ?? 0).toLocaleString()}
            </div>
            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-stone-500">
                Completed & confirmed
              </p>
              <span className="text-[11px] text-emerald-700 font-semibold group-hover:underline flex items-center gap-0.5">
                <span>View Chart</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Pending Orders - Clickable to Filter Pending */}
          <div
            onClick={() => navigate('/bubae-studio/orders?status=Pending')}
            className="group bg-white p-5 rounded-2xl border border-stone-200/80 hover:border-amber-300 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer space-y-2"
            title="Click to filter and view Pending Orders"
          >
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-medium uppercase tracking-wider group-hover:text-amber-700 transition-colors">
                Pending Orders
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-serif font-bold text-stone-900">
              {stats?.pendingOrders ?? 0}
            </div>
            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-amber-700 font-medium">
                Awaiting confirmation
              </p>
              <span className="text-[11px] text-amber-700 font-semibold group-hover:underline flex items-center gap-0.5">
                <span>Filter List</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Active Products - Clickable to View In-Stock Catalog */}
          <div
            onClick={() => navigate('/bubae-studio/products?filter=in-stock')}
            className="group bg-white p-5 rounded-2xl border border-stone-200/80 hover:border-[#F9CAD5] shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer space-y-2"
            title="Click to view Active Products"
          >
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-medium uppercase tracking-wider group-hover:text-[#BE185D] transition-colors">
                Active Catalog
              </span>
              <div className="p-2 rounded-xl bg-[#FFF0F3] text-[#BE185D] group-hover:scale-105 transition-transform">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-serif font-bold text-stone-900">
              {stats?.availableProducts ?? 0} <span className="text-xs font-sans text-stone-500 font-normal">/ {stats?.totalProducts ?? 0} total</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-stone-500">
                In-stock in storefront
              </p>
              <span className="text-[11px] text-[#BE185D] font-semibold group-hover:underline flex items-center gap-0.5">
                <span>View Catalog</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Out of Stock Warning - Clickable to View Attention Items */}
          <div
            onClick={() => navigate('/bubae-studio/products?filter=out-of-stock')}
            className="group bg-white p-5 rounded-2xl border border-stone-200/80 hover:border-rose-300 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer space-y-2"
            title="Click to view Out-of-Stock and Attention Products"
          >
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-medium uppercase tracking-wider group-hover:text-rose-700 transition-colors">
                Stock Alerts
              </span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-serif font-bold text-stone-900">
              {stats?.outOfStockProducts ?? 0}
            </div>
            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-stone-500">
                Items requiring restock
              </p>
              <span className="text-[11px] text-rose-700 font-semibold group-hover:underline flex items-center gap-0.5">
                <span>View Alerts</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Quick Workflow Status Strip */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#F7D8E2]/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center divide-y sm:divide-y-0 sm:divide-x divide-stone-100 shadow-2xs">
          <div className="p-2 cursor-pointer hover:bg-stone-50/60 rounded-xl transition-colors" onClick={() => navigate('/bubae-studio/orders?status=Pending')}>
            <div className="text-xs font-medium text-stone-500">Pending Review</div>
            <div className="text-xl font-bold text-amber-600 mt-1">{stats?.pendingOrders ?? 0}</div>
          </div>
          <div className="p-2 cursor-pointer hover:bg-stone-50/60 rounded-xl transition-colors" onClick={() => navigate('/bubae-studio/orders?status=Confirmed')}>
            <div className="text-xs font-medium text-stone-500">Confirmed</div>
            <div className="text-xl font-bold text-blue-600 mt-1">{stats?.confirmedOrders ?? 0}</div>
          </div>
          <div className="p-2 cursor-pointer hover:bg-stone-50/60 rounded-xl transition-colors" onClick={() => navigate('/bubae-studio/orders?status=Delivered')}>
            <div className="text-xs font-medium text-stone-500">Delivered</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">{stats?.deliveredOrders ?? 0}</div>
          </div>
          <div className="p-2 cursor-pointer hover:bg-stone-50/60 rounded-xl transition-colors" onClick={() => navigate('/bubae-studio/products')}>
            <div className="text-xs font-medium text-stone-500">Total Catalog Items</div>
            <div className="text-xl font-bold text-stone-800 mt-1">{stats?.totalProducts ?? 0}</div>
          </div>
        </div>

        {/* Recent Orders Section */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900">Recent Customer Orders</h2>
              <p className="text-xs text-stone-500">Latest Cash on Delivery orders placed on the website</p>
            </div>
            <button
              onClick={() => navigate('/bubae-studio/orders')}
              className="text-xs font-semibold text-[#BE185D] hover:underline flex items-center gap-1 cursor-pointer py-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-500">No orders placed yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-[#FFF9FA] text-stone-500 uppercase tracking-wider text-[10px] border-b border-stone-100 font-medium">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">District</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {recentOrders.map((ord) => (
                    <tr
                      key={ord.id}
                      className="hover:bg-[#FFFDFE] transition-colors cursor-pointer"
                      onClick={() => navigate(`/bubae-studio/orders?order=${ord.id}`)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        {ord.order_number}
                      </td>
                      <td className="py-3 px-4 font-medium text-stone-900">
                        {ord.customer_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-600">
                        {ord.phone}
                      </td>
                      <td className="py-3 px-4">
                        {ord.district}
                      </td>
                      <td className="py-3 px-4 text-stone-500">
                        {ord.items?.length || 1} item(s)
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-900">
                        ৳{Number(ord.total_amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(ord.status)}`}>
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Instant Revenue Analytics Modal */}
      {isRevenueModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 relative shadow-2xl border border-[#F9CAD5] space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-stone-900">
                    COD Sales & Revenue Analytics
                  </h3>
                  <p className="text-xs text-stone-500">
                    Historical revenue from valid & confirmed Cash on Delivery orders
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsRevenueModalOpen(false)}
                className="p-2 text-stone-400 hover:text-black rounded-lg hover:bg-stone-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close Revenue Analytics"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {revenueData ? (
              <div className="space-y-6">
                {/* 3 Summary Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#F8FDF9] border border-emerald-100 rounded-xl p-4 space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">
                      Total Revenue
                    </span>
                    <div className="text-2xl font-serif font-bold text-stone-900">
                      ৳{revenueData.totalRevenue.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-stone-500">From all non-cancelled orders</span>
                  </div>

                  <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-4 space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-stone-600">
                      Total Orders
                    </span>
                    <div className="text-2xl font-serif font-bold text-stone-900">
                      {revenueData.totalOrders}
                    </div>
                    <span className="text-[11px] text-stone-500">Confirmed, shipped & delivered</span>
                  </div>

                  <div className="bg-[#FFF9FA] border border-[#F9CAD5]/60 rounded-xl p-4 space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#BE185D]">
                      Average Order Value
                    </span>
                    <div className="text-2xl font-serif font-bold text-stone-900">
                      ৳{revenueData.averageOrderValue.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-stone-500">Average payable per customer order</span>
                  </div>
                </div>

                {/* Monthly Revenue Chart */}
                <div className="border border-stone-200/80 rounded-xl p-5 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                        Monthly Revenue Breakdown
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Compare monthly trends to track sales trajectory
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-stone-500">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>Monthly View</span>
                    </div>
                  </div>

                  {/* Visual Bar Chart */}
                  {(() => {
                    const maxMonthlyRev = Math.max(1, ...revenueData.monthlyBreakdown.map(m => m.revenue));
                    return (
                      <div className="pt-6 pb-2">
                        <div className="grid grid-cols-6 gap-3 sm:gap-6 items-end h-44 border-b border-stone-200 px-2">
                          {revenueData.monthlyBreakdown.map((item, idx) => {
                            const heightPercent = Math.max(8, Math.round((item.revenue / maxMonthlyRev) * 100));
                            return (
                              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group relative">
                                {/* Hover Tooltip */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-stone-900 text-white text-[10px] py-1 px-2 rounded-md pointer-events-none whitespace-nowrap z-10 shadow-sm">
                                  {item.month}: ৳{item.revenue.toLocaleString()} ({item.ordersCount} orders)
                                </div>

                                <div className="text-[11px] font-bold text-stone-800 tabular-nums">
                                  {item.revenue > 0 ? `৳${(item.revenue / 1000).toFixed(1)}k` : '৳0'}
                                </div>

                                <div
                                  style={{ height: `${heightPercent}%` }}
                                  className={`w-full max-w-[48px] rounded-t-lg transition-all duration-500 ${
                                    item.revenue > 0
                                      ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-700 hover:to-emerald-500 shadow-2xs'
                                      : 'bg-stone-100'
                                  }`}
                                />

                                <div className="text-[10px] font-medium text-stone-600 mt-2 truncate w-full text-center">
                                  {item.shortMonth}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="pt-2 text-[11px] text-stone-500 flex items-center justify-between">
                    <span>* Excludes cancelled and invalid orders.</span>
                    <span className="text-emerald-700 font-medium">Real-time sync</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
