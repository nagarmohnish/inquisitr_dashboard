import { useMemo, useState } from 'react';
import { format, differenceInDays, parseISO, subDays } from 'date-fns';
import DistanceGauge from '../components/DistanceGauge';
import TrajectoryChart from '../components/TrajectoryChart';
import GapAnalysisTable from '../components/GapAnalysisTable';

// Publication filter options
const PUBLICATION_OPTIONS = [
  { key: 'overall', label: 'Overall' },
  { key: 'main', label: 'Main Newsletter' },
  { key: 'ads', label: 'Ads Newsletter' }
];

// Targets from prediction.py - Q1 2026 goals
const TARGETS = {
  subscribers: 30000,
  openRate: { min: 35, max: 40 },
  ctr: { min: 5, max: 6 },
  ctor: { min: 16, max: 17 },
  trafficPerSend: 3000,
  revenuePerClick: 0.6,
  avgClicksPerClicker: 9,
  costPerClicker: 0.3,
  deadline: new Date('2026-03-31T00:00:00Z')
};

// Helper function to get status
function getStatus(progress, requiredProgress = 100) {
  const ratio = progress / requiredProgress;
  if (ratio >= 1) return { key: 'on-track', label: 'On Track' };
  if (ratio >= 0.8) return { key: 'at-risk', label: 'At Risk' };
  return { key: 'behind', label: 'Behind' };
}

// Redesigned Days Remaining Card with better colors and layout
function DaysRemainingCardRedesigned({ daysRemaining, deadline, predictions }) {
  const urgencyLevel = daysRemaining > 60 ? 'comfortable' : daysRemaining > 30 ? 'moderate' : 'urgent';

  return (
    <div className={`days-card-redesigned ${urgencyLevel}`}>
      <div className="days-card-main">
        <div className="days-number">{daysRemaining}</div>
        <div className="days-text">
          <span className="days-label">Days Left</span>
          <span className="days-deadline">Until {format(deadline, 'MMM d, yyyy')}</span>
        </div>
      </div>
      <div className="days-card-metrics">
        <div className="days-metric">
          <span className="days-metric-value">{predictions.requiredDailyGrowth.toFixed(1)}</span>
          <span className="days-metric-label">Subs/day needed</span>
        </div>
        <div className="days-metric-divider" />
        <div className="days-metric">
          <span className="days-metric-value">{predictions.actualDailyGrowth.toFixed(1)}</span>
          <span className="days-metric-label">Current subs/day</span>
        </div>
        <div className="days-metric-divider" />
        <div className="days-metric">
          <span className={`days-metric-value ${predictions.subStatus === 'ON TRACK' ? 'positive' : predictions.subStatus === 'AHEAD' ? 'positive' : 'negative'}`}>
            {predictions.subStatus}
          </span>
          <span className="days-metric-label">Trajectory</span>
        </div>
      </div>
    </div>
  );
}

// Short explanation at the top
function ProjectionSummary({ predictions }) {
  return (
    <div className="projection-summary">
      <div className="projection-summary-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </div>
      <div className="projection-summary-content">
        <strong>Projection Summary:</strong> Based on your current growth rate of{' '}
        <span className="highlight">{predictions.actualDailyGrowth.toFixed(1)} subscribers/day</span>,
        you are projected to reach{' '}
        <span className="highlight">{Math.round(predictions.projectedSubs).toLocaleString()} subscribers</span>{' '}
        by March 31, 2026. Target is <span className="highlight">{TARGETS.subscribers.toLocaleString()}</span>.
        {predictions.projectedSubs >= TARGETS.subscribers ? (
          <span className="status-good"> You are on track to meet your goal.</span>
        ) : (
          <span className="status-warning"> You need to increase daily growth by {(predictions.requiredDailyGrowth - predictions.actualDailyGrowth).toFixed(1)} subs/day.</span>
        )}
      </div>
    </div>
  );
}

