import { useState, useEffect } from 'react';
import { IntegrationConfig, integrationsApi } from '../services/api';
import { IntegrationCard } from '../components/integrations/IntegrationCard';
import { ConnectionWizard } from '../components/integrations/ConnectionWizard';
import { FieldMapper } from '../components/integrations/FieldMapper';
import { SyncLogViewer } from '../components/integrations/SyncLogViewer';

interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning';
  message: string;
}

export const IntegrationsPage = () => {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modal states
  const [showWizard, setShowWizard] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<IntegrationConfig | null>(null);
  const [showFieldMapper, setShowFieldMapper] = useState(false);
  const [mappingIntegration, setMappingIntegration] = useState<IntegrationConfig | null>(null);
  const [showLogViewer, setShowLogViewer] = useState(false);
  const [logViewerIntegration, setLogViewerIntegration] = useState<IntegrationConfig | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const data = await integrationsApi.getAll();
      setIntegrations(data);
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleEdit = (integration: IntegrationConfig) => {
    setEditingIntegration(integration);
    setShowWizard(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await integrationsApi.delete(id);
      showToast('success', 'Integration deleted successfully');
      fetchIntegrations();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Failed to delete integration');
    }
    setShowDeleteConfirm(null);
  };

  const handleViewLogs = (integration: IntegrationConfig) => {
    setLogViewerIntegration(integration);
    setShowLogViewer(true);
  };

  const handleViewMappings = (integration: IntegrationConfig) => {
    setMappingIntegration(integration);
    setShowFieldMapper(true);
  };

  const handleWizardClose = () => {
    setShowWizard(false);
    setEditingIntegration(null);
  };

  const handleWizardSave = () => {
    showToast('success', editingIntegration ? 'Integration updated successfully' : 'Integration created successfully');
    fetchIntegrations();
  };

  const handleFieldMapperSave = () => {
    showToast('success', 'Field mappings saved successfully');
    fetchIntegrations();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ERP Integrations</h1>
          <p className="text-gray-600 mt-1">
            Connect to SAP, Oracle, and other ERP systems to sync data
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Integration
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{integrations.length}</p>
              <p className="text-sm text-gray-500">Total Integrations</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {integrations.filter((i) => i.isActive).length}
              </p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {integrations.filter((i) => i.syncSettings?.autoSync).length}
              </p>
              <p className="text-sm text-gray-500">Auto-Sync Enabled</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {integrations.filter((i) => i.syncStatus === 'failed').length}
              </p>
              <p className="text-sm text-gray-500">Failed Syncs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      {integrations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg
            className="mx-auto h-16 w-16 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No integrations configured</h3>
          <p className="mt-2 text-sm text-gray-500">
            Get started by connecting to your ERP system
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
          >
            Add Your First Integration
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onEdit={handleEdit}
              onDelete={(id) => setShowDeleteConfirm(id)}
              onViewLogs={handleViewLogs}
              onViewMappings={handleViewMappings}
              onRefresh={fetchIntegrations}
            />
          ))}
        </div>
      )}

      {/* Connection Wizard Modal */}
      <ConnectionWizard
        isOpen={showWizard}
        onClose={handleWizardClose}
        onSave={handleWizardSave}
        editingIntegration={editingIntegration}
      />

      {/* Field Mapper Modal */}
      <FieldMapper
        isOpen={showFieldMapper}
        onClose={() => {
          setShowFieldMapper(false);
          setMappingIntegration(null);
        }}
        integration={mappingIntegration}
        onSave={handleFieldMapperSave}
      />

      {/* Sync Log Viewer Modal */}
      <SyncLogViewer
        isOpen={showLogViewer}
        onClose={() => {
          setShowLogViewer(false);
          setLogViewerIntegration(null);
        }}
        integration={logViewerIntegration}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Integration</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this integration? This action cannot be undone and all sync history will be lost.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded shadow-lg flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in-right ${
              toast.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : toast.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
            }`}
          >
            {toast.type === 'success' && (
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-current hover:opacity-70"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
