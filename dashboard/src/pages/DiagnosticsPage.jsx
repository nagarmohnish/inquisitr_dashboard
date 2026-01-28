import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, formatDistanceToNow, parseISO, differenceInHours, differenceInMinutes } from 'date-fns';

// Status icons
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function RefreshIcon({ spinning }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={spinning ? 'animate-spin' : ''}
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}

function DataIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" />
      <path d="M18 17V9M13 17V5M8 17v-3" />
    </svg>
  );
}

// Status badge component
function StatusBadge({ status }) {
  const config = {
    ok: { label: 'Healthy', icon: CheckIcon, className: 'status-ok' },
    warning: { label: 'Warning', icon: AlertIcon, className: 'status-warning' },
    error: { label: 'Error', icon: ErrorIcon, className: 'status-error' },
    checking: { label: 'Checking...', icon: RefreshIcon, className: 'status-checking' }
  };

  const { label, icon: Icon, className } = config[status] || config.checking;

  return (
    <span className={`diag-status-badge ${className}`}>
      <Icon spinning={status === 'checking'} />
      <span>{label}</span>
    </span>
  );
}

// Data check result card
function CheckCard({ title, description, status, details, lastChecked, onRecheck }) {
  return (
    <div className={`diag-check-card ${status}`}>
      <div className="diag-check-header">
        <div className="diag-check-title">
          <h4>{title}</h4>
          <StatusBadge status={status} />
        </div>
        {onRecheck && (
          <button className="diag-recheck-btn" onClick={onRecheck} title="Re-check">
            <RefreshIcon />
          </button>
        )}
      </div>
      <p className="diag-check-desc">{description}</p>
      {details && (
        <div className="diag-check-details">
          {details.map((detail, idx) => (
            <div key={idx} className="diag-detail-row">
              <span className="diag-detail-label">{detail.label}:</span>
              <span className={`diag-detail-value ${detail.status || ''}`}>{detail.value}</span>
            </div>
          ))}
        </div>
      )}
      {lastChecked && (
        <div className="diag-check-footer">
          Last checked: {formatDistanceToNow(lastChecked, { addSuffix: true })}
        </div>
      )}
    </div>
  );
}

// Metric validation row
function MetricValidation({ name, expected, actual, formula, status }) {
  return (
    <tr className={`metric-row ${status}`}>
      <td>{name}</td>
      <td className="metric-formula"><code>{formula}</code></td>
      <td className="metric-value">{expected}</td>
      <td className="metric-value">{actual}</td>
      <td>
        <StatusBadge status={status} />
      </td>
    </tr>
  );
}