// Detailed methodology explanation at the bottom
function ProjectionMethodology({ predictions }) {
  return (
    <div className="projection-methodology">
      <h3>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
        How Projections Are Calculated
      </h3>

      <div className="methodology-grid">
        <div className="methodology-card">
          <h4>Current Growth Rate</h4>
          <div className="methodology-formula">
            <code>Actual Daily Growth = New Subscribers (Last 30 Days) ÷ 30</code>
          </div>
          <p>
            We count all new subscribers from the past 30 days and divide by 30 to get the average daily growth.
            Your current rate: <strong>{predictions.actualDailyGrowth.toFixed(2)} subs/day</strong>
          </p>
        </div>

        <div className="methodology-card">
          <h4>Required Growth Rate</h4>
          <div className="methodology-formula">
            <code>Required Daily Growth = (Target - Current) ÷ Days Remaining</code>
          </div>
          <p>
            The gap between your current subscriber count and target, divided by remaining days.
            Required rate: <strong>{predictions.requiredDailyGrowth.toFixed(2)} subs/day</strong>
          </p>
        </div>

        <div className="methodology-card">
          <h4>Projected Subscribers</h4>
          <div className="methodology-formula">
            <code>Projection = Current + (Daily Growth × Days Remaining)</code>
          </div>
          <p>
            Linear projection assuming growth continues at current rate.
            Projected total: <strong>{Math.round(predictions.projectedSubs).toLocaleString()} subscribers</strong>
          </p>
        </div>

        <div className="methodology-card">
          <h4>Status Determination</h4>
          <div className="methodology-formula">
            <code>Status = Projected ≥ Target × 1.05 ? AHEAD : Projected ≥ Target ? ON TRACK : BEHIND</code>
          </div>
          <p>
            <strong>AHEAD:</strong> Projected to exceed target by 5%+<br />
            <strong>ON TRACK:</strong> Projected to meet target<br />
            <strong>BEHIND:</strong> Projected to miss target
          </p>
        </div>
      </div>

      <div className="methodology-assumptions">
        <h4>Key Assumptions & Limitations</h4>
        <ul>
          <li><strong>Linear Growth:</strong> Projections assume constant daily growth rate. Actual growth may vary due to seasonality, campaigns, or external factors.</li>
          <li><strong>30-Day Baseline:</strong> Growth rate is calculated from the most recent 30 days, which may not reflect long-term trends.</li>
          <li><strong>No Churn Modeling:</strong> Current projections don't account for subscriber churn. Net growth is what matters.</li>
          <li><strong>Rate Metrics (OR, CTR, CTOR):</strong> These are averages that can be improved through content optimization, not linear growth.</li>
        </ul>
      </div>
    </div>
  );
}

