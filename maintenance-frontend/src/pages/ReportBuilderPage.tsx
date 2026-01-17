import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  reportsApi,
  ReportFilter,
  ReportSorting,
  ReportAggregation,
  DataSourceColumn,
  ReportExecutionResult,
} from '../services/api';
import { FilterBuilder, ColumnSelector, ReportPreview, SimpleChart } from '../components/reports';

const DATA_SOURCES = [
  { value: 'work_order', label: 'Work Orders' },
  { value: 'asset', label: 'Assets' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'preventive_maintenance', label: 'PM Schedules' },
  { value: 'custom', label: 'Users' },
];

const CHART_TYPES = [
  { value: '', label: 'No Chart' },
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'pie', label: 'Pie Chart' },
];

const AGGREGATION_FUNCTIONS = [
  { value: 'count', label: 'Count' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
];

export const ReportBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dataSource, setDataSource] = useState('work_order');
  const [reportType, setReportType] = useState('work_order');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [sorting, setSorting] = useState<ReportSorting[]>([]);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [aggregations, setAggregations] = useState<ReportAggregation[]>([]);
  const [chartType, setChartType] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  // UI state
  const [availableColumns, setAvailableColumns] = useState<DataSourceColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<ReportExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'columns' | 'filters' | 'sorting' | 'aggregations'>('columns');
  const [savedReportId, setSavedReportId] = useState<string | null>(null);

  // Load columns when data source changes
  useEffect(() => {
    const loadColumns = async () => {
      try {
        const columns = await reportsApi.getColumns(dataSource);
        setAvailableColumns(columns);
        // Set default columns if none selected
        if (selectedColumns.length === 0) {
          setSelectedColumns(columns.slice(0, 5).map(c => c.field));
        }
      } catch (err) {
        console.error('Failed to load columns:', err);
      }
    };
    loadColumns();
  }, [dataSource]);

  // Load existing report for editing
  useEffect(() => {
    if (editId) {
      const loadReport = async () => {
        try {
          setLoading(true);
          const report = await reportsApi.getById(editId);
          setName(report.name);
          setDescription(report.description || '');
          setReportType(report.reportType);
          setDataSource(report.reportType === 'custom' ? 'custom' : report.reportType);
          setSelectedColumns(report.configuration.columns || []);
          // Convert filters from object to array format
          const filtersArray: ReportFilter[] = Object.entries(report.configuration.filters || {}).map(
            ([field, config]) => ({
              field,
              operator: config.operator as ReportFilter['operator'],
              value: config.value,
            })
          );
          setFilters(filtersArray);
          setSorting(report.configuration.sorting || []);
          setGroupBy(report.configuration.groupBy || []);
          setAggregations(report.configuration.aggregations || []);
          setChartType(report.configuration.chartType || '');
          setDateRange(report.configuration.dateRange || null);
          setIsPublic(report.isPublic);
          setSavedReportId(report.id);
        } catch (err) {
          console.error('Failed to load report:', err);
          setError('Failed to load report for editing');
        } finally {
          setLoading(false);
        }
      };
      loadReport();
    }
  }, [editId]);

  const handleRunPreview = async () => {
    if (selectedColumns.length === 0) {
      setError('Please select at least one column');
      return;
    }

    try {
      setPreviewLoading(true);
      setError(null);

      // If we have a saved report, execute it
      if (savedReportId) {
        const result = await reportsApi.execute(savedReportId, {
          dateRange: dateRange || undefined,
          page: 1,
          limit: 20,
        });
        setPreviewResult(result);
      } else {
        // Create a temporary report to preview
        const tempReport = await reportsApi.create({
          name: name || 'Preview Report',
          description,
          reportType,
          dataSource,
          configuration: {
            columns: selectedColumns,
            filters,
            sorting,
            groupBy,
            aggregations,
            chartType: chartType as 'bar' | 'line' | 'pie' | 'table' | undefined,
            dateRange: dateRange || undefined,
          },
          isPublic: false,
        });

        setSavedReportId(tempReport.id);

        const result = await reportsApi.execute(tempReport.id, {
          dateRange: dateRange || undefined,
          page: 1,
          limit: 20,
        });
        setPreviewResult(result);
      }
    } catch (err: any) {
      console.error('Failed to run preview:', err);
      setError(err.response?.data?.message || 'Failed to run preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!name.trim()) {
      setError('Please enter a report name');
      return;
    }
    if (selectedColumns.length === 0) {
      setError('Please select at least one column');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      type ReportType = 'inventory' | 'custom' | 'asset' | 'work_order' | 'preventive_maintenance' | 'cost' | 'performance' | 'compliance';
      const reportData = {
        name,
        description,
        reportType: reportType as ReportType,
        dataSource,
        configuration: {
          columns: selectedColumns,
          filters,
          sorting,
          groupBy,
          aggregations,
          chartType: chartType as 'bar' | 'line' | 'pie' | 'table' | undefined,
          dateRange: dateRange || undefined,
        },
        isPublic,
      };

      if (savedReportId) {
        await reportsApi.update(savedReportId, reportData as Partial<import('../services/api').SavedReport>);
      } else {
        const created = await reportsApi.create(reportData);
        setSavedReportId(created.id);
      }

      navigate('/reports');
    } catch (err: any) {
      console.error('Failed to save report:', err);
      setError(err.response?.data?.message || 'Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  const addSorting = () => {
    if (availableColumns.length > 0) {
      setSorting([...sorting, { field: availableColumns[0].field, order: 'asc' }]);
    }
  };

  const updateSorting = (index: number, updates: Partial<ReportSorting>) => {
    const newSorting = [...sorting];
    newSorting[index] = { ...newSorting[index], ...updates };
    setSorting(newSorting);
  };

  const removeSorting = (index: number) => {
    setSorting(sorting.filter((_, i) => i !== index));
  };

  const addAggregation = () => {
    if (availableColumns.length > 0) {
      const numericColumn = availableColumns.find(c => c.type === 'number');
      setAggregations([
        ...aggregations,
        { field: numericColumn?.field || availableColumns[0].field, function: 'count' },
      ]);
    }
  };

  const updateAggregation = (index: number, updates: Partial<ReportAggregation>) => {
    const newAggs = [...aggregations];
    newAggs[index] = { ...newAggs[index], ...updates };
    setAggregations(newAggs);
  };

  const removeAggregation = (index: number) => {
    setAggregations(aggregations.filter((_, i) => i !== index));
  };

  // Generate chart data from preview result
  const chartData = React.useMemo(() => {
    if (!previewResult || !chartType || !previewResult.aggregations) {
      return [];
    }

    // Try to create meaningful chart data from aggregations or grouped data
    return Object.entries(previewResult.aggregations).map(([key, value]) => ({
      label: key.replace(/_/g, ' '),
      value: typeof value === 'number' ? value : 0,
    }));
  }, [previewResult, chartType]);

  if (loading && editId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading report...</p>
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
              <button
                onClick={() => navigate('/reports')}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Reports
              </button>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">
                {editId ? 'Edit Report' : 'Report Builder'}
              </h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRunPreview}
                disabled={previewLoading || selectedColumns.length === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {previewLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                    Running...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Preview
                  </>
                )}
              </button>
              <button
                onClick={handleSaveReport}
                disabled={loading || !name.trim() || selectedColumns.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Report
                  </>
                )}
              </button>
            </div>
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
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg border p-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Report Details</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter report name"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={2}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Source
                </label>
                <select
                  value={dataSource}
                  onChange={(e) => {
                    setDataSource(e.target.value);
                    setReportType(e.target.value);
                    setSelectedColumns([]);
                    setFilters([]);
                    setSorting([]);
                    setAggregations([]);
                    setPreviewResult(null);
                    setSavedReportId(null);
                  }}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {DATA_SOURCES.map((ds) => (
                    <option key={ds.value} value={ds.value}>
                      {ds.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chart Type
                </label>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {CHART_TYPES.map((ct) => (
                    <option key={ct.value} value={ct.value}>
                      {ct.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                  Share with organization
                </label>
              </div>
            </div>

            {/* Date Range */}
            <div className="bg-white rounded-lg border p-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Date Range (Optional)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange?.start || ''}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        start: e.target.value,
                        end: prev?.end || '',
                      }))
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange?.end || ''}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        start: prev?.start || '',
                        end: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              {dateRange && (dateRange.start || dateRange.end) && (
                <button
                  type="button"
                  onClick={() => setDateRange(null)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear date range
                </button>
              )}
            </div>
          </div>

          {/* Right Panel - Configuration Tabs & Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="border-b">
                <nav className="flex -mb-px">
                  {[
                    { id: 'columns', label: 'Columns', count: selectedColumns.length },
                    { id: 'filters', label: 'Filters', count: filters.length },
                    { id: 'sorting', label: 'Sorting', count: sorting.length },
                    { id: 'aggregations', label: 'Aggregations', count: aggregations.length },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-4">
                {activeTab === 'columns' && (
                  <ColumnSelector
                    availableColumns={availableColumns}
                    selectedColumns={selectedColumns}
                    onChange={setSelectedColumns}
                  />
                )}

                {activeTab === 'filters' && (
                  <FilterBuilder
                    columns={availableColumns}
                    filters={filters}
                    onChange={setFilters}
                  />
                )}

                {activeTab === 'sorting' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-gray-700">Sort Order</h4>
                      <button
                        type="button"
                        onClick={addSorting}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Sort
                      </button>
                    </div>

                    {sorting.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No sorting applied.</p>
                    ) : (
                      <div className="space-y-3">
                        {sorting.map((sort, index) => (
                          <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                            <select
                              value={sort.field}
                              onChange={(e) => updateSorting(index, { field: e.target.value })}
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              {availableColumns.map((col) => (
                                <option key={col.field} value={col.field}>
                                  {col.label}
                                </option>
                              ))}
                            </select>
                            <select
                              value={sort.order}
                              onChange={(e) => updateSorting(index, { order: e.target.value as 'asc' | 'desc' })}
                              className="w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="asc">Ascending</option>
                              <option value="desc">Descending</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => removeSorting(index)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'aggregations' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-gray-700">Aggregations</h4>
                      <button
                        type="button"
                        onClick={addAggregation}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Aggregation
                      </button>
                    </div>

                    {aggregations.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No aggregations configured.</p>
                    ) : (
                      <div className="space-y-3">
                        {aggregations.map((agg, index) => (
                          <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                            <select
                              value={agg.function}
                              onChange={(e) => updateAggregation(index, { function: e.target.value as ReportAggregation['function'] })}
                              className="w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              {AGGREGATION_FUNCTIONS.map((func) => (
                                <option key={func.value} value={func.value}>
                                  {func.label}
                                </option>
                              ))}
                            </select>
                            <span className="text-gray-500">of</span>
                            <select
                              value={agg.field}
                              onChange={(e) => updateAggregation(index, { field: e.target.value })}
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              {availableColumns
                                .filter((col) => agg.function === 'count' || col.type === 'number')
                                .map((col) => (
                                  <option key={col.field} value={col.field}>
                                    {col.label}
                                  </option>
                                ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeAggregation(index)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Chart Preview */}
            {chartType && chartData.length > 0 && (
              <SimpleChart
                type={chartType as 'bar' | 'line' | 'pie'}
                data={chartData}
                title="Chart Preview"
              />
            )}

            {/* Data Preview */}
            <ReportPreview
              result={previewResult}
              columns={availableColumns}
              loading={previewLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilderPage;
