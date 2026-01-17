import React from 'react';

interface DataPoint {
  label: string;
  value: number;
  value2?: number;
}

interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  title?: string;
  color?: string;
  color2?: string;
  showGrid?: boolean;
  showDots?: boolean;
  showLabels?: boolean;
  yAxisLabel?: string;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 600,
  height = 300,
  title,
  color = '#3B82F6',
  color2 = '#10B981',
  showGrid = true,
  showDots = true,
  showLabels = true,
  yAxisLabel,
  className = '',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ width, height }}>
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const padding = { top: 40, right: 20, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const allValues = data.flatMap(d => [d.value, d.value2].filter(v => v !== undefined) as number[]);
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);
  const valueRange = maxValue - minValue || 1;

  const xStep = chartWidth / (data.length - 1 || 1);
  const yScale = chartHeight / valueRange;

  const getY = (value: number) => padding.top + chartHeight - (value - minValue) * yScale;
  const getX = (index: number) => padding.left + index * xStep;

  const pathD = data
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${getX(index)} ${getY(point.value)}`)
    .join(' ');

  const pathD2 = data[0]?.value2 !== undefined
    ? data.map((point, index) => `${index === 0 ? 'M' : 'L'} ${getX(index)} ${getY(point.value2!)}`)
        .join(' ')
    : '';

  const gridLines = [];
  const yLabels = [];
  const numYGridLines = 5;
  for (let i = 0; i <= numYGridLines; i++) {
    const y = padding.top + (chartHeight / numYGridLines) * i;
    const value = maxValue - (valueRange / numYGridLines) * i;
    gridLines.push(
      <line
        key={`grid-${i}`}
        x1={padding.left}
        y1={y}
        x2={width - padding.right}
        y2={y}
        stroke="#E5E7EB"
        strokeDasharray="4"
      />
    );
    yLabels.push(
      <text
        key={`ylabel-${i}`}
        x={padding.left - 10}
        y={y + 4}
        textAnchor="end"
        className="text-xs fill-gray-500"
      >
        {Math.round(value)}
      </text>
    );
  }

  return (
    <div className={className}>
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <svg width={width} height={height} className="overflow-visible">
        {showGrid && gridLines}
        {yLabels}

        {yAxisLabel && (
          <text
            x={15}
            y={height / 2}
            transform={`rotate(-90, 15, ${height / 2})`}
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            {yAxisLabel}
          </text>
        )}

        {/* X axis */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#9CA3AF"
        />

        {/* Y axis */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="#9CA3AF"
        />

        {/* Line 1 */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Line 2 */}
        {pathD2 && (
          <path
            d={pathD2}
            fill="none"
            stroke={color2}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Dots */}
        {showDots &&
          data.map((point, index) => (
            <React.Fragment key={index}>
              <circle
                cx={getX(index)}
                cy={getY(point.value)}
                r="4"
                fill={color}
                className="cursor-pointer hover:r-6 transition-all"
              >
                <title>{`${point.label}: ${point.value}`}</title>
              </circle>
              {point.value2 !== undefined && (
                <circle
                  cx={getX(index)}
                  cy={getY(point.value2)}
                  r="4"
                  fill={color2}
                  className="cursor-pointer"
                >
                  <title>{`${point.label}: ${point.value2}`}</title>
                </circle>
              )}
            </React.Fragment>
          ))}

        {/* X axis labels */}
        {showLabels &&
          data.map((point, index) => {
            if (data.length > 15 && index % Math.ceil(data.length / 10) !== 0) return null;
            return (
              <text
                key={`label-${index}`}
                x={getX(index)}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                className="text-xs fill-gray-500"
                transform={`rotate(-45, ${getX(index)}, ${height - padding.bottom + 20})`}
              >
                {point.label.length > 8 ? point.label.slice(0, 8) + '...' : point.label}
              </text>
            );
          })}
      </svg>
    </div>
  );
};

export default LineChart;
