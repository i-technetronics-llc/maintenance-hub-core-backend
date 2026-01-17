import { useState } from 'react';
import { IntegrationConfig, integrationsApi, ConnectionTestResult } from '../../services/api';

interface IntegrationCardProps {
  integration: IntegrationConfig;
  onEdit: (integration: IntegrationConfig) => void;
  onDelete: (id: string) => void;
  onViewLogs: (integration: IntegrationConfig) => void;
  onViewMappings: (integration: IntegrationConfig) => void;
  onRefresh: () => void;
}

const INTEGRATION_ICONS: Record<string, string> = {
  sap: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  oracle: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
  dynamics: 'M3 3h18v18H3V3zm16 16V5H5v14h14z',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  idle: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  running: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  success: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  failed: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  partial: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
};

export const IntegrationCard = ({
  integration,
  onEdit,
  onDelete,
  onViewLogs,
  onViewMappings,
  onRefresh,
}: IntegrationCardProps) => {
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await integrationsApi.testConnection(integration.id);
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.response?.data?.message || 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await integrationsApi.triggerSync(integration.id);
      onRefresh();
    } catch (error: any) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      await integrationsApi.update(integration.id, { isActive: !integration.isActive });
      onRefresh();
    } catch (error: any) {
      console.error('Toggle failed:', error);
    }
  };

  const statusColors = STATUS_COLORS[integration.syncStatus] || STATUS_COLORS.idle;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              integration.type === 'sap' ? 'bg-blue-100' :
              integration.type === 'oracle' ? 'bg-red-100' : 'bg-purple-100'
            }`}>
              <svg
                className={`w-6 h-6 ${
                  integration.type === 'sap' ? 'text-blue-600' :
                  integration.type === 'oracle' ? 'text-red-600' : 'text-purple-600'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={INTEGRATION_ICONS[integration.type]}
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{integration.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{integration.type.toUpperCase()}</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => { onEdit(integration); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Edit Configuration
                </button>
                <button
                  onClick={() => { onViewMappings(integration); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Field Mappings
                </button>
                <button
                  onClick={() => { onViewLogs(integration); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  View Sync Logs
                </button>
                <button
                  onClick={() => { handleToggleActive(); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  {integration.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => { onDelete(integration.id); setShowMenu(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {integration.description && (
          <p className="mt-2 text-sm text-gray-600">{integration.description}</p>
        )}
      </div>

      {/* Status */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot} ${integration.syncStatus === 'running' ? 'animate-pulse' : ''}`} />
              {integration.syncStatus.charAt(0).toUpperCase() + integration.syncStatus.slice(1)}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              integration.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {integration.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            Last sync: {formatDate(integration.lastSyncAt)}
          </span>
        </div>

        {integration.lastSyncError && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
            {integration.lastSyncError}
          </div>
        )}
      </div>

      {/* Sync Settings */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Sync Settings</h4>
        <div className="flex flex-wrap gap-2">
          {integration.syncSettings?.syncAssets && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">Assets</span>
          )}
          {integration.syncSettings?.syncInventory && (
            <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">Inventory</span>
          )}
          {integration.syncSettings?.syncWorkOrders && (
            <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">Work Orders</span>
          )}
          {integration.syncSettings?.syncPurchaseOrders && (
            <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded">Purchase Orders</span>
          )}
          {integration.syncSettings?.autoSync && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              Auto: {integration.syncSettings.syncInterval}min
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      {integration.lastSyncStats && (
        <div className="px-4 py-3 border-b border-gray-100">
          <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Last Sync Stats</h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {(integration.lastSyncStats.assetsCreated || 0) + (integration.lastSyncStats.assetsUpdated || 0)}
              </p>
              <p className="text-xs text-gray-500">Assets</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {(integration.lastSyncStats.inventoryCreated || 0) + (integration.lastSyncStats.inventoryUpdated || 0)}
              </p>
              <p className="text-xs text-gray-500">Inventory</p>
            </div>
            <div>
              <p className={`text-lg font-semibold ${integration.lastSyncStats.errors ? 'text-red-600' : 'text-gray-900'}`}>
                {integration.lastSyncStats.errors || 0}
              </p>
              <p className="text-xs text-gray-500">Errors</p>
            </div>
          </div>
        </div>
      )}

      {/* Test Result */}
      {testResult && (
        <div className={`px-4 py-3 ${testResult.success ? 'bg-green-50' : 'bg-red-50'} border-b border-gray-100`}>
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
              {testResult.message}
            </span>
            {testResult.responseTimeMs && (
              <span className="text-xs text-gray-500">({testResult.responseTimeMs}ms)</span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex gap-2">
        <button
          onClick={handleTestConnection}
          disabled={testing}
          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {testing ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          Test
        </button>
        <button
          onClick={handleSync}
          disabled={syncing || !integration.isActive}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {syncing ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Sync Now
        </button>
      </div>
    </div>
  );
};
