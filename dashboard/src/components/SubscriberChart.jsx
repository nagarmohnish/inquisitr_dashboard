import { useMemo } from 'react';
import { format } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

// Distinct color palette for acquisition sources (channel: source: medium)
const SOURCE_COLORS = {
  'api: ml2: none': '#2563eb',                        // Blue
  'import: direct: none': '#18181b',                   // Black
  'api: ml2.275: none': '#60a5fa',                     // Light blue
  'api: lh2 da: lh2 da': '#f59e0b',                   // Amber
  'api: direct: none': '#6b7280',                      // Gray
  'api: ml3: none': '#7c3aed',                         // Purple
  'api: sso: sso': '#059669',                          // Emerald
  'api: lh2 email capture: lh2 email capture': '#06b6d4', // Cyan
  'import: lh2 da: lh2 da': '#d97706',                // Dark amber
  'api: website: popup': '#ec4899',                    // Pink
  'api: website: embedded': '#f97316',                 // Orange
  'api: website: landing page': '#84cc16',             // Lime
  total: '#dc2626'                                     // Red - total
};

// Fallback color generator for unknown sources
const FALLBACK_COLORS = ['#8b5cf6', '#14b8a6', '#f43f5e', '#0ea5e9', '#a855f7', '#22c55e'];
function getSourceColor(source, index) {
  return SOURCE_COLORS[source] || FALLBACK_COLORS[index % FALLBACK_COLORS.length] || '#71717a';
}

function formatXAxis(dateStr, granularity) {
  const date = new Date(dateStr);
  if (granularity === 'week') {
    return `Week ${format(date, 'w')}`;
  }
  if (granularity === 'month') {
    return format(date, "MMM ''yy");
  }
  return format(date, 'MMM d');
}

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
              style={{ backgroundColor: entry.color }}
            />
            <span className="tooltip-label">{entry.name}:</span>
            <span className="tooltip-value">{formatNumber(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SubscriberChart({
  data,
  sources = ['total'],
  granularity = 'day',
  title = 'Subscriber Growth',
  subtitle,
  height = 300
}) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(d => ({
      ...d,
      dateFormatted: formatXAxis(d.date, granularity)
    }));
  }, [data, granularity]);

  const visibleSources = useMemo(() => {
    return sources.filter(source =>
      chartData.some(d => d[source] !== undefined && d[source] !== null)
    );
  }, [chartData, sources]);

  if (chartData.length === 0) {
    return (
      <div className="subscriber-chart-card">
        <div className="subscriber-chart-header">
          <div>
            <div className="subscriber-chart-title">{title}</div>
            {subtitle && <div className="subscriber-chart-subtitle">{subtitle}</div>}
          </div>
        </div>
        <div className="empty-state" style={{ height }}>
          <p>No subscriber data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subscriber-chart-card">
      <div className="subscriber-chart-header">
        <div>
          <div className="subscriber-chart-title">{title}</div>
          {subtitle && <div className="subscriber-chart-subtitle">{subtitle}</div>}
        </div>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="dateFormatted"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#a1a1aa', fontSize: 10 }}
              interval={Math.max(Math.floor(chartData.length / 6) - 1, 0)}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#a1a1aa', fontSize: 10 }}
              tickFormatter={formatNumber}
              tickCount={5}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </span>
              )}
            />
            {visibleSources.map((source, idx) => {
              const color = getSourceColor(source, idx);
              return (
                <Line
                  key={source}
                  type="linear"
                  dataKey={source}
                  name={source}
                  stroke={color}
                  strokeWidth={source === 'total' ? 2.5 : 1.5}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: color }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
