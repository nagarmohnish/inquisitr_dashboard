import { useMemo } from 'react';
import { format } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

// Distinct color palette for UTM sources - professional but distinguishable
const SOURCE_COLORS = {
  direct: '#18181b',     // Black - primary/direct
  ml2: '#2563eb',        // Blue - paid source 1
  ml3: '#7c3aed',        // Purple - paid source 2
  website: '#0891b2',    // Cyan - website traffic
  referral: '#059669',   // Emerald - referrals
  organic: '#ca8a04',    // Yellow/Gold - organic
  other: '#71717a',      // Gray - other
  total: '#dc2626'       // Red - total (standout)
};

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
            {visibleSources.map(source => (
              <Line
                key={source}
                type="linear"
                dataKey={source}
                name={source.charAt(0).toUpperCase() + source.slice(1)}
                stroke={SOURCE_COLORS[source] || SOURCE_COLORS.other}
                strokeWidth={source === 'total' ? 2.5 : 1.5}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: SOURCE_COLORS[source] || SOURCE_COLORS.other }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
