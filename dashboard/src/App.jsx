import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, subDays, formatDistanceToNow } from 'date-fns';
import {
  fetchApiData,
  refreshApiData,
  normalizeApiData,
  filterBySource,
  getDateRange,
  filterByDateRange,
  calculateMetrics,
  calculateTrendData,
  getTopArticles,
  getTopPosts,
  calculateSubscriberGrowthBySource,
  calculateDailyNewSubscribers,
  calculateSourceWiseSubscribers,
  calculateUnsubscribeBounceData
} from './utils/dataParser';
import MetricCard from './components/MetricCard';
import MetricCardWithGraph from './components/MetricCardWithGraph';
import TrendChartAdvanced from './components/TrendChartAdvanced';
import { TopArticlesTable, TopPostsTable } from './components/TopPerformersTable';
import SubscriberChart from './components/SubscriberChart';
import {
  SkeletonCard,
  SkeletonChart,
  SkeletonTable,
  SkeletonFilterBar,
  EmptyState
} from './components/SkeletonLoader';
import DateRangePicker from './components/DateRangePicker';
import Sidebar from './components/Sidebar';
import TargetPage from './pages/TargetPage';
import UnitEconomicsPage from './pages/UnitEconomicsPage';
import ContentPerformancePage from './pages/ContentPerformancePage';
import HelpGuidePage from './pages/HelpGuidePage';
import DiagnosticsPage from './pages/DiagnosticsPage';
import AnalyticsChatPage from './pages/AnalyticsChatPage';

const AUTO_REFRESH_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours - matches server refresh interval
const STATUS_CHECK_INTERVAL = 60 * 1000;

