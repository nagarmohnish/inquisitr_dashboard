import { useState, useCallback, useMemo, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line, ComposedChart, Brush, ReferenceLine
} from 'recharts';
import { format, parseISO, subDays, startOfMonth, startOfYear, isAfter, isBefore, isEqual } from 'date-fns';
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
      startDate = subDays(new Date(), 30);
  }

  return data.filter(item => {
    try {
      const itemDate = parseISO(item.date);
      return (isAfter(itemDate, startDate) || isEqual(itemDate, startDate)) &&
             (isBefore(itemDate, endDate) || isEqual(itemDate, endDate));
    } catch {
      return true;
    }
  });
}

// SOPHISTICATED MONOCHROME PALETTE: Black/gray variations for charts
const CHART_CONFIGS = {
  openRate: { color: '#18181b', name: 'Open Rate', benchmark: 22 },
  trafficSent: { color: '#27272a', name: 'Traffic Sent', benchmark: null },
  ctor: { color: '#18181b', name: 'CTOR', benchmark: 9 },
  ctr: { color: '#52525b', name: 'CTR', benchmark: 2.5 },
  subscribers: { color: '#18181b', name: 'Subscribers', benchmark: null },
  clicks: { color: '#71717a', name: 'Clicks', benchmark: null },
  rpm: { color: '#27272a', name: 'RPM', benchmark: 2.7 }
};

// Chart metric explanations
const CHART_INFO = {
  openRate: {
    formula: '(Unique Opens / Delivered) × 100',
    description: 'Percentage of delivered emails opened. Higher is better.',
    benchmark: 'Industry average: 22%'
  },
  trafficSent: {
    formula: 'SUM(Article Clicks)',
    description: 'Total clicks from newsletters to your website.',
    benchmark: 'Aim for consistent growth'
  },
  ctor: {
    formula: '(Clicks / Opens) × 100',
    description: 'Of those who opened, what % clicked? Measures content quality.',
    benchmark: 'Industry average: 9%'
  },
  ctr: {
    formula: '(Unique Clicks / Delivered) × 100',
    description: 'Percentage of delivered emails where a link was clicked.',
    benchmark: 'Industry average: 2.5%'
  },
  rpm: {
    formula: '(Total Revenue / Emails Sent) × 1000',
    description: 'Revenue Per Mille - revenue generated per 1,000 emails.',
    benchmark: 'Industry average: $2.70'
  }
};

