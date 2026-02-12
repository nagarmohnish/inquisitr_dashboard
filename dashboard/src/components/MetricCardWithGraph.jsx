import { useState, useMemo } from 'react';
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  ComposedChart, Line
} from 'recharts';
import { format, parseISO } from 'date-fns';
import ChartFilters from './ChartFilters';

// SOPHISTICATED B&W PALETTE: Monochrome charts with subtle variations
const COLOR_HEX = {
  blue: '#18181b',    // Primary black
  green: '#18181b',   // Primary black
  purple: '#52525b',  // Secondary gray
  amber: '#71717a',   // Tertiary gray
  pink: '#a1a1aa'     // Muted gray
};

const ACCENT_COLORS = {
  blue: 'var(--accent-primary)',
  green: 'var(--accent-primary)',
  purple: 'var(--accent-neutral-dark)',
  amber: 'var(--accent-neutral)',
  pink: 'var(--text-muted)'
};

// Comprehensive Metric explanations - used across the dashboard
// NOTE: Beehiiv's "CTR" is actually CTOR (clicks/opens). True CTR would be clicks/total subs.
const METRIC_INFO = {
  Subscribers: {
    formula: 'COUNT(subscribers WHERE status = "active")',
    description: 'Total active subscribers across all publications. A growing count indicates healthy list growth.',
    benchmark: 'Continuously growing',
    tip: 'Focus on acquisition channels and referral programs to grow subscribers.'
  },
  'Open Rate': {
    formula: '(Unique Opens / Delivered) × 100',
    description: 'Percentage of delivered emails opened at least once. Measures subject line effectiveness and sender reputation.',
    benchmark: '20-40% (industry avg: 22%)',
    tip: 'Test subject lines, optimize send times, and clean inactive subscribers.'
  },
  CTR: {
    formula: '(Unique Clicks / Total Subscribers) × 100',
    description: 'Click-Through Rate - percentage of total subscribers who clicked. Based on total subscriber count for true reach measurement.',
    benchmark: '2-5% (industry avg: 2.5%)',
    tip: 'Add compelling CTAs, improve link placement, and ensure mobile optimization.'
  },
  CTOR: {
    formula: '(Unique Clicks / Unique Opens) × 100',
    description: 'Click-to-Open Rate - of people who opened, what percentage clicked? This is what Beehiiv calls "CTR". Measures content quality.',
    benchmark: '9-15% (target: 9%)',
    tip: 'Improve content quality, CTA placement, and ensure content matches subject promises.'
  },
  RPM: {
    formula: '(Total Revenue / Emails Sent) × 1000',
    description: 'Revenue Per Mille - revenue generated per 1,000 emails sent. Key monetization metric.',
    benchmark: '$2.70 (industry avg)',
    tip: 'Optimize ad placements, improve click rates, and test different monetization strategies.'
  },
  'Traffic Sent': {
    formula: 'SUM(All Link Clicks)',
    description: 'Total clicks from newsletters to your website or articles. Measures reader engagement.',
    benchmark: 'Higher is better',
    tip: 'Add more compelling links, use curiosity-driven teasers, and optimize link placement.'
  },
  'Bounce Rate': {
    formula: '(Bounced / Sent) × 100',
    description: 'Percentage of emails that could not be delivered. Affects sender reputation.',
    benchmark: '<2% (ideal: <0.5%)',
    tip: 'Clean your list regularly, remove invalid emails, and use double opt-in.'
  },
  'Unsubscribe Rate': {
    formula: '(Unsubscribes / Delivered) × 100',
    description: 'Percentage of recipients who unsubscribed after receiving the email.',
    benchmark: '<0.5% (ideal: <0.2%)',
    tip: 'Send relevant content, respect frequency preferences, and segment your audience.'
  },
  'Active Subscribers': {
    formula: 'COUNT(subscribers WHERE status = "active")',
    description: 'Total currently active subscribers. Matches Beehiiv\'s "Active subscribers" count. Change shows net new subscribers vs prior period.',
    benchmark: 'Continuously growing',
    tip: 'Focus on acquisition channels, referral programs, and lead magnets.'
  }
};

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function ChevronIcon({ expanded }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: 'transform 0.2s ease',
        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)'
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function InfoPopover({ info, onClose }) {
  if (!info) return null;

  return (
    <div className="metric-info-popover">
      <div className="metric-info-header">
        <span>How it's calculated</span>
        <button className="metric-info-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="metric-info-content">
        <div className="metric-info-formula">
          <code>{info.formula}</code>
        </div>
        <p className="metric-info-description">{info.description}</p>
        <div className="metric-info-benchmark">
          <span className="metric-info-label">Benchmark:</span>
          <span>{info.benchmark}</span>
        </div>
        <div className="metric-info-tip">
          <span className="metric-info-label">Tip:</span>
          <span>{info.tip}</span>
        </div>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, formatType, showComparison }) {
  if (!active || !payload?.length) return null;

  const currentValue = payload.find(p => p.dataKey === 'value')?.value;
  const comparisonValue = payload.find(p => p.dataKey === 'comparisonValue')?.value;

  let formattedDate;
  try {
    formattedDate = format(parseISO(label), 'MMM d, yyyy');
  } catch {
    formattedDate = label;
  }

  const formatVal = (val) => {
    if (val === undefined || val === null) return '-';
    return formatType === 'percent' ? `${val.toFixed(2)}%` : val.toLocaleString();
  };

  return (
    <div className="metric-graph-tooltip trading-tooltip">
      <div className="tooltip-date">{formattedDate}</div>
      <div className="tooltip-row">
        <span className="tooltip-label">Value:</span>
        <span className="tooltip-value">{formatVal(currentValue)}</span>
      </div>
      {showComparison && comparisonValue !== undefined && (
        <div className="tooltip-row comparison-row">
          <span className="tooltip-label">Prior:</span>
          <span className="tooltip-value">{formatVal(comparisonValue)}</span>
        </div>
      )}
    </div>
  );
}

