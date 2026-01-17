import { useState, useEffect } from 'react';

interface KpiData {
  mtbf: { value: number; unit: string; trend: number };
  mttr: { value: number; unit: string; trend: number };
  oee: { value: number; trend: number };
  pmCompliance: { value: number; trend: number };
  firstTimeFixRate: { value: number; trend: number };
  workOrderCompletionRate: { value: number; trend: number };
  assetUptime: { value: number; trend: number };
  maintenanceCostPerAsset: { value: number; trend: number };
  backlogWork: { hours: number; orders: number };
  scheduledVsUnscheduled: { scheduled: number; unscheduled: number };
}

export const KpiDashboardPage = () => {
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadKpiData();
  }, [period]);

  const loadKpiData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockData: KpiData = {
        mtbf: { value: 245, unit: 'hours', trend: 5.2 },
        mttr: { value: 2.5, unit: 'hours', trend: -8.3 },
        oee: { value: 78.5, trend: 3.1 },
        pmCompliance: { value: 92, trend: 2.5 },
        firstTimeFixRate: { value: 85, trend: 1.8 },
        workOrderCompletionRate: { value: 94, trend: 0.5 },
        assetUptime: { value: 97.5, trend: 0.3 },
        maintenanceCostPerAsset: { value: 1250, trend: -5.2 },
        backlogWork: { hours: 156, orders: 23 },
        scheduledVsUnscheduled: { scheduled: 72, unscheduled: 28 },
      };
      setData(mockData);
    } catch (error) {
      console.error('Failed to load KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTrend = (trend: number) => {
    const isPositive = trend > 0;
    return (
      <span className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        <svg className={`w-4 h-4 mr-1 ${isPositive ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        {Math.abs(trend)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">KPI Dashboard</h1>
              <p className="text-sm text-gray-500">Key performance indicators for maintenance operations</p>
            </div>
            <div className="flex gap-2">
              {(['week', 'month', 'quarter', 'year'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    period === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Primary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* MTBF */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {formatTrend(data.mtbf.trend)}
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">MTBF (Mean Time Between Failures)</h3>
            <p className="text-3xl font-bold text-gray-900">{data.mtbf.value} <span className="text-lg text-gray-500">{data.mtbf.unit}</span></p>
            <p className="text-xs text-gray-400 mt-2">Higher is better</p>
          </div>

          {/* MTTR */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              {formatTrend(data.mttr.trend)}
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">MTTR (Mean Time To Repair)</h3>
            <p className="text-3xl font-bold text-gray-900">{data.mttr.value} <span className="text-lg text-gray-500">{data.mttr.unit}</span></p>
            <p className="text-xs text-gray-400 mt-2">Lower is better</p>
          </div>

          {/* OEE */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              {formatTrend(data.oee.trend)}
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">OEE (Overall Equipment Effectiveness)</h3>
            <p className="text-3xl font-bold text-gray-900">{data.oee.value}%</p>
            <div className="mt-2 w-full h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-purple-500 rounded-full" style={{ width: `${data.oee.value}%` }} />
            </div>
          </div>

          {/* PM Compliance */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {formatTrend(data.pmCompliance.trend)}
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">PM Compliance Rate</h3>
            <p className="text-3xl font-bold text-gray-900">{data.pmCompliance.value}%</p>
            <div className="mt-2 w-full h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-orange-500 rounded-full" style={{ width: `${data.pmCompliance.value}%` }} />
            </div>
          </div>
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">First Time Fix Rate</h3>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-gray-900">{data.firstTimeFixRate.value}%</p>
              {formatTrend(data.firstTimeFixRate.trend)}
            </div>
            <div className="mt-2 w-full h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-green-500 rounded-full" style={{ width: `${data.firstTimeFixRate.value}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Work Order Completion Rate</h3>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-gray-900">{data.workOrderCompletionRate.value}%</p>
              {formatTrend(data.workOrderCompletionRate.trend)}
            </div>
            <div className="mt-2 w-full h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${data.workOrderCompletionRate.value}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Asset Uptime</h3>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-gray-900">{data.assetUptime.value}%</p>
              {formatTrend(data.assetUptime.trend)}
            </div>
            <div className="mt-2 w-full h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-green-500 rounded-full" style={{ width: `${data.assetUptime.value}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Maintenance Cost / Asset</h3>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-gray-900">${data.maintenanceCostPerAsset.value}</p>
              {formatTrend(data.maintenanceCostPerAsset.trend)}
            </div>
            <p className="text-xs text-gray-400 mt-2">Per month average</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scheduled vs Unscheduled */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduled vs Unscheduled Maintenance</h3>
            <div className="flex items-center justify-center py-8">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="12" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="12"
                    strokeDasharray={`${data.scheduledVsUnscheduled.scheduled * 2.51} 251`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{data.scheduledVsUnscheduled.scheduled}%</p>
                    <p className="text-sm text-gray-500">Scheduled</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-6">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded mr-2" />
                <span className="text-sm text-gray-600">Scheduled ({data.scheduledVsUnscheduled.scheduled}%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-300 rounded mr-2" />
                <span className="text-sm text-gray-600">Unscheduled ({data.scheduledVsUnscheduled.unscheduled}%)</span>
              </div>
            </div>
          </div>

          {/* Backlog */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Backlog</h3>
            <div className="space-y-6">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">Open Work Orders</p>
                    <p className="text-3xl font-bold text-yellow-900">{data.backlogWork.orders}</p>
                  </div>
                  <svg className="w-12 h-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-800 font-medium">Estimated Backlog Hours</p>
                    <p className="text-3xl font-bold text-orange-900">{data.backlogWork.hours}</p>
                  </div>
                  <svg className="w-12 h-12 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Average: {(data.backlogWork.hours / data.backlogWork.orders).toFixed(1)} hours per work order
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default KpiDashboardPage;