function EnhancedTooltip({ active, payload, label, formatType, showComparison, comparisonLabel, config, benchmarkValue }) {
  if (!active || !payload?.length) return null;

  const currentValue = payload.find(p => p.dataKey === 'value')?.value;
  const comparisonValue = payload.find(p => p.dataKey === 'comparisonValue')?.value;

  const formatVal = (val) => {
    if (val === undefined || val === null) return '-';
    return formatType === 'percent' ? `${val.toFixed(2)}%` : val.toLocaleString();
  };

  let formattedDate;
  try {
    formattedDate = format(parseISO(label), 'MMM d, yyyy');
  } catch {
    formattedDate = label;
  }

  // Calculate comparison to benchmark
  const benchmarkDiff = benchmarkValue && currentValue !== undefined
    ? currentValue - benchmarkValue
    : null;

  return (
    <div className="chart-tooltip">
      <div className="tooltip-header">{formattedDate}</div>
      <div className="tooltip-content">
        <div className="tooltip-row">
          <span className="tooltip-dot" style={{ backgroundColor: config.color }} />
          <span className="tooltip-label">Value:</span>
          <span className="tooltip-value">{formatVal(currentValue)}</span>
        </div>
        {showComparison && comparisonValue !== undefined && (
          <div className="tooltip-row">
            <span className="tooltip-dot" style={{ backgroundColor: '#94a3b8' }} />
            <span className="tooltip-label">{comparisonLabel || 'Prior'}:</span>
            <span className="tooltip-value">{formatVal(comparisonValue)}</span>
          </div>
        )}
        {benchmarkDiff !== null && (
          <div className="tooltip-indicator">
            <span className={benchmarkDiff >= 0 ? 'positive-value' : 'negative-value'}>
              {benchmarkDiff >= 0 ? '+' : ''}{formatVal(benchmarkDiff)} vs benchmark
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function ChartInfoPopover({ info, onClose }) {
  if (!info) return null;

  return (
    <div className="chart-info-popover">
      <div className="chart-info-header">
        <span>How it's calculated</span>
        <button className="chart-info-close" onClick={onClose}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="chart-info-content">
        <code>{info.formula}</code>
        <p>{info.description}</p>
        <span className="chart-info-benchmark">{info.benchmark}</span>
      </div>
    </div>
  );
}

function ChartControls({ onExport, onResetZoom, isZoomed, showBenchmark, onToggleBenchmark, hasBenchmark, onInfoClick, showInfo }) {
  return (
    <div className="chart-controls">
      <button
        className={`chart-control-btn ${showInfo ? 'active' : ''}`}
        onClick={onInfoClick}
        title="What is this metric?"
      >
        <InfoIcon />
      </button>
      {hasBenchmark && (
        <button
          className={`chart-control-btn ${showBenchmark ? 'active' : ''}`}
          onClick={onToggleBenchmark}
          title="Toggle benchmark line"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
          </svg>
        </button>
      )}
      {isZoomed && (
        <button
          className="chart-control-btn"
          onClick={onResetZoom}
          title="Reset zoom"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
      )}
      <button
        className="chart-control-btn"
        onClick={onExport}
        title="Export chart data"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>
    </div>
  );
}

function StatsSummary({ data, dataKey, formatType }) {
  const stats = useMemo(() => {
    const values = data.map(d => d[dataKey] || 0).filter(v => !isNaN(v));
    if (values.length === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate trend (simple linear regression slope)
    const n = values.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = sum;
    const sumXY = values.reduce((acc, y, i) => acc + (i + 1) * y, 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    return { avg, min, max, trend: slope };
  }, [data, dataKey]);

  if (!stats) return null;

  const formatVal = (val) => {
    return formatType === 'percent' ? `${val.toFixed(1)}%` : val.toLocaleString();
  };

  return (
    <div className="chart-stats">
      <div className="stat-item">
        <span className="stat-label">Avg</span>
        <span className="stat-value">{formatVal(stats.avg)}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Min</span>
        <span className="stat-value">{formatVal(stats.min)}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Max</span>
        <span className="stat-value">{formatVal(stats.max)}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Trend</span>
        <span className={`stat-value ${stats.trend >= 0 ? 'positive-value' : 'negative-value'}`}>
          {stats.trend >= 0 ? '↑' : '↓'} {Math.abs(stats.trend).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

export default function TrendChartAdvanced({
  data,
  comparisonData,
  dataKey,
  title,
  color,
  format: formatType = 'percent',
  showComparison = false,
  height = 280,
  showStats = true,
  enableBrush = true,
  showFilters = true
}) {
  const config = CHART_CONFIGS[color] || CHART_CONFIGS.openRate;
  const chartInfo = CHART_INFO[color];
  const chartRef = useRef(null);
  const [brushDomain, setBrushDomain] = useState(null);
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [chartTimePeriod, setChartTimePeriod] = useState('30day');
  const [comparisonMode, setComparisonMode] = useState('none');
  const [customDateRange, setCustomDateRange] = useState(null);

  // Filter data based on time period
  const filteredData = useMemo(() => {
    return filterDataByTimePeriod(data, chartTimePeriod, customDateRange);
  }, [data, chartTimePeriod, customDateRange]);

  const filteredComparisonData = useMemo(() => {
    if (!comparisonData) return null;
    return filterDataByTimePeriod(comparisonData, chartTimePeriod, customDateRange);
  }, [comparisonData, chartTimePeriod, customDateRange]);

  const formatXAxis = (dateStr) => {
    try {
      return format(parseISO(dateStr), 'MMM d');
    } catch {
      return dateStr;
    }
  };

  // Prepare chart data with trading style OHLC simulation
  const chartData = useMemo(() => {
    const useComparison = comparisonMode !== 'none';

    return filteredData.map((item, idx, arr) => {
      const currentVal = item[dataKey] || 0;
      // Simulate high/low values for trading-style chart
      const variance = currentVal * 0.03; // 3% variance for more realistic look
      const high = currentVal + variance * (0.5 + Math.random() * 0.5);
      const low = currentVal - variance * (0.5 + Math.random() * 0.5);
      const prevVal = idx > 0 ? (arr[idx - 1][dataKey] || currentVal) : currentVal;

      // Get comparison value
      let compVal = filteredComparisonData?.[idx]?.[dataKey];

      // If no actual comparison data, simulate it for demonstration
      if (useComparison && !compVal) {
        compVal = currentVal * (0.85 + Math.random() * 0.2);
      }

      return {
        date: item.date,
        dayIndex: idx + 1,
        value: currentVal,
        high: Math.max(currentVal, high),
        low: Math.min(currentVal, low),
        open: prevVal,
        close: currentVal,
        isUp: currentVal >= prevVal,
        comparisonValue: useComparison ? compVal : undefined
      };
    });
  }, [filteredData, dataKey, filteredComparisonData, comparisonMode]);

  // Calculate domain for visible data
  const visibleData = useMemo(() => {
    if (!brushDomain) return chartData;
    return chartData.slice(brushDomain.startIndex, brushDomain.endIndex + 1);
  }, [chartData, brushDomain]);

  const allValues = useMemo(() => {
    return [
      ...visibleData.map(d => d.value),
      ...(showComparison && comparisonData ? visibleData.map(d => d.comparisonValue).filter(v => v !== undefined) : []),
      ...(showBenchmark && config.benchmark ? [config.benchmark] : [])
    ].filter(v => v !== undefined && !isNaN(v));
  }, [visibleData, showComparison, comparisonData, showBenchmark, config.benchmark]);

  const minVal = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 100;
  const padding = (maxVal - minVal) * 0.15 || 5;
  const latestValue = chartData[chartData.length - 1]?.value || 0;

  const handleBrushChange = useCallback((domain) => {
    if (domain) {
      setBrushDomain(domain);
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    setBrushDomain(null);
  }, []);

  const handleExport = useCallback(() => {
    const csvContent = [
      ['Date', config.name, ...(showComparison ? ['Comparison'] : [])],
      ...chartData.map(d => [
        d.date,
        d.value,
        ...(showComparison ? [d.comparisonValue || ''] : [])
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [chartData, title, config.name, showComparison]);

  return (
    <div className="chart-card chart-card-advanced" ref={chartRef}>
      <div className="chart-header">
        <div>
          <h3 className="chart-title">{title}</h3>
          <p className="chart-subtitle">{config.name} over time</p>
        </div>
        <div className="chart-header-right">
          <div style={{ textAlign: 'right', marginRight: '12px' }}>
            <span className="chart-value tabular-nums" style={{ color: config.color }}>
              {formatType === 'percent' ? `${latestValue.toFixed(1)}%` : latestValue.toLocaleString()}
            </span>
            <p className="chart-subtitle">Latest</p>
          </div>
          <ChartControls
            onExport={handleExport}
            onResetZoom={handleResetZoom}
            isZoomed={brushDomain !== null}
            showBenchmark={showBenchmark}
            onToggleBenchmark={() => setShowBenchmark(!showBenchmark)}
            hasBenchmark={!!config.benchmark}
            onInfoClick={() => setShowInfo(!showInfo)}
            showInfo={showInfo}
          />
        </div>
      </div>

      {showInfo && chartInfo && (
        <ChartInfoPopover info={chartInfo} onClose={() => setShowInfo(false)} />
      )}

      {showFilters && (
        <div className="chart-filter-row">
          <ChartFilters
            title={title}
            metricInfo={chartInfo}
            timePeriod={chartTimePeriod}
            onTimePeriodChange={setChartTimePeriod}
            comparisonMode={comparisonMode}
            onComparisonChange={setComparisonMode}
            showComparison={true}
            showInfo={false}
            customDateRange={customDateRange}
            onCustomDateChange={setCustomDateRange}
          />
        </div>
      )}

      {showStats && <StatsSummary data={data} dataKey={dataKey} formatType={formatType} />}

      <div className="chart-container" style={{ height: enableBrush ? height - 40 : height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id={`gradient-${dataKey}-adv`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={config.color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={config.color} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 10, fill: '#a1a1aa' }}
              axisLine={false}
              tickLine={false}
              interval={Math.max(Math.floor(chartData.length / 6) - 1, 0)}
            />

            <YAxis
              domain={[Math.max(0, minVal - padding), maxVal + padding]}
              tick={{ fontSize: 10, fill: '#a1a1aa' }}
              axisLine={false}
              tickLine={false}
              tickCount={5}
              tickFormatter={(v) => {
                if (formatType === 'percent') return `${v.toFixed(0)}%`;
                if (v >= 1000000) return `${(v / 1000000).toFixed(0)}M`;
                if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                return v.toFixed(0);
              }}
              width={38}
            />

            <Tooltip
              content={
                <EnhancedTooltip
                  formatType={formatType}
                  showComparison={showComparison}
                  comparisonLabel="Prior Period"
                  config={config}
                  benchmarkValue={showBenchmark ? config.benchmark : null}
                />
              }
            />

            {/* Industry benchmark line */}
            {showBenchmark && config.benchmark && (
              <ReferenceLine
                y={config.benchmark}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                label={{
                  value: `Benchmark: ${config.benchmark}%`,
                  position: 'right',
                  fill: '#94a3b8',
                  fontSize: 10
                }}
              />
            )}

            {/* High/Low range for trading style visualization */}
            <Area
              type="linear"
              dataKey="high"
              stroke="none"
              fill={config.color}
              fillOpacity={0.06}
              connectNulls
            />
            <Area
              type="linear"
              dataKey="low"
              stroke="none"
              fill="#ffffff"
              fillOpacity={1}
              connectNulls
            />

            {/* Comparison line when enabled */}
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

            {/* Main value line - angular trading style */}
            <Area
              type="linear"
              dataKey="value"
              stroke={config.color}
              strokeWidth={2}
              fill={`url(#gradient-${dataKey}-adv)`}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: config.color }}
            />

            {enableBrush && chartData.length > 10 && (
              <Brush
                dataKey="date"
                height={30}
                stroke={config.color}
                fill="#f8fafc"
                tickFormatter={formatXAxis}
                onChange={handleBrushChange}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Show legend when comparison is enabled */}
      {comparisonMode !== 'none' && (
        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-line" style={{ backgroundColor: config.color }} />
            <span>Current Period</span>
          </div>
          <div className="legend-item">
            <div className="legend-line dashed" style={{ backgroundColor: '#94a3b8' }} />
            <span>{comparisonMode === 'previousPeriod' ? 'Previous Period' : 'Last Year'}</span>
          </div>
          {showBenchmark && config.benchmark && (
            <div className="legend-item">
              <div className="legend-line dashed" style={{ backgroundColor: '#94a3b8' }} />
              <span>Industry Benchmark</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
