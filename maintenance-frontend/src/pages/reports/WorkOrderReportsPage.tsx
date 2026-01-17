import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, PieChart } from '../../components/charts';
import { api } from '../../services/api';

interface WorkOrderMetrics {
  summary: {
    total: number;
    open: number;
    completed: number;
    overdue: number;
    avgResolutionTime: number | null;
    slaCompliance: number;
  };
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  completionTrends: { date: string; completed: number; created: number }[];
  topFailureCategories: { category: string; count: number }[];
  avgResolutionByType: { type: string; hours: number }[];
}

const WorkOrderReportsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<WorkOrderMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/analytics/work-orders/metrics', { params: dateRange });
      setMetrics(response.data.data);
    } catch (error) {
      console.error('Error fetching work order metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    if (!metrics || !metrics.summary) return;

    const rows = [
      ['Work Order Report'],
      ['Date Range:', `${dateRange.startDate} to ${dateRange.endDate}`],
      [''],
      ['Summary'],
      ['Total Work Orders', metrics.summary.total],
      ['Open', metrics.summary.open],
      ['Completed', metrics.summary.completed],
      ['Overdue', metrics.summary.overdue],
      ['Avg Resolution Time (hrs)', metrics.summary.avgResolutionTime || 'N/A'],
      ['SLA Compliance (%)', metrics.summary.slaCompliance],
      [''],
      ['By Status'],
      ...Object.entries(metrics.byStatus).map(([status, count]) => [status, count]),
      [''],
      ['By Priority'],
      ...Object.entries(metrics.byPriority).map(([priority, count]) => [priority, count]),
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `work-order-report-${dateRange.startDate}-${dateRange.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics || !metrics.summary) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">No metrics data available for the selected date range.</p>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    ASSIGNED: '#3B82F6',
    IN_PROGRESS: '#F59E0B',
    ON_HOLD: '#6B7280',
    COMPLETED: '#10B981',
    CLOSED: '#6366F1',
    CANCELLED: '#EF4444',
  };

  const priorityColors: Record<string, string> = {
    CRITICAL: '#EF4444',
    HIGH: '#F97316',
    MEDIUM: '#F59E0B',
    LOW: '#10B981',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Work Order Reports</h1>
          <p className="text-gray-600">Detailed work order analytics and trends</p>
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-800">{metrics?.summary?.total ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Open</p>
          <p className="text-2xl font-bold text-blue-600">{metrics?.summary?.open ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">{metrics?.summary?.completed ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{metrics?.summary?.overdue ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Avg Resolution</p>
          <p className="text-2xl font-bold text-purple-600">
            {metrics?.summary?.avgResolutionTime ?? 'N/A'}
            <span className="text-sm font-normal">hrs</span>
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">SLA Compliance</p>
          <p className="text-2xl font-bold text-teal-600">{metrics?.summary?.slaCompliance ?? 0}%</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <LineChart
            data={(metrics?.completionTrends ?? []).map(t => ({
              label: t.date,
              value: t.completed,
              value2: t.created,
            }))}
            title="Work Order Trends"
            height={300}
            color="#10B981"
            color2="#3B82F6"
            showGrid={true}
            yAxisLabel="Count"
          />
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-sm text-gray-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span className="text-sm text-gray-600">Created</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <PieChart
            data={Object.entries(metrics?.byStatus ?? {}).map(([label, value]) => ({
              label: label.replace('_', ' '),
              value,
              color: statusColors[label],
            }))}
            title="By Status"
            donut={true}
            showPercentages={true}
            height={300}
          />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <PieChart
            data={Object.entries(metrics?.byPriority ?? {}).map(([label, value]) => ({
              label,
              value,
              color: priorityColors[label],
            }))}
            title="By Priority"
            donut={true}
            showPercentages={true}
            height={300}
          />
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <BarChart
            data={Object.entries(metrics?.byType ?? {}).map(([label, value]) => ({
              label: label.replace('_', ' '),
              value,
            }))}
            title="By Type"
            height={300}
            color="#6366F1"
            showValues={true}
          />
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Failure Categories */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-lg font-semibold mb-4">Top Failure Categories</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm text-gray-600">Category</th>
                <th className="text-right py-2 text-sm text-gray-600">Count</th>
              </tr>
            </thead>
            <tbody>
              {(metrics?.topFailureCategories ?? []).length > 0 ? (
                (metrics?.topFailureCategories ?? []).slice(0, 10).map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 text-sm">{item.category}</td>
                    <td className="py-2 text-sm text-right font-medium">{item.count}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="py-4 text-center text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Resolution Time by Type */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-lg font-semibold mb-4">Avg Resolution Time by Type</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm text-gray-600">Type</th>
                <th className="text-right py-2 text-sm text-gray-600">Hours</th>
              </tr>
            </thead>
            <tbody>
              {(metrics?.avgResolutionByType ?? []).length > 0 ? (
                (metrics?.avgResolutionByType ?? []).map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 text-sm">{item.type.replace('_', ' ')}</td>
                    <td className="py-2 text-sm text-right font-medium">{item.hours}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="py-4 text-center text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WorkOrderReportsPage;
