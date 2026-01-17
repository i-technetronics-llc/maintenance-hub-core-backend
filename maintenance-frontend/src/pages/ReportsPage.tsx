import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  reportsApi,
  SavedReport,
  ReportExecutionResult,
  DataSourceColumn,
} from '../services/api';
import { ReportPreview, SimpleChart } from '../components/reports';

const REPORT_TYPE_LABELS: Record<string, string> = {
  asset: 'Asset Report',
  work_order: 'Work Order Report',
  inventory: 'Inventory Report',
  preventive_maintenance: 'PM Report',
  cost: 'Cost Report',
  performance: 'Performance Report',
  compliance: 'Compliance Report',
  custom: 'Custom Report',
};

const DATA_SOURCE_LABELS: Record<string, string> = {
  work_order: 'Work Orders',
  asset: 'Assets',
  inventory: 'Inventory',
  preventive_maintenance: 'PM Schedules',
  custom: 'Users',
};

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [executionResult, setExecutionResult] = useState<ReportExecutionResult | null>(null);
  const [executionLoading, setExecutionLoading] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [columns, setColumns] = useState<DataSourceColumn[]>([]);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Export format
  const [_exportFormat, _setExportFormat] = useState<'csv' | 'json'>('csv');

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await reportsApi.getAll();
      setReports(data);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleRunReport = async (report: SavedReport) => {
    try {
      setSelectedReport(report);
      setExecutionLoading(true);
      setExecutionError(null);
      setShowResultModal(true);

      // Load columns for the data source
      const cols = await reportsApi.getColumns(report.reportType);
      setColumns(cols);

      const result = await reportsApi.execute(report.id, {
        page: 1,
        limit: 50,
      });
      setExecutionResult(result);
    } catch (err: any) {
      console.error('Failed to run report:', err);
      setExecutionError(err.response?.data?.message || 'Failed to run report');
    } finally {
      setExecutionLoading(false);
    }
  };

  const handlePageChange = async (page: number) => {
    if (!selectedReport) return;

    try {
      setExecutionLoading(true);
      const result = await reportsApi.execute(selectedReport.id, {
        page,
        limit: 50,
      });
      setExecutionResult(result);
    } catch (err: any) {
      console.error('Failed to load page:', err);
    } finally {
      setExecutionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      await reportsApi.delete(id);
      setReports(reports.filter((r) => r.id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error('Failed to delete report:', err);
      setError(err.response?.data?.message || 'Failed to delete report');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (!executionResult) return;

    const headers = executionResult.metadata.columns.join(',');
    const rows = executionResult.data.map((row) =>
      executionResult.metadata.columns
        .map((col) => {
          const value = row[col];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        })
        .join(',')
    );
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${executionResult.metadata.reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (!executionResult) return;

    const json = JSON.stringify(
      {
        metadata: executionResult.metadata,
        data: executionResult.data,
        aggregations: executionResult.aggregations,
      },
      null,
      2
    );

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${executionResult.metadata.reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate chart data from execution result aggregations
  const chartData = React.useMemo(() => {
    if (!executionResult?.aggregations || !selectedReport?.configuration.chartType) {
      return [];
    }

    return Object.entries(executionResult.aggregations).map(([key, value]) => ({
      label: key.replace(/_/g, ' '),
      value: typeof value === 'number' ? value : 0,
    }));
  }, [executionResult, selectedReport]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-sm text-gray-500 mt-1">
                Create and manage custom reports for your maintenance data
              </p>
            </div>
            <button
              onClick={() => navigate('/reports/builder')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Report
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {reports.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first custom report to analyze your maintenance data
            </p>
            <button
              onClick={() => navigate('/reports/builder')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Report
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-lg border hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 truncate">{report.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {REPORT_TYPE_LABELS[report.reportType] || report.reportType}
                      </p>
                    </div>
                    {report.isPublic && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Shared
                      </span>
                    )}
                  </div>

                  {report.description && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">{report.description}</p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                      {DATA_SOURCE_LABELS[report.reportType] || report.reportType}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {report.configuration.columns.length} columns
                    </span>
                    {report.configuration.chartType && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        {report.configuration.chartType}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      {report.lastGeneratedAt
                        ? `Last run: ${new Date(report.lastGeneratedAt).toLocaleDateString()}`
                        : `Created: ${new Date(report.createdAt).toLocaleDateString()}`}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRunReport(report)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Run Report"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => navigate(`/reports/builder?edit=${report.id}`)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                        title="Edit Report"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(report.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Delete Report"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Results Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowResultModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
              {/* Modal Header */}
              <div className="bg-white px-6 py-4 border-b flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedReport?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {REPORT_TYPE_LABELS[selectedReport?.reportType || '']}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {executionResult && (
                    <>
                      <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export CSV
                      </button>
                      <button
                        onClick={handleExportJSON}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Export JSON
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowResultModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="bg-gray-50 px-6 py-4 max-h-[70vh] overflow-y-auto">
                {executionError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-700">{executionError}</p>
                  </div>
                )}

                {/* Chart */}
                {selectedReport?.configuration.chartType && chartData.length > 0 && (
                  <div className="mb-6">
                    <SimpleChart
                      type={selectedReport.configuration.chartType as 'bar' | 'line' | 'pie'}
                      data={chartData}
                      title="Report Visualization"
                    />
                  </div>
                )}

                {/* Data Table */}
                <ReportPreview
                  result={executionResult}
                  columns={columns}
                  loading={executionLoading}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 opacity-75" onClick={() => setDeleteConfirm(null)}></div>

            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Delete Report</h3>
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this report? This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
