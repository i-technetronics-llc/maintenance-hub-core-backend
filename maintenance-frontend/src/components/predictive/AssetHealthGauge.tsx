import { useMemo } from 'react';

interface AssetHealthGaugeProps {
  healthScore: number; // 0-100
  assetName?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const AssetHealthGauge = ({
  healthScore,
  assetName,
  size = 'md',
  showLabel = true,
}: AssetHealthGaugeProps) => {
  const sizeConfig = useMemo(() => {
    switch (size) {
      case 'sm':
        return { width: 80, height: 80, strokeWidth: 6, fontSize: 'text-lg' };
      case 'lg':
        return { width: 160, height: 160, strokeWidth: 12, fontSize: 'text-4xl' };
      default:
        return { width: 120, height: 120, strokeWidth: 8, fontSize: 'text-2xl' };
    }
  }, [size]);

  const { width, height, strokeWidth, fontSize } = sizeConfig;
  const radius = (width - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, healthScore));
  const offset = circumference - (progress / 100) * circumference;

  const getHealthColor = (score: number) => {
    if (score >= 80) return { stroke: '#10B981', text: 'text-green-500', bg: 'bg-green-50', label: 'Excellent' };
    if (score >= 60) return { stroke: '#3B82F6', text: 'text-blue-500', bg: 'bg-blue-50', label: 'Good' };
    if (score >= 40) return { stroke: '#F59E0B', text: 'text-amber-500', bg: 'bg-amber-50', label: 'Fair' };
    if (score >= 20) return { stroke: '#F97316', text: 'text-orange-500', bg: 'bg-orange-50', label: 'Poor' };
    return { stroke: '#EF4444', text: 'text-red-500', bg: 'bg-red-50', label: 'Critical' };
  };

  const healthConfig = getHealthColor(progress);

  return (
    <div className={`flex flex-col items-center ${healthConfig.bg} rounded-xl p-4`}>
      {assetName && (
        <p className="text-sm font-medium text-gray-700 mb-2 truncate max-w-full">{assetName}</p>
      )}

      <div className="relative" style={{ width, height }}>
        {/* Background circle */}
        <svg className="transform -rotate-90" width={width} height={height}>
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            fill="none"
            stroke={healthConfig.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${fontSize} font-bold ${healthConfig.text}`}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {showLabel && (
        <div className="mt-2 text-center">
          <span className={`text-sm font-medium ${healthConfig.text}`}>
            {healthConfig.label}
          </span>
        </div>
      )}
    </div>
  );
};

export default AssetHealthGauge;
