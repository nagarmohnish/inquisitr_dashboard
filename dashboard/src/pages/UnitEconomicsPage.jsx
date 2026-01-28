import { useState, useMemo } from 'react';
import { format, subDays, startOfMonth, startOfYear } from 'date-fns';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import ChartFilters from '../components/ChartFilters';

// Cost configuration (matching plan_rohit)
const COSTS = {
  PAID_SOURCES: ['ml2', 'ml3'],
  COST_PER_EMAIL: 0.10,
  BEEHIIV_MONTHLY: 109,
  BEEHIIV_WEEKLY: 109 / 4.33  // ~$25.17/week
};

// Publication filter options
const PUBLICATION_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'main', label: 'Main' },
  { key: 'ads', label: 'Ads' }
];

// Time period options
const TIME_PERIOD_OPTIONS = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'custom', label: 'Custom' }
];

// SOPHISTICATED MONOCHROME PALETTE: Black/gray variations
const COLORS = {
  blue: '#18181b',    // Primary black
  purple: '#27272a',  // Dark gray
  green: '#18181b',   // Primary black
  amber: '#52525b',   // Medium gray
  rose: '#71717a',    // Light gray
  cyan: '#a1a1aa'     // Muted gray
};

// Metric explanations for info buttons
const METRIC_INFO = {
  Revenue: { formula: '(Article Clicks × 1.5 PV/click / 1000) × RPM', description: 'Estimated revenue from ad impressions based on newsletter traffic.', benchmark: 'RPM: $2.70 (industry avg)' },
  'Total Cost': { formula: 'Beehiiv Fee + Paid Acquisition Cost', description: 'Total cost including platform fees and paid subscriber acquisition.', benchmark: 'Monitor for profitability' },
  Profit: { formula: 'Revenue - Total Cost', description: 'Net profit or loss after all costs are deducted.', benchmark: '> $0 is profitable' },
  ROI: { formula: '((Revenue - Cost) / Cost) × 100', description: 'Return on investment percentage. Measures efficiency of spending.', benchmark: '> 0% is profitable' },
  RPM: { formula: '(Revenue / Pageviews) × 1000', description: 'Revenue per 1,000 pageviews. Key monetization metric.', benchmark: 'Target: $2.70' },
  'CPU (Cost/User)': { formula: 'Total Cost / New Subscribers', description: 'Cost to acquire each new subscriber.', benchmark: 'Target: < $0.30' },
  'Cost/Clicker': { formula: 'Total Cost / Unique Clickers', description: 'Cost per person who clicks a link in your newsletter.', benchmark: 'Target: $0.30' },
  'Rev/Clicker': { formula: 'Revenue / Unique Clickers', description: 'Revenue generated from each unique clicker.', benchmark: 'Target: > Cost/Clicker' },
  'Avg Clicks/Clicker': { formula: 'Total Article Clicks / Unique Clickers', description: 'Average number of article clicks per engaged subscriber.', benchmark: 'Target: $9.00' }
};

function InfoIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function MetricInfoTooltip({ info }) {
  if (!info) return null;
  return (
    <div className="metric-info-tooltip">
      <code>{info.formula}</code>
      <p>{info.description}</p>
      <span className="benchmark">{info.benchmark}</span>
    </div>
  );
}


