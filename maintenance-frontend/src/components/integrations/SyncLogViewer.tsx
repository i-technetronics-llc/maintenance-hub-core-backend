import { useState, useEffect } from 'react';
import { IntegrationConfig, IntegrationLog, integrationsApi, SyncDirection, SyncLogStatus } from '../../services/api';

interface SyncLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
  integration: IntegrationConfig | null;
}

const STATUS_STYLES: Record<SyncLogStatus, { bg: string; text: string; icon: string }> = {
  success: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  failed: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  partial: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  skipped: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
};

const DIRECTION_STYLES: Record<SyncDirection, { bg: string; text: string; label: string }> = {
  inbound: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Inbound' },
  outbound: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Outbound' },
};

export const SyncLogViewer = ({
  isOpen,
  onClose,
  integration,
}: SyncLogViewerProps) => {
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<IntegrationLog | null>(null);
  const [filters, setFilters] = useState({
    direction: '' as SyncDirection | '',
    entityType: '',
    status: '' as SyncLogStatus | '',
  });

  useEffect(() => {
    if (integration && isOpen) {
      fetchLogs();
    }
  }, [integration, isOpen, filters]);

  const fetchLogs = async () => {
    if (!integration) return;

    setLoading(true);
    try {
      const data = await integrationsApi.getLogs(integration.id, {
        direction: filters.direction || undefined,
        entityType: filters.entityType || undefined,
        status: filters.status || undefined,
        limit: 100,
      });
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (!isOpen || !integration) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Sync Logs</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {integration.name} - View synchronization history
                </p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-4 items-center">
              <select
                value={filters.direction}
                onChange={(e) => setFilters({ ...filters, direction: e.target.value as SyncDirection | '' })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Directions</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>

              <select
                value={filters.entityType}
                onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Entity Types</option>
                <option value="asset">Assets</option>
                <option value="inventory">Inventory</option>
                <option value="work_order">Work Orders</option>
                <option value="purchase_order">Purchase Orders</option>
                <option value="connection_test">Connection Tests</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as SyncLogStatus | '' })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="partial">Partial</option>
                <option value="skipped">Skipped</option>
              </select>

              <button
                onClick={fetchLogs}
                className="px-3 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Logs List */}
            <div className={`${selectedLog ? 'w-1/2' : 'w-full'} overflow-y-auto border-r border-gray-200`}>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>No sync logs found</p>
                  <p className="text-sm">Trigger a sync to see logs here</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {logs.map((log) => {
                    const statusStyle = STATUS_STYLES[log.status] || STATUS_STYLES.skipped;
                    const directionStyle = DIRECTION_STYLES[log.direction] || DIRECTION_STYLES.inbound;

                    return (
                      <button
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 ${
                          selectedLog?.id === log.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <svg className={`w-5 h-5 ${statusStyle.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={statusStyle.icon} />
                            </svg>
                            <div>
                              <span className="font-medium text-gray-900 capitalize">
                                {log.entityType.replace('_', ' ')}
                              </span>
                              <div className="flex gap-2 mt-1">
                                <span className={`px-2 py-0.5 text-xs rounded ${directionStyle.bg} ${directionStyle.text}`}>
                                  {directionStyle.label}
                                </span>
                                <span className={`px-2 py-0.5 text-xs rounded ${statusStyle.bg} ${statusStyle.text}`}>
                                  {log.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div>{formatDate(log.createdAt)}</div>
                            <div>{formatDuration(log.durationMs)}</div>
                          </div>
                        </div>
                        {log.recordsProcessed > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            {log.recordsProcessed} records processed
                            {log.recordsWithErrors > 0 && (
                              <span className="text-red-600"> ({log.recordsWithErrors} errors)</span>
                            )}
                          </div>
                        )}
                        {log.errorMessage && (
                          <div className="mt-2 text-sm text-red-600 truncate">
                            {log.errorMessage}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Log Details */}
            {selectedLog && (
              <div className="w-1/2 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Log Details</h3>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Basic Information</h4>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Entity Type</dt>
                        <dd className="font-medium capitalize">{selectedLog.entityType.replace('_', ' ')}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Direction</dt>
                        <dd className="font-medium capitalize">{selectedLog.direction}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Status</dt>
                        <dd className="font-medium capitalize">{selectedLog.status}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Duration</dt>
                        <dd className="font-medium">{formatDuration(selectedLog.durationMs)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Timestamp</dt>
                        <dd className="font-medium">{formatDate(selectedLog.createdAt)}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Records */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Records</h4>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-white p-3 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{selectedLog.recordsProcessed}</div>
                        <div className="text-sm text-gray-500">Processed</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <div className={`text-2xl font-bold ${selectedLog.recordsWithErrors > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {selectedLog.recordsWithErrors}
                        </div>
                        <div className="text-sm text-gray-500">Errors</div>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {selectedLog.errorMessage && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-red-700 mb-2">Error Message</h4>
                      <p className="text-sm text-red-600">{selectedLog.errorMessage}</p>
                    </div>
                  )}

                  {/* Request */}
                  {selectedLog.request && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Request</h4>
                      <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
                        {JSON.stringify(selectedLog.request, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Response */}
                  {selectedLog.response && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Response</h4>
                      <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
                        {JSON.stringify(selectedLog.response, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Showing {logs.length} log entries
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