function RecommendationCard({ recommendations }) {
  return (
    <div className="recommendation-card">
      <h3>Recommendations</h3>
      <div className="recommendation-list">
        {recommendations.map((rec, idx) => (
          <div key={idx} className="recommendation-item">
            <span className="rec-number">{idx + 1}</span>
            <p>{rec}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Gauges Grid Component - using DistanceGauge for conceptually correct display
function GaugesGrid({ predictions }) {
  return (
    <div className="target-gauges-grid">
      <DistanceGauge
        title="Subscribers"
        current={predictions.currentSubs}
        target={TARGETS.subscribers}
        format="number"
        isPercentMetric={false}
        daysRemaining={predictions.daysRemaining}
        requiredDailyRate={predictions.requiredDailyGrowth}
        actualDailyRate={predictions.actualDailyGrowth}
        subtitle={`Need ${predictions.subsNeeded.toLocaleString()} more`}
      />
      <DistanceGauge
        title="Open Rate"
        current={predictions.avgOpenRate}
        target={TARGETS.openRate.min}
        format="percent"
        isPercentMetric={true}
        daysRemaining={predictions.daysRemaining}
        requiredDailyRate={predictions.daysRemaining > 0 ? (TARGETS.openRate.min - predictions.avgOpenRate) / predictions.daysRemaining : 0}
        subtitle={`Target: ${TARGETS.openRate.min}-${TARGETS.openRate.max}%`}
      />
      <DistanceGauge
        title="CTR"
        current={predictions.avgCtr || 0}
        target={TARGETS.ctr.min}
        format="percent"
        isPercentMetric={true}
        daysRemaining={predictions.daysRemaining}
        requiredDailyRate={predictions.daysRemaining > 0 ? (TARGETS.ctr.min - (predictions.avgCtr || 0)) / predictions.daysRemaining : 0}
        subtitle={`Target: ${TARGETS.ctr.min}-${TARGETS.ctr.max}%`}
      />
      <DistanceGauge
        title="CTOR"
        current={predictions.avgCtor}
        target={TARGETS.ctor.min}
        format="percent"
        isPercentMetric={true}
        daysRemaining={predictions.daysRemaining}
        requiredDailyRate={predictions.daysRemaining > 0 ? (TARGETS.ctor.min - predictions.avgCtor) / predictions.daysRemaining : 0}
        subtitle={`Target: ${TARGETS.ctor.min}-${TARGETS.ctor.max}%`}
      />
    </div>
  );
}

// Publication Filter Component
function PublicationFilter({ selected, onChange }) {
  return (
    <div className="publication-filter">
      <span className="filter-label">Publication:</span>
      <div className="publication-toggle">
        {PUBLICATION_OPTIONS.map(opt => (
          <button
            key={opt.key}
            className={`pub-filter-btn ${selected === opt.key ? 'active' : ''}`}
            onClick={() => onChange(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TargetPage({ data }) {
  const [selectedPublication, setSelectedPublication] = useState('overall');

  const predictions = useMemo(() => {
    if (!data) return null;

    const now = new Date();
    const daysRemaining = differenceInDays(TARGETS.deadline, now);

    // Filter data based on selected publication
    let filteredSubscribers = data.subscribers || [];
    let filteredPosts = data.posts || [];

    // Filter by publication if not 'overall'
    if (selectedPublication !== 'overall') {
      // Map selection to publication name patterns
      const pubNamePatterns = {
        'main': ['inquisitr main', 'main'],
        'ads': ['inquisitr ads', 'ads']
      };
      const patterns = pubNamePatterns[selectedPublication] || [selectedPublication];

      filteredSubscribers = filteredSubscribers.filter(s => {
        const pubName = (s['Publication Name'] || s.publicationName || '').toLowerCase();
        return patterns.some(pattern => pubName.includes(pattern));
      });

      filteredPosts = filteredPosts.filter(p => {
        const pubName = (p['Publication Name'] || p.publicationName || '').toLowerCase();
        return patterns.some(pattern => pubName.includes(pattern));
      });
    }

    // Calculate metrics from filtered posts
    const calculateMetricsFromPosts = (posts) => {
      if (!posts || posts.length === 0) return { openRate: 0, ctr: 0, ctor: 0, trafficSent: 0 };

      let totalDelivered = 0;
      let totalOpens = 0;
      let totalClicks = 0;
      let totalTraffic = 0;

      posts.forEach(p => {
        const delivered = parseFloat(p['Delivered'] || p['delivered'] || p['Recipients'] || 0);
        const opens = parseFloat(p['Unique Opens'] || p['unique_opens'] || 0);
        const clicks = parseFloat(p['Unique Clicks'] || p['unique_clicks'] || 0);

        totalDelivered += delivered;
        totalOpens += opens;
        totalClicks += clicks;

        // Article clicks for traffic
        const articleClicks = p['Article Clicks'] || p['articleClicks'] || [];
        if (Array.isArray(articleClicks)) {
          articleClicks.forEach(ac => {
            totalTraffic += ac.totalClicks || 0;
          });
        }
      });

      return {
        openRate: totalDelivered > 0 ? (totalOpens / totalDelivered) * 100 : 0,
        ctr: totalDelivered > 0 ? (totalClicks / totalDelivered) * 100 : 0,
        ctor: totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0,
        trafficSent: posts.length > 0 ? totalTraffic / posts.length : 0
      };
    };

    // Get subscriber count - count active subscribers from filtered list
    const activeSubs = filteredSubscribers.filter(s => (s['Status'] || s['status'])?.toLowerCase() === 'active');
    const currentSubs = activeSubs.length;

    const subsNeeded = TARGETS.subscribers - currentSubs;

    // Calculate daily growth from filtered subscriber data
    const thirtyDaysAgo = subDays(now, 30);
    const recentSubs = filteredSubscribers.filter(s => {
      const created = s['Subscribe Date'] || s.created;
      if (!created) return false;
      try {
        const date = created instanceof Date ? created : parseISO(created);
        return date >= thirtyDaysAgo;
      } catch {
        return false;
      }
    }).length;

    const actualDailyGrowth = recentSubs / 30;
    const requiredDailyGrowth = daysRemaining > 0 ? subsNeeded / daysRemaining : 0;
    const projectedSubs = currentSubs + (actualDailyGrowth * daysRemaining);

    let subStatus = 'BEHIND';
    if (projectedSubs >= TARGETS.subscribers * 1.05) {
      subStatus = 'AHEAD';
    } else if (projectedSubs >= TARGETS.subscribers) {
      subStatus = 'ON TRACK';
    }

    // Get engagement metrics - always calculate from filtered posts
    const computed = calculateMetricsFromPosts(filteredPosts);
    const avgOpenRate = computed.openRate;
    const avgCtr = computed.ctr;
    const avgCtor = computed.ctor;
    const avgTrafficSent = computed.trafficSent;

    // Generate recommendations
    const recommendations = [];
    if (subStatus === 'BEHIND') {
      const gap = requiredDailyGrowth - actualDailyGrowth;
      recommendations.push(
        `Subscriber growth needs to increase by ${gap.toFixed(1)} subs/day. Consider: referral programs, cross-promotions, or paid acquisition.`
      );
    }
    if (avgOpenRate < TARGETS.openRate.min) {
      recommendations.push(
        `Open rate (${avgOpenRate.toFixed(1)}%) is below target (${TARGETS.openRate.min}%). Test subject lines, optimize send times, and clean inactive subscribers.`
      );
    }
    if (avgCtor < TARGETS.ctor.min) {
      recommendations.push(
        `CTOR (${avgCtor.toFixed(1)}%) is below target (${TARGETS.ctor.min}%). Improve CTA placement, use more compelling link text, and ensure content matches subject promises.`
      );
    }
    if (avgTrafficSent < TARGETS.trafficPerSend) {
      recommendations.push(
        `Traffic per send (${avgTrafficSent.toFixed(0)}) is below target (${TARGETS.trafficPerSend}). Add more article links, use curiosity-driven teasers, and test link positioning.`
      );
    }
    if (recommendations.length === 0) {
      recommendations.push('All metrics are on track! Maintain current strategies and continue monitoring.');
    }

    // Generate trajectory data for chart
    const trajectoryData = [];
    const monthsUntilDeadline = Math.ceil(daysRemaining / 30);

    // Add historical data points (past 3 months approximated)
    for (let i = -3; i <= 0; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const historicalValue = currentSubs - (actualDailyGrowth * Math.abs(i) * 30);
      trajectoryData.push({
        date: format(monthDate, 'MMM yy'),
        historical: Math.max(0, historicalValue),
        required: null,
        projected: null
      });
    }

    // Add future projections
    for (let i = 1; i <= monthsUntilDeadline; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const projectedValue = currentSubs + (actualDailyGrowth * i * 30);
      const requiredValue = currentSubs + (requiredDailyGrowth * i * 30);
      trajectoryData.push({
        date: format(monthDate, 'MMM yy'),
        historical: null,
        required: requiredValue,
        projected: projectedValue
      });
    }

    return {
      currentSubs,
      projectedSubs,
      subsNeeded,
      daysRemaining,
      actualDailyGrowth,
      requiredDailyGrowth,
      subStatus,
      avgOpenRate,
      avgCtr,
      avgCtor,
      avgTrafficSent,
      recommendations: recommendations.slice(0, 3),
      trajectoryData
    };
  }, [data, selectedPublication]);

  if (!predictions) {
    return (
      <div className="empty-state">
        <p>Loading prediction data...</p>
      </div>
    );
  }

  // Build gap analysis metrics
  const gapMetrics = [
    {
      name: 'Subscribers',
      current: predictions.currentSubs,
      target: TARGETS.subscribers,
      gap: predictions.subsNeeded,
      dailyRequired: predictions.requiredDailyGrowth,
      dailyActual: predictions.actualDailyGrowth,
      format: 'number',
      dailyFormat: 'decimal',
      status: getStatus(predictions.currentSubs / TARGETS.subscribers * 100, predictions.requiredDailyGrowth > 0 ? predictions.actualDailyGrowth / predictions.requiredDailyGrowth * 100 : 100)
    },
    {
      name: 'Open Rate',
      description: `Target: ${TARGETS.openRate.min}-${TARGETS.openRate.max}%`,
      current: predictions.avgOpenRate,
      target: TARGETS.openRate.min,
      gap: TARGETS.openRate.min - predictions.avgOpenRate,
      format: 'percent',
      status: getStatus((predictions.avgOpenRate / TARGETS.openRate.min) * 100)
    },
    {
      name: 'CTR',
      description: `Target: ${TARGETS.ctr.min}-${TARGETS.ctr.max}%`,
      current: predictions.avgCtr || 0,
      target: TARGETS.ctr.min,
      gap: TARGETS.ctr.min - (predictions.avgCtr || 0),
      format: 'percent',
      status: getStatus(((predictions.avgCtr || 0) / TARGETS.ctr.min) * 100)
    },
    {
      name: 'CTOR',
      description: `Target: ${TARGETS.ctor.min}-${TARGETS.ctor.max}%`,
      current: predictions.avgCtor,
      target: TARGETS.ctor.min,
      gap: TARGETS.ctor.min - predictions.avgCtor,
      format: 'percent',
      status: getStatus((predictions.avgCtor / TARGETS.ctor.min) * 100)
    }
  ];

  return (
    <div className="target-page target-page-compact">
      {/* Compact Header Row - Days Left + Title */}
      <div className="target-header-compact">
        <div className="target-title-section">
          <h1>Target Tracking</h1>
          <p>Q1 2026 Goals — Progress toward March 31, 2026</p>
        </div>
        <PublicationFilter
          selected={selectedPublication}
          onChange={setSelectedPublication}
        />
        <DaysRemainingCardRedesigned
          daysRemaining={predictions.daysRemaining}
          deadline={TARGETS.deadline}
          predictions={predictions}
        />
      </div>

      {/* Short Projection Summary */}
      <ProjectionSummary predictions={predictions} />

      {/* Progress Gauges */}
      <section className="target-section">
        <h2 className="section-title">Progress Gauges</h2>
        <GaugesGrid predictions={predictions} />
      </section>

      {/* Trajectory Chart */}
      <section className="target-section">
        <TrajectoryChart
          data={predictions.trajectoryData}
          targetValue={TARGETS.subscribers}
          title="Subscriber Growth Trajectory"
          subtitle="Historical data, required trajectory, and projected growth"
        />
      </section>

      {/* Gap Analysis Table */}
      <section className="target-section">
        <GapAnalysisTable
          metrics={gapMetrics}
          title="Gap Analysis"
          subtitle="Current status vs Q1 2026 targets"
        />
      </section>

      {/* Recommendations */}
      <section className="target-section">
        <RecommendationCard recommendations={predictions.recommendations} />
      </section>

      {/* Detailed Methodology Explanation */}
      <section className="target-section">
        <ProjectionMethodology predictions={predictions} />
      </section>
    </div>
  );
}
