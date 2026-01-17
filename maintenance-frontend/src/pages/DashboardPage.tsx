import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useOrganizationStore } from '../store/organizationStore';
import { analyticsApi, DashboardAnalytics } from '../services/api';

// Status color mappings
const workOrderStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  assigned: 'bg-indigo-100 text-indigo-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  closed: 'bg-gray-200 text-gray-700',
  cancelled: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
};

const priorityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const assetStatusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  under_maintenance: 'bg-yellow-100 text-yellow-800',
  decommissioned: 'bg-red-100 text-red-800',
};

const inventoryCategoryLabels: Record<string, string> = {
  spare_parts: 'Spare Parts',
  consumables: 'Consumables',
  tools: 'Tools',
  equipment: 'Equipment',
  safety: 'Safety',
  electrical: 'Electrical',
  mechanical: 'Mechanical',
  other: 'Other',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { selectedOrganization } = useOrganizationStore();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [selectedOrganization]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getDashboard();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatLabel = (str: string) => {
    return str
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">
                Welcome back, {user?.firstName}! Here's your overview.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {user?.role?.name || 'User'}
              </span>
              <button
                onClick={loadAnalytics}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Work Orders Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Work Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {analytics?.workOrders?.total || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-4">
              <div className="flex items-center text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                <span className="text-gray-600">{analytics?.workOrders?.completedThisMonth || 0} this month</span>
              </div>
              {analytics?.workOrders?.overdue ? (
                <div className="flex items-center text-sm text-red-600">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-1.5"></span>
                  <span>{analytics.workOrders.overdue} overdue</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Assets Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Assets</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {analytics?.assets?.total || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-4">
              <div className="flex items-center text-sm">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1.5"></span>
                <span className="text-gray-600">{analytics?.assets?.underMaintenance || 0} under maintenance</span>
              </div>
              {analytics?.assets?.warrantyExpiringSoon ? (
                <div className="flex items-center text-sm text-orange-600">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-1.5"></span>
                  <span>{analytics.assets.warrantyExpiringSoon} warranty expiring</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Inventory Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Inventory Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {analytics?.inventory?.total || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-4">
              <div className="flex items-center text-sm">
                <span className="text-gray-600">Value: {formatCurrency(analytics?.inventory?.totalValue || 0)}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center space-x-4">
              {analytics?.inventory?.lowStockItems ? (
                <div className="flex items-center text-sm text-yellow-600">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1.5"></span>
                  <span>{analytics.inventory.lowStockItems} low stock</span>
                </div>
              ) : null}
              {analytics?.inventory?.outOfStockItems ? (
                <div className="flex items-center text-sm text-red-600">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-1.5"></span>
                  <span>{analytics.inventory.outOfStockItems} out of stock</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Users Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {analytics?.users?.total || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-4">
              <div className="flex items-center text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                <span className="text-gray-600">{analytics?.users?.activeUsers || 0} active</span>
              </div>
              {analytics?.users?.pendingInvitations ? (
                <div className="flex items-center text-sm text-yellow-600">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1.5"></span>
                  <span>{analytics.users.pendingInvitations} pending</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Trend Indicator */}
        {analytics?.trends && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Work Order Trends</h3>
                <p className="text-blue-100 text-sm mt-1">Comparing this week to last week</p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-sm text-blue-100">This Week</p>
                    <p className="text-2xl font-bold">{analytics.trends.workOrdersThisWeek}</p>
                  </div>
                  <div className="h-12 w-px bg-blue-400"></div>
                  <div>
                    <p className="text-sm text-blue-100">Last Week</p>
                    <p className="text-2xl font-bold">{analytics.trends.workOrdersLastWeek}</p>
                  </div>
                  <div className="h-12 w-px bg-blue-400"></div>
                  <div>
                    <p className="text-sm text-blue-100">Trend</p>
                    <p className={`text-2xl font-bold flex items-center ${analytics.trends.workOrdersTrend >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {analytics.trends.workOrdersTrend >= 0 ? (
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                      {Math.abs(analytics.trends.workOrdersTrend)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Work Orders by Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Orders by Status</h3>
            <div className="space-y-3">
              {analytics?.workOrders?.byStatus && Object.entries(analytics.workOrders.byStatus)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${workOrderStatusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                        {formatLabel(status)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                        <div
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${(count / (analytics?.workOrders?.total || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              {(!analytics?.workOrders?.byStatus || Object.values(analytics.workOrders.byStatus).every(v => v === 0)) && (
                <p className="text-gray-500 text-sm text-center py-4">No work orders yet</p>
              )}
            </div>
          </div>

          {/* Work Orders by Priority */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Orders by Priority</h3>
            <div className="space-y-3">
              {analytics?.workOrders?.byPriority && Object.entries(analytics.workOrders.byPriority)
                .filter(([, count]) => count > 0)
                .map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityColors[priority] || 'bg-gray-100 text-gray-800'}`}>
                        {formatLabel(priority)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                        <div
                          className={`h-2 rounded-full ${priority === 'critical' ? 'bg-red-500' : priority === 'high' ? 'bg-orange-500' : priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${(count / (analytics?.workOrders?.total || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              {(!analytics?.workOrders?.byPriority || Object.values(analytics.workOrders.byPriority).every(v => v === 0)) && (
                <p className="text-gray-500 text-sm text-center py-4">No work orders yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Assets by Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assets by Status</h3>
            <div className="space-y-3">
              {analytics?.assets?.byStatus && Object.entries(analytics.assets.byStatus)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${assetStatusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                        {formatLabel(status)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                        <div
                          className="h-2 bg-green-500 rounded-full"
                          style={{ width: `${(count / (analytics?.assets?.total || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              {(!analytics?.assets?.byStatus || Object.values(analytics.assets.byStatus).every(v => v === 0)) && (
                <p className="text-gray-500 text-sm text-center py-4">No assets yet</p>
              )}
            </div>
          </div>

          {/* Inventory by Category */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory by Category</h3>
            <div className="space-y-3">
              {analytics?.inventory?.byCategory && Object.entries(analytics.inventory.byCategory)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {inventoryCategoryLabels[category] || formatLabel(category)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-32 h-2 bg-gray-200 rounded-full mr-3">
                        <div
                          className="h-2 bg-purple-500 rounded-full"
                          style={{ width: `${(count / (analytics?.inventory?.total || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              {(!analytics?.inventory?.byCategory || Object.values(analytics.inventory.byCategory).every(v => v === 0)) && (
                <p className="text-gray-500 text-sm text-center py-4">No inventory items yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Users by Role */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Role</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {analytics?.users?.byRole && Object.entries(analytics.users.byRole)
              .filter(([, count]) => count > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([role, count]) => (
                <div key={role} className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-600 mt-1">{role}</p>
                </div>
              ))}
            {(!analytics?.users?.byRole || Object.values(analytics.users.byRole).every(v => v === 0)) && (
              <p className="text-gray-500 text-sm text-center py-4 col-span-full">No users yet</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Work Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Work Orders</h3>
            <div className="space-y-4">
              {analytics?.recentActivity?.recentWorkOrders.length ? (
                analytics.recentActivity.recentWorkOrders.map((wo) => (
                  <div key={wo.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {wo.woNumber || 'N/A'} - {wo.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {wo.assetName && `Asset: ${wo.assetName}`}
                        {wo.assignedTo && ` | Assigned: ${wo.assignedTo}`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[wo.priority] || 'bg-gray-100 text-gray-800'}`}>
                        {formatLabel(wo.priority)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${workOrderStatusColors[wo.status] || 'bg-gray-100 text-gray-800'}`}>
                        {formatLabel(wo.status)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No recent work orders</p>
              )}
            </div>
          </div>

          {/* Recent Assets */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Assets</h3>
            <div className="space-y-4">
              {analytics?.recentActivity?.recentAssets.length ? (
                analytics.recentActivity.recentAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {asset.assetCode || 'N/A'} - {asset.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Type: {asset.type}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${assetStatusColors[asset.status] || 'bg-gray-100 text-gray-800'}`}>
                      {formatLabel(asset.status)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No recent assets</p>
              )}
            </div>
          </div>
        </div>

        {/* Average Completion Time */}
        {analytics?.workOrders?.avgCompletionTime !== null && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Average Work Order Completion Time</h3>
                <p className="text-sm text-gray-500 mt-1">Based on completed work orders with actual start and end times</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">{analytics?.workOrders?.avgCompletionTime} hours</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
