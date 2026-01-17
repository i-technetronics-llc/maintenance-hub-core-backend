import React from 'react';

interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  title?: string;
  label?: string;
  unit?: string;
  width?: number;
  height?: number;
  thresholds?: {
    low?: number;
    medium?: number;
    high?: number;
  };
  colors?: {
    low?: string;
    medium?: string;
    high?: string;
    background?: string;
  };
  className?: string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  min = 0,
  max = 100,
  title,
  label,
  unit = '%',
  width = 200,
  height = 150,
  thresholds = { low: 33, medium: 66, high: 100 },
  colors = {
    low: '#EF4444',
    medium: '#F59E0B',
    high: '#10B981',
    background: '#E5E7EB',
  },
  className = '',
}) => {
  const cx = width / 2;
  const cy = height - 20;
  const radius = Math.min(width / 2, height) - 30;

  const normalizedValue = Math.max(min, Math.min(max, value));
  const percentage = ((normalizedValue - min) / (max - min)) * 100;

  // Convert percentage to angle (0% = -180deg, 100% = 0deg)
  const valueAngle = -180 + (percentage / 100) * 180;

  // Create arc path
  const createArc = (startAngle: number, endAngle: number): string => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  // Calculate threshold angles
  const lowAngle = -180 + ((thresholds.low! / 100) * 180);
  const mediumAngle = -180 + ((thresholds.medium! / 100) * 180);

  // Determine current color
  let currentColor = colors.low;
  if (percentage >= thresholds.medium!) {
    currentColor = colors.high;
  } else if (percentage >= thresholds.low!) {
    currentColor = colors.medium;
  }

  // Needle
  const needleLength = radius - 10;
  const needleAngle = (valueAngle * Math.PI) / 180;
  const needleX = cx + needleLength * Math.cos(needleAngle);
  const needleY = cy + needleLength * Math.sin(needleAngle);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <svg width={width} height={height}>
        {/* Background arc */}
        <path
          d={createArc(-180, 0)}
          fill="none"
          stroke={colors.background}
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Low range arc (red) */}
        <path
          d={createArc(-180, lowAngle)}
          fill="none"
          stroke={colors.low}
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* Medium range arc (yellow) */}
        <path
          d={createArc(lowAngle, mediumAngle)}
          fill="none"
          stroke={colors.medium}
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* High range arc (green) */}
        <path
          d={createArc(mediumAngle, 0)}
          fill="none"
          stroke={colors.high}
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* Value arc */}
        {percentage > 0 && (
          <path
            d={createArc(-180, valueAngle)}
            fill="none"
            stroke={currentColor}
            strokeWidth="12"
            strokeLinecap="round"
          />
        )}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="#374151"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Center circle */}
        <circle cx={cx} cy={cy} r="8" fill="#374151" />
        <circle cx={cx} cy={cy} r="4" fill="white" />

        {/* Min/Max labels */}
        <text
          x={cx - radius - 5}
          y={cy + 15}
          textAnchor="start"
          className="text-xs fill-gray-500"
        >
          {min}
        </text>
        <text
          x={cx + radius + 5}
          y={cy + 15}
          textAnchor="end"
          className="text-xs fill-gray-500"
        >
          {max}
        </text>

        {/* Value display */}
        <text
          x={cx}
          y={cy - 20}
          textAnchor="middle"
          className="text-2xl font-bold"
          fill={currentColor}
        >
          {normalizedValue.toFixed(0)}{unit}
        </text>

        {/* Label */}
        {label && (
          <text
            x={cx}
            y={cy + 20}
            textAnchor="middle"
            className="text-sm fill-gray-600"
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  );
};

export default GaugeChart;