// Icons
function RefreshIcon({ spinning }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? 'animate-spin' : ''}
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// Hamburger menu icon for mobile
function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function App() {
  const [rawData, setRawData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('overall');
  const [timePeriod, setTimePeriod] = useState('30day');
  const [comparisonPeriod, setComparisonPeriod] = useState('none');
  const [customRange, setCustomRange] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [nextRefresh, setNextRefresh] = useState(null);
  const [expandedMetric, setExpandedMetric] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activePage, setActivePage] = useState('overview');
  const [newsletterTableFilter, setNewsletterTableFilter] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sourceOptions = useMemo(() => {
    const options = [{ value: 'overall', label: 'All Publications' }];
    if (rawData?.publications?.length > 0) {
      rawData.publications.forEach(pub => {
        options.push({ value: pub.name, label: pub.name });
      });
    }
    return options;
  }, [rawData?.publications]);

  const timeOptions = [
    { value: 'yesterday', label: 'Yesterday' },
    { value: '7day', label: 'Last 7 Days' },
    { value: '30day', label: 'Last 30 Days' },
    { value: '90day', label: 'Last 90 Days' },
    { value: 'alltime', label: 'All Time' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const comparisonOptions = [
    { value: 'none', label: 'No Comparison' },
    { value: 'week', label: 'vs Previous Week' },
    { value: 'month', label: 'vs Previous Month' },
  ];

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const apiData = forceRefresh ? await refreshApiData() : await fetchApiData();

      if (apiData?.error) {
        throw new Error(apiData.error);
      }

      const normalized = normalizeApiData(apiData);
      setRawData(normalized);

      if (apiData?.fetchedAt) {
        setLastFetched(new Date(apiData.fetchedAt));
        const fetchedAt = new Date(apiData.fetchedAt).getTime();
        setNextRefresh(new Date(fetchedAt + AUTO_REFRESH_INTERVAL));
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const checkRefresh = () => {
      if (nextRefresh && new Date() >= nextRefresh && !isRefreshing) {
        loadData(true);
      }
    };
    const interval = setInterval(checkRefresh, STATUS_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [nextRefresh, isRefreshing, loadData]);

  const processedData = useMemo(() => {
    if (!rawData) return null;

    try {
      const publications = rawData.publications || [];
      const posts = filterBySource(rawData.posts, source, publications);
      const subscribers = filterBySource(rawData.subscribers, source, publications);
      const articleClicks = filterBySource(rawData.articleClicks, source, publications);

      // Calculate period days based on time filter
      let periodDays = 30;
      if (timePeriod === 'yesterday') periodDays = 1;
      else if (timePeriod === '7day') periodDays = 7;
      else if (timePeriod === '30day') periodDays = 30;
      else if (timePeriod === '90day') periodDays = 90;
      else if (timePeriod === 'alltime') periodDays = 365;
      else if (timePeriod === 'custom' && customRange) {
        const diffTime = Math.abs(customRange.end - customRange.start);
        periodDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 30;
      }

      const dateRange = getDateRange(posts, timePeriod, customRange);

      const filteredPosts = filterByDateRange(posts, dateRange);
      const filteredArticleClicks = filterByDateRange(articleClicks, dateRange);

      // Determine comparison period based on user selection (weekly or monthly only)
      let comparisonDays = 0;
      let comparisonLabel = '';
      let showComparison = false;

      if (comparisonPeriod === 'week') {
        comparisonDays = 7;
        comparisonLabel = 'Prev Week Avg';
        showComparison = true;
      } else if (comparisonPeriod === 'month') {
        comparisonDays = 30;
        comparisonLabel = 'Prev Month Avg';
        showComparison = true;
      }

      // Calculate the comparison range for metrics change (always uses prior period of same length)
      const priorRange = {
        start: subDays(dateRange.start, periodDays),
        end: subDays(dateRange.end, periodDays)
      };
      const priorPosts = filterByDateRange(posts, priorRange);

      // Calculate metrics with prior period for change calculation
      const metrics = calculateMetrics(filteredPosts, subscribers, priorPosts, subscribers, dateRange, priorRange);
      const baseTrendData = calculateTrendData(filteredPosts);

      // Calculate daily new subscribers and merge into trend data
      const dailyNewSubs = calculateDailyNewSubscribers(subscribers, dateRange);
      const trendData = baseTrendData.map(day => ({
        ...day,
        newSubscribers: dailyNewSubs[day.date] || 0
      }));

      // Calculate comparison averages when comparison is enabled
      let comparisonAverages = null;
      let comparisonTrendData = null;

      if (showComparison && comparisonDays > 0) {
        const comparisonRange = {
          start: subDays(dateRange.start, comparisonDays),
          end: subDays(dateRange.end, comparisonDays)
        };
        const comparisonPosts = filterByDateRange(posts, comparisonRange);
        comparisonTrendData = calculateTrendData(comparisonPosts);

        // Calculate comparison period averages
        if (comparisonPosts.length > 0) {
          const compTotalDelivered = comparisonPosts.reduce((sum, p) => sum + (p['Delivered'] || p.delivered || 0), 0);
          const compTotalRecipients = comparisonPosts.reduce((sum, p) => sum + (p['Recipients'] || p.recipients || p['Delivered'] || p.delivered || 0), 0);
          const compTotalOpens = comparisonPosts.reduce((sum, p) => sum + (p['Unique Opens'] || p.uniqueOpens || 0), 0);
          const compTotalClicks = comparisonPosts.reduce((sum, p) => sum + (p['Unique Clicks'] || p.uniqueClicks || 0), 0);
          const compTotalAllClicks = comparisonPosts.reduce((sum, p) => sum + (p['Clicks'] || p.clicks || 0), 0);
          const compTotalAllOpens = comparisonPosts.reduce((sum, p) => sum + (p['Opens'] || p.opens || 0), 0);
          const compTotalUnsubscribes = comparisonPosts.reduce((sum, p) => sum + (p['Unsubscribes'] || p.unsubscribes || 0), 0);

          comparisonAverages = {
            openRate: compTotalDelivered > 0 ? (compTotalOpens / compTotalDelivered) * 100 : 0,
            ctr: compTotalDelivered > 0 ? (compTotalClicks / compTotalDelivered) * 100 : 0,
            ctor: compTotalAllOpens > 0 ? (compTotalAllClicks / compTotalAllOpens) * 100 : 0,
            subscribers: compTotalDelivered,
            unsubscribeRate: compTotalDelivered > 0 ? (compTotalUnsubscribes / compTotalDelivered) * 100 : 0,
            bounceRate: compTotalRecipients > 0 ? ((compTotalRecipients - compTotalDelivered) / compTotalRecipients) * 100 : 0
          };
        }
      }

      const topArticles = getTopArticles(filteredArticleClicks);
      const topPosts = getTopPosts(filteredPosts);

      // Calculate subscriber growth by UTM source
      const subscriberGrowthBySource = calculateSubscriberGrowthBySource(subscribers, dateRange);

      // Calculate source-wise subscriber table data (filtered by date range)
      const sourceWiseSubscribers = calculateSourceWiseSubscribers(subscribers, dateRange);

      // Calculate unsubscribe and bounce rate data
      const unsubscribeBounceData = calculateUnsubscribeBounceData(posts, dateRange);

      // Generate sparkline data from trend data
      const sparklineData = {
        subscribers: trendData.map(d => d.recipients || 0),
        openRate: trendData.map(d => d.openRate || 0),
        ctr: trendData.map(d => d.ctr || 0),
        trafficSent: trendData.map(d => d.trafficSent || 0),
        ctor: trendData.map(d => d.ctor || 0),
      };

      // Calculate previous day values for metrics (when "yesterday" filter is active)
      const previousDayValues = trendData.length > 1 ? {
        openRate: trendData[trendData.length - 2]?.openRate,
        ctr: trendData[trendData.length - 2]?.ctr,
        ctor: trendData[trendData.length - 2]?.ctor,
        subscribers: trendData[trendData.length - 2]?.delivered,
        newSubscribers: trendData[trendData.length - 2]?.newSubscribers
      } : {};

      return {
        metrics,
        trendData,
        comparisonTrendData,
        topArticles,
        topPosts,
        dateRange,
        postCount: filteredPosts.length,
        sparklineData,
        subscriberGrowthBySource,
        sourceWiseSubscribers,
        unsubscribeBounceData,
        previousDayValues,
        comparisonLabel,
        comparisonAverages,
        showComparison
      };
    } catch (err) {
      console.error('Error processing data:', err);
      return null;
    }
  }, [rawData, source, timePeriod, comparisonPeriod, customRange]);

  const handleRefresh = () => {
    if (!isRefreshing) {
      loadData(true);
    }
  };

  const handleExport = () => {
    if (!processedData) return;

    const csvData = [
      ['Metric', 'Value', 'Change'],
      ['Subscribers', processedData.metrics.totalSubs.value, processedData.metrics.totalSubs.change],
      ['Open Rate', `${processedData.metrics.openRate.value.toFixed(1)}%`, `${processedData.metrics.openRate.change.toFixed(1)} pts`],
      ['CTR', `${processedData.metrics.ctr.value.toFixed(1)}%`, `${processedData.metrics.ctr.change.toFixed(1)} pts`],
      ['CTOR', `${processedData.metrics.ctor.value.toFixed(1)}%`, `${processedData.metrics.ctor.change.toFixed(1)} pts`],
      [],
      ['Trend Data'],
      ['Date', 'Open Rate', 'CTR', 'CTOR'],
      ...processedData.trendData.map(d => [d.date, `${d.openRate.toFixed(1)}%`, `${d.ctr.toFixed(1)}%`, `${d.ctor.toFixed(1)}%`])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inquisitr-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMetricClick = (metricKey) => {
    setExpandedMetric(expandedMetric === metricKey ? null : metricKey);
  };

  const getTimeFilterLabel = () => {
    const option = timeOptions.find(o => o.value === timePeriod);
    return option?.label || '';
  };

  if (error && !rawData) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: '400px', padding: '48px', textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Connection Error</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>{error}</p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '12px' }}>
            Make sure the API server is running on port 3001
          </p>
          <button onClick={() => loadData()} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        activePage={activePage}
        onPageChange={setActivePage}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="main-content">
        <div className="dashboard-container">
          {/* Header */}
          <header className="dashboard-header">
            <div className="header-content">
              <div className="header-left">
                {/* Mobile hamburger menu */}
                <button
                  className="mobile-menu-btn"
                  onClick={() => setIsMobileMenuOpen(true)}
                  aria-label="Open menu"
                >
                  <MenuIcon />
                </button>
                <h1 className="header-title">
                  {activePage === 'overview' ? 'Overview' :
                   activePage === 'chat' ? 'Analytics Chat' :
                   activePage === 'target' ? 'Target Tracking' :
                   activePage === 'content' ? 'Content Performance' :
                   activePage === 'diagnostics' ? 'Diagnostics' :
                   activePage === 'help' ? 'Help & Guide' :
                   'Unit Economics'}
                </h1>
                {/* Data update timestamp - next to title */}
                {lastFetched && (
                  <div className="header-timestamp">
                    <span className="timestamp-value">{format(lastFetched, 'MMM d, h:mm a')}</span>
                    <span className="timestamp-relative">({formatDistanceToNow(lastFetched, { addSuffix: true })})</span>
                  </div>
                )}
              </div>
              <div className="header-actions">
                {activePage === 'overview' && (
                  <button
                    className="btn-icon"
                    onClick={handleExport}
                    disabled={!processedData}
                    title="Export CSV"
                  >
                    <ExportIcon />
                  </button>
                )}
                <button
                  className="btn-icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  title="Refresh data"
                >
                  <RefreshIcon spinning={isRefreshing} />
                </button>
              </div>
            </div>
          </header>

          {activePage === 'target' ? (
            <TargetPage data={rawData} />
          ) : activePage === 'economics' ? (
            <UnitEconomicsPage data={rawData} />
          ) : activePage === 'content' ? (
            <ContentPerformancePage data={rawData} />
          ) : activePage === 'diagnostics' ? (
            <DiagnosticsPage data={rawData} onRefresh={() => loadData(true)} />
          ) : activePage === 'help' ? (
            <HelpGuidePage />
          ) : activePage === 'chat' ? (
            <AnalyticsChatPage data={rawData} />
          ) : (
            <main className="dashboard-main">
        {isLoading ? (
          <>
            <SkeletonFilterBar />
            <div className="metrics-grid">
              {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
            <div className="charts-grid">
              {[...Array(3)].map((_, i) => <SkeletonChart key={i} />)}
            </div>
            <div className="tables-grid">
              <SkeletonTable />
              <SkeletonTable />
            </div>
          </>
        ) : processedData ? (
          <>
            {/* Filter Bar */}
            <div className="filter-bar">
              <div className="filter-group">
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="filter-select"
                >
                  {sourceOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <div className="filter-date-wrapper">
                  <select
                    value={timePeriod}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTimePeriod(val);
                      if (val === 'custom') {
                        setShowDatePicker(true);
                      }
                    }}
                    className="filter-select"
                  >
                    {timeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {timePeriod === 'custom' && customRange && (
                    <button
                      className="custom-date-btn active"
                      onClick={() => setShowDatePicker(true)}
                      title="Edit custom date range"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>{format(customRange.start, 'MMM d')} - {format(customRange.end, 'MMM d')}</span>
                    </button>
                  )}
                </div>

                <select
                  value={comparisonPeriod}
                  onChange={(e) => setComparisonPeriod(e.target.value)}
                  className="filter-select"
                >
                  {comparisonOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {processedData.dateRange && (
                <div className="filter-info">
                  <span className="date-range">
                    {format(processedData.dateRange.start, 'MMM d')} - {format(processedData.dateRange.end, 'MMM d, yyyy')}
                  </span>
                  <span className="post-count">{processedData.postCount} newsletters</span>
                </div>
              )}
            </div>

            {/* Refreshing Toast */}
            {isRefreshing && (
              <div className="card animate-slide-up" style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                zIndex: 50
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid var(--accent-blue)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Refreshing data...
                </span>
              </div>
            )}

            {/* Empty State Warning */}
            {processedData.postCount === 0 && (
              <div className="card" style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(245, 158, 11, 0.1)',
                borderColor: 'rgba(245, 158, 11, 0.3)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span style={{ fontSize: '14px', color: '#92400e' }}>
                  No newsletters found for the selected filters.
                </span>
              </div>
            )}

            {/* Metrics Grid - Primary engagement metrics with graphs */}
            <section>
              <h2 className="section-title">Engagement Metrics</h2>
              <div className="metrics-grid-4">
                <MetricCardWithGraph
                  label="New Subscribers"
                  value={processedData.metrics.newSubscribers.value}
                  change={processedData.metrics.newSubscribers.change}
                  changeLabel={processedData.comparisonLabel || 'vs prior'}
                  format="exact"
                  color="blue"
                  trendData={processedData.trendData}
                  dataKey="newSubscribers"
                  metricType="newSubscribers"
                  showPreviousDay={timePeriod === 'yesterday'}
                  previousDayValue={processedData.previousDayValues?.newSubscribers}
                  comparisonValue={processedData.showComparison ? processedData.comparisonAverages?.subscribers : undefined}
                  comparisonValueLabel={processedData.comparisonLabel}
                />
                <MetricCardWithGraph
                  label="Open Rate"
                  value={processedData.metrics.openRate.value}
                  change={processedData.metrics.openRate.change}
                  changeLabel={processedData.comparisonLabel || 'vs prior'}
                  format="percent"
                  color="purple"
                  trendData={processedData.trendData}
                  dataKey="openRate"
                  metricType="openRate"
                  showPreviousDay={timePeriod === 'yesterday'}
                  previousDayValue={processedData.previousDayValues?.openRate}
                  comparisonValue={processedData.showComparison ? processedData.comparisonAverages?.openRate : undefined}
                  comparisonValueLabel={processedData.comparisonLabel}
                />
                <MetricCardWithGraph
                  label="CTR"
                  value={processedData.metrics.ctr.value}
                  change={processedData.metrics.ctr.change}
                  changeLabel={processedData.comparisonLabel || 'vs prior'}
                  format="percent"
                  color="green"
                  trendData={processedData.trendData}
                  dataKey="ctr"
                  metricType="ctr"
                  showPreviousDay={timePeriod === 'yesterday'}
                  previousDayValue={processedData.previousDayValues?.ctr}
                  comparisonValue={processedData.showComparison ? processedData.comparisonAverages?.ctr : undefined}
                  comparisonValueLabel={processedData.comparisonLabel}
                />
                <MetricCardWithGraph
                  label="CTOR"
                  value={processedData.metrics.ctor.value}
                  change={processedData.metrics.ctor.change}
                  changeLabel={processedData.comparisonLabel || 'vs prior'}
                  format="percent"
                  color="pink"
                  trendData={processedData.trendData}
                  dataKey="ctor"
                  metricType="ctor"
                  showPreviousDay={timePeriod === 'yesterday'}
                  previousDayValue={processedData.previousDayValues?.ctor}
                  comparisonValue={processedData.showComparison ? processedData.comparisonAverages?.ctor : undefined}
                  comparisonValueLabel={processedData.comparisonLabel}
                />
              </div>
            </section>

            {/* Newsletter Health Metrics - removed List Growth */}
            <section>
              <h2 className="section-title">Newsletter Health</h2>
              <div className="metrics-grid-3">
                <MetricCard
                  label="Traffic Sent"
                  value={processedData.metrics.trafficSent.value}
                  change={processedData.metrics.trafficSent.change}
                  changeLabel={processedData.comparisonLabel || 'vs prior'}
                  format="number"
                  color="blue"
                  tooltip="Total clicks sent to external articles"
                />
                <MetricCard
                  label="Unsubscribe Rate"
                  value={processedData.metrics.unsubscribeRate.value}
                  change={processedData.metrics.unsubscribeRate.change}
                  changeLabel={processedData.comparisonLabel || 'vs prior'}
                  format="percent"
                  color="amber"
                  tooltip="Percentage of subscribers who unsubscribed"
                  comparisonValue={processedData.showComparison ? processedData.comparisonAverages?.unsubscribeRate : undefined}
                  comparisonValueLabel={processedData.comparisonLabel}
                />
                <MetricCard
                  label="Bounce Rate"
                  value={processedData.metrics.bounceRate.value}
                  change={processedData.metrics.bounceRate.change}
                  changeLabel={processedData.comparisonLabel || 'vs prior'}
                  format="percent"
                  color="pink"
                  tooltip="Percentage of emails that bounced"
                  comparisonValue={processedData.showComparison ? processedData.comparisonAverages?.bounceRate : undefined}
                  comparisonValueLabel={processedData.comparisonLabel}
                />
              </div>
            </section>

            {/* Subscriber Growth by Source */}
            {processedData.subscriberGrowthBySource?.data?.length > 0 && (
              <section>
                <h2 className="section-title">Subscriber Growth by Source</h2>
                <SubscriberChart
                  data={processedData.subscriberGrowthBySource.data}
                  sources={processedData.subscriberGrowthBySource.sources}
                  title="Daily New Subscribers"
                  subtitle="New subscribers by acquisition channel (UTM source)"
                  height={320}
                />
              </section>
            )}

            {/* Source-wise Subscriber Table */}
            {processedData.sourceWiseSubscribers?.length > 0 && (
              <section>
                <h2 className="section-title">Subscribers by Source</h2>
                <div className="card" style={{ padding: 'var(--space-md)' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
                    New subscribers acquired during the selected time period, grouped by acquisition source.
                  </p>
                  <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', fontSize: '12px', color: 'var(--text-secondary)' }}>Source</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', fontSize: '12px', color: 'var(--text-secondary)' }}>Count</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', fontSize: '12px', color: 'var(--text-secondary)' }}>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedData.sourceWiseSubscribers.map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '10px 12px', fontSize: '13px' }}>{row.source}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', fontWeight: '500' }}>{row.count.toLocaleString()}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px', color: 'var(--text-secondary)' }}>{row.percentage.toFixed(1)}%</td>
                          </tr>
                        ))}
                        <tr style={{ background: 'var(--bg-tertiary)', fontWeight: '600' }}>
                          <td style={{ padding: '10px 12px', fontSize: '13px' }}>Total</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px' }}>
                            {processedData.sourceWiseSubscribers.reduce((sum, r) => sum + r.count, 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '13px' }}>100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* Traffic Sent Trend - Full Width */}
            <section>
              <h2 className="section-title">Trends</h2>
              <TrendChartAdvanced
                data={processedData.trendData}
                comparisonData={processedData.comparisonTrendData}
                dataKey="trafficSent"
                title="Traffic Sent"
                color="trafficSent"
                format="number"
                showComparison={comparisonPeriod !== 'none'}
                showStats={true}
                enableBrush={false}
              />
            </section>

            {/* Unsubscribe & Bounce Count Trends */}
            {processedData.unsubscribeBounceData?.dailyData?.length > 0 && (
              <section>
                <h2 className="section-title">Unsubscribe & Bounce Counts</h2>
                <div className="tables-grid">
                  {/* Daily Trend Chart - Counts */}
                  <TrendChartAdvanced
                    data={processedData.unsubscribeBounceData.dailyData}
                    dataKey="unsubscribes"
                    title="Unsubscribe Count"
                    color="amber"
                    format="number"
                    showStats={true}
                    enableBrush={false}
                  />
                  <TrendChartAdvanced
                    data={processedData.unsubscribeBounceData.dailyData}
                    dataKey="bounces"
                    title="Bounce Count"
                    color="pink"
                    format="number"
                    showStats={true}
                    enableBrush={false}
                  />
                </div>
              </section>
            )}

            {/* Newsletter-wise Metrics Table */}
            {processedData.unsubscribeBounceData?.newsletterData?.length > 0 && (
              <section>
                <h2 className="section-title">Newsletter Metrics</h2>
                <div className="card" style={{ padding: 'var(--space-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                      Performance metrics for each newsletter in the selected period.
                    </p>
                    <select
                      value={newsletterTableFilter}
                      onChange={(e) => setNewsletterTableFilter(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-light)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="all">All Publications</option>
                      {rawData?.publications?.map(pub => (
                        <option key={pub.id || pub.name} value={pub.name}>{pub.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-light)', position: 'sticky', top: 0, background: 'var(--bg-secondary)' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', fontSize: '12px', color: 'var(--text-secondary)' }}>Newsletter</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', fontSize: '12px', color: 'var(--text-secondary)' }}>Date</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', fontSize: '12px', color: 'var(--text-secondary)' }}>Delivered</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', fontSize: '12px', color: 'var(--text-secondary)' }}>Open Rate</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', fontSize: '12px', color: 'var(--text-secondary)' }}>CTR</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', fontSize: '12px', color: 'var(--text-secondary)' }}>CTOR</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', fontSize: '12px', color: 'var(--text-secondary)' }}>Unsub Rate</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', fontSize: '12px', color: 'var(--text-secondary)' }}>Bounce Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedData.unsubscribeBounceData.newsletterData
                          .filter(row => newsletterTableFilter === 'all' || row.publicationName?.toLowerCase() === newsletterTableFilter.toLowerCase())
                          .slice(0, 25)
                          .map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '10px 12px', fontSize: '12px' }} title={row.title}>{row.title}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
                              {row.date ? format(new Date(row.date), 'MMM d') : '-'}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px' }}>{row.delivered.toLocaleString()}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', color: row.openRate >= 35 ? 'var(--status-good)' : row.openRate >= 25 ? 'var(--text-primary)' : 'var(--status-risk)' }}>
                              {row.openRate.toFixed(1)}%
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px' }}>
                              {row.ctr.toFixed(2)}%
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px' }}>
                              {row.ctor.toFixed(1)}%
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', color: row.unsubscribeRate > 0.5 ? 'var(--status-risk)' : 'var(--text-primary)' }}>
                              {row.unsubscribeRate.toFixed(2)}%
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', color: row.bounceRate > 2 ? 'var(--status-risk)' : 'var(--text-primary)' }}>
                              {row.bounceRate.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* Tables Grid */}
            <section>
              <h2 className="section-title">Top Performers</h2>
              <div className="tables-grid">
                <TopArticlesTable
                  articles={processedData.topArticles}
                  timeFilter={getTimeFilterLabel()}
                />
                <TopPostsTable
                  posts={processedData.topPosts}
                  timeFilter={getTimeFilterLabel()}
                />
              </div>
            </section>
          </>
        ) : (
              <EmptyState message="No data available" />
            )}
          </main>
          )}

          {showDatePicker && (
            <DateRangePicker
              startDate={customRange?.start || subDays(new Date(), 30)}
              endDate={customRange?.end || new Date()}
              onChange={(range) => {
                setCustomRange(range);
                setTimePeriod('custom');
              }}
              onClose={() => setShowDatePicker(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
