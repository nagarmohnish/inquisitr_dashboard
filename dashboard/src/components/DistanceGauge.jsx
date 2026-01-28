import { useMemo, useState } from 'react';

// Status thresholds based on distance to target
const STATUS = {
  ON_TRACK: { key: 'on-track', label: 'On Track', color: '#22c55e' },  // Green - Good
  AT_RISK: { key: 'at-risk', label: 'At Risk', color: '#f59e0b' },     // Amber - Decent
  BEHIND: { key: 'behind', label: 'Behind', color: '#ef4444' }         // Red - At Risk
};

// Metric explanations for info buttons
const METRIC_INFO = {
  Subscribers: {
    formula: 'COUNT(subscribers WHERE status = "active")',
    description: 'Total active subscribers. A growing count indicates healthy list growth.',
    benchmark: 'Target: 30,000 by Q1 2026'
  },
  'Open Rate': {
    formula: '(Unique Opens / Delivered) × 100',
    description: 'Percentage of delivered emails opened. Measures subject line effectiveness.',
    benchmark: '35-40% (industry avg: 22%)'
  },
  CTR: {
    formula: '(Unique Clicks / Delivered) × 100',
    description: 'Click-Through Rate - percentage of recipients who clicked a link.',
    benchmark: '16-17% (industry avg: 2.5%)'
  },
  CTOR: {
    formula: '(Clicks / Opens) × 100',
    description: 'Click-to-Open Rate - of those who opened, what % clicked?',
    benchmark: '9-10% (industry avg: 9%)'
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

function GaugeInfoPopover({ info, onClose }) {
  if (!info) return null;
  return (
    <div className="gauge-info-popover">
      <div className="gauge-info-header">
        <span>About this metric</span>
        <button className="gauge-info-close" onClick={onClose}>×</button>
      </div>
      <div className="gauge-info-content">
        <code>{info.formula}</code>
        <p>{info.description}</p>
        <span className="gauge-info-benchmark">{info.benchmark}</span>
      </div>
    </div>
  );
}

function getStatus(distancePercent, daysRemaining, requiredDailyRate, actualDailyRate) {
  // If we've reached the target
  if (distancePercent <= 0) return STATUS.ON_TRACK;

  // Compare actual daily progress to required daily progress
  if (requiredDailyRate && actualDailyRate !== undefined) {
    const ratio = actualDailyRate / requiredDailyRate;
    if (ratio >= 1) return STATUS.ON_TRACK;
    if (ratio >= 0.8) return STATUS.AT_RISK;
    return STATUS.BEHIND;
  }

  // Fallback: based on distance percentage
  if (distancePercent <= 10) return STATUS.ON_TRACK;
  if (distancePercent <= 30) return STATUS.AT_RISK;
  return STATUS.BEHIND;
}

function formatDistance(value, format, isPercentMetric) {
  if (value === undefined || value === null) return '-';

  if (isPercentMetric) {
    // For percentage metrics, show percentage points
    return `${Math.abs(value).toFixed(1)} pts`;
  }

  if (format === 'percent') return `${Math.abs(value).toFixed(1)}%`;
  if (format === 'number') return Math.abs(value).toLocaleString();
  if (format === 'currency') return `$${Math.abs(value).toFixed(2)}`;
  return Math.abs(value);
}

function formatValue(value, format) {
  if (value === undefined || value === null) return '-';
  if (format === 'percent') return `${value.toFixed(1)}%`;
  if (format === 'number') return value.toLocaleString();
  if (format === 'currency') return `$${value.toFixed(2)}`;
  return value;
}

/**
 * DistanceGauge - Shows distance to target instead of percent complete
 * This is the conceptually correct way to display rate-based targets
 *
 * For a metric like Open Rate:
 * - Target: 35%
 * - Current: 25%
 * - Shows: "10 pts to target" NOT "71% complete"
 */
export default function DistanceGauge({
  title,
  current,
  target,
  format: valueFormat = 'number',
  isPercentMetric = false, // Set true for rate metrics like Open Rate, CTOR
  daysRemaining,
  requiredDailyRate,
  actualDailyRate,
  size = 140,
  strokeWidth = 10,
  subtitle
}) {
  const [showInfo, setShowInfo] = useState(false);
  const metricInfo = METRIC_INFO[title];

  const distance = useMemo(() => {
    return target - current;
  }, [current, target]);

  const isTargetMet = distance <= 0;

  // For the visual, we show how much of the gap has been closed
  // Start from 0, fill up as we get closer to target
  const visualProgress = useMemo(() => {
    if (!target || target === 0) return 0;
    if (isTargetMet) return 100;

    // Calculate what percentage of the target we've reached
    // This is different from percent complete - it shows proximity
    const progress = (current / target) * 100;
    return Math.max(0, Math.min(100, progress));
  }, [current, target, isTargetMet]);

  const status = useMemo(() => {
    const distancePercent = target > 0 ? (distance / target) * 100 : 0;
    return getStatus(distancePercent, daysRemaining, requiredDailyRate, actualDailyRate);
  }, [distance, target, daysRemaining, requiredDailyRate, actualDailyRate]);

  // SVG calculations
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (visualProgress / 100) * circumference;

  return (
    <div className={`distance-gauge-container gauge-${status.key}`}>
      <div className="distance-gauge" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            className="distance-gauge-bg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--bg-tertiary)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            className="distance-gauge-fill"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={status.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
              transition: 'stroke-dashoffset 0.5s ease-out'
            }}
          />
        </svg>

        {/* Center content - showing distance to target */}
        <div className="distance-gauge-center">
          {isTargetMet ? (
            <>
              <div className="distance-gauge-value achieved">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="distance-gauge-label">Target Met</div>
            </>
          ) : (
            <>
              <div className="distance-gauge-value">
                {formatDistance(distance, valueFormat, isPercentMetric)}
              </div>
              <div className="distance-gauge-label">to target</div>
            </>
          )}
        </div>
      </div>

      {/* Title and details with info button */}
      <div className="distance-gauge-title-row">
        <div className="distance-gauge-title">{title}</div>
        {metricInfo && (
          <button
            className={`gauge-info-btn ${showInfo ? 'active' : ''}`}
            onClick={() => setShowInfo(!showInfo)}
            title={`About ${title}`}
          >
            <InfoIcon />
          </button>
        )}
      </div>
      {showInfo && metricInfo && (
        <GaugeInfoPopover info={metricInfo} onClose={() => setShowInfo(false)} />
      )}
      <div className="distance-gauge-details">
        <span className="current-value">{formatValue(current, valueFormat)}</span>
        <span className="separator">→</span>
        <span className="target-value">{formatValue(target, valueFormat)}</span>
      </div>

      {subtitle && (
        <div className="distance-gauge-subtitle">{subtitle}</div>
      )}

      {/* Required daily rate info */}
      {requiredDailyRate !== undefined && !isTargetMet && (
        <div className="distance-gauge-daily">
          <span className="daily-label">Daily required:</span>
          <span className="daily-value">
            +{isPercentMetric ? `${requiredDailyRate.toFixed(2)} pts` : formatValue(requiredDailyRate, valueFormat)}
          </span>
        </div>
      )}

      {/* Status badge */}
      <div className={`status-pill ${status.key}`}>
        {status.key === 'on-track' && '✓ '}
        {status.key === 'at-risk' && '⚠ '}
        {status.key === 'behind' && '✗ '}
        {status.label}
      </div>
    </div>
  );
}

