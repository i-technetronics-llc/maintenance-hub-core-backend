import React, { useState, useEffect } from 'react';
import { GaugeChart, LineChart, BarChart } from '../../components/charts';
import { api } from '../../services/api';

interface KPIData {
  mtbf: number | null;
  mttr: number | null;
  oee: number | null;
  pmCompliance: number;
  workOrderBacklog: number;
  firstTimeFixRate: number;
  technicianUtilization: number;
  inventoryTurnover: number;
  avgCostPerWorkOrder: number;
  assetAvailability: number;
  trends: {
    mtbfTrend: number;
    mttrTrend: number;
    pmComplianceTrend: number;
  };
}

interface TrendData {
  date: string;
  count: number;
}

const KpiDashboardPage: React.FC = () => {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpiResponse, trendResponse] = await Promise.all([
        api.get('/analytics/kpi-dashboard', { params: dateRange }),
        api.get('/analytics/work-orders/trend', { params: { days: 30 } }),
      ]);
      setKpiData(kpiResponse.data.data);
      setTrendData(trendResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const KPICard: React.FC<{
    title: string;
    value: string | number;
    unit?: string;
    trend?: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, unit, trend, icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{title}</span>
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-2xl font-bold text-gray-800">{value}</span>
        {unit && <span className="text-sm text-gray-500 mb-1">{unit}</span>}
      </div>
      {trend !== undefined && (
        <div className={`text-sm mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last period
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
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
          <h1 className="text-2xl font-bold text-gray-800">KPI Dashboard</h1>
          <p className="text-gray-600">Key performance indicators overview</p>
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
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="MTBF (Mean Time Between Failures)"
          value={kpiData?.mtbf ?? 'N/A'}
          unit="hours"
          trend={kpiData?.trends?.mtbfTrend}
          icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="bg-blue-500"
        />
        <KPICard
          title="MTTR (Mean Time To Repair)"
          value={kpiData?.mttr ?? 'N/A'}
          unit="hours"
          trend={kpiData?.trends?.mttrTrend}
          icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          color="bg-orange-500"
        />
        <KPICard
          title="OEE (Overall Equipment Effectiveness)"
          value={kpiData?.oee ?? 'N/A'}
          unit="%"
          icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          color="bg-green-500"
        />
        <KPICard
          title="PM Compliance Rate"
          value={kpiData?.pmCompliance ?? 0}
          unit="%"
          trend={kpiData?.trends?.pmComplianceTrend}
          icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="bg-purple-500"
        />
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Work Order Backlog"
          value={kpiData?.workOrderBacklog ?? 0}
          unit="orders"
          icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          color="bg-red-500"
        />
        <KPICard
          title="First Time Fix Rate"
          value={kpiData?.firstTimeFixRate ?? 0}
          unit="%"
          icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
          color="bg-teal-500"
        />
        <KPICard
          title="Technician Utilization"
          value={kpiData?.technicianUtilization ?? 0}
          unit="%"
          icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          color="bg-indigo-500"
        />
        <KPICard
          title="Asset Availability"
          value={kpiData?.assetAvailability ?? 0}
          unit="%"
          icon={<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>}
          color="bg-cyan-500"
        />
      </div>

      {/* Gauges Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <GaugeChart
            value={kpiData?.oee ?? 0}
            title="OEE"
            label="Overall Equipment Effectiveness"
            thresholds={{ low: 60, medium: 80, high: 100 }}
            width={180}
            height={130}
          />
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <GaugeChart
            value={kpiData?.pmCompliance ?? 0}
            title="PM Compliance"
            label="Preventive Maintenance Compliance"
            thresholds={{ low: 70, medium: 85, high: 100 }}
            width={180}
            height={130}
          />
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <GaugeChart
            value={kpiData?.technicianUtilization ?? 0}
            title="Utilization"
            label="Technician Utilization Rate"
            thresholds={{ low: 50, medium: 75, high: 100 }}
            width={180}
            height={130}
          />
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <GaugeChart
            value={kpiData?.assetAvailability ?? 0}
            title="Availability"
            label="Asset Availability Rate"
            thresholds={{ low: 80, medium: 90, high: 100 }}
            width={180}
            height={130}
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <LineChart
            data={trendData.map(t => ({ label: t.date, value: t.count }))}
            title="Work Order Trend (Last 30 Days)"
            height={280}
            color="#3B82F6"
            showGrid={true}
            showDots={false}
            yAxisLabel="Work Orders"
          />
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <BarChart
            data={[
              { label: 'MTBF', value: kpiData?.mtbf ?? 0 },
              { label: 'MTTR', value: kpiData?.mttr ?? 0 },
              { label: 'Backlog', value: kpiData?.workOrderBacklog ?? 0 },
            ]}
            title="Key Metrics Comparison"
            height={280}
            color="#10B981"
            showValues={true}
          />
        </div>
      </div>

      {/* Cost Metrics */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-lg font-semibold mb-4">Cost Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600">Avg Cost per Work Order</p>
            <p className="text-2xl font-bold text-blue-800">
              ${(kpiData?.avgCostPerWorkOrder ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600">Inventory Turnover</p>
            <p className="text-2xl font-bold text-green-800">
              {kpiData?.inventoryTurnover ?? 0}x
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600">First Time Fix Rate</p>
            <p className="text-2xl font-bold text-purple-800">
              {kpiData?.firstTimeFixRate ?? 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KpiDashboardPage;
