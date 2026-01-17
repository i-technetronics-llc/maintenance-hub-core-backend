import { useState, useEffect } from 'react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  usageCount: number;
  lastUsed: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export const ApiKeysPage = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState<{ name: string; permissions: string[]; expiresInDays: number | null }>({
    name: '',
    permissions: [],
    expiresInDays: null,
  });
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const availablePermissions = [
    { code: 'read:assets', label: 'Read Assets' },
    { code: 'write:assets', label: 'Write Assets' },
    { code: 'read:work-orders', label: 'Read Work Orders' },
    { code: 'write:work-orders', label: 'Write Work Orders' },
    { code: 'read:inventory', label: 'Read Inventory' },
    { code: 'write:inventory', label: 'Write Inventory' },
    { code: 'read:users', label: 'Read Users' },
    { code: 'read:reports', label: 'Read Reports' },
  ];

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockKeys: ApiKey[] = [
        {
          id: '1',
          name: 'Production Integration',
          key: '',
          keyPrefix: 'cmms_****_prod',
          permissions: ['read:assets', 'read:work-orders', 'write:work-orders'],
          rateLimit: 1000,
          usageCount: 15420,
          lastUsed: new Date(Date.now() - 3600000).toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          name: 'Mobile App',
          key: '',
          keyPrefix: 'cmms_****_mob',
          permissions: ['read:assets', 'read:work-orders'],
          rateLimit: 500,
          usageCount: 8350,
          lastUsed: new Date(Date.now() - 1800000).toISOString(),
          expiresAt: null,
          isActive: true,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      setApiKeys(mockKeys);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    try {
      // Mock key generation - replace with actual API call
      const generatedKey = 'cmms_' + Math.random().toString(36).substring(2, 15) + '_' + Math.random().toString(36).substring(2, 8);
      setCreatedKey(generatedKey);

      const newApiKey: ApiKey = {
        id: Date.now().toString(),
        name: newKey.name,
        key: '',
        keyPrefix: 'cmms_****_' + generatedKey.slice(-4),
        permissions: newKey.permissions,
        rateLimit: 1000,
        usageCount: 0,
        lastUsed: null,
        expiresAt: newKey.expiresInDays
          ? new Date(Date.now() + newKey.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
          : null,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      setApiKeys([...apiKeys, newApiKey]);
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const handleRevokeKey = async (key: ApiKey) => {
    if (confirm(`Are you sure you want to revoke the API key "${key.name}"? This action cannot be undone.`)) {
      setApiKeys(apiKeys.filter(k => k.id !== key.id));
    }
  };

  const handleToggleKey = async (key: ApiKey) => {
    setApiKeys(apiKeys.map(k => k.id === key.id ? { ...k, isActive: !k.isActive } : k));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
              <p className="text-sm text-gray-500">Manage your API keys for external integrations</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate New Key
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* API Documentation Link */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-medium text-blue-900">API Documentation</h3>
              <p className="text-sm text-blue-700 mt-1">
                View our API documentation to learn how to integrate with your systems.
              </p>
              <a href="/api/docs" className="text-sm font-medium text-blue-600 hover:underline mt-2 inline-block">
                View Documentation
              </a>
            </div>
          </div>
        </div>

        {/* API Keys List */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Key</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Permissions</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Usage</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Last Used</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {apiKeys.map((key) => (
                <tr key={key.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{key.name}</p>
                    <p className="text-sm text-gray-500">
                      Created {new Date(key.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{key.keyPrefix}</code>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {key.permissions.slice(0, 2).map((perm) => (
                        <span key={perm} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                          {perm}
                        </span>
                      ))}
                      {key.permissions.length > 2 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          +{key.permissions.length - 2} more
                        </span>
                      )}
                    </div>
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
                      {key.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleKey(key)}
                        className={`p-2 rounded-lg ${
                          key.isActive ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'
                        }`}
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
                        onClick={() => handleRevokeKey(key)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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

          {apiKeys.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-2">No API Keys</p>
              <p className="text-gray-500">Generate your first API key to start integrating.</p>
            </div>
          )}
        </div>
      </main>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Generate New API Key</h3>
            </div>

            {createdKey ? (
              <div className="p-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="font-medium text-green-900">API Key Created Successfully</p>
                      <p className="text-sm text-green-700 mt-1">
                        Copy your API key now. You won't be able to see it again.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your API Key</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
                      {createdKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(createdKey)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreatedKey(null);
                    setNewKey({ name: '', permissions: [], expiresInDays: null });
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
                  <input
                    type="text"
                    value={newKey.name}
                    onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                    placeholder="e.g., Production Integration"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availablePermissions.map((perm) => (
                      <label key={perm.code} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newKey.permissions.includes(perm.code)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewKey({ ...newKey, permissions: [...newKey.permissions, perm.code] });
                            } else {
                              setNewKey({ ...newKey, permissions: newKey.permissions.filter(p => p !== perm.code) });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiration</label>
                  <select
                    value={newKey.expiresInDays?.toString() || ''}
                    onChange={(e) => setNewKey({ ...newKey, expiresInDays: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Never expires</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="180">180 days</option>
                    <option value="365">1 year</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateKey}
                    disabled={!newKey.name || newKey.permissions.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Generate Key
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeysPage;
