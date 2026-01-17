import { useState, useEffect } from 'react';

interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  mrr: number;
  arr: number;
  growth: number;
  revenueByPlan: { plan: string; revenue: number; subscribers: number }[];
  revenueHistory: { month: string; revenue: number }[];
  topCompanies: { name: string; revenue: number; plan: string }[];
}

export const RevenueDashboard = () => {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadRevenueData();
  }, [period]);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      // Simulated data - replace with actual API call
      const mockData: RevenueData = {
        totalRevenue: 125000,
        monthlyRevenue: 15000,
        yearlyRevenue: 125000,
        mrr: 15000,
        arr: 180000,
        growth: 12.5,
        revenueByPlan: [
          { plan: 'Enterprise', revenue: 75000, subscribers: 15 },
          { plan: 'Professional', revenue: 35000, subscribers: 50 },
          { plan: 'Starter', revenue: 15000, subscribers: 100 },
        ],
        revenueHistory: [
          { month: 'Jan', revenue: 10000 },
          { month: 'Feb', revenue: 11000 },
          { month: 'Mar', revenue: 12000 },
          { month: 'Apr', revenue: 13000 },
          { month: 'May', revenue: 14000 },
          { month: 'Jun', revenue: 15000 },
        ],
        topCompanies: [
          { name: 'Acme Corp', revenue: 5000, plan: 'Enterprise' },
          { name: 'TechStart Inc', revenue: 3500, plan: 'Enterprise' },
          { name: 'Global Manufacturing', revenue: 3000, plan: 'Professional' },
          { name: 'HealthCare Plus', revenue: 2500, plan: 'Professional' },
          { name: 'RetailMax', revenue: 2000, plan: 'Professional' },
        ],
      };
      setData(mockData);
    } catch (error) {
      console.error('Failed to load revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) return null;

  const maxRevenue = Math.max(...data.revenueHistory.map(h => h.revenue));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h1>
          <p className="text-gray-500">Track and analyze platform revenue</p>
        </div>
        <div className="flex gap-2">
          {(['month', 'quarter', 'year'] as const).map((p) => (
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm font-medium text-gray-500">Monthly Recurring Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(data.mrr)}</p>
          <div className="flex items-center mt-2">
            <span className="text-green-600 text-sm font-medium flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {data.growth}%
            </span>
            <span className="text-gray-400 text-sm ml-2">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm font-medium text-gray-500">Annual Recurring Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(data.arr)}</p>
          <p className="text-gray-400 text-sm mt-2">Based on current MRR</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm font-medium text-gray-500">Total Revenue (YTD)</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(data.yearlyRevenue)}</p>
          <p className="text-gray-400 text-sm mt-2">Year to date</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm font-medium text-gray-500">Avg Revenue Per Account</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {formatCurrency(data.mrr / data.revenueByPlan.reduce((a, b) => a + b.subscribers, 0))}
          </p>
          <p className="text-gray-400 text-sm mt-2">Per month</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
        <div className="h-64 flex items-end justify-between gap-4">
          {data.revenueHistory.map((item) => (
            <div key={item.month} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}
              />
              <p className="text-xs text-gray-500 mt-2">{item.month}</p>
              <p className="text-xs font-medium text-gray-700">{formatCurrency(item.revenue)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Plan</h3>
          <div className="space-y-4">
            {data.revenueByPlan.map((plan) => (
              <div key={plan.plan} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{plan.plan}</p>
                  <p className="text-sm text-gray-500">{plan.subscribers} subscribers</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(plan.revenue)}</p>
                  <p className="text-sm text-gray-500">
                    {((plan.revenue / data.totalRevenue) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Companies */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Revenue Companies</h3>
          <div className="space-y-3">
            {data.topCompanies.map((company, index) => (
              <div key={company.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mr-3">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{company.name}</p>
                    <p className="text-sm text-gray-500">{company.plan}</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">{formatCurrency(company.revenue)}/mo</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
