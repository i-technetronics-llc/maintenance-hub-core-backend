import { useState, useEffect } from 'react';

interface PlatformStats {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  activeUsers: number;
  totalWorkOrders: number;
  totalAssets: number;
  storageUsed: number;
  apiCalls: number;
  companiesByStatus: { status: string; count: number }[];
  usersByRole: { role: string; count: number }[];
  activityByDay: { day: string; logins: number; workOrders: number }[];
  topActiveCompanies: { name: string; users: number; workOrders: number }[];
  regionDistribution: { region: string; companies: number }[];
}

export const PlatformAnalytics = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  const loadStats = async () => {
    try {
      setLoading(true);
      // Simulated data - replace with actual API call
      const mockStats: PlatformStats = {
        totalCompanies: 165,
        activeCompanies: 142,
        totalUsers: 2350,
        activeUsers: 1890,
        totalWorkOrders: 45200,
        totalAssets: 18500,
        storageUsed: 125.6,
        apiCalls: 1250000,
        companiesByStatus: [
          { status: 'Active', count: 142 },
          { status: 'Trial', count: 15 },
          { status: 'Pending', count: 5 },
          { status: 'Suspended', count: 3 },
        ],
        usersByRole: [
          { role: 'Admin', count: 180 },
          { role: 'Technician', count: 850 },
          { role: 'Manager', count: 420 },
          { role: 'Viewer', count: 900 },
        ],
        activityByDay: [
          { day: 'Mon', logins: 1200, workOrders: 450 },
          { day: 'Tue', logins: 1350, workOrders: 520 },
          { day: 'Wed', logins: 1400, workOrders: 480 },
          { day: 'Thu', logins: 1250, workOrders: 510 },
          { day: 'Fri', logins: 1100, workOrders: 420 },
          { day: 'Sat', logins: 450, workOrders: 150 },
          { day: 'Sun', logins: 300, workOrders: 80 },
        ],
        topActiveCompanies: [
          { name: 'Global Manufacturing', users: 125, workOrders: 2500 },
          { name: 'TechStart Inc', users: 95, workOrders: 1800 },
          { name: 'Healthcare Plus', users: 85, workOrders: 1500 },
          { name: 'RetailMax', users: 75, workOrders: 1200 },
          { name: 'Energy Corp', users: 65, workOrders: 980 },
        ],
        regionDistribution: [
          { region: 'North America', companies: 85 },
          { region: 'Europe', companies: 45 },
          { region: 'Asia Pacific', companies: 25 },
          { region: 'Latin America', companies: 10 },
        ],
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load platform stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) return null;

  const maxLogins = Math.max(...stats.activityByDay.map(d => d.logins));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-500">Monitor platform usage and performance</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Companies</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(stats.totalCompanies)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">{stats.activeCompanies} active</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(stats.totalUsers)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">{stats.activeUsers} active</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Work Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(stats.totalWorkOrders)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">All time</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">API Calls</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{(stats.apiCalls / 1000000).toFixed(1)}M</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">This month</p>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity</h3>
        <div className="h-64 flex items-end justify-between gap-4">
          {stats.activityByDay.map((item) => (
            <div key={item.day} className="flex-1 flex flex-col items-center">
              <div className="w-full relative" style={{ height: `${(item.logins / maxLogins) * 100}%`, minHeight: '20px' }}>
                <div className="absolute inset-0 bg-blue-500 rounded-t-lg opacity-70" />
                <div
                  className="absolute bottom-0 left-0 right-0 bg-green-500 rounded-t-lg"
                  style={{ height: `${(item.workOrders / item.logins) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{item.day}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-2" />
            <span className="text-sm text-gray-600">Logins</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2" />
            <span className="text-sm text-gray-600">Work Orders</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Companies by Status */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Companies by Status</h3>
          <div className="space-y-3">
            {stats.companiesByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-gray-600">{item.status}</span>
                <div className="flex items-center">
                  <div className="w-24 h-2 bg-gray-200 rounded-full mr-3">
                    <div
                      className={`h-2 rounded-full ${
                        item.status === 'Active' ? 'bg-green-500' :
                        item.status === 'Trial' ? 'bg-blue-500' :
                        item.status === 'Pending' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(item.count / stats.totalCompanies) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Users by Role */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Users by Role</h3>
          <div className="space-y-3">
            {stats.usersByRole.map((item) => (
              <div key={item.role} className="flex items-center justify-between">
                <span className="text-gray-600">{item.role}</span>
                <div className="flex items-center">
                  <div className="w-24 h-2 bg-gray-200 rounded-full mr-3">
                    <div
                      className="h-2 bg-purple-500 rounded-full"
                      style={{ width: `${(item.count / stats.totalUsers) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{formatNumber(item.count)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Region Distribution */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Companies by Region</h3>
          <div className="space-y-3">
            {stats.regionDistribution.map((item) => (
              <div key={item.region} className="flex items-center justify-between">
                <span className="text-gray-600">{item.region}</span>
                <div className="flex items-center">
                  <div className="w-24 h-2 bg-gray-200 rounded-full mr-3">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${(item.companies / stats.totalCompanies) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.companies}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Active Companies */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active Companies</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Company</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Users</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Work Orders</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {stats.topActiveCompanies.map((company, index) => (
                <tr key={company.name} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 px-4">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">{company.name}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{company.users}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{formatNumber(company.workOrders)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      High
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
