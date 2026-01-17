import { useState, useEffect } from 'react';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  lastTriggered: string | null;
  successCount: number;
  failureCount: number;
  createdAt: string;
}

export const WebhooksPage = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [, setSelectedWebhook] = useState<Webhook | null>(null);
  const [newWebhook, setNewWebhook] = useState<{
    name: string;
    url: string;
    events: string[];
  }>({
    name: '',
    url: '',
    events: [],
  });

  const availableEvents = [
    { code: 'work_order.created', label: 'Work Order Created' },
    { code: 'work_order.updated', label: 'Work Order Updated' },
    { code: 'work_order.completed', label: 'Work Order Completed' },
    { code: 'asset.created', label: 'Asset Created' },
    { code: 'asset.updated', label: 'Asset Updated' },
    { code: 'inventory.low_stock', label: 'Inventory Low Stock' },
    { code: 'pm.due', label: 'PM Schedule Due' },
    { code: 'pm.overdue', label: 'PM Schedule Overdue' },
  ];

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockWebhooks: Webhook[] = [
        {
          id: '1',
          name: 'Slack Notifications',
          url: 'https://hooks.slack.com/services/xxx/yyy/zzz',
          events: ['work_order.created', 'work_order.completed'],
          secret: 'whsec_****',
          isActive: true,
          lastTriggered: new Date(Date.now() - 3600000).toISOString(),
          successCount: 245,
          failureCount: 3,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          name: 'ERP Integration',
          url: 'https://erp.example.com/webhooks/cmms',
          events: ['inventory.low_stock', 'work_order.completed'],
          secret: 'whsec_****',
          isActive: true,
          lastTriggered: new Date(Date.now() - 7200000).toISOString(),
          successCount: 89,
          failureCount: 1,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      setWebhooks(mockWebhooks);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    try {
      const secret = 'whsec_' + Math.random().toString(36).substring(2, 15);
      const webhook: Webhook = {
        id: Date.now().toString(),
        name: newWebhook.name,
        url: newWebhook.url,
        events: newWebhook.events,
        secret,
        isActive: true,
        lastTriggered: null,
        successCount: 0,
        failureCount: 0,
        createdAt: new Date().toISOString(),
      };
      setWebhooks([...webhooks, webhook]);
      setShowCreateModal(false);
      setNewWebhook({ name: '', url: '', events: [] });
    } catch (error) {
      console.error('Failed to create webhook:', error);
    }
  };

  const handleToggleWebhook = (webhook: Webhook) => {
    setWebhooks(webhooks.map(w => w.id === webhook.id ? { ...w, isActive: !w.isActive } : w));
  };

  const handleDeleteWebhook = (webhook: Webhook) => {
    if (confirm(`Are you sure you want to delete the webhook "${webhook.name}"?`)) {
      setWebhooks(webhooks.filter(w => w.id !== webhook.id));
    }
  };

  const handleTestWebhook = async (webhook: Webhook) => {
    alert(`Test payload sent to ${webhook.url}`);
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
              <p className="text-sm text-gray-500">Receive real-time notifications for events</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Webhook
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Webhooks List */}
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${webhook.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div>
                    <h3 className="font-semibold text-gray-900">{webhook.name}</h3>
                    <p className="text-sm text-gray-500 font-mono">{webhook.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestWebhook(webhook)}
                    className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Test
                  </button>
                  <button
                    onClick={() => setSelectedWebhook(webhook)}
                    className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleWebhook(webhook)}
                    className={`px-3 py-1.5 text-sm rounded-lg ${
                      webhook.isActive
                        ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}
                  >
                    {webhook.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDeleteWebhook(webhook)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {webhook.events.map((event) => (
                  <span key={event} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                    {availableEvents.find(e => e.code === event)?.label || event}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {webhook.successCount} successful
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {webhook.failureCount} failed
                </div>
                <div>
                  Last triggered: {webhook.lastTriggered ? new Date(webhook.lastTriggered).toLocaleString() : 'Never'}
                </div>
              </div>
            </div>
          ))}

          {webhooks.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Webhooks Configured</h3>
              <p className="text-gray-500 mb-4">Add a webhook to receive real-time notifications.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Your First Webhook
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Create Webhook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Webhook</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  placeholder="e.g., Slack Notifications"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
                <input
                  type="url"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  placeholder="https://example.com/webhook"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Events</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableEvents.map((event) => (
                    <label key={event.code} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newWebhook.events.includes(event.code)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewWebhook({ ...newWebhook, events: [...newWebhook.events, event.code] });
                          } else {
                            setNewWebhook({ ...newWebhook, events: newWebhook.events.filter(ev => ev !== event.code) });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewWebhook({ name: '', url: '', events: [] });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWebhook}
                  disabled={!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Webhook
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhooksPage;
