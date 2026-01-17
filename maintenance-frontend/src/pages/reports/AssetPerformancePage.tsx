import React, { useState, useEffect } from 'react';
import { BarChart, PieChart, GaugeChart } from '../../components/charts';
import { api } from '../../services/api';

interface AssetPerformanceMetrics {
  summary: {
    totalAssets: number;
    operationalAssets: number;
    underMaintenance: number;
    avgAvailability: number;
    avgReliability: number;
  };
  downtimeByAsset: { assetId: string; assetName: string; downtime: number }[];
  maintenanceCostByAsset: { assetId: string; assetName: string; cost: number }[];
  failureFrequency: { assetId: string; assetName: string; failures: number }[];
  utilizationRates: { assetId: string; assetName: string; utilization: number }[];
  reliabilityScores: { assetId: string; assetName: string; score: number; mtbf: number }[];
}

const AssetPerformancePage: React.FC = () => {
  const [metrics, setMetrics] = useState<AssetPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'downtime' | 'cost' | 'reliability'>('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/analytics/assets/performance');
      setMetrics(response.data.data);
    } catch (error) {
      console.error('Error fetching asset performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    if (!metrics) return;

    const rows = [
      ['Asset Performance Report'],
      [''],
      ['Summary'],
      ['Total Assets', metrics.summary.totalAssets],
      ['Operational', metrics.summary.operationalAssets],
      ['Under Maintenance', metrics.summary.underMaintenance],
      ['Avg Availability (%)', metrics.summary.avgAvailability],
      ['Avg Reliability (%)', metrics.summary.avgReliability],
      [''],
      ['Top Downtime Assets'],
      ['Asset', 'Downtime (hrs)'],
      ...metrics.downtimeByAsset.map(a => [a.assetName, a.downtime]),
      [''],
      ['Maintenance Cost by Asset'],
      ['Asset', 'Cost ($)'],
      ...metrics.maintenanceCostByAsset.map(a => [a.assetName, a.cost]),
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asset-performance-report-${new Date().toISOString().split('T')[0]}.csv`;
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Asset Performance</h1>
          <p className="text-gray-600">Asset reliability, availability and performance metrics</p>
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
          <p className="text-sm text-gray-600">Total Assets</p>
          <p className="text-2xl font-bold text-gray-800">{metrics?.summary?.totalAssets ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Operational</p>
          <p className="text-2xl font-bold text-green-600">{metrics?.summary?.operationalAssets ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Under Maintenance</p>
          <p className="text-2xl font-bold text-orange-600">{metrics?.summary?.underMaintenance ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Avg Availability</p>
          <p className="text-2xl font-bold text-blue-600">{metrics?.summary?.avgAvailability ?? 0}%</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-sm text-gray-600">Avg Reliability</p>
          <p className="text-2xl font-bold text-purple-600">{metrics?.summary?.avgReliability ?? 0}%</p>
        </div>
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-4 flex justify-center">
          <GaugeChart
            value={metrics?.summary?.avgAvailability ?? 0}
            title="Availability"
            label="Average Asset Availability"
            thresholds={{ low: 80, medium: 90, high: 100 }}
            width={180}
            height={130}
          />
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 flex justify-center">
          <GaugeChart
            value={metrics?.summary?.avgReliability ?? 0}
            title="Reliability"
            label="Average Asset Reliability"
            thresholds={{ low: 70, medium: 85, high: 100 }}
            width={180}
            height={130}
          />
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 flex justify-center">
          <GaugeChart
            value={(metrics?.summary?.totalAssets ?? 0) > 0
              ? Math.round(((metrics?.summary?.operationalAssets ?? 0) / (metrics?.summary?.totalAssets ?? 1)) * 100)
              : 0}
            title="Operational Rate"
            label="Assets Currently Operational"
            thresholds={{ low: 70, medium: 85, high: 100 }}
            width={180}
            height={130}
          />
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 flex justify-center">
          <GaugeChart
            value={100 - (metrics?.summary?.underMaintenance ?? 0) / Math.max(metrics?.summary?.totalAssets ?? 1, 1) * 100}
            title="Uptime"
            label="Assets Not in Maintenance"
            thresholds={{ low: 80, medium: 90, high: 100 }}
            width={180}
            height={130}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {(['overview', 'downtime', 'cost', 'reliability'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <PieChart
              data={[
                { label: 'Operational', value: metrics?.summary?.operationalAssets ?? 0, color: '#10B981' },
                { label: 'Under Maintenance', value: metrics?.summary?.underMaintenance ?? 0, color: '#F59E0B' },
                { label: 'Other', value: Math.max(0, (metrics?.summary?.totalAssets ?? 0) - (metrics?.summary?.operationalAssets ?? 0) - (metrics?.summary?.underMaintenance ?? 0)), color: '#6B7280' },
              ]}
              title="Asset Status Distribution"
              donut={true}
              height={300}
            />
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <BarChart
              data={(metrics?.utilizationRates ?? []).slice(0, 8).map(a => ({
                label: a.assetName.length > 15 ? a.assetName.slice(0, 15) + '...' : a.assetName,
                value: a.utilization,
              }))}
              title="Top Asset Utilization Rates"
              height={300}
              color="#6366F1"
              yAxisLabel="Utilization %"
            />
          </div>
        </div>
      )}

      {activeTab === 'downtime' && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-lg font-semibold mb-4">Downtime by Asset</h2>
          <BarChart
            data={(metrics?.downtimeByAsset ?? []).map(a => ({
              label: a.assetName.length > 15 ? a.assetName.slice(0, 15) + '...' : a.assetName,
              value: a.downtime,
            }))}
            height={400}
            color="#EF4444"
            yAxisLabel="Hours"
            showValues={true}
          />
          <table className="w-full mt-6">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm text-gray-600">Asset</th>
                <th className="text-right py-2 text-sm text-gray-600">Downtime (hours)</th>
              </tr>
            </thead>
            <tbody>
              {(metrics?.downtimeByAsset ?? []).map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-2 text-sm">{item.assetName}</td>
                  <td className="py-2 text-sm text-right font-medium">{item.downtime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'cost' && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-lg font-semibold mb-4">Maintenance Cost by Asset</h2>
          <BarChart
            data={(metrics?.maintenanceCostByAsset ?? []).map(a => ({
              label: a.assetName.length > 15 ? a.assetName.slice(0, 15) + '...' : a.assetName,
              value: a.cost,
            }))}
            height={400}
            color="#10B981"
            yAxisLabel="Cost ($)"
            showValues={true}
          />
          <table className="w-full mt-6">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm text-gray-600">Asset</th>
                <th className="text-right py-2 text-sm text-gray-600">Cost ($)</th>
              </tr>
            </thead>
            <tbody>
              {(metrics?.maintenanceCostByAsset ?? []).map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-2 text-sm">{item.assetName}</td>
                  <td className="py-2 text-sm text-right font-medium">${(item.cost ?? 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'reliability' && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-lg font-semibold mb-4">Asset Reliability Scores</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChart
              data={(metrics?.reliabilityScores ?? []).slice(0, 10).map(a => ({
                label: a.assetName.length > 15 ? a.assetName.slice(0, 15) + '...' : a.assetName,
                value: a.score,
              }))}
              height={350}
              color="#8B5CF6"
              yAxisLabel="Score"
              showValues={true}
            />
            <div>
              <BarChart
                data={(metrics?.failureFrequency ?? []).slice(0, 10).map(a => ({
                  label: a.assetName.length > 15 ? a.assetName.slice(0, 15) + '...' : a.assetName,
                  value: a.failures,
                }))}
                title="Failure Frequency"
                height={350}
                color="#EF4444"
                yAxisLabel="Failures"
                showValues={true}
              />
            </div>
          </div>
          <table className="w-full mt-6">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 text-sm text-gray-600">Asset</th>
                <th className="text-right py-2 text-sm text-gray-600">Reliability Score</th>
                <th className="text-right py-2 text-sm text-gray-600">MTBF (hrs)</th>
              </tr>
            </thead>
            <tbody>
              {(metrics?.reliabilityScores ?? []).map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-2 text-sm">{item.assetName}</td>
                  <td className="py-2 text-sm text-right font-medium">
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.score >= 90 ? 'bg-green-100 text-green-800' :
                      item.score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.score}%
                    </span>
                  </td>
                  <td className="py-2 text-sm text-right">{item.mtbf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssetPerformancePage;
