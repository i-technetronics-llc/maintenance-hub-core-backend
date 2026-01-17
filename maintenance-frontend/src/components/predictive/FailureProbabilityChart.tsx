import { useMemo } from 'react';

interface ProbabilityDataPoint {
  assetId: string;
  assetName: string;
  probability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictedDays?: number;
}

interface FailureProbabilityChartProps {
  data: ProbabilityDataPoint[];
  height?: number;
  onAssetClick?: (assetId: string) => void;
  showLabels?: boolean;
  sortBy?: 'probability' | 'name' | 'risk';
}

export const FailureProbabilityChart = ({
  data,
  height = 300,
  onAssetClick,
  showLabels = true,
  sortBy = 'probability',
}: FailureProbabilityChartProps) => {
  const sortedData = useMemo(() => {
    const sorted = [...data];
    switch (sortBy) {
      case 'probability':
        return sorted.sort((a, b) => b.probability - a.probability);
      case 'name':
        return sorted.sort((a, b) => a.assetName.localeCompare(b.assetName));
      case 'risk':
        const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return sorted.sort((a, b) => riskOrder[b.riskLevel] - riskOrder[a.riskLevel]);
      default:
        return sorted;
    }
  }, [data, sortBy]);

  const getBarColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'high':
        return 'bg-gradient-to-r from-orange-500 to-orange-600';
      case 'medium':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
      default:
        return 'bg-gradient-to-r from-green-500 to-green-600';
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No probability data</h3>
          <p className="mt-1 text-sm text-gray-500">Run failure predictions to see probability data</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const avgProbability = data.reduce((sum, d) => sum + d.probability, 0) / data.length;
  const maxProbability = Math.max(...data.map(d => d.probability));
  const criticalCount = data.filter(d => d.riskLevel === 'critical').length;
  const highCount = data.filter(d => d.riskLevel === 'high').length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Failure Probability</h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              Avg: <span className="font-medium text-gray-700">{avgProbability.toFixed(1)}%</span>
            </span>
            <span className="text-gray-500">
              Max: <span className="font-medium text-gray-700">{maxProbability.toFixed(1)}%</span>
            </span>
          </div>
        </div>

        {/* Summary badges */}
        <div className="flex items-center gap-2 mt-3">
          {criticalCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
              {criticalCount} Critical
            </span>
          )}
          {highCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
              {highCount} High Risk
            </span>
          )}
        </div>
      </div>

      <div className="p-6" style={{ minHeight: height }}>
        {/* Bar Chart */}
        <div className="space-y-3">
          {sortedData.slice(0, 10).map((item, _index) => (
            <div
              key={item.assetId}
              className="group cursor-pointer"
              onClick={() => onAssetClick?.(item.assetId)}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                    {item.assetName}
                  </span>
                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getRiskBadgeColor(item.riskLevel)}`}>
                    {item.riskLevel}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900 ml-2">
                  {item.probability.toFixed(1)}%
                </span>
              </div>

              <div className="relative h-6 bg-gray-100 rounded-lg overflow-hidden group-hover:bg-gray-200 transition-colors">
                <div
                  className={`absolute inset-y-0 left-0 ${getBarColor(item.riskLevel)} rounded-lg transition-all duration-500 ease-out`}
                  style={{ width: `${Math.min(100, item.probability)}%` }}
                >
                  {showLabels && item.probability > 15 && (
                    <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white">
                      {item.predictedDays !== undefined && (
                        <span>{item.predictedDays}d</span>
                      )}
                    </span>
                  )}
                </div>

                {/* Threshold markers */}
                <div className="absolute inset-y-0 left-1/4 w-px bg-gray-300" title="25% threshold" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-gray-300" title="50% threshold" />
                <div className="absolute inset-y-0 left-3/4 w-px bg-gray-300" title="75% threshold" />
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-green-500"></span>
              <span>Low (0-25%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-yellow-500"></span>
              <span>Medium (25-50%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-orange-500"></span>
              <span>High (50-75%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500"></span>
              <span>Critical (75%+)</span>
            </div>
          </div>
        </div>

        {sortedData.length > 10 && (
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all {sortedData.length} assets
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple mini version for dashboards
export const FailureProbabilityMini = ({
  data,
  onViewAll,
}: {
  data: ProbabilityDataPoint[];
  onViewAll?: () => void;
}) => {
  const topRisks = useMemo(() => {
    return [...data]
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);
  }, [data]);

  const getBarColor = (prob: number) => {
    if (prob >= 75) return 'bg-red-500';
    if (prob >= 50) return 'bg-orange-500';
    if (prob >= 25) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Top Failure Risks</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            View all
          </button>
        )}
      </div>

      <div className="space-y-2">
        {topRisks.map((item) => (
          <div key={item.assetId} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 truncate w-24">{item.assetName}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${getBarColor(item.probability)} rounded-full`}
                style={{ width: `${item.probability}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700 w-10 text-right">
              {item.probability.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FailureProbabilityChart;