// Compact version for grids
export function DistanceGaugeCompact({
  title,
  current,
  target,
  format: valueFormat = 'number',
  isPercentMetric = false,
  size = 100,
  strokeWidth = 8
}) {
  const distance = useMemo(() => {
    return target - current;
  }, [current, target]);

  const isTargetMet = distance <= 0;

  const visualProgress = useMemo(() => {
    if (!target || target === 0) return 0;
    if (isTargetMet) return 100;
    return Math.max(0, Math.min(100, (current / target) * 100));
  }, [current, target, isTargetMet]);

  const status = useMemo(() => {
    const distancePercent = target > 0 ? (distance / target) * 100 : 0;
    return getStatus(distancePercent);
  }, [distance, target]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (visualProgress / 100) * circumference;

  return (
    <div className={`distance-gauge-compact gauge-${status.key}`}>
      <div className="gauge-svg-container" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            className="distance-gauge-bg"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--bg-tertiary)"
            strokeWidth={strokeWidth}
          />
          <circle
            className="distance-gauge-fill"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={status.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%'
            }}
          />
        </svg>
        <div className="gauge-center-compact">
          <span className="gauge-distance">
            {isTargetMet ? '✓' : formatDistance(distance, valueFormat, isPercentMetric)}
          </span>
        </div>
      </div>
      <div className="gauge-info-compact">
        <div className="gauge-title-compact">{title}</div>
        <div className="gauge-values-compact">
          <span>{formatValue(current, valueFormat)}</span>
          <span className="gauge-target-compact">→ {formatValue(target, valueFormat)}</span>
        </div>
      </div>
    </div>
  );
}
