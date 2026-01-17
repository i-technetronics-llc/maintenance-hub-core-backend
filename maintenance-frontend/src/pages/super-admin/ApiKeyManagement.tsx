import { useState, useEffect } from 'react';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  companyId: string;
  companyName: string;
  permissions: string[];
  rateLimit: number;
  usageCount: number;
  lastUsed: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export const ApiKeyManagement = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setShowCreateModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      // Mock data - replace with API call
      const mockKeys: ApiKey[] = [
        {
          id: '1',
          name: 'Production API',
          keyPrefix: 'cmms_prod_****',
          companyId: 'c1',
          companyName: 'Acme Corp',
          permissions: ['read:assets', 'read:work-orders', 'write:work-orders'],
          rateLimit: 1000,
          usageCount: 45620,
          lastUsed: new Date(Date.now() - 3600000).toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          name: 'Integration Key',
          keyPrefix: 'cmms_int_****',
          companyId: 'c2',
          companyName: 'TechStart Inc',
          permissions: ['read:assets', 'read:inventory'],
          rateLimit: 500,
          usageCount: 12350,
          lastUsed: new Date(Date.now() - 7200000).toISOString(),
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          name: 'Mobile App Key',
          keyPrefix: 'cmms_mob_****',
          companyId: 'c3',
          companyName: 'Global Manufacturing',
          permissions: ['read:assets', 'read:work-orders', 'write:work-orders', 'read:inventory'],
          rateLimit: 2000,
          usageCount: 89450,
          lastUsed: new Date(Date.now() - 900000).toISOString(),
          expiresAt: null,
          isActive: true,
          createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          name: 'Test Environment',
          keyPrefix: 'cmms_test_****',
          companyId: 'c1',
          companyName: 'Acme Corp',
          permissions: ['read:assets'],
          rateLimit: 100,
          usageCount: 250,
          lastUsed: new Date(Date.now() - 86400000).toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: false,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      setApiKeys(mockKeys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (key: ApiKey) => {
    setApiKeys(apiKeys.map(k => k.id === key.id ? { ...k, isActive: !k.isActive } : k));
  };

  const handleRevoke = async (key: ApiKey) => {
    if (confirm(`Are you sure you want to revoke the API key "${key.name}"?`)) {
      setApiKeys(apiKeys.filter(k => k.id !== key.id));
    }
  };

  const filteredKeys = apiKeys
    .filter(key => {
      if (filter === 'active') return key.isActive;
      if (filter === 'inactive') return !key.isActive;
      return true;
    })
    .filter(key =>
      key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Key Management</h1>
          <p className="text-gray-500">Manage and monitor API keys across the platform</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Generate New Key
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Total API Keys</p>
          <p className="text-2xl font-bold text-gray-900">{apiKeys.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Active Keys</p>
          <p className="text-2xl font-bold text-green-600">{apiKeys.filter(k => k.isActive).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Total API Calls</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(apiKeys.reduce((a, k) => a + k.usageCount, 0))}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Companies with API Access</p>
          <p className="text-2xl font-bold text-gray-900">{new Set(apiKeys.map(k => k.companyId)).size}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by name or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 max-w-md px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f ? 'bg-white shadow text-gray-900' : 'text-gray-600'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* API Keys Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Company</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Key</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Usage</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Last Used</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredKeys.map((key) => (
              <tr key={key.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-gray-900">{key.name}</p>
                    <p className="text-sm text-gray-500">{key.permissions.length} permissions</p>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">{key.companyName}</td>
                <td className="py-3 px-4">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{key.keyPrefix}</code>
                </td>
                <td className="py-3 px-4 text-right">
                  <p className="font-medium text-gray-900">{formatNumber(key.usageCount)}</p>
                  <p className="text-sm text-gray-500">{key.rateLimit}/min limit</p>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {key.lastUsed ? new Date(key.lastUsed).toLocaleString() : 'Never'}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    key.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {key.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedKey(key)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                      title="View Details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggleStatus(key)}
                      className={`p-2 hover:bg-gray-100 rounded-lg ${key.isActive ? 'text-yellow-600' : 'text-green-600'}`}
                      title={key.isActive ? 'Disable' : 'Enable'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {key.isActive ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        )}
                      </svg>
                    </button>
                    <button
                      onClick={() => handleRevoke(key)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                      title="Revoke"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredKeys.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No API keys found
          </div>
        )}
      </div>

      {/* Key Details Modal */}
      {selectedKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedKey.name}</h3>
                  <p className="text-sm text-gray-500">{selectedKey.companyName}</p>
                </div>
                <button onClick={() => setSelectedKey(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700">API Key</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-gray-100 px-3 py-2 rounded-lg text-sm">{selectedKey.keyPrefix}</code>
                  <button className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm">
                    Copy Full Key
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Permissions</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedKey.permissions.map((perm) => (
                    <span key={perm} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Rate Limit</p>
                  <p className="text-gray-900">{selectedKey.rateLimit} requests/min</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Usage</p>
                  <p className="text-gray-900">{formatNumber(selectedKey.usageCount)} requests</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Created</p>
                  <p className="text-gray-900">{new Date(selectedKey.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Expires</p>
                  <p className="text-gray-900">
                    {selectedKey.expiresAt ? new Date(selectedKey.expiresAt).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedKey(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => handleRevoke(selectedKey)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Revoke Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