// Key Metric Card Component with info button (no sparkline - clean design)
function MetricCard({ label, value, change, changeLabel, color, format: formatType }) {
  const info = METRIC_INFO[label];

  const formatValue = (val) => {
    if (formatType === 'currency') return `$${val.toFixed(2)}`;
    if (formatType === 'percent') return `${val.toFixed(1)}%`;
    if (formatType === 'number') return val.toLocaleString();
    return val;
  };

  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className="econ-metric-card" style={{ '--accent': color }}>
      <div className="econ-metric-header">
        <span className="econ-metric-label">{label}</span>
        {info && (
          <button className="table-info-btn" title={`About ${label}`}>
            <InfoIcon />
            <MetricInfoTooltip info={info} />
          </button>
        )}
      </div>
      <div className="econ-metric-value">{formatValue(value)}</div>
      <div className="econ-metric-footer">
        {change !== undefined && (
          <span className={`econ-metric-change ${isPositive ? 'positive' : isNegative ? 'negative' : ''}`}>
            {isPositive ? '↑' : isNegative ? '↓' : ''}
            {Math.abs(change).toFixed(1)}{formatType === 'percent' ? ' pts' : '%'}
          </span>
        )}
        {changeLabel && <span className="econ-metric-change-label">{changeLabel}</span>}
      </div>
    </div>
  );
}

// Unit Economics Card with info button
function UnitEconCard({ label, value, subtext, highlight }) {
  const info = METRIC_INFO[label];

  return (
    <div className={`unit-econ-card-v2 ${highlight ? 'highlight' : ''}`}>
      <div className="unit-econ-card-header">
        <div className="unit-econ-card-label">{label}</div>
        {info && (
          <button className="table-info-btn" title={`About ${label}`}>
            <InfoIcon />
            <MetricInfoTooltip info={info} />
          </button>
        )}
      </div>
      <div className="unit-econ-card-value">{value}</div>
      {subtext && <div className="unit-econ-card-subtext">{subtext}</div>}
    </div>
  );
}

// Funnel Stage Component
function FunnelStage({ label, value, percentage, isLast, dropoff }) {
  return (
    <div className="funnel-stage-v2">
      <div className="funnel-stage-content">
        <div className="funnel-stage-value">{value}</div>
        <div className="funnel-stage-label">{label}</div>
        <div className="funnel-stage-pct">{percentage}</div>
      </div>
      {!isLast && (
        <div className="funnel-arrow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          {dropoff && <span className="funnel-dropoff">{dropoff}</span>}
        </div>
      )}
    </div>
  );
}