// Export METRIC_INFO for use in other components
export { METRIC_INFO };

export default function MetricCardWithGraph({
  label,
  value,
  change,
  changeLabel = 'vs prior',
  format: formatType = 'number',
  color = 'blue',
  trendData = [],
  dataKey,
  previousDayValue,
  showPreviousDay = false,
  comparisonValue,
  comparisonValueLabel,
  expanded = false,
  onToggleExpand
}) {
  const [showInfo, setShowInfo] = useState(false);
  const [chartTimePeriod, setChartTimePeriod] = useState('30day');
  const [comparisonMode, setComparisonMode] = useState('none');
  const [customDateRange, setCustomDateRange] = useState(null);
  const accentColor = ACCENT_COLORS[color] || ACCENT_COLORS.blue;
  const hexColor = COLOR_HEX[color] || COLOR_HEX.blue;
  const metricInfo = METRIC_INFO[label];

  const formatValue = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '-';
    if (formatType === 'percent') return `${val.toFixed(1)}%`;
    if (formatType === 'exact') return val.toLocaleString();
    if (formatType === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      return val.toLocaleString();
    }
    return val;
  };

  const isPositive = change > 0;
  const isNegative = change < 0;
  const changeValue = Math.abs(change || 0);
  const changeText = formatType === 'percent'
    ? `${changeValue.toFixed(1)} pts`
    : formatValue(changeValue);

  const changeClass = isPositive ? 'positive' : isNegative ? 'negative' : 'neutral';

  // Prepare chart data only when expanded
  const chartData = useMemo(() => {
    if (!expanded || !trendData || trendData.length === 0) return [];
    return trendData.map((item, idx, arr) => {
      const currentVal = item[dataKey] || 0;
      const prevVal = idx > 0 ? (arr[idx - 1][dataKey] || currentVal) : currentVal;
      return {
        date: item.date,
        value: currentVal,
        open: prevVal,
        close: currentVal,
        isUp: currentVal >= prevVal
      };
    });
  }, [expanded, trendData, dataKey]);

  // Calculate domain for Y axis
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    const values = chartData.map(d => d.value).filter(v => !isNaN(v));
    if (values.length === 0) return [0, 100];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.15 || 5;
    return [Math.max(0, min - padding), max + padding];
  }, [chartData]);

  const formatXAxis = (dateStr) => {
    try {
      return format(parseISO(dateStr), 'MMM d');
    } catch {
      return dateStr;
    }
  };

  const handleInfoClick = (e) => {
    e.stopPropagation();
    setShowInfo(!showInfo);
  };

  const handleCardClick = () => {
    if (onToggleExpand) {
      onToggleExpand();
    }
  };

  return (
    <div
      className={`metric-card-graph accent-${color} ${expanded ? 'expanded' : ''}`}
      style={{ '--accent': accentColor }}
    >
      <div className="metric-card-top" onClick={handleCardClick} style={{ cursor: onToggleExpand ? 'pointer' : 'default' }}>
        <div className="metric-card-header">
          <span className="metric-title">{label}</span>
          <div className="metric-header-actions">
            {metricInfo && (
              <button
                className={`metric-info-btn ${showInfo ? 'active' : ''}`}
                onClick={handleInfoClick}
                title={`Learn about ${label}`}
              >
                <InfoIcon />
              </button>
            )}
            {onToggleExpand && (
              <span className="metric-expand-indicator">
                <ChevronIcon expanded={expanded} />
              </span>
            )}
          </div>
        </div>

        {showInfo && metricInfo && (
          <InfoPopover info={metricInfo} onClose={() => setShowInfo(false)} />
        )}

        <div className="metric-value-section">
          <div className="metric-values-row">
            <div className="metric-value tabular-nums">{formatValue(value)}</div>
            {comparisonValue !== undefined && comparisonValue !== null && (
              <div className="metric-comparison-value">
                <span className="comparison-value tabular-nums">{formatValue(comparisonValue)}</span>
                <span className="comparison-label">{comparisonValueLabel || 'Prev Avg'}</span>
              </div>
            )}
          </div>
          <div className="metric-footer">
            <span className={`metric-change ${changeClass}`}>
              {isPositive && '↑'}
              {isNegative && '↓'}
              {' '}{changeText}
            </span>
            <span className="metric-label">{changeLabel}</span>
          </div>
        </div>

        {showPreviousDay && previousDayValue !== undefined && (
          <div className="metric-previous-day">
            <span className="previous-day-label">Yesterday:</span>
            <span className="previous-day-value">{formatValue(previousDayValue)}</span>
          </div>
        )}
      </div>

      {/* Expandable chart - only visible when card is clicked */}
      {expanded && chartData.length > 1 && (
        <div className="metric-expanded-chart">
          <div className="metric-chart-filters">
            <ChartFilters
              title={label}
              metricInfo={metricInfo}
              timePeriod={chartTimePeriod}
              onTimePeriodChange={setChartTimePeriod}
              comparisonMode={comparisonMode}
              onComparisonChange={setComparisonMode}
              showComparison={true}
              showInfo={false}
              compact={true}
              customDateRange={customDateRange}
              onCustomDateChange={setCustomDateRange}
            />
          </div>
          <div className="metric-graph-container trading-chart">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={hexColor} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={hexColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 9, fill: '#a1a1aa' }}
                  axisLine={false}
                  tickLine={false}
                  interval={Math.max(Math.floor(chartData.length / 5) - 1, 0)}
                />
                <YAxis
                  domain={yDomain}
                  tick={{ fontSize: 9, fill: '#a1a1aa' }}
                  axisLine={false}
                  tickLine={false}
                  tickCount={4}
                  tickFormatter={(v) => {
                    if (formatType === 'percent') return `${v.toFixed(0)}%`;
                    if (v >= 1000000) return `${(v / 1000000).toFixed(0)}M`;
                    if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                    return v.toFixed(0);
                  }}
                  width={32}
                />
                <Tooltip content={<ChartTooltip formatType={formatType} showComparison={comparisonMode !== 'none'} />} />

                <Area
                  type="linear"
                  dataKey="value"
                  stroke={hexColor}
                  strokeWidth={2}
                  fill={`url(#gradient-${dataKey})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: hexColor }}
                />

                {comparisonMode !== 'none' && (
                  <Line
                    type="linear"
                    dataKey="comparisonValue"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    connectNulls
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
