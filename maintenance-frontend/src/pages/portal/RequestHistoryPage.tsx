import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { portalRequestsApi, ServiceRequest } from '../../services/portalApi';

type StatusFilter = 'all' | 'submitted' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled';

export function RequestHistoryPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const loadRequests = async (page = 1, status?: string) => {
    setIsLoading(true);
    try {
      const response = await portalRequestsApi.getAll({
        page,
        limit: pagination.limit,
        status: status && status !== 'all' ? status : undefined,
      });
      setRequests(response.data);
      setPagination({
        page: response.meta.page,
        limit: response.meta.limit,
        total: response.meta.total,
        totalPages: response.meta.totalPages,
      });
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(1, statusFilter);
  }, [statusFilter]);

  const handlePageChange = (newPage: number) => {
    loadRequests(newPage, statusFilter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-700';
      case 'acknowledged':
        return 'bg-purple-100 text-purple-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-orange-600';
      case 'urgent':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusFilters: { value: StatusFilter; label: string; count?: number }[] = [
    { value: 'all', label: 'All Requests' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'acknowledged', label: 'Acknowledged' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
          <p className="text-gray-500 mt-1">View and track all your service requests</p>
        </div>
        <Link
          to="/portal/submit-request"
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Request
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === filter.value
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Request List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : requests.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Request
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Category
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Priority
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-xs font-medium text-blue-600">
                            #{request.requestNumber}
                          </span>
                          <p className="text-sm font-medium text-gray-900 mt-0.5 line-clamp-1">
                            {request.title}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 capitalize">
                          {request.category?.replace(/_/g, ' ') || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-medium capitalize ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {formatStatus(request.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(request.submittedAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/portal/requests/${request.id}`}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {requests.map((request) => (
                <Link
                  key={request.id}
                  to={`/portal/requests/${request.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-blue-600">
                          #{request.requestNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {formatStatus(request.status)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-1 line-clamp-2">
                        {request.title}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="capitalize">{request.category?.replace(/_/g, ' ') || 'General'}</span>
                        <span>&bull;</span>
                        <span className={`font-medium ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </span>
                        <span>&bull;</span>
                        <span>{formatDate(request.submittedAt)}</span>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} requests
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium ${
                            pagination.page === pageNum
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {statusFilter === 'all' ? 'No requests yet' : `No ${formatStatus(statusFilter).toLowerCase()} requests`}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {statusFilter === 'all'
                ? 'Get started by submitting your first service request.'
                : 'Try selecting a different status filter.'}
            </p>
            {statusFilter === 'all' && (
              <Link
                to="/portal/submit-request"
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Submit Request
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