export default function DiagnosticsPage({ data, onRefresh }) {
  const [apiStatus, setApiStatus] = useState(null);
  const [isCheckingApi, setIsCheckingApi] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastApiCheck, setLastApiCheck] = useState(null);
  const [validationResults, setValidationResults] = useState(null);

  // Check API status
  const checkApiStatus = useCallback(async () => {
    setIsCheckingApi(true);
    try {
      const response = await fetch('/api/status');
      if (response.ok) {
        const status = await response.json();
        setApiStatus({ ...status, connected: true });
      } else {
        setApiStatus({ connected: false, error: `HTTP ${response.status}` });
      }
    } catch (err) {
      setApiStatus({ connected: false, error: err.message });
    } finally {
      setIsCheckingApi(false);
      setLastApiCheck(new Date());
    }
  }, []);

  // Initial API check
  useEffect(() => {
    checkApiStatus();
  }, [checkApiStatus]);

  // Force refresh data
  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
      await checkApiStatus();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Data validation checks
  const dataHealth = useMemo(() => {
    if (!data) return null;

    const now = new Date();
    const posts = data.posts || [];
    const subscribers = data.subscribers || [];
    const fetchedAt = data.fetchedAt ? new Date(data.fetchedAt) : null;

    // Calculate data freshness
    const dataAge = fetchedAt ? differenceInHours(now, fetchedAt) : null;
    const dataAgeMinutes = fetchedAt ? differenceInMinutes(now, fetchedAt) : null;

    // Check for recent posts
    const recentPosts = posts.filter(p => {
      const pubDate = p['Publish Date'] || p.publishDate;
      if (!pubDate) return false;
      try {
        const date = parseISO(pubDate);
        return differenceInHours(now, date) <= 168; // Last 7 days
      } catch {
        return false;
      }
    });

    // Check for data completeness
    const postsWithStats = posts.filter(p =>
      (p['Delivered'] || p.delivered) > 0 &&
      (p['Unique Opens'] || p.uniqueOpens) !== undefined
    );

    const subscribersWithDates = subscribers.filter(s =>
      s['Subscribe Date'] || s.created
    );

    // Check for null/missing values
    const postsWithMissingData = posts.filter(p =>
      !(p['Title'] || p.title) ||
      !(p['Publish Date'] || p.publishDate)
    );

    // Active subscribers check
    const activeSubscribers = subscribers.filter(s =>
      (s['Status'] || s.status)?.toLowerCase() === 'active'
    );

    // UTM source distribution
    const utmSources = {};
    subscribers.forEach(s => {
      const src = s['UTM Source'] || s.utmSource || 'direct';
      utmSources[src] = (utmSources[src] || 0) + 1;
    });

    return {
      totalPosts: posts.length,
      totalSubscribers: subscribers.length,
      activeSubscribers: activeSubscribers.length,
      recentPostsCount: recentPosts.length,
      postsWithStats: postsWithStats.length,
      postsWithMissingData: postsWithMissingData.length,
      subscribersWithDates: subscribersWithDates.length,
      dataAge,
      dataAgeMinutes,
      fetchedAt,
      utmSources,
      publications: data.publications || []
    };
  }, [data]);

  // Run metric validation
  const runValidation = useCallback(() => {
    if (!data || !dataHealth) return;

    const posts = data.posts || [];
    const subscribers = data.subscribers || [];

    // Calculate metrics manually and compare
    const results = [];

    // 1. Total Subscribers validation
    const activeCount = subscribers.filter(s =>
      (s['Status'] || s.status)?.toLowerCase() === 'active'
    ).length;
    results.push({
      name: 'Active Subscribers',
      formula: 'COUNT(subscribers WHERE status = "active")',
      expected: dataHealth.activeSubscribers,
      actual: activeCount,
      status: activeCount === dataHealth.activeSubscribers ? 'ok' : 'error'
    });

    // 2. Open Rate calculation check
    const totalDelivered = posts.reduce((sum, p) => sum + (p['Delivered'] || p.delivered || 0), 0);
    const totalUniqueOpens = posts.reduce((sum, p) => sum + (p['Unique Opens'] || p.uniqueOpens || 0), 0);
    const calculatedOpenRate = totalDelivered > 0 ? (totalUniqueOpens / totalDelivered) * 100 : 0;

    // Get reported open rate from posts
    const reportedOpenRates = posts.filter(p => (p['Open Rate %'] || p.openRate) > 0);
    const avgReportedOpenRate = reportedOpenRates.length > 0
      ? reportedOpenRates.reduce((sum, p) => sum + (p['Open Rate %'] || p.openRate || 0), 0) / reportedOpenRates.length
      : 0;

    results.push({
      name: 'Open Rate',
      formula: '(Unique Opens / Delivered) × 100',
      expected: `${avgReportedOpenRate.toFixed(2)}%`,
      actual: `${calculatedOpenRate.toFixed(2)}%`,
      status: Math.abs(calculatedOpenRate - avgReportedOpenRate) < 5 ? 'ok' : 'warning'
    });

    // 3. CTR calculation check
    const totalUniqueClicks = posts.reduce((sum, p) => sum + (p['Unique Clicks'] || p.uniqueClicks || 0), 0);
    const calculatedCTR = totalDelivered > 0 ? (totalUniqueClicks / totalDelivered) * 100 : 0;

    const reportedCTRs = posts.filter(p => (p['Click Rate %'] || p.clickRate) > 0);
    const avgReportedCTR = reportedCTRs.length > 0
      ? reportedCTRs.reduce((sum, p) => sum + (p['Click Rate %'] || p.clickRate || 0), 0) / reportedCTRs.length
      : 0;

    results.push({
      name: 'Click-Through Rate (CTR)',
      formula: '(Unique Clicks / Delivered) × 100',
      expected: `${avgReportedCTR.toFixed(2)}%`,
      actual: `${calculatedCTR.toFixed(2)}%`,
      status: Math.abs(calculatedCTR - avgReportedCTR) < 2 ? 'ok' : 'warning'
    });

    // 4. CTOR calculation check
    const totalClicks = posts.reduce((sum, p) => sum + (p['Clicks'] || p.clicks || 0), 0);
    const totalOpens = posts.reduce((sum, p) => sum + (p['Opens'] || p.opens || 0), 0);
    const calculatedCTOR = totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0;

    results.push({
      name: 'Click-to-Open Rate (CTOR)',
      formula: '(Total Clicks / Total Opens) × 100',
      expected: 'Varies by post',
      actual: `${calculatedCTOR.toFixed(2)}%`,
      status: calculatedCTOR > 0 && calculatedCTOR < 100 ? 'ok' : 'warning'
    });

    // 5. Data completeness check
    const completenessRatio = posts.length > 0 ? (dataHealth.postsWithStats / posts.length) * 100 : 0;
    results.push({
      name: 'Data Completeness',
      formula: 'Posts with stats / Total posts',
      expected: '100%',
      actual: `${completenessRatio.toFixed(1)}%`,
      status: completenessRatio >= 95 ? 'ok' : completenessRatio >= 80 ? 'warning' : 'error'
    });

    setValidationResults(results);
  }, [data, dataHealth]);

  // Connection status
  const connectionStatus = useMemo(() => {
    if (isCheckingApi) return 'checking';
    if (!apiStatus) return 'checking';
    return apiStatus.connected ? 'ok' : 'error';
  }, [apiStatus, isCheckingApi]);

  // Data freshness status
  const freshnessStatus = useMemo(() => {
    if (!dataHealth?.dataAge) return 'warning';
    if (dataHealth.dataAge <= 6) return 'ok';
    if (dataHealth.dataAge <= 12) return 'warning';
    return 'error';
  }, [dataHealth]);

  // Data quality status
  const qualityStatus = useMemo(() => {
    if (!dataHealth) return 'warning';
    const completeness = dataHealth.totalPosts > 0
      ? (dataHealth.postsWithStats / dataHealth.totalPosts) * 100
      : 0;
    if (completeness >= 95 && dataHealth.postsWithMissingData === 0) return 'ok';
    if (completeness >= 80) return 'warning';
    return 'error';
  }, [dataHealth]);

  return (
    <main className="dashboard-main diagnostics-page">
      {/* Header */}
      <div className="diag-header">
        <div>
          <h2>Data Diagnostics</h2>
          <p>Monitor data health, validate metrics, and check API connectivity</p>
        </div>
        <div className="diag-header-actions">
          <button
            className="btn btn-secondary"
            onClick={checkApiStatus}
            disabled={isCheckingApi}
          >
            <RefreshIcon spinning={isCheckingApi} />
            Check Connection
          </button>
          <button
            className="btn btn-primary"
            onClick={handleForceRefresh}
            disabled={isRefreshing}
          >
            <RefreshIcon spinning={isRefreshing} />
            Force Refresh Data
          </button>
        </div>
      </div>

      {/* Status Overview Cards */}
      <section className="diag-section">
        <h3 className="diag-section-title">System Status</h3>
        <div className="diag-status-grid">
          <CheckCard
            title="API Connection"
            description="Connection to the Beehiiv API backend server"
            status={connectionStatus}
            details={apiStatus ? [
              { label: 'Status', value: apiStatus.connected ? 'Connected' : 'Disconnected', status: apiStatus.connected ? 'ok' : 'error' },
              { label: 'Cache Available', value: apiStatus.hasCachedData ? 'Yes' : 'No' },
              { label: 'Cache Stale', value: apiStatus.isStale ? 'Yes' : 'No', status: apiStatus.isStale ? 'warning' : 'ok' },
              ...(apiStatus.error ? [{ label: 'Error', value: apiStatus.error, status: 'error' }] : [])
            ] : []}
            lastChecked={lastApiCheck}
            onRecheck={checkApiStatus}
          />

          <CheckCard
            title="Data Freshness"
            description="How recent is the cached data"
            status={freshnessStatus}
            details={dataHealth ? [
              { label: 'Last Fetched', value: dataHealth.fetchedAt ? format(dataHealth.fetchedAt, 'MMM d, yyyy HH:mm') : 'Unknown' },
              { label: 'Data Age', value: dataHealth.dataAge !== null ? `${dataHealth.dataAge} hours` : 'Unknown', status: freshnessStatus },
              { label: 'Next Refresh', value: apiStatus?.nextRefresh ? format(new Date(apiStatus.nextRefresh), 'HH:mm') : 'Unknown' }
            ] : []}
          />

          <CheckCard
            title="Data Quality"
            description="Completeness and validity of loaded data"
            status={qualityStatus}
            details={dataHealth ? [
              { label: 'Total Posts', value: dataHealth.totalPosts.toLocaleString() },
              { label: 'Posts with Stats', value: `${dataHealth.postsWithStats.toLocaleString()} (${((dataHealth.postsWithStats / Math.max(dataHealth.totalPosts, 1)) * 100).toFixed(0)}%)` },
              { label: 'Missing Data', value: dataHealth.postsWithMissingData, status: dataHealth.postsWithMissingData === 0 ? 'ok' : 'warning' },
              { label: 'Recent Posts (7d)', value: dataHealth.recentPostsCount.toLocaleString() }
            ] : []}
          />
        </div>
      </section>

      {/* Data Summary */}
      <section className="diag-section">
        <h3 className="diag-section-title">Data Summary</h3>
        <div className="diag-summary-grid">
          <div className="diag-summary-card">
            <div className="diag-summary-icon"><DatabaseIcon /></div>
            <div className="diag-summary-content">
              <div className="diag-summary-value">{dataHealth?.totalPosts?.toLocaleString() || 0}</div>
              <div className="diag-summary-label">Total Posts</div>
            </div>
          </div>
          <div className="diag-summary-card">
            <div className="diag-summary-icon"><ServerIcon /></div>
            <div className="diag-summary-content">
              <div className="diag-summary-value">{dataHealth?.totalSubscribers?.toLocaleString() || 0}</div>
              <div className="diag-summary-label">Total Subscribers</div>
            </div>
          </div>
          <div className="diag-summary-card">
            <div className="diag-summary-icon"><DataIcon /></div>
            <div className="diag-summary-content">
              <div className="diag-summary-value">{dataHealth?.activeSubscribers?.toLocaleString() || 0}</div>
              <div className="diag-summary-label">Active Subscribers</div>
            </div>
          </div>
          <div className="diag-summary-card">
            <div className="diag-summary-icon"><ServerIcon /></div>
            <div className="diag-summary-content">
              <div className="diag-summary-value">{dataHealth?.publications?.length || 0}</div>
              <div className="diag-summary-label">Publications</div>
            </div>
          </div>
        </div>
      </section>

      {/* Metric Validation */}
      <section className="diag-section">
        <div className="diag-section-header">
          <h3 className="diag-section-title">Metric Validation</h3>
          <button className="btn btn-secondary btn-sm" onClick={runValidation}>
            Run Validation
          </button>
        </div>
        <p className="diag-section-desc">
          Verify that calculated metrics match expected values based on raw data
        </p>

        {validationResults ? (
          <div className="diag-validation-table-wrapper">
            <table className="diag-validation-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Formula</th>
                  <th>Expected</th>
                  <th>Calculated</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {validationResults.map((result, idx) => (
                  <MetricValidation key={idx} {...result} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="diag-empty-state">
            <p>Click "Run Validation" to verify metric calculations</p>
          </div>
        )}
      </section>

      {/* UTM Source Distribution */}
      {dataHealth?.utmSources && Object.keys(dataHealth.utmSources).length > 0 && (
        <section className="diag-section">
          <h3 className="diag-section-title">Subscriber Sources</h3>
          <p className="diag-section-desc">Distribution of subscribers by UTM source</p>
          <div className="diag-source-grid">
            {Object.entries(dataHealth.utmSources)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([source, count]) => (
                <div key={source} className="diag-source-item">
                  <span className="diag-source-name">{source}</span>
                  <span className="diag-source-count">{count.toLocaleString()}</span>
                  <div className="diag-source-bar">
                    <div
                      className="diag-source-bar-fill"
                      style={{ width: `${(count / dataHealth.totalSubscribers) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Publications */}
      {dataHealth?.publications?.length > 0 && (
        <section className="diag-section">
          <h3 className="diag-section-title">Connected Publications</h3>
          <div className="diag-publications-grid">
            {dataHealth.publications.map(pub => (
              <div key={pub.id} className="diag-pub-card">
                <div className="diag-pub-name">{pub.name}</div>
                <div className="diag-pub-id">{pub.id}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Troubleshooting */}
      <section className="diag-section">
        <h3 className="diag-section-title">Troubleshooting</h3>
        <div className="diag-troubleshooting">
          <div className="diag-trouble-item">
            <h4>Data not updating?</h4>
            <p>Click "Force Refresh Data" to fetch the latest data from Beehiiv API. Auto-refresh occurs every 6 hours.</p>
          </div>
          <div className="diag-trouble-item">
            <h4>Connection error?</h4>
            <p>Ensure the API server is running on port 3001. Check the terminal for any error messages.</p>
          </div>
          <div className="diag-trouble-item">
            <h4>Metrics look wrong?</h4>
            <p>Run the validation check above to compare calculated vs reported values. Check for data completeness issues.</p>
          </div>
          <div className="diag-trouble-item">
            <h4>Missing newsletters?</h4>
            <p>Only "confirmed" (sent) newsletters are fetched. Draft and scheduled newsletters are excluded.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
