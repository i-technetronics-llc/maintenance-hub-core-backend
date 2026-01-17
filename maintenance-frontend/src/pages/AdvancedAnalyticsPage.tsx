import { useState } from 'react';

export const AdvancedAnalyticsPage = () => {
  const [selectedReport, setSelectedReport] = useState('asset-health');

  const reports = [
    { id: 'asset-health', name: 'Asset Health Score', description: 'Overall health metrics for all assets' },
    { id: 'failure-analysis', name: 'Failure Analysis', description: 'Root cause analysis of equipment failures' },
    { id: 'cost-trends', name: 'Cost Trends', description: 'Maintenance cost analysis over time' },
    { id: 'technician-performance', name: 'Technician Performance', description: 'Work order metrics by technician' },
    { id: 'spare-parts', name: 'Spare Parts Usage', description: 'Parts consumption and optimization' },
    { id: 'downtime-analysis', name: 'Downtime Analysis', description: 'Equipment downtime breakdown' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">Enterprise</span>
              </div>
              <p className="text-sm text-gray-500">Deep insights into maintenance operations</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Schedule Report
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Export Data
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Report Selector */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Reports</h3>
              </div>
              <div className="p-2">
                {reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                      selectedReport === report.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <p className="font-medium text-sm">{report.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{report.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Report Content */}
          <div className="lg:col-span-3">
            {selectedReport === 'asset-health' && (
              <div className="space-y-6">
                {/* Asset Health Overview */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Health Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">Excellent</p>
                      <p className="text-2xl font-bold text-green-700">45</p>
                      <p className="text-xs text-green-600">Health Score: 90-100</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">Good</p>
                      <p className="text-2xl font-bold text-blue-700">32</p>
                      <p className="text-xs text-blue-600">Health Score: 70-89</p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-600 font-medium">Fair</p>
                      <p className="text-2xl font-bold text-yellow-700">18</p>
                      <p className="text-xs text-yellow-600">Health Score: 50-69</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-600 font-medium">Poor</p>
                      <p className="text-2xl font-bold text-red-700">5</p>
                      <p className="text-xs text-red-600">Health Score: 0-49</p>
                    </div>
                  </div>
                </div>

                {/* Health Trend Chart Placeholder */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Score Trend</h3>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-gray-500">Interactive chart would render here</p>
                      <p className="text-sm text-gray-400">Connect charting library for visualization</p>
                    </div>
                  </div>
                </div>

                {/* Top Assets Needing Attention */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Assets Needing Attention</h3>
                  <div className="space-y-4">
                    {[
                      { name: 'CNC Machine #7', score: 42, issue: 'Multiple overdue PM schedules' },
                      { name: 'Hydraulic Press B', score: 48, issue: 'High failure rate in last 30 days' },
                      { name: 'Cooling Tower', score: 55, issue: 'Degrading sensor readings' },
                      { name: 'Conveyor Line 3', score: 61, issue: 'Pending critical repairs' },
                      { name: 'Compressor Unit 2', score: 65, issue: 'Approaching end of service life' },
                    ].map((asset, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold ${
                            asset.score < 50 ? 'bg-red-100 text-red-600' :
                            asset.score < 70 ? 'bg-yellow-100 text-yellow-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {asset.score}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{asset.name}</p>
                            <p className="text-sm text-gray-500">{asset.issue}</p>
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedReport !== 'asset-health' && (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {reports.find(r => r.id === selectedReport)?.name}
                </h3>
                <p className="text-gray-500 mb-4">
                  {reports.find(r => r.id === selectedReport)?.description}
                </p>
                <p className="text-sm text-gray-400">
                  Report visualization would render here with actual data
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdvancedAnalyticsPage;
