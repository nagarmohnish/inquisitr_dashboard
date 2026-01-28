import { useMemo } from 'react';
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip
} from 'recharts';

const ACCENT_COLORS = {
  blue: 'var(--accent-blue)',
  green: 'var(--accent-green)',
  purple: 'var(--accent-purple)',
  amber: 'var(--accent-amber)',
  pink: 'var(--accent-rose)',
  orange: 'var(--accent-orange)',
  red: 'var(--accent-rose)'
};

const COLOR_HEX = {
  blue: '#3b82f6',
  green: '#10b981',
  purple: '#8b5cf6',
  amber: '#f59e0b',
  pink: '#f43f5e',
  orange: '#f97316',
  red: '#ef4444'
};

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;

  const chartData = data.slice(-7).map((value, idx) => ({ value, idx }));

  return (
    <div className="metric-sparkline">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`sparkGrad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR_HEX[color]} stopOpacity={0.3} />
              <stop offset="100%" stopColor={COLOR_HEX[color]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={COLOR_HEX[color]}
            strokeWidth={1.5}
            fill={`url(#sparkGrad-${color})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChevronIcon({ rotated }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease'
      }}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function DetailChart({ data, dataKey, color }) {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id={`detailGrad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR_HEX[color]} stopOpacity={0.2} />
              <stop offset="100%" stopColor={COLOR_HEX[color]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '13px'
            }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={COLOR_HEX[color]}
            strokeWidth={2}
            fill={`url(#detailGrad-${dataKey})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function MetricCard({
  label,
  value,
  change,
  changeLabel = 'vs prior',
  format = 'number',
  color = 'blue',
  sparklineData = [],
  isExpanded = false,
  onClick,
  detailData,
  detailDataKey,
  tooltip,
  invertChange = false
}) {
  const accentColor = ACCENT_COLORS[color] || ACCENT_COLORS.blue;

  const formatValue = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '-';
    if (format === 'percent') return `${val.toFixed(1)}%`;
    if (format === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      return val.toLocaleString();
    }
    return val;
  };

  const isPositive = change > 0;
  const isNegative = change < 0;
  const changeValue = Math.abs(change || 0);
  const changeText = format === 'percent'
    ? `${changeValue.toFixed(1)} pts`
    : formatValue(changeValue);

  // For metrics where lower is better (like unsubscribe rate), invert the color logic
  let changeClass;
  if (invertChange) {
    changeClass = isPositive ? 'negative' : isNegative ? 'positive' : 'neutral';
  } else {
    changeClass = isPositive ? 'positive' : isNegative ? 'negative' : 'neutral';
  }

  return (
    <div
      className={`metric-card ${isExpanded ? 'expanded' : ''}`}
      style={{ '--accent': accentColor }}
      onClick={onClick}
      title={tooltip}
    >
      <div className="metric-card-header">
        <span className="metric-title">{label}</span>
        {tooltip && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.4 }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )}
        {onClick && (
          <ChevronIcon rotated={isExpanded} />
        )}
      </div>

      <div className="metric-value">{formatValue(value)}</div>

      <div className="metric-footer">
        <span className={`metric-change ${changeClass}`}>
          {isPositive && '↑'}
          {isNegative && '↓'}
          {' '}{changeText}
        </span>
        <span className="metric-label">{changeLabel}</span>
      </div>

      {sparklineData && sparklineData.length > 1 && !isExpanded && (
        <Sparkline data={sparklineData} color={color} />
      )}

      {isExpanded && detailData && (
        <div className="metric-detail-panel animate-fade-in">
          <DetailChart
            data={detailData}
            dataKey={detailDataKey || 'value'}
            color={color}
          />
        </div>
      )}
    </div>
  );
}
