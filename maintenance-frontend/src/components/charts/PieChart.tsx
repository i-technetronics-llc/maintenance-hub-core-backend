import React from 'react';

interface PieData {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieData[];
  width?: number;
  height?: number;
  title?: string;
  showLegend?: boolean;
  showLabels?: boolean;
  showPercentages?: boolean;
  donut?: boolean;
  className?: string;
}

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

export const PieChart: React.FC<PieChartProps> = ({
  data,
  width = 400,
  height = 300,
  title,
  showLegend = true,
  showLabels = true,
  showPercentages = true,
  donut = false,
  className = '',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ width, height }}>
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const total = data.reduce((acc, item) => acc + item.value, 0);
  if (total === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ width, height }}>
        <p className="text-gray-500">No data to display</p>
      </div>
    );
  }

  const chartSize = Math.min(width, height) - 40;
  const cx = chartSize / 2 + 20;
  const cy = chartSize / 2 + (title ? 30 : 20);
  const outerRadius = chartSize / 2 - 10;
  const innerRadius = donut ? outerRadius * 0.6 : 0;

  let currentAngle = -90; // Start from top

  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + outerRadius * Math.cos(startRad);
    const y1 = cy + outerRadius * Math.sin(startRad);
    const x2 = cx + outerRadius * Math.cos(endRad);
    const y2 = cy + outerRadius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    let pathD = '';
    if (donut) {
      const ix1 = cx + innerRadius * Math.cos(startRad);
      const iy1 = cy + innerRadius * Math.sin(startRad);
      const ix2 = cx + innerRadius * Math.cos(endRad);
      const iy2 = cy + innerRadius * Math.sin(endRad);

      pathD = `
        M ${x1} ${y1}
        A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
        L ${ix2} ${iy2}
        A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix1} ${iy1}
        Z
      `;
    } else {
      pathD = `
        M ${cx} ${cy}
        L ${x1} ${y1}
        A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
        Z
      `;
    }

    // Label position
    const midAngle = (startAngle + endAngle) / 2;
    const midRad = (midAngle * Math.PI) / 180;
    const labelRadius = donut ? (outerRadius + innerRadius) / 2 : outerRadius * 0.65;
    const labelX = cx + labelRadius * Math.cos(midRad);
    const labelY = cy + labelRadius * Math.sin(midRad);

    return {
      pathD,
      color: item.color || COLORS[index % COLORS.length],
      label: item.label,
      value: item.value,
      percentage,
      labelX,
      labelY,
    };
  });

  const legendWidth = showLegend ? 150 : 0;

  return (
    <div className={className}>
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <div className="flex items-start">
        <svg width={chartSize + 40} height={chartSize + (title ? 50 : 40)}>
          {slices.map((slice, index) => (
            <g key={index}>
              <path
                d={slice.pathD}
                fill={slice.color}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <title>{`${slice.label}: ${slice.value} (${slice.percentage.toFixed(1)}%)`}</title>
              </path>
              {showLabels && slice.percentage > 5 && (
                <text
                  x={slice.labelX}
                  y={slice.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs fill-white font-medium pointer-events-none"
                >
                  {showPercentages ? `${slice.percentage.toFixed(0)}%` : slice.value}
                </text>
              )}
            </g>
          ))}

          {/* Center text for donut chart */}
          {donut && (
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xl font-bold fill-gray-700"
            >
              {total}
            </text>
          )}
        </svg>

        {/* Legend */}
        {showLegend && (
          <div className="ml-4 flex flex-col gap-2" style={{ width: legendWidth }}>
            {slices.map((slice, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-sm text-gray-600 truncate" title={slice.label}>
                  {slice.label}
                </span>
                <span className="text-sm text-gray-500 ml-auto">
                  {slice.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PieChart;
