import { useMemo, useState } from 'react';

// Metric explanations for info buttons
const METRIC_INFO = {
  Subscribers: {
    formula: 'COUNT(active subscribers)',
    description: 'Total active subscribers across all publications.',
    benchmark: 'Target: 30,000 by Q1 2026'
  },
  'Open Rate': {
    formula: '(Unique Opens / Delivered) × 100',
    description: 'Percentage of delivered emails opened.',
    benchmark: 'Target: 35-40% (industry avg: 22%)'
  },
  CTR: {
    formula: '(Unique Clicks / Delivered) × 100',
    description: 'Click-Through Rate - percentage of all delivered emails where a link was clicked.',
    benchmark: 'Target: 5-6% (industry avg: 2.5%)'
  },
  CTOR: {
    formula: '(Unique Clicks / Unique Opens) × 100',
    description: 'Click-to-Open Rate - of those who opened, what percentage clicked. This matches Beehiiv\'s "CTR" metric.',
    benchmark: 'Target: 16-17% (matches Beehiiv CTR)'
  },
  'Revenue/Click': {
    formula: 'Total Ad Revenue / Total Clicks',
    description: 'Average revenue generated per click on newsletter content.',
    benchmark: 'Target: $0.60'
  },
  'Avg Clicks/Clicker': {
    formula: 'Total Clicks / Unique Clickers',
    description: 'Average number of clicks per unique clicker, measuring engagement depth.',
    benchmark: 'Target: $9.00'
  },
  'Cost/Clicker': {
    formula: 'Total Cost / Unique Clickers',
    description: 'Cost to acquire each unique clicker.',
    benchmark: 'Target: $0.30'
  }
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

function formatValue(value, format) {
  if (value === undefined || value === null) return '-';
  if (format === 'percent') return `${value.toFixed(1)}%`;
  if (format === 'number') return value.toLocaleString();
  if (format === 'currency') return `$${value.toFixed(2)}`;
  if (format === 'decimal') return value.toFixed(2);
  return value;
}

function getStatus(current, target, requiredDaily, actualDaily) {
  const progress = target > 0 ? (current / target) * 100 : 0;
  const growthRatio = requiredDaily > 0 ? actualDaily / requiredDaily : 1;

  if (progress >= 100 || growthRatio >= 1) {
    return { key: 'on-track', label: 'On Track' };
  }
  if (growthRatio >= 0.8) {
    return { key: 'at-risk', label: 'At Risk' };
  }
  return { key: 'behind', label: 'Behind' };
}

function SortIcon({ direction }) {
  if (!direction) {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {direction === 'asc' ? <path d="M7 15l5 5 5-5" /> : <path d="M7 9l5-5 5 5" />}
    </svg>
  );
}

export default function GapAnalysisTable({
  metrics,
  title = 'Gap Analysis',
  subtitle
}) {
  const [sortField, setSortField] = useState('gap');
  const [sortDirection, setSortDirection] = useState('desc');

  const sortedMetrics = useMemo(() => {
    if (!metrics || metrics.length === 0) return [];

    return [...metrics].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle special fields
      if (sortField === 'status') {
        const statusOrder = { 'behind': 0, 'at-risk': 1, 'on-track': 2 };
        aVal = statusOrder[a.status?.key] || 0;
        bVal = statusOrder[b.status?.key] || 0;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
  }, [metrics, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (!sortedMetrics || sortedMetrics.length === 0) {
    return (
      <div className="gap-analysis-table">
        <div className="table-header">
          <h3>{title}</h3>
        </div>
        <div className="empty-state">
          <p>No metrics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gap-analysis-table">
      <div className="table-header">
        <div>
          <h3>{title}</h3>
          {subtitle && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{subtitle}</p>}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="gap-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                Metric
                <span className="sort-icon">
                  <SortIcon direction={sortField === 'name' ? sortDirection : null} />
                </span>
              </th>
              <th onClick={() => handleSort('current')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                Current
                <span className="sort-icon">
                  <SortIcon direction={sortField === 'current' ? sortDirection : null} />
                </span>
              </th>
              <th onClick={() => handleSort('target')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                Target
                <span className="sort-icon">
                  <SortIcon direction={sortField === 'target' ? sortDirection : null} />
                </span>
              </th>
              <th onClick={() => handleSort('gap')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                Gap
                <span className="sort-icon">
                  <SortIcon direction={sortField === 'gap' ? sortDirection : null} />
                </span>
              </th>
              <th onClick={() => handleSort('dailyRequired')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                Daily Required
                <span className="sort-icon">
                  <SortIcon direction={sortField === 'dailyRequired' ? sortDirection : null} />
                </span>
              </th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                Status
                <span className="sort-icon">
                  <SortIcon direction={sortField === 'status' ? sortDirection : null} />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedMetrics.map((metric, idx) => {
              const status = metric.status || getStatus(
                metric.current,
                metric.target,
                metric.dailyRequired,
                metric.dailyActual
              );
              const gap = metric.gap ?? (metric.target - metric.current);
              const isPositiveGap = gap > 0;

              return (
                <tr key={metric.name || idx}>
                  <td>
                    <div className="metric-name-cell">
                      <span style={{ fontWeight: 500 }}>{metric.name}</span>
                      {METRIC_INFO[metric.name] && (
                        <button className="table-info-btn" title={`About ${metric.name}`}>
                          <InfoIcon />
                          <MetricInfoTooltip info={METRIC_INFO[metric.name]} />
                        </button>
                      )}
                    </div>
                    {metric.description && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {metric.description}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="gap-value">
                      {formatValue(metric.current, metric.format)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {formatValue(metric.target, metric.format)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`gap-value ${isPositiveGap ? 'gap-negative' : 'gap-positive'}`}>
                      {isPositiveGap ? '-' : '+'}{formatValue(Math.abs(gap), metric.format)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {metric.dailyRequired !== undefined
                        ? formatValue(metric.dailyRequired, metric.dailyFormat || 'decimal')
                        : '-'
                      }
                      {metric.dailyRequired !== undefined && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/day</span>
                      )}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`status-pill ${status.key}`}>
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
