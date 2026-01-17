import { useState, useEffect } from 'react';
import { auditApi, AuditLog } from '../services/api';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN: 'bg-purple-100 text-purple-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  VIEW: 'bg-indigo-100 text-indigo-800',
  EXPORT: 'bg-yellow-100 text-yellow-800',
  IMPORT: 'bg-orange-100 text-orange-800',
};

export default function AuditTrailPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actions, setActions] = useState<string[]>([]);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, itemsPerPage, searchQuery, selectedAction, selectedEntityType, startDate, endDate]);

  const fetchFilters = async () => {
    try {
      const [actionsData, entityTypesData] = await Promise.all([
        auditApi.getActions(),
        auditApi.getEntityTypes(),
      ]);
      setActions(actionsData);
      setEntityTypes(entityTypesData);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const result = await auditApi.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        action: selectedAction || undefined,
        entityType: selectedEntityType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setAuditLogs(result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotalItems(result.total || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    return ACTION_COLORS[action?.toUpperCase()] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedAction('');
    setSelectedEntityType('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      <div className="flex items-center">
        <p className="text-sm text-gray-700">
          Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
          <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
          <span className="font-medium">{totalItems}</span> results
        </p>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
        <nav className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50"
          >
            Last
          </button>
        </nav>
      </div>
    </div>
  );

  if (loading && auditLogs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Audit Trail</h2>
        <p className="text-gray-600">View system activity and user actions</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <input
              type="text"
              placeholder="Search audit logs..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              {actions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>

          {/* Entity Type Filter */}
          <div>
            <select
              value={selectedEntityType}
              onChange={(e) => {
                setSelectedEntityType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Entity Types</option>
              {entityTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Start Date"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="End Date"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Reset Filters */}
        {(searchQuery || selectedAction || selectedEntityType || startDate || endDate) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log) => (
                <tr key={log.auditId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.user ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {log.user.firstName} {log.user.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{log.user.email}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Unknown User</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {log.entityType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {log.entityId ? log.entityId.slice(0, 8) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ipAddress || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleViewDetails(log)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {renderPagination()}
      </div>

      {auditLogs.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs found</h3>
          <p className="mt-1 text-sm text-gray-500">No activity has been recorded yet.</p>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowDetailModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Audit Log Details</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Timestamp</label>
                      <p className="text-gray-900">{formatDate(selectedLog.timestamp)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Action</label>
                      <p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(selectedLog.action)}`}>
                          {selectedLog.action}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">User</label>
                      <p className="text-gray-900">
                        {selectedLog.user ? `${selectedLog.user.firstName} ${selectedLog.user.lastName}` : 'Unknown'}
                      </p>
                      {selectedLog.user && (
                        <p className="text-sm text-gray-500">{selectedLog.user.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Entity Type</label>
                      <p className="text-gray-900">{selectedLog.entityType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Entity ID</label>
                      <p className="text-gray-900 font-mono text-sm">{selectedLog.entityId || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">IP Address</label>
                      <p className="text-gray-900">{selectedLog.ipAddress || '-'}</p>
                    </div>
                  </div>

                  {selectedLog.userAgent && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">User Agent</label>
                      <p className="text-gray-900 text-sm break-all">{selectedLog.userAgent}</p>
                    </div>
                  )}

                  {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-2">Changes</label>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(selectedLog.changes, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
