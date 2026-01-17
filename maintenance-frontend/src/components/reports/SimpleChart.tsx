import React, { useMemo } from 'react';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface SimpleChartProps {
  type: 'bar' | 'line' | 'pie';
  data: DataPoint[];
  title?: string;
  height?: number;
  showLegend?: boolean;
}

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
];

export const SimpleChart: React.FC<SimpleChartProps> = ({
  type,
  data,
  title,
  height = 300,
  showLegend = true,
}) => {
  const chartData = useMemo(() => {
    return data.map((d, i) => ({
      ...d,
      color: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    }));
  }, [data]);

  const maxValue = useMemo(() => {
    return Math.max(...data.map(d => d.value), 1);
  }, [data]);

  const total = useMemo(() => {
    return data.reduce((sum, d) => sum + d.value, 0);
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border">
        <p className="text-gray-500 text-sm">No data available for chart</p>
      </div>
    );
  }

  const renderBarChart = () => {
    const barWidth = Math.min(60, (600 - 80) / data.length - 10);
    const chartHeight = height - 60;

    return (
      <svg viewBox={`0 0 ${Math.max(600, data.length * 70 + 80)} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Y-axis */}
        <line x1="50" y1="20" x2="50" y2={chartHeight + 20} stroke="#E5E7EB" strokeWidth="1" />

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <g key={i}>
            <line x1="45" y1={chartHeight - chartHeight * ratio + 20} x2="50" y2={chartHeight - chartHeight * ratio + 20} stroke="#9CA3AF" />
            <text x="40" y={chartHeight - chartHeight * ratio + 24} textAnchor="end" fontSize="10" fill="#6B7280">
              {Math.round(maxValue * ratio)}
            </text>
            <line x1="50" y1={chartHeight - chartHeight * ratio + 20} x2={data.length * 70 + 60} y2={chartHeight - chartHeight * ratio + 20} stroke="#F3F4F6" strokeDasharray="2,2" />
          </g>
        ))}

        {/* X-axis */}
        <line x1="50" y1={chartHeight + 20} x2={data.length * 70 + 60} y2={chartHeight + 20} stroke="#E5E7EB" strokeWidth="1" />

        {/* Bars */}
        {chartData.map((d, i) => {
          const barHeight = (d.value / maxValue) * chartHeight;
          const x = 60 + i * 70;
          const y = chartHeight - barHeight + 20;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={d.color}
                rx="2"
                className="transition-opacity hover:opacity-80"
              >
                <title>{`${d.label}: ${d.value}`}</title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={chartHeight + 35}
                textAnchor="middle"
                fontSize="10"
                fill="#6B7280"
                className="truncate"
              >
                {d.label.length > 8 ? d.label.slice(0, 8) + '...' : d.label}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="10"
                fill="#374151"
              >
                {d.value}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderLineChart = () => {
    const chartWidth = Math.max(600, data.length * 60 + 80);
    const chartHeight = height - 60;
    const pointSpacing = (chartWidth - 100) / Math.max(data.length - 1, 1);

    const points = chartData.map((d, i) => ({
      x: 60 + i * pointSpacing,
      y: chartHeight - (d.value / maxValue) * chartHeight + 20,
      ...d,
    }));

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <svg viewBox={`0 0 ${chartWidth} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <g key={i}>
            <line x1="45" y1={chartHeight - chartHeight * ratio + 20} x2="50" y2={chartHeight - chartHeight * ratio + 20} stroke="#9CA3AF" />
            <text x="40" y={chartHeight - chartHeight * ratio + 24} textAnchor="end" fontSize="10" fill="#6B7280">
              {Math.round(maxValue * ratio)}
            </text>
            <line x1="50" y1={chartHeight - chartHeight * ratio + 20} x2={chartWidth - 20} y2={chartHeight - chartHeight * ratio + 20} stroke="#F3F4F6" strokeDasharray="2,2" />
          </g>
        ))}

        {/* Axes */}
        <line x1="50" y1="20" x2="50" y2={chartHeight + 20} stroke="#E5E7EB" strokeWidth="1" />
        <line x1="50" y1={chartHeight + 20} x2={chartWidth - 20} y2={chartHeight + 20} stroke="#E5E7EB" strokeWidth="1" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#3B82F6" strokeWidth="2" />

        {/* Area under line */}
        <path
          d={`${linePath} L ${points[points.length - 1].x} ${chartHeight + 20} L ${points[0].x} ${chartHeight + 20} Z`}
          fill="url(#gradient)"
          opacity="0.2"
        />

        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Points and labels */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#3B82F6" stroke="#fff" strokeWidth="2">
              <title>{`${p.label}: ${p.value}`}</title>
            </circle>
            <text x={p.x} y={chartHeight + 35} textAnchor="middle" fontSize="10" fill="#6B7280">
              {p.label.length > 8 ? p.label.slice(0, 8) + '...' : p.label}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  const renderPieChart = () => {
    const centerX = 150;
    const centerY = 150;
    const radius = 100;
    let currentAngle = -90;

    const slices = chartData.map((d) => {
      const percentage = d.value / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      // Label position
      const midAngle = ((startAngle + endAngle) / 2 * Math.PI) / 180;
      const labelRadius = radius * 0.65;
      const labelX = centerX + labelRadius * Math.cos(midAngle);
      const labelY = centerY + labelRadius * Math.sin(midAngle);

      return {
        ...d,
        path,
        percentage,
        labelX,
        labelY,
      };
    });

    return (
      <div className="flex items-center justify-center space-x-8">
        <svg viewBox="0 0 300 300" width="300" height="300">
          {slices.map((slice, i) => (
            <g key={i}>
              <path
                d={slice.path}
                fill={slice.color}
                stroke="#fff"
                strokeWidth="2"
                className="transition-opacity hover:opacity-80 cursor-pointer"
              >
                <title>{`${slice.label}: ${slice.value} (${(slice.percentage * 100).toFixed(1)}%)`}</title>
              </path>
              {slice.percentage > 0.05 && (
                <text
                  x={slice.labelX}
                  y={slice.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fill="#fff"
                  fontWeight="500"
                >
                  {(slice.percentage * 100).toFixed(0)}%
                </text>
              )}
            </g>
          ))}
        </svg>

        {showLegend && (
          <div className="space-y-2">
            {chartData.map((d, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-sm text-gray-600">{d.label}</span>
                <span className="text-sm font-medium text-gray-900">({d.value})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      {title && (
        <h4 className="text-sm font-medium text-gray-700 mb-4">{title}</h4>
      )}

      <div className="overflow-x-auto">
        {type === 'bar' && renderBarChart()}
        {type === 'line' && renderLineChart()}
        {type === 'pie' && renderPieChart()}
      </div>

      {showLegend && type !== 'pie' && (
        <div className="mt-4 flex flex-wrap gap-4 justify-center">
          {chartData.map((d, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-xs text-gray-600">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleChart;
