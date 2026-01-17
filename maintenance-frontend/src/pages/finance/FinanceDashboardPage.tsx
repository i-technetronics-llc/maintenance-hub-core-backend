import { useState, useEffect } from 'react';
import { financeApi, FinancialSummary, Invoice, PurchaseOrder } from '../../services/api';

export function FinanceDashboardPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [recentPOs, setRecentPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryData, invoicesData, posData] = await Promise.all([
        financeApi.dashboard.getSummary(),
        financeApi.invoices.getAll({ limit: 5 }),
        financeApi.purchaseOrders.getAll({ limit: 5 }),
      ]);
      setSummary(summaryData);
      setRecentInvoices(invoicesData.data || []);
      setRecentPOs(posData.data || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      viewed: 'bg-purple-100 text-purple-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      received: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const netIncome = (summary?.totalRevenue || 0) - (summary?.totalExpenses || 0);
  const profitMargin = summary?.totalRevenue ? (netIncome / summary.totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your financial performance</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(summary?.totalRevenue || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(summary?.totalExpenses || 0)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Outstanding</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(summary?.outstandingInvoices || 0)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="font-medium text-yellow-600">{summary?.overdueInvoices || 0}</span>
            <span className="text-gray-500 ml-2">overdue invoices</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Net Income</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(netIncome)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="font-medium text-gray-600">
              {profitMargin.toFixed(1)}%
            </span>
            <span className="text-gray-500 ml-2">profit margin</span>
          </div>
        </div>
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Month */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Month</h3>
          <div className="space-y-4">
            {(summary?.revenueByMonth ?? []).slice(0, 6).map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{item.month}</span>
                  <span className="text-gray-500">{formatCurrency(item.amount)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min((item.amount / (summary?.totalRevenue || 1)) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
            {(summary?.revenueByMonth ?? []).length === 0 && (
              <p className="text-gray-500 text-sm">No revenue data available</p>
            )}
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
          <div className="space-y-4">
            {(summary?.expensesByCategory ?? []).map((cat, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700 capitalize">{cat.category}</span>
                  <span className="text-gray-500">{formatCurrency(cat.amount)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min((cat.amount / (summary?.totalExpenses || 1)) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
            {(summary?.expensesByCategory ?? []).length === 0 && (
              <p className="text-gray-500 text-sm">No expense data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
            <a href="/finance/invoices" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All
            </a>
          </div>
          <div className="space-y-3">
            {recentInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                  <p className="text-sm text-gray-500">{invoice.client?.name || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
            {recentInvoices.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No recent invoices</p>
            )}
          </div>
        </div>

        {/* Recent Purchase Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Purchase Orders</h3>
            <a href="/finance/purchase-orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All
            </a>
          </div>
          <div className="space-y-3">
            {recentPOs.map((po) => (
              <div key={po.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{po.poNumber}</p>
                  <p className="text-sm text-gray-500">{po.supplier?.name || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(po.totalAmount)}</p>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(po.status)}`}>
                    {po.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
            {recentPOs.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No recent purchase orders</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Clients */}
      {(summary?.topClients ?? []).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clients by Revenue</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summary?.topClients.slice(0, 6).map((client, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{client.clientName}</p>
                <p className="text-lg font-bold text-blue-600 mt-1">{formatCurrency(client.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Budget Utilization</h3>
          <a href="/finance/budgets" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Manage Budgets
          </a>
        </div>
        <div className="flex items-center">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Overall Budget Utilization</span>
              <span className="font-medium text-gray-700">
                {(summary?.budgetUtilization || 0).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  (summary?.budgetUtilization || 0) > 90
                    ? 'bg-red-500'
                    : (summary?.budgetUtilization || 0) > 70
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{
                  width: `${Math.min(summary?.budgetUtilization || 0, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
