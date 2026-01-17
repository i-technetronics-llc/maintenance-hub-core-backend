import React from 'react';

interface BarData {
  label: string;
  value: number;
  value2?: number;
  color?: string;
}

interface BarChartProps {
  data: BarData[];
  width?: number;
  height?: number;
  title?: string;
  color?: string;
  color2?: string;
  orientation?: 'vertical' | 'horizontal';
  showValues?: boolean;
  showGrid?: boolean;
  yAxisLabel?: string;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  width = 600,
  height = 300,
  title,
  color = '#3B82F6',
  color2 = '#10B981',
  orientation: _orientation = 'vertical',
  showValues = true,
  showGrid = true,
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

  const padding = { top: 40, right: 20, bottom: 80, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const hasSecondValue = data.some(d => d.value2 !== undefined);
  const allValues = data.flatMap(d => [d.value, d.value2].filter(v => v !== undefined) as number[]);
  const maxValue = Math.max(...allValues, 1);

  const barGroupWidth = chartWidth / data.length;
  const barPadding = barGroupWidth * 0.2;
  const barWidth = hasSecondValue
    ? (barGroupWidth - barPadding * 2) / 2
    : barGroupWidth - barPadding * 2;

  const gridLines = [];
  const yLabels = [];
  const numYGridLines = 5;
  for (let i = 0; i <= numYGridLines; i++) {
    const y = padding.top + (chartHeight / numYGridLines) * i;
    const value = maxValue - (maxValue / numYGridLines) * i;
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
      <svg width={width} height={height}>
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

        {/* Bars */}
        {data.map((item, index) => {
          const x = padding.left + index * barGroupWidth + barPadding;
          const barHeight1 = (item.value / maxValue) * chartHeight;
          const barColor1 = item.color || color;

          return (
            <g key={index}>
              {/* First bar */}
              <rect
                x={x}
                y={height - padding.bottom - barHeight1}
                width={barWidth}
                height={barHeight1}
                fill={barColor1}
                rx="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <title>{`${item.label}: ${item.value}`}</title>
              </rect>

              {/* Second bar (if exists) */}
              {item.value2 !== undefined && (
                <rect
                  x={x + barWidth}
                  y={height - padding.bottom - (item.value2 / maxValue) * chartHeight}
                  width={barWidth}
                  height={(item.value2 / maxValue) * chartHeight}
                  fill={color2}
                  rx="2"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <title>{`${item.label}: ${item.value2}`}</title>
                </rect>
              )}

              {/* Values on top of bars */}
              {showValues && (
                <>
                  <text
                    x={x + barWidth / 2}
                    y={height - padding.bottom - barHeight1 - 5}
                    textAnchor="middle"
                    className="text-xs fill-gray-600 font-medium"
                  >
                    {item.value}
                  </text>
                  {item.value2 !== undefined && (
                    <text
                      x={x + barWidth + barWidth / 2}
                      y={height - padding.bottom - (item.value2 / maxValue) * chartHeight - 5}
                      textAnchor="middle"
                      className="text-xs fill-gray-600 font-medium"
                    >
                      {item.value2}
                    </text>
                  )}
                </>
              )}

              {/* X axis labels */}
              <text
                x={x + (hasSecondValue ? barWidth : barWidth / 2)}
                y={height - padding.bottom + 15}
                textAnchor="middle"
                className="text-xs fill-gray-500"
                transform={`rotate(-45, ${x + (hasSecondValue ? barWidth : barWidth / 2)}, ${height - padding.bottom + 15})`}
              >
                {item.label.length > 12 ? item.label.slice(0, 12) + '...' : item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default BarChart;
