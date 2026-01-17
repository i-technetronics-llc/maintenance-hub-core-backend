import { useMemo } from 'react';

interface Anomaly {
  id: string;
  assetId: string;
  assetName?: string;
  sensorType: string;
  value: number;
  unit?: string;
  zScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  message?: string;
}

interface AnomalyTimelineProps {
  anomalies: Anomaly[];
  maxItems?: number;
  onViewAnomaly?: (id: string) => void;
  onViewAsset?: (assetId: string) => void;
}

export const AnomalyTimeline = ({
  anomalies,
  maxItems = 10,
  onViewAnomaly,
  onViewAsset,
}: AnomalyTimelineProps) => {
  const sortedAnomalies = useMemo(() => {
    return [...anomalies]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, maxItems);
  }, [anomalies, maxItems]);

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          dotColor: 'bg-red-500',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
          icon: (
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
        };
      case 'high':
        return {
          dotColor: 'bg-orange-500',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-700',
          borderColor: 'border-orange-200',
          icon: (
            <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
        };
      case 'medium':
        return {
          dotColor: 'bg-yellow-500',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
          icon: (
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
        };
      default:
        return {
          dotColor: 'bg-blue-500',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
          icon: (
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          ),
        };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatSensorType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (sortedAnomalies.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <svg
            className="mx-auto h-12 w-12 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No anomalies detected</h3>
          <p className="mt-1 text-sm text-gray-500">All systems operating within normal parameters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Anomaly Timeline</h2>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
            {anomalies.length} total
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flow-root">
          <ul className="-mb-8">
            {sortedAnomalies.map((anomaly, index) => {
              const config = getSeverityConfig(anomaly.severity);
              const isLast = index === sortedAnomalies.length - 1;

              return (
                <li key={anomaly.id}>
                  <div className="relative pb-8">
                    {!isLast && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white ${config.bgColor}`}
                        >
                          {config.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`${config.bgColor} rounded-lg border ${config.borderColor} p-3 cursor-pointer hover:shadow-md transition-shadow`}
                          onClick={() => onViewAnomaly?.(anomaly.id)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
                                {anomaly.severity.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatSensorType(anomaly.sensorType)}
                              </span>
                            </div>
                            <time className="text-xs text-gray-500">
                              {formatTimestamp(anomaly.timestamp)}
                            </time>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewAsset?.(anomaly.assetId);
                              }}
                              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {anomaly.assetName || 'Asset'}
                            </button>
                          </div>

                          <p className="text-sm text-gray-600 mb-2">
                            {anomaly.message || `Value ${anomaly.value.toFixed(2)}${anomaly.unit || ''} detected (Z-score: ${anomaly.zScore.toFixed(2)})`}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              Value: <span className="font-medium">{anomaly.value.toFixed(2)}{anomaly.unit || ''}</span>
                            </span>
                            <span>
                              Z-Score: <span className="font-medium">{Math.abs(anomaly.zScore).toFixed(2)}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {anomalies.length > maxItems && (
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all {anomalies.length} anomalies
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnomalyTimeline;