// Donut Chart for Cost Breakdown
function CostDonutChart({ data }) {
  const CHART_COLORS = [COLORS.blue, COLORS.amber, COLORS.purple];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => `$${value.toFixed(2)}`}
          contentStyle={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--bg-tertiary)',
            borderRadius: '8px'
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Trend Chart Component - matching Overview style
function TrendChart({ data, comparisonData, dataKey, title, color, format: formatType, showComparison }) {
  const formatValue = (val) => {
    if (formatType === 'currency') return `$${val.toFixed(2)}`;
    if (formatType === 'percent') return `${val.toFixed(1)}%`;
    return val.toLocaleString();
  };

  // Calculate stats
  const values = data.map(d => d[dataKey] || 0).filter(v => !isNaN(v));
  const currentAvg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">{title}</h3>
          <p className="chart-subtitle">Trend over time</p>
        </div>
        <div className="chart-header-value">
          <span className="chart-value tabular-nums">{formatValue(currentAvg)}</span>
          <span className="chart-value-label">Average</span>
        </div>
      </div>
      {/* Stats Summary */}
      <div className="chart-stats">
        <div className="stat-item">
          <span className="stat-label">Avg</span>
          <span className="stat-value">{formatValue(currentAvg)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Min</span>
          <span className="stat-value">{formatValue(min)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Max</span>
          <span className="stat-value">{formatValue(max)}</span>
        </div>
      </div>
      <div className="chart-container" style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              tickFormatter={(val) => {
                const d = new Date(val);
                return format(d, 'MMM d');
              }}
              interval={Math.max(Math.floor(data.length / 6) - 1, 0)}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              tickFormatter={(val) => formatType === 'percent' ? `${val.toFixed(0)}%` : formatType === 'currency' ? `$${val.toFixed(0)}` : val}
              width={38}
              tickCount={5}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              formatter={(val) => [formatValue(val), title.replace(' Trend', '')]}
              labelFormatter={(val) => format(new Date(val), 'MMM d, yyyy')}
            />
            {showComparison && comparisonData && (
              <Area
                type="linear"
                data={comparisonData}
                dataKey={dataKey}
                stroke="var(--text-muted)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
                opacity={0.5}
              />
            )}
            <Area
              type="linear"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${dataKey})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function UnitEconomicsPage({ data }) {
  const [timePeriod, setTimePeriod] = useState('week');
  const [showComparison, setShowComparison] = useState(false);
  const [funnelPublication, setFunnelPublication] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({ start: subDays(new Date(), 14), end: new Date() });

  const economics = useMemo(() => {
    if (!data?.posts || !data?.subscribers) {
      return null;
    }

    const now = new Date();

    // Calculate date ranges based on selected time period
    const getDateRanges = () => {
      switch (timePeriod) {
        case 'day':
          return {
            start: subDays(now, 1),
            end: now,
            prevStart: subDays(now, 2),
            prevEnd: subDays(now, 1),
            beehiivCost: COSTS.BEEHIIV_MONTHLY / 30 // Daily cost
          };
        case 'week':
          return {
            start: subDays(now, 7),
            end: now,
            prevStart: subDays(now, 14),
            prevEnd: subDays(now, 7),
            beehiivCost: COSTS.BEEHIIV_WEEKLY
          };
        case 'month':
          return {
            start: subDays(now, 30),
            end: now,
            prevStart: subDays(now, 60),
            prevEnd: subDays(now, 30),
            beehiivCost: COSTS.BEEHIIV_MONTHLY
          };
        case 'custom':
          const diffDays = Math.ceil((customDateRange.end - customDateRange.start) / (1000 * 60 * 60 * 24));
          return {
            start: customDateRange.start,
            end: customDateRange.end,
            prevStart: subDays(customDateRange.start, diffDays),
            prevEnd: customDateRange.start,
            beehiivCost: (COSTS.BEEHIIV_MONTHLY / 30) * diffDays
          };
        default:
          return {
            start: subDays(now, 7),
            end: now,
            prevStart: subDays(now, 14),
            prevEnd: subDays(now, 7),
            beehiivCost: COSTS.BEEHIIV_WEEKLY
          };
      }
    };

    const dateRanges = getDateRanges();

    // Helper functions
    const getPostDate = (post) => {
      const dateStr = post['Publish Date'] || post['publish_date'] || post['send_date'];
      return dateStr ? new Date(dateStr) : null;
    };

    // Filter posts by publication
    const filterByPublication = (posts, pubFilter) => {
      if (pubFilter === 'all') return posts;

      // Map selection to publication name patterns (matching TargetPage)
      const pubNamePatterns = {
        'main': ['inquisitr main', 'main'],
        'ads': ['inquisitr ads', 'ads']
      };
      const patterns = pubNamePatterns[pubFilter] || [pubFilter];

      return posts.filter(p => {
        const pubName = (p['Publication Name'] || p.publicationName || p.publication || p.list || p['List Name'] || '').toLowerCase();
        return patterns.some(pattern => pubName.includes(pattern));
      });
    };

    const getSubscriberDate = (sub) => {
      const dateStr = sub['Subscribe Date'] || sub['created_at'] || sub['created'];
      return dateStr ? new Date(dateStr) : null;
    };

    const sumField = (posts, field) => {
      return posts.reduce((sum, post) => {
        const val = parseFloat(post[field]) || 0;
        return sum + val;
      }, 0);
    };

    const getArticleClicks = (posts) => {
      return posts.reduce((sum, post) => {
        const clicks = post['Article Clicks'] || post['articleClicks'] || [];
        return sum + clicks.reduce((s, c) => s + (c.totalClicks || 0), 0);
      }, 0);
    };

    const isPaidSource = (sub) => {
      const source = (sub['UTM Source'] || sub['utm_source'] || '').toLowerCase();
      return COSTS.PAID_SOURCES.some(ps => source.includes(ps));
    };

    // Filter posts by current period
    const postsCurrent = data.posts.filter(p => {
      const date = getPostDate(p);
      return date && date >= dateRanges.start && date <= dateRanges.end;
    });

    // Filter posts by previous period
    const postsPrev = data.posts.filter(p => {
      const date = getPostDate(p);
      return date && date >= dateRanges.prevStart && date < dateRanges.prevEnd;
    });

    // Active subscribers
    const activeSubscribers = data.subscribers.filter(s =>
      (s['Status'] || s['status'])?.toLowerCase() === 'active'
    );

    // New subscribers in current period
    const newSubsCurrent = data.subscribers.filter(s => {
      const date = getSubscriberDate(s);
      return date && date >= dateRanges.start && date <= dateRanges.end;
    });

    // New subscribers in previous period
    const newSubsPrev = data.subscribers.filter(s => {
      const date = getSubscriberDate(s);
      return date && date >= dateRanges.prevStart && date < dateRanges.prevEnd;
    });

    // Paid subscribers
    const paidSubsCurrent = newSubsCurrent.filter(isPaidSource);
    const paidSubsPrev = newSubsPrev.filter(isPaidSource);

    // Calculate metrics for a period
    const calculatePeriodMetrics = (posts, newSubs, paidSubs, beehiivCost) => {
      const delivered = sumField(posts, 'Delivered') || sumField(posts, 'delivered');
      const uniqueOpens = sumField(posts, 'Unique Opens') || sumField(posts, 'unique_opens');
      const uniqueClicks = sumField(posts, 'Unique Clicks') || sumField(posts, 'unique_clicks');
      const articleClicks = getArticleClicks(posts);

      const acquisitionCost = paidSubs.length * COSTS.COST_PER_EMAIL;
      const totalCost = acquisitionCost + beehiivCost;

      const openRate = delivered > 0 ? (uniqueOpens / delivered * 100) : 0;
      const clickRate = delivered > 0 ? (uniqueClicks / delivered * 100) : 0;
      const ctor = uniqueOpens > 0 ? (uniqueClicks / uniqueOpens * 100) : 0;

      const cpu = newSubs.length > 0 ? totalCost / newSubs.length : 0;
      const pctClickers = delivered > 0 ? (uniqueClicks / delivered * 100) : 0;
      const costPerClicker = uniqueClicks > 0 ? totalCost / uniqueClicks : 0;
      const avgClicksPerClicker = uniqueClicks > 0 ? articleClicks / uniqueClicks : 0;

      // Revenue estimation (using $2.70 RPM industry benchmark, 1.5 PV/click)
      const estimatedRPM = 2.70;  // Industry benchmark
      const pvPerClick = 1.5;
      const estimatedPV = articleClicks * pvPerClick;
      const estimatedRevenue = (estimatedPV / 1000) * estimatedRPM;

      const revenuePerClicker = uniqueClicks > 0 ? estimatedRevenue / uniqueClicks : 0;
      const revenuePerClick = articleClicks > 0 ? estimatedRevenue / articleClicks : 0;
      const rpm = estimatedPV > 0 ? (estimatedRevenue / estimatedPV * 1000) : 0;
      const roi = totalCost > 0 ? ((estimatedRevenue - totalCost) / totalCost * 100) : 0;

      return {
        postCount: posts.length,
        delivered,
        uniqueOpens,
        uniqueClicks,
        articleClicks,
        newSubs: newSubs.length,
        paidSubs: paidSubs.length,
        organicSubs: newSubs.length - paidSubs.length,
        acquisitionCost,
        totalCost,
        openRate,
        clickRate,
        ctor,
        cpu,
        pctClickers,
        costPerClicker,
        avgClicksPerClicker,
        estimatedPV,
        estimatedRevenue,
        revenuePerClicker,
        revenuePerClick,
        rpm,
        roi
      };
    };

    // Calculate metrics for current and previous periods
    const current = calculatePeriodMetrics(postsCurrent, newSubsCurrent, paidSubsCurrent, dateRanges.beehiivCost);
    const prev = calculatePeriodMetrics(postsPrev, newSubsPrev, paidSubsPrev, dateRanges.beehiivCost);

    // Build trend data
    const buildTrendData = (posts) => {
      const byDate = {};
      posts.forEach(post => {
        const date = getPostDate(post);
        if (!date) return;
        const dateKey = format(date, 'yyyy-MM-dd');
        if (!byDate[dateKey]) {
          byDate[dateKey] = { delivered: 0, opens: 0, clicks: 0, articleClicks: 0 };
        }
        byDate[dateKey].delivered += parseFloat(post['Delivered'] || post['delivered']) || 0;
        byDate[dateKey].opens += parseFloat(post['Unique Opens'] || post['unique_opens']) || 0;
        byDate[dateKey].clicks += parseFloat(post['Unique Clicks'] || post['unique_clicks']) || 0;
        byDate[dateKey].articleClicks += getArticleClicks([post]);
      });

      return Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, d]) => ({
          date,
          openRate: d.delivered > 0 ? (d.opens / d.delivered * 100) : 0,
          clickRate: d.delivered > 0 ? (d.clicks / d.delivered * 100) : 0,
          ctor: d.opens > 0 ? (d.clicks / d.opens * 100) : 0,
          revenue: (d.articleClicks * 1.5 / 1000) * 2.70 // Using $2.70 RPM
        }));
    };

    const trendData = buildTrendData(postsCurrent);
    const prevTrendData = buildTrendData(postsPrev);

    // Calculate funnel data with publication filter
    const funnelPosts = filterByPublication(postsCurrent, funnelPublication);
    const funnelMetrics = calculatePeriodMetrics(funnelPosts, [], [], 0);

    return {
      totalSubscribers: activeSubscribers.length,
      current,
      prev,
      trendData,
      prevTrendData,
      funnel: funnelMetrics,
      costs: {
        beehiiv: dateRanges.beehiivCost,
        acquisition: current.acquisitionCost,
        total: current.totalCost
      },
      dateRanges
    };
  }, [data, timePeriod, funnelPublication, customDateRange]);

  if (!data || !economics) {
    return (
      <main className="dashboard-main">
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading unit economics data...</p>
        </div>
      </main>
    );
  }

  const current = economics.current;
  const prev = economics.prev;

  const formatCurrency = (val) => `$${val.toFixed(2)}`;
  const formatCurrencyPrecise = (val) => `$${val.toFixed(4)}`;
  const formatPercent = (val) => `${val.toFixed(1)}%`;
  const formatNumber = (val) => val.toLocaleString();

  // Cost breakdown for donut chart
  const costBreakdown = [
    { name: 'Beehiiv Fee', value: economics.costs.beehiiv },
    { name: 'Paid Acquisition', value: economics.costs.acquisition }
  ];

  return (
    <main className="dashboard-main unit-economics-page">
      {/* Period Selector */}
      <div className="econ-filter-bar">
        <div className="econ-period-selector">
          {TIME_PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.key}
              className={`econ-period-btn ${timePeriod === opt.key ? 'active' : ''}`}
              onClick={() => setTimePeriod(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {timePeriod === 'custom' && (
          <div className="econ-custom-date-inputs">
            <input
              type="date"
              value={format(customDateRange.start, 'yyyy-MM-dd')}
              onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
              className="econ-date-input"
            />
            <span>to</span>
            <input
              type="date"
              value={format(customDateRange.end, 'yyyy-MM-dd')}
              onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
              className="econ-date-input"
            />
          </div>
        )}
        <label className="econ-comparison-toggle">
          <input
            type="checkbox"
            checked={showComparison}
            onChange={(e) => setShowComparison(e.target.checked)}
          />
          <span>vs Previous Period</span>
        </label>
      </div>

      {/* KEY FINANCIAL METRICS ROW (5 cards) - monetary metrics only */}
      <section>
        <h2 className="section-title">Financial Metrics</h2>
        <div className="econ-metrics-row">
          <MetricCard
            label="Revenue"
            value={current.estimatedRevenue}
            change={prev.estimatedRevenue > 0 ? ((current.estimatedRevenue - prev.estimatedRevenue) / prev.estimatedRevenue * 100) : 0}
            changeLabel="vs prior"
            color={COLORS.blue}
            format="currency"
          />
          <MetricCard
            label="Total Cost"
            value={current.totalCost}
            change={prev.totalCost > 0 ? ((current.totalCost - prev.totalCost) / prev.totalCost * 100) : 0}
            changeLabel="vs prior"
            color={COLORS.purple}
            format="currency"
          />
          <MetricCard
            label="Profit"
            value={current.estimatedRevenue - current.totalCost}
            change={(() => {
              const currentProfit = current.estimatedRevenue - current.totalCost;
              const prevProfit = prev.estimatedRevenue - prev.totalCost;
              if (Math.abs(prevProfit) > 0) {
                return ((currentProfit - prevProfit) / Math.abs(prevProfit)) * 100;
              }
              return 0;
            })()}
            changeLabel="vs prior"
            color={COLORS.green}
            format="currency"
          />
          <MetricCard
            label="ROI"
            value={current.roi}
            change={current.roi - prev.roi}
            changeLabel="vs prior"
            color={COLORS.amber}
            format="percent"
          />
          <MetricCard
            label="RPM"
            value={current.rpm}
            change={current.rpm - prev.rpm}
            changeLabel="vs prior"
            color={COLORS.rose}
            format="currency"
          />
        </div>
      </section>

      {/* UNIT ECONOMICS ROW (4 cards) */}
      <section>
        <h2 className="section-title">Unit Economics</h2>
        <div className="econ-unit-row">
          <UnitEconCard
            label="CPU (Cost/User)"
            value={formatCurrencyPrecise(current.cpu)}
            highlight
          />
          <UnitEconCard
            label="Cost/Clicker"
            value={formatCurrencyPrecise(current.costPerClicker)}
          />
          <UnitEconCard
            label="Rev/Clicker"
            value={formatCurrencyPrecise(current.revenuePerClicker)}
          />
          <UnitEconCard
            label="ROI"
            value={formatPercent(current.roi)}
            subtext={current.roi >= 0 ? 'Profitable' : 'Loss'}
          />
        </div>
      </section>

      {/* TREND CHART - Revenue only (unit economics focused) */}
      <section>
        <h2 className="section-title">Revenue Trend</h2>
        <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
          <TrendChart
            data={economics.trendData}
            comparisonData={showComparison ? economics.prevTrendData : null}
            dataKey="revenue"
            title="Estimated Revenue"
            color={COLORS.blue}
            format="currency"
            showComparison={showComparison}
          />
        </div>
        {/* Show comparison legend when enabled */}
        {showComparison && (
          <div className="chart-legend" style={{ marginTop: '8px', paddingLeft: '4px' }}>
            <div className="legend-item">
              <div className="legend-line" style={{ backgroundColor: COLORS.blue }} />
              <span>Current Period</span>
            </div>
            <div className="legend-item">
              <div className="legend-line dashed" style={{ backgroundColor: 'var(--text-muted)' }} />
              <span>Previous Period</span>
            </div>
          </div>
        )}
      </section>

      {/* FUNNEL VISUALIZATION */}
      <section>
        <div className="section-header-with-filter">
          <h2 className="section-title">Conversion Funnel</h2>
          <div className="funnel-pub-filter">
            {PUBLICATION_OPTIONS.map(opt => (
              <button
                key={opt.key}
                className={`pub-filter-btn ${funnelPublication === opt.key ? 'active' : ''}`}
                onClick={() => setFunnelPublication(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="card econ-funnel-card">
          <div className="econ-funnel-row">
            <FunnelStage
              label="Delivered"
              value={formatNumber(economics.funnel.delivered)}
              percentage="100%"
              dropoff={`${economics.funnel.openRate.toFixed(1)}% open`}
            />
            <FunnelStage
              label="Opened"
              value={formatNumber(economics.funnel.uniqueOpens)}
              percentage={formatPercent(economics.funnel.openRate)}
              dropoff={`${economics.funnel.ctor.toFixed(1)}% click`}
            />
            <FunnelStage
              label="Clicked"
              value={formatNumber(economics.funnel.uniqueClicks)}
              percentage={formatPercent(economics.funnel.clickRate)}
              dropoff={`${economics.funnel.avgClicksPerClicker.toFixed(1)} clicks/user`}
            />
            <FunnelStage
              label="Visits"
              value={formatNumber(economics.funnel.articleClicks)}
              percentage={formatPercent(economics.funnel.pctClickers)}
              dropoff={`RPM: ${formatCurrency(economics.funnel.rpm)}`}
            />
            <FunnelStage
              label="Revenue"
              value={formatCurrency(economics.funnel.estimatedRevenue)}
              percentage={`ROI: ${formatPercent(economics.funnel.roi)}`}
              isLast
            />
          </div>
        </div>
      </section>

      {/* COST BREAKDOWN */}
      <section>
        <h2 className="section-title">Cost Breakdown</h2>
        <div className="econ-cost-section">
          <div className="card econ-cost-chart">
            <CostDonutChart data={costBreakdown} />
          </div>
          <div className="card econ-cost-table">
            <table className="econ-table">
              <thead>
                <tr>
                  <th>Cost Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Beehiiv Fee ({timePeriod})</td>
                  <td className="econ-table-value">{formatCurrency(economics.costs.beehiiv)}</td>
                </tr>
                <tr>
                  <td>Paid Acquisition ({current.paidSubs} subs @ $0.10)</td>
                  <td className="econ-table-value">{formatCurrency(economics.costs.acquisition)}</td>
                </tr>
                <tr className="econ-table-total">
                  <td><strong>Total Cost</strong></td>
                  <td className="econ-table-value"><strong>{formatCurrency(economics.costs.total)}</strong></td>
                </tr>
              </tbody>
            </table>
            <div className="econ-cost-summary">
              <div className="econ-cost-item">
                <span className="econ-cost-label">Input</span>
                <span className="econ-cost-value">{formatCurrency(current.totalCost)}</span>
              </div>
              <div className="econ-cost-item">
                <span className="econ-cost-label">Output</span>
                <span className="econ-cost-value">{formatCurrency(current.estimatedRevenue)}</span>
              </div>
              <div className="econ-cost-item">
                <span className="econ-cost-label">Profit</span>
                <span className={`econ-cost-value ${current.estimatedRevenue - current.totalCost >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(current.estimatedRevenue - current.totalCost)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="econ-notes">
        <div className="card" style={{ padding: '16px 20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>Notes & Assumptions</h3>
          <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, paddingLeft: '20px' }}>
            <li>Revenue estimated using $2.70 RPM (industry avg) and 1.5 pageviews per click</li>
            <li>Paid acquisition: {COSTS.PAID_SOURCES.join(', ')} sources @ ${COSTS.COST_PER_EMAIL}/subscriber</li>
            <li>Beehiiv: ${COSTS.BEEHIIV_MONTHLY}/month (${COSTS.BEEHIIV_WEEKLY.toFixed(2)}/week)</li>
            <li>Connect Mediavine + GA4 APIs for actual revenue attribution</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
