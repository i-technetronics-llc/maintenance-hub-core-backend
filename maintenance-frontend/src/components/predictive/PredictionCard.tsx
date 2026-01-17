import { useState } from 'react';

interface PredictionFactor {
  name: string;
  contribution: number;
  value: number;
  threshold?: number;
  unit?: string;
  description?: string;
}

interface Prediction {
  id: string;
  assetId: string;
  assetName?: string;
  assetTag?: string;
  predictionType: 'anomaly' | 'failure' | 'remaining_life' | 'degradation';
  prediction: string;
  probability: number;
  confidence: number;
  predictedDate?: string;
  remainingLifeDays?: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'acknowledged' | 'work_order_created' | 'resolved' | 'false_positive' | 'dismissed';
  factors: PredictionFactor[];
  recommendedAction?: string;
  estimatedCost?: number;
  potentialSavings?: number;
  createdAt: string;
}

interface PredictionCardProps {
  prediction: Prediction;
  onAcknowledge?: (id: string) => void;
  onCreateWorkOrder?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onViewAsset?: (assetId: string) => void;
  compact?: boolean;
}

export const PredictionCard = ({
  prediction,
  onAcknowledge,
  onCreateWorkOrder,
  onDismiss,
  onViewAsset,
  compact = false,
}: PredictionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200',
          badge: 'bg-red-500',
        };
      case 'high':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-800',
          border: 'border-orange-200',
          badge: 'bg-orange-500',
        };
      case 'medium':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
          badge: 'bg-yellow-500',
        };
      default:
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200',
          badge: 'bg-green-500',
        };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'anomaly':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'failure':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'remaining_life':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">New</span>;
      case 'acknowledged':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">Acknowledged</span>;
      case 'work_order_created':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">WO Created</span>;
      case 'resolved':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Resolved</span>;
      case 'false_positive':
      case 'dismissed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Dismissed</span>;
      default:
        return null;
    }
  };

  const riskColors = getRiskColor(prediction.riskLevel);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntil = (dateString: string) => {
    const days = Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days` : 'Overdue';
  };

  if (compact) {
    return (
      <div className={`p-4 rounded-lg border ${riskColors.border} ${riskColors.bg}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className={`${riskColors.text}`}>{getTypeIcon(prediction.predictionType)}</span>
            <div>
              <p className="font-medium text-gray-900">{prediction.assetName || 'Asset'}</p>
              <p className="text-sm text-gray-600 line-clamp-1">{prediction.prediction}</p>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full text-white ${riskColors.badge}`}>
            {prediction.riskLevel.charAt(0).toUpperCase() + prediction.riskLevel.slice(1)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${prediction.status === 'new' ? 'border-l-4' : ''} ${prediction.status === 'new' ? riskColors.border : 'border-gray-200'}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${riskColors.bg}`}>
              <span className={riskColors.text}>{getTypeIcon(prediction.predictionType)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">
                  {prediction.assetName || 'Asset'}
                </h3>
                {prediction.assetTag && (
                  <span className="text-sm text-gray-500">({prediction.assetTag})</span>
                )}
                {getStatusBadge(prediction.status)}
              </div>
              <p className="text-sm text-gray-500 capitalize">
                {prediction.predictionType.replace('_', ' ')} Prediction
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full text-white ${riskColors.badge}`}>
            {prediction.riskLevel.charAt(0).toUpperCase() + prediction.riskLevel.slice(1)} Risk
          </span>
        </div>

        {/* Prediction Message */}
        <p className="text-gray-700 mb-4">{prediction.prediction}</p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Probability</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full">
                <div
                  className={`h-2 rounded-full ${riskColors.badge}`}
                  style={{ width: `${prediction.probability}%` }}
                />
              </div>
              <span className="text-sm font-medium">{prediction.probability.toFixed(0)}%</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Confidence</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-purple-500 rounded-full"
                  style={{ width: `${prediction.confidence}%` }}
                />
              </div>
              <span className="text-sm font-medium">{prediction.confidence.toFixed(0)}%</span>
            </div>
          </div>
          {prediction.predictedDate && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Predicted Date</p>
              <p className="text-sm font-medium">{formatDate(prediction.predictedDate)}</p>
              <p className="text-xs text-gray-500">{getDaysUntil(prediction.predictedDate)}</p>
            </div>
          )}
          {prediction.remainingLifeDays !== undefined && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Remaining Life</p>
              <p className="text-sm font-medium">{prediction.remainingLifeDays} days</p>
            </div>
          )}
          {prediction.estimatedCost && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Est. Cost</p>
              <p className="text-sm font-medium">${prediction.estimatedCost.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Recommended Action */}
        {prediction.recommendedAction && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-600 font-medium mb-1">Recommended Action</p>
            <p className="text-sm text-blue-800">{prediction.recommendedAction}</p>
          </div>
        )}

        {/* Expandable Factors */}
        {prediction.factors.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {isExpanded ? 'Hide' : 'Show'} Contributing Factors ({prediction.factors.length})
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-2">
                {prediction.factors.map((factor, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{factor.name}</span>
                      <span className="text-xs text-gray-500">{factor.contribution.toFixed(0)}% contribution</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                        <div
                          className="h-1.5 bg-blue-500 rounded-full"
                          style={{ width: `${factor.contribution}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Value: {factor.value.toFixed(2)} {factor.unit || ''}
                      {factor.threshold && ` (Threshold: ${factor.threshold})`}
                    </p>
                    {factor.description && (
                      <p className="text-xs text-gray-500 mt-1">{factor.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {prediction.status === 'new' && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
            {onCreateWorkOrder && (
              <button
                onClick={() => onCreateWorkOrder(prediction.id)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Work Order
              </button>
            )}
            {onAcknowledge && (
              <button
                onClick={() => onAcknowledge(prediction.id)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Acknowledge
              </button>
            )}
            {onViewAsset && (
              <button
                onClick={() => onViewAsset(prediction.assetId)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Asset
              </button>
            )}
            {onDismiss && (
              <button
                onClick={() => onDismiss(prediction.id)}
                className="px-4 py-2 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Generated on {formatDate(prediction.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PredictionCard;
