import { useMemo, useState } from 'react';
import { format, parseISO, subDays, startOfMonth, startOfYear, isAfter, isBefore, isEqual } from 'date-fns';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea, ComposedChart
} from 'recharts';
import ChartFilters from './ChartFilters';

// Helper function to filter data by time period
function filterDataByTimePeriod(data, timePeriod, customDateRange) {
  if (!data || data.length === 0) return data;

  let startDate, endDate = new Date();

  switch (timePeriod) {
    case '7day':
      startDate = subDays(new Date(), 7);
      break;
    case '30day':
      startDate = subDays(new Date(), 30);
      break;
    case '90day':
      startDate = subDays(new Date(), 90);
      break;
    case 'mtd':
      startDate = startOfMonth(new Date());
      break;
    case 'ytd':
      startDate = startOfYear(new Date());
      break;
    case 'custom':
      if (customDateRange) {
        startDate = customDateRange.start;
        endDate = customDateRange.end;
      } else {
        startDate = subDays(new Date(), 30);
      }
      break;
    default:
      // For trajectory charts, default to showing all data
      return data;
  }

  return data.filter(item => {
    try {
      // Handle both date string formats
      const itemDate = typeof item.date === 'string' && item.date.includes('-')
        ? parseISO(item.date)
        : new Date(item.date);
      return (isAfter(itemDate, startDate) || isEqual(itemDate, startDate)) &&
             (isBefore(itemDate, endDate) || isEqual(itemDate, endDate));
    } catch {
      return true;
    }
  });
}

// Metric info for trajectory charts
const TRAJECTORY_INFO = {
  subscribers: {
    formula: 'Current + (Daily Growth × Days Remaining)',
    description: 'Linear projection based on current growth rate. Shows historical data, required trajectory, and projected path.',
    benchmark: 'Target: 30,000 by Q1 2026'
  }
};

function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="chart-tooltip">
      <div className="tooltip-header">{label}</div>
      <div className="tooltip-content">
        {payload.map((entry, idx) => (
          <div key={idx} className="tooltip-row">
            <span
              className="tooltip-dot"
              style={{
                backgroundColor: entry.dataKey === 'historical' ? '#3b82f6' :
                  entry.dataKey === 'required' ? '#f43f5e' : '#94a3b8'
              }}
            />
            <span className="tooltip-label">
              {entry.dataKey === 'historical' ? 'Actual' :
                entry.dataKey === 'required' ? 'Required' : 'Projected'}:
            </span>
            <span className="tooltip-value">{formatNumber(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TrajectoryChart({
  data,
  targetValue,
  targetRange, // Optional: { min, max } for metrics with ranges
  title = 'Growth Trajectory',
  subtitle,
  height = 300,
  metricFormat = 'number',
  showFilters = true
}) {
  const [chartTimePeriod, setChartTimePeriod] = useState('all');
  const [comparisonMode, setComparisonMode] = useState('none');
  const [customDateRange, setCustomDateRange] = useState(null);

  // Filter data based on time period
  const filteredData = useMemo(() => {
    if (chartTimePeriod === 'all') return data;
    return filterDataByTimePeriod(data, chartTimePeriod, customDateRange);
  }, [data, chartTimePeriod, customDateRange]);

  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    return filteredData;
  }, [filteredData]);

  // Determine if on track
  const onTrack = useMemo(() => {
    if (!chartData.length) return false;
    const lastProjected = chartData[chartData.length - 1]?.projected;
    if (targetRange) {
      return lastProjected >= targetRange.min;
    }
    return lastProjected >= targetValue;
  }, [chartData, targetValue, targetRange]);

  if (chartData.length === 0) {
    return (
      <div className="trajectory-chart-card">
        <div className="trajectory-chart-header">
          <div>
            <div className="trajectory-chart-title">{title}</div>
            {subtitle && <div className="trajectory-chart-subtitle">{subtitle}</div>}
          </div>
        </div>
        <div className="empty-state" style={{ height }}>
          <p>No trajectory data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trajectory-chart-card">
      <div className="trajectory-chart-header">
        <div>
          <div className="trajectory-chart-title">{title}</div>
          {subtitle && <div className="trajectory-chart-subtitle">{subtitle}</div>}
        </div>
        <div className="trajectory-header-right">
          <div className="trajectory-legend">
            <div className="trajectory-legend-item">
              <span className="legend-line-solid" />
              <span>Historical</span>
            </div>
            <div className="trajectory-legend-item">
              <span className="legend-line-dashed" />
              <span>Required</span>
            </div>
            <div className="trajectory-legend-item">
              <span className="legend-line-dotted" />
              <span>Projected</span>
            </div>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="trajectory-chart-filters">
          <ChartFilters
            title={title}
            metricInfo={TRAJECTORY_INFO.subscribers}
            timePeriod={chartTimePeriod}
            onTimePeriodChange={setChartTimePeriod}
            comparisonMode={comparisonMode}
            onComparisonChange={setComparisonMode}
            showComparison={false}
            showInfo={true}
            customDateRange={customDateRange}
            onCustomDateChange={setCustomDateRange}
          />
        </div>
      )}

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={formatNumber}
              width={55}
              domain={['auto', 'auto']}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Target range shaded area (for metrics like Open Rate 35-40%) */}
            {targetRange && (
              <ReferenceArea
                y1={targetRange.min}
                y2={targetRange.max}
                fill="#10b981"
                fillOpacity={0.1}
                strokeOpacity={0}
              />
            )}

            {/* Target line */}
            <ReferenceLine
              y={targetRange ? targetRange.min : targetValue}
              stroke="#f43f5e"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              label={{
                value: `Target: ${formatNumber(targetRange ? targetRange.min : targetValue)}`,
                position: 'right',
                fill: '#f43f5e',
                fontSize: 11
              }}
            />

            {/* Historical data (solid blue area) - trading style with linear interpolation */}
            <Area
              type="linear"
              dataKey="historical"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#historicalGradient)"
              connectNulls
            />

            {/* Required trajectory (dashed red line) - angular style */}
            <Line
              type="linear"
              dataKey="required"
              stroke="#f43f5e"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls
            />

            {/* Projected trajectory (dotted gray line) - angular style */}
            <Line
              type="linear"
              dataKey="projected"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={false}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Status indicator */}
      <div style={{
        marginTop: 'var(--space-md)',
        padding: 'var(--space-sm) var(--space-md)',
        borderRadius: 'var(--radius-sm)',
        background: onTrack ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '13px',
        fontWeight: 500,
        color: onTrack ? '#10b981' : '#ef4444'
      }}>
        {onTrack ? '✓ On track to meet target' : '✗ Below required trajectory'}
      </div>
    </div>
  );
}
