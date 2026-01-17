import React, { useState, useEffect } from 'react';
import { BarChart, PieChart } from '../../components/charts';
import { api } from '../../services/api';

interface InventoryMetrics {
  summary: {
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    avgTurnoverRate: number;
  };
  stockByCategory: { category: string; quantity: number; value: number }[];
  turnoverByCategory: { category: string; turnover: number }[];
  stockoutIncidents: { date: string; item: string; duration: number }[];
  slowMovingItems: { itemId: string; name: string; daysSinceLastMove: number; quantity: number }[];
  reorderRecommendations: { itemId: string; name: string; currentQty: number; reorderQty: number; urgency: string }[];
}

const InventoryReportsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'stock' | 'reorder' | 'slow'>('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/analytics/inventory/metrics');
      setMetrics(response.data.data);
    } catch (error) {
      console.error('Error fetching inventory metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    if (!metrics) return;

    const rows = [
      ['Inventory Report'],
      ['Generated:', new Date().toISOString()],
      [''],
      ['Summary'],
      ['Total Items', metrics.summary.totalItems],
      ['Total Value ($)', metrics.summary.totalValue],
      ['Low Stock Items', metrics.summary.lowStockItems],
      ['Out of Stock Items', metrics.summary.outOfStockItems],
      ['Avg Turnover Rate', metrics.summary.avgTurnoverRate],
      [''],
      ['Stock by Category'],
      ['Category', 'Quantity', 'Value ($)'],
      ...metrics.stockByCategory.map(c => [c.category, c.quantity, c.value]),
      [''],
      ['Reorder Recommendations'],
      ['Item', 'Current Qty', 'Reorder Qty', 'Urgency'],
      ...metrics.reorderRecommendations.map(r => [r.name, r.currentQty, r.reorderQty, r.urgency]),
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const urgencyColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory Reports</h1>
          <p className="text-gray-600">Stock levels, turnover, and reorder analysis</p>
        </div>
        <button
          onClick={exportToCsv}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Total Items</p>
          <p className="text-2xl font-bold text-gray-800">{metrics?.summary?.totalItems ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Total Value</p>
          <p className="text-2xl font-bold text-green-600">${(metrics?.summary?.totalValue ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Low Stock</p>
          <p className="text-2xl font-bold text-orange-600">{metrics?.summary?.lowStockItems ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{metrics?.summary?.outOfStockItems ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Avg Turnover</p>
          <p className="text-2xl font-bold text-blue-600">{metrics?.summary?.avgTurnoverRate ?? 0}x</p>
        </div>
      </div>

      {/* Alert Banner */}
      {(metrics?.summary?.outOfStockItems ?? 0) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold text-red-800">Stock Alert</p>
            <p className="text-sm text-red-700">{metrics?.summary?.outOfStockItems} items are out of stock and need immediate attention.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {(['overview', 'stock', 'reorder', 'slow'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab === 'slow' ? 'Slow Moving' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <PieChart
              data={(metrics?.stockByCategory ?? []).map(c => ({
                label: c.category.replace('_', ' '),
                value: c.quantity,
              }))}
              title="Stock Quantity by Category"
              donut={true}
              height={300}
            />
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <BarChart
              data={(metrics?.stockByCategory ?? []).map(c => ({
                label: c.category.replace('_', ' '),
                value: c.value,
              }))}
              title="Stock Value by Category"
              height={300}
              color="#10B981"
              yAxisLabel="Value ($)"
              showValues={true}
            />
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 lg:col-span-2">
            <BarChart
              data={(metrics?.turnoverByCategory ?? []).map(c => ({
                label: c.category.replace('_', ' '),
                value: c.turnover,
              }))}
              title="Turnover Rate by Category"
              height={280}
              color="#6366F1"
              yAxisLabel="Turnover"
              showValues={true}
            />
          </div>
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-lg font-semibold mb-4">Stock Levels by Category</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 text-sm text-gray-600">Category</th>
                <th className="text-right py-3 text-sm text-gray-600">Quantity</th>
                <th className="text-right py-3 text-sm text-gray-600">Value ($)</th>
                <th className="text-right py-3 text-sm text-gray-600">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {(metrics?.stockByCategory ?? []).map((item, idx) => {
                const totalValue = metrics?.summary?.totalValue || 1;
                const percentage = (item.value / totalValue) * 100;
                return (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 text-sm font-medium">{item.category.replace('_', ' ')}</td>
                    <td className="py-3 text-sm text-right">{item.quantity.toLocaleString()}</td>
                    <td className="py-3 text-sm text-right">${item.value.toLocaleString()}</td>
                    <td className="py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <span>{percentage.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="py-3">Total</td>
                <td className="py-3 text-right">
                  {(metrics?.stockByCategory ?? []).reduce((a, c) => a + c.quantity, 0).toLocaleString()}
                </td>
                <td className="py-3 text-right">${(metrics?.summary?.totalValue ?? 0).toLocaleString()}</td>
                <td className="py-3 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {activeTab === 'reorder' && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-lg font-semibold mb-4">Reorder Recommendations</h2>
          {(metrics?.reorderRecommendations ?? []).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No reorder recommendations at this time.</p>
              <p className="text-sm">All items are above minimum stock levels.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 text-sm text-gray-600">Item</th>
                  <th className="text-right py-3 text-sm text-gray-600">Current Qty</th>
                  <th className="text-right py-3 text-sm text-gray-600">Reorder Qty</th>
                  <th className="text-center py-3 text-sm text-gray-600">Urgency</th>
                  <th className="text-center py-3 text-sm text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {(metrics?.reorderRecommendations ?? []).map((item, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 text-sm font-medium">{item.name}</td>
                    <td className="py-3 text-sm text-right">{item.currentQty}</td>
                    <td className="py-3 text-sm text-right font-medium text-blue-600">{item.reorderQty}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${urgencyColors[item.urgency] || 'bg-gray-100'}`}>
                        {item.urgency.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                        Create PO
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'slow' && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-lg font-semibold mb-4">Slow Moving Items</h2>
          {(metrics?.slowMovingItems ?? []).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No slow-moving items detected.</p>
            </div>
          ) : (
            <>
              <BarChart
                data={(metrics?.slowMovingItems ?? []).slice(0, 10).map(item => ({
                  label: item.name.length > 15 ? item.name.slice(0, 15) + '...' : item.name,
                  value: item.daysSinceLastMove,
                }))}
                title="Days Since Last Movement"
                height={300}
                color="#F59E0B"
                yAxisLabel="Days"
                showValues={true}
              />
              <table className="w-full mt-6">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 text-sm text-gray-600">Item</th>
                    <th className="text-right py-3 text-sm text-gray-600">Quantity</th>
                    <th className="text-right py-3 text-sm text-gray-600">Days Since Last Move</th>
                    <th className="text-center py-3 text-sm text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(metrics?.slowMovingItems ?? []).map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 text-sm font-medium">{item.name}</td>
                      <td className="py-3 text-sm text-right">{item.quantity}</td>
                      <td className="py-3 text-sm text-right">{item.daysSinceLastMove} days</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.daysSinceLastMove > 90 ? 'bg-red-100 text-red-800' :
                          item.daysSinceLastMove > 60 ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.daysSinceLastMove > 90 ? 'Critical' : item.daysSinceLastMove > 60 ? 'Warning' : 'Monitor'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryReportsPage;
