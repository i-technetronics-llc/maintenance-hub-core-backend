import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, PieChart, AreaChart } from '../../components/charts';
import { api } from '../../services/api';

interface CostMetrics {
  summary: {
    totalCost: number;
    laborCost: number;
    partsCost: number;
    otherCost: number;
    budgetVariance: number;
  };
  costTrends: { date: string; labor: number; parts: number; total: number }[];
  costByDepartment: { department: string; cost: number }[];
  costByAsset: { assetId: string; assetName: string; cost: number }[];
  budgetVsActual: { category: string; budget: number; actual: number }[];
  highestCostWorkOrders: { woId: string; woNumber: string; title: string; cost: number }[];
}

const CostReportsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<CostMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/analytics/costs', { params: dateRange });
      setMetrics(response.data.data);
    } catch (error) {
      console.error('Error fetching cost metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    if (!metrics) return;

    const rows = [
      ['Cost Report'],
      ['Date Range:', `${dateRange.startDate} to ${dateRange.endDate}`],
      [''],
      ['Summary'],
      ['Total Cost ($)', metrics.summary.totalCost],
      ['Labor Cost ($)', metrics.summary.laborCost],
      ['Parts Cost ($)', metrics.summary.partsCost],
      ['Other Cost ($)', metrics.summary.otherCost],
      ['Budget Variance (%)', metrics.summary.budgetVariance],
      [''],
      ['Cost by Asset'],
      ['Asset', 'Cost ($)'],
      ...metrics.costByAsset.map(a => [a.assetName, a.cost]),
      [''],
      ['Budget vs Actual'],
      ['Category', 'Budget ($)', 'Actual ($)'],
      ...metrics.budgetVsActual.map(b => [b.category, b.budget, b.actual]),
      [''],
      ['Highest Cost Work Orders'],
      ['WO Number', 'Title', 'Cost ($)'],
      ...metrics.highestCostWorkOrders.map(wo => [wo.woNumber, wo.title, wo.cost]),
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cost-report-${dateRange.startDate}-${dateRange.endDate}.csv`;
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

  const budgetStatus = (metrics?.summary.budgetVariance ?? 0) < 0 ? 'under' : 'over';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cost Reports</h1>
          <p className="text-gray-600">Maintenance cost analysis and budget tracking</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">From:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">To:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="border rounded-lg px-3 py-2 text-sm"
            />
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Total Cost</p>
          <p className="text-2xl font-bold text-gray-800">${(metrics?.summary?.totalCost ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Labor Cost</p>
          <p className="text-2xl font-bold text-blue-600">${(metrics?.summary?.laborCost ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Parts Cost</p>
          <p className="text-2xl font-bold text-green-600">${(metrics?.summary?.partsCost ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Other Cost</p>
          <p className="text-2xl font-bold text-purple-600">${(metrics?.summary?.otherCost ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Budget Variance</p>
          <p className={`text-2xl font-bold ${budgetStatus === 'under' ? 'text-green-600' : 'text-red-600'}`}>
            {budgetStatus === 'under' ? '' : '+'}
            {metrics?.summary?.budgetVariance ?? 0}%
          </p>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <PieChart
            data={[
              { label: 'Labor', value: metrics?.summary?.laborCost ?? 0, color: '#3B82F6' },
              { label: 'Parts', value: metrics?.summary?.partsCost ?? 0, color: '#10B981' },
              { label: 'Other', value: metrics?.summary?.otherCost ?? 0, color: '#8B5CF6' },
            ]}
            title="Cost Breakdown"
            donut={true}
            showPercentages={true}
            height={250}
          />
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 lg:col-span-2">
          <AreaChart
            data={(metrics?.costTrends ?? []).map(t => ({
              label: t.date,
              value: t.total,
            }))}
            title="Monthly Cost Trend"
            height={250}
            color="#3B82F6"
            yAxisLabel="Cost ($)"
          />
        </div>
      </div>

      {/* Budget vs Actual */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-lg font-semibold mb-4">Budget vs Actual</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BarChart
            data={(metrics?.budgetVsActual ?? []).map(b => ({
              label: b.category,
              value: b.budget,
              value2: b.actual,
            }))}
            height={300}
            color="#3B82F6"
            color2="#10B981"
            showValues={true}
          />
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 text-sm text-gray-600">Category</th>
                <th className="text-right py-3 text-sm text-gray-600">Budget</th>
                <th className="text-right py-3 text-sm text-gray-600">Actual</th>
                <th className="text-right py-3 text-sm text-gray-600">Variance</th>
              </tr>
            </thead>
            <tbody>
              {(metrics?.budgetVsActual ?? []).map((item, idx) => {
                const variance = item.actual - item.budget;
                const variancePercent = item.budget > 0 ? (variance / item.budget) * 100 : 0;
                return (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 text-sm font-medium">{item.category}</td>
                    <td className="py-3 text-sm text-right">${item.budget.toLocaleString()}</td>
                    <td className="py-3 text-sm text-right">${item.actual.toLocaleString()}</td>
                    <td className={`py-3 text-sm text-right font-medium ${variance <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {variance <= 0 ? '' : '+'}${variance.toLocaleString()} ({variancePercent.toFixed(1)}%)
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="py-3">Total</td>
                <td className="py-3 text-right">
                  ${(metrics?.budgetVsActual ?? []).reduce((a, b) => a + b.budget, 0).toLocaleString()}
                </td>
                <td className="py-3 text-right">
                  ${(metrics?.budgetVsActual ?? []).reduce((a, b) => a + b.actual, 0).toLocaleString()}
                </td>
                <td className={`py-3 text-right ${(metrics?.summary?.budgetVariance ?? 0) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics?.summary?.budgetVariance ?? 0}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="flex justify-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-sm text-gray-600">Budget</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-sm text-gray-600">Actual</span>
          </div>
        </div>
      </div>

      {/* Cost by Asset */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-lg font-semibold mb-4">Maintenance Cost by Asset (Top 10)</h2>
        <BarChart
          data={(metrics?.costByAsset ?? []).map(a => ({
            label: a.assetName.length > 20 ? a.assetName.slice(0, 20) + '...' : a.assetName,
            value: a.cost,
          }))}
          height={320}
          color="#10B981"
          yAxisLabel="Cost ($)"
          showValues={true}
        />
      </div>

      {/* Highest Cost Work Orders */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-lg font-semibold mb-4">Highest Cost Work Orders</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 text-sm text-gray-600">WO Number</th>
              <th className="text-left py-3 text-sm text-gray-600">Title</th>
              <th className="text-right py-3 text-sm text-gray-600">Cost</th>
              <th className="text-right py-3 text-sm text-gray-600">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {(metrics?.highestCostWorkOrders ?? []).map((wo, idx) => {
              const percentage = (metrics?.summary?.totalCost ?? 0) > 0
                ? (wo.cost / (metrics?.summary?.totalCost ?? 1)) * 100
                : 0;
              return (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-3 text-sm font-medium text-blue-600">{wo.woNumber}</td>
                  <td className="py-3 text-sm">{wo.title}</td>
                  <td className="py-3 text-sm text-right font-medium">${wo.cost.toLocaleString()}</td>
                  <td className="py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.min(percentage * 5, 100)}%` }}
                        />
                      </div>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cost Trend Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-lg font-semibold mb-4">Monthly Cost Components</h2>
        <LineChart
          data={(metrics?.costTrends ?? []).map(t => ({
            label: t.date,
            value: t.labor,
            value2: t.parts,
          }))}
          height={300}
          color="#3B82F6"
          color2="#10B981"
          showGrid={true}
          yAxisLabel="Cost ($)"
        />
        <div className="flex justify-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-sm text-gray-600">Labor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-sm text-gray-600">Parts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostReportsPage;
