import React from 'react';
import { ReportExecutionResult, DataSourceColumn } from '../../services/api';

interface ReportPreviewProps {
  result: ReportExecutionResult | null;
  columns: DataSourceColumn[];
  loading?: boolean;
  onPageChange?: (page: number) => void;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  result,
  columns,
  loading = false,
  onPageChange,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-8">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-gray-500">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white rounded-lg border p-8">
        <div className="flex flex-col items-center justify-center text-gray-500">
          <svg className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">Run preview to see report data</p>
        </div>
      </div>
    );
  }

  const getColumnLabel = (field: string): string => {
    const column = columns.find(c => c.field === field);
    return column?.label || field;
  };

  const formatValue = (value: any, field: string): string => {
    if (value === null || value === undefined) return '-';

    const column = columns.find(c => c.field === field);
    const type = column?.type || 'string';

    switch (type) {
      case 'date':
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return String(value);
        }
      case 'number':
        if (field.toLowerCase().includes('cost') || field.toLowerCase().includes('price') || field.toLowerCase().includes('value')) {
          return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
        }
        return new Intl.NumberFormat('en-US').format(Number(value));
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h4 className="text-sm font-medium text-gray-700">
            {result.metadata.reportName}
          </h4>
          <span className="text-xs text-gray-500">
            {result.total} record{result.total !== 1 ? 's' : ''} found
          </span>
        </div>
        <span className="text-xs text-gray-400">
          Executed: {new Date(result.metadata.executedAt).toLocaleString()}
        </span>
      </div>

      {/* Aggregations */}
      {result.aggregations && Object.keys(result.aggregations).length > 0 && (
        <div className="px-4 py-3 bg-blue-50 border-b">
          <div className="flex flex-wrap gap-4">
            {Object.entries(result.aggregations).map(([key, value]) => {
              const [func, field] = key.split('_');
              return (
                <div key={key} className="text-sm">
                  <span className="text-gray-500 capitalize">{func}({getColumnLabel(field)}):</span>
                  <span className="ml-1 font-medium text-gray-900">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {result.metadata.columns.map((field) => (
                <th
                  key={field}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {getColumnLabel(field)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {result.data.length === 0 ? (
              <tr>
                <td
                  colSpan={result.metadata.columns.length}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  No data matches the current filters
                </td>
              </tr>
            ) : (
              result.data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {result.metadata.columns.map((field) => (
                    <td
                      key={field}
                      className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                    >
                      {formatValue(row[field], field)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {result.totalPages > 1 && onPageChange && (
        <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Page {result.page} of {result.totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => onPageChange(result.page - 1)}
              disabled={result.page === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => onPageChange(result.page + 1)}
              disabled={result.page === result.totalPages}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPreview;
