import { useState } from 'react';

// Comprehensive metric definitions with detailed explanations
const METRIC_DEFINITIONS = {
  overview: {
    title: 'Overview Metrics',
    description: 'High-level health metrics that give you a quick snapshot of newsletter performance.',
    metrics: [
      {
        name: 'Subscriber Count',
        formula: 'Total active subscribers across all publications',
        mathFormula: 'Subscribers = COUNT(subscribers WHERE status = "active")',
        interpretation: 'The total number of people currently subscribed and receiving your newsletters. A growing subscriber count indicates healthy list growth.',
        dataSource: 'Beehiiv API - Subscribers endpoint, filtered by status="active"',
        goodRange: 'Continuously growing',
        actionIfLow: 'Focus on acquisition channels, referral programs, or content that drives sign-ups.',
        icon: 'users',
        calculation: [
          'Query all subscribers from Beehiiv API',
          'Filter to only include status="active"',
          'Count total records',
          'Change = Current Period New Subs - Prior Period New Subs'
        ]
      },
      {
        name: 'Open Rate (OR)',
        formula: '(Total Unique Opens / Total Delivered) × 100',
        mathFormula: 'OR = (ΣUnique_Opens / ΣDelivered) × 100',
        interpretation: 'The percentage of delivered emails that were opened at least once. This measures how compelling your subject lines and sender reputation are.',
        dataSource: 'Posts sheet - aggregated from Unique Opens and Delivered fields',
        goodRange: '20-40% (industry benchmark: ~22%)',
        actionIfLow: 'Test subject lines, optimize send times, clean inactive subscribers, improve sender reputation.',
        icon: 'mail-open',
        calculation: [
          'Sum all Unique Opens across posts in date range',
          'Sum all Delivered emails across posts in date range',
          'Divide Unique Opens by Delivered',
          'Multiply by 100 to get percentage',
          'Change = Current OR - Prior Period OR (in percentage points)'
        ]
      },
      {
        name: 'Click-Through Rate (CTR)',
        formula: '(Total Unique Clicks / Total Delivered) × 100',
        mathFormula: 'CTR = (ΣUnique_Clicks / ΣDelivered) × 100',
        interpretation: 'The percentage of delivered emails where at least one link was clicked. Measures overall engagement from inbox to click.',
        dataSource: 'Posts sheet - aggregated from Unique Clicks and Delivered fields',
        goodRange: '2-5% (industry benchmark: ~2.5%)',
        actionIfLow: 'Improve content relevance, add compelling CTAs, test link placement, ensure mobile optimization.',
        icon: 'mouse-pointer',
        calculation: [
          'Sum all Unique Clicks across posts in date range',
          'Sum all Delivered emails across posts in date range',
          'Divide Unique Clicks by Delivered',
          'Multiply by 100 to get percentage',
          'Change = Current CTR - Prior Period CTR (in percentage points)'
        ]
      },
      {
        name: 'Click-to-Open Rate (CTOR)',
        formula: '(Unique Clicks / Unique Opens) × 100',
        mathFormula: 'CTOR = (ΣClicks / ΣOpens) × 100',
        interpretation: 'Of people who opened the email, what percentage clicked a link? This measures content quality and relevance after the open.',
        dataSource: 'Posts sheet - Clicks / Opens (uses total clicks and opens)',
        goodRange: '9-15% (target: 9-10%)',
        actionIfLow: 'Improve content quality, CTA placement, ensure content matches subject promises.',
        icon: 'activity',
        calculation: [
          'Sum all Clicks across posts in date range',
          'Sum all Opens across posts in date range',
          'Divide Clicks by Opens',
          'Multiply by 100 to get percentage',
          'Note: We use total clicks/opens (not unique) for CTOR calculation'
        ]
      }
    ]
  },
  target: {
    title: 'Target Tracking Metrics',
    description: 'Metrics that track progress toward Q1 2026 goals with trajectory analysis.',
    metrics: [
      {
        name: 'Distance to Target',
        formula: 'Target Value - Current Value',
        mathFormula: 'Distance = Target - Current',
        interpretation: 'Shows how far you are from reaching each goal. For percentage-based metrics like Open Rate, this shows the gap in percentage points, not percent complete.',
        dataSource: 'Calculated from current metrics vs defined targets',
        goodRange: 'Decreasing over time',
        actionIfLow: 'Review the gap analysis table and prioritize metrics with the largest gaps.',
        icon: 'target',
        calculation: [
          'For Subscribers: Target (e.g., 100,000) - Current Count',
          'For Open Rate: Target (35%) - Current OR (e.g., 25%) = 10 pts',
          'For CTOR: Target (9%) - Current CTOR',
          'Distance should decrease as you approach deadline'
        ]
      },
      {
        name: 'Current Growth Rate',
        formula: '((Latest Value - Earlier Value) / Days) / Earlier Value × 100',
        mathFormula: 'Growth_Rate = (ΔValue / Days) / Initial_Value × 100',
        interpretation: 'The actual daily growth rate based on historical data. Used to project future values.',
        dataSource: 'Calculated from trend data over the selected period',
        goodRange: 'Should exceed Required Growth Rate',
        actionIfLow: 'Increase growth efforts or adjust strategy.',
        icon: 'trending-up',
        calculation: [
          'Calculate the change in value over the period',
          'Divide by number of days to get daily change',
          'Divide by starting value to get percentage',
          'This gives average daily growth rate'
        ]
      },
      {
        name: 'Required Growth Rate',
        formula: '(Target - Current) / Days Remaining',
        mathFormula: 'Required_Daily = (Target - Current) / Days_to_Deadline',
        interpretation: 'The daily growth rate needed to hit your target by the deadline. Compare this to your actual daily growth to see if you\'re on track.',
        dataSource: 'Calculated from target, current value, and days until March 31, 2026',
        goodRange: 'Actual growth >= Required growth',
        actionIfLow: 'Increase growth efforts or adjust expectations.',
        icon: 'calendar',
        calculation: [
          'Calculate days remaining until deadline (March 31, 2026)',
          'Calculate gap: Target - Current Value',
          'Divide gap by days remaining',
          'For subscribers: e.g., (100,000 - 80,000) / 60 days = 333 subs/day',
          'For rates: e.g., (35% - 25%) / 60 days = 0.167 pts/day'
        ]
      },
      {
        name: 'Projected Value',
        formula: 'Current + (Daily Growth Rate × Days Remaining)',
        mathFormula: 'Projected = Current + (Growth_Rate × Days_Remaining)',
        interpretation: 'Based on current growth trajectory, what value you\'ll reach by the deadline using linear projection.',
        dataSource: 'Calculated from current value, growth rate, and days remaining',
        goodRange: 'Projected >= Target',
        actionIfLow: 'Current trajectory will miss target - action required.',
        icon: 'trending-up',
        calculation: [
          'Take current value',
          'Multiply daily growth rate by days remaining',
          'Add to current value',
          'This assumes linear growth continues at same rate'
        ]
      },
      {
        name: 'Trajectory Status',
        formula: 'Actual Growth Rate vs Required Growth Rate',
        mathFormula: 'Status = Actual_Rate ≥ Required_Rate ? "ON TRACK" : "BEHIND"',
        interpretation: 'ON TRACK: Actual >= Required | AT RISK: Actual is 80-100% of Required | BEHIND: Actual < 80% of Required',
        dataSource: 'Comparison of actual vs required growth rates',
        goodRange: 'ON TRACK status',
        actionIfLow: 'Focus on the recommendations provided for each metric.',
        icon: 'activity',
        calculation: [
          'Compare projected value to target',
          'If projected >= target: ON TRACK (green)',
          'If projected >= 80% of gap closed: AT RISK (amber)',
          'If projected < 80% of gap closed: BEHIND (red)'
        ]
      }
    ]
  },
  economics: {
    title: 'Unit Economics Metrics',
    description: 'Financial metrics that help understand the cost efficiency and revenue generation of your newsletter.',
    metrics: [
      {
        name: 'CPU (Cost per User)',
        formula: 'Total Acquisition Spend / New Subscribers',
        mathFormula: 'CPU = Total_Spend / New_Subscribers',
        interpretation: 'How much it costs to acquire each new subscriber. Lower is better, but must be balanced with subscriber quality.',
        dataSource: 'Beehiiv subscription costs + paid acquisition costs / new subscriber count',
        goodRange: '< $0.50 for quality subscribers',
        actionIfLow: 'N/A - lower is better',
        icon: 'dollar-sign',
        calculation: [
          'Sum all acquisition costs (ads, tools, Beehiiv fees)',
          'Count new subscribers in the same period',
          'Divide total costs by new subscribers',
          'Track over time to identify cost-effective channels'
        ]
      },
      {
        name: 'Cost per Clicker',
        formula: 'CPU / (Click Rate / 100)',
        mathFormula: 'Cost_per_Clicker = CPU / CTR',
        interpretation: 'The effective cost to acquire someone who actually clicks your links. Accounts for engagement quality.',
        dataSource: 'Derived from CPU and click rates',
        goodRange: 'Lower than revenue per clicker',
        actionIfLow: 'Improve click rates or reduce acquisition costs.',
        icon: 'credit-card',
        calculation: [
          'Take CPU (cost per user)',
          'Divide by CTR expressed as decimal (e.g., 3% = 0.03)',
          'Example: $0.50 CPU / 0.03 CTR = $16.67 per clicker',
          'This shows true cost of an engaged subscriber'
        ]
      },
      {
        name: 'Revenue per Clicker',
        formula: 'Total Newsletter Revenue / Unique Clickers',
        mathFormula: 'RPC = Revenue / Unique_Clickers',
        interpretation: 'How much revenue each clicking subscriber generates. Should exceed cost per clicker for profitability.',
        dataSource: 'Mediavine/ad revenue / unique clickers',
        goodRange: '> Cost per Clicker',
        actionIfLow: 'Improve ad placement, increase pageviews per click, or negotiate better RPMs.',
        icon: 'trending-up',
        calculation: [
          'Sum all newsletter-attributed revenue',
          'Count unique clickers from newsletters',
          'Divide revenue by clickers',
          'Compare to Cost per Clicker for unit economics'
        ]
      },
      {
        name: 'ROI (Return on Investment)',
        formula: '((Revenue - Cost) / Cost) × 100',
        mathFormula: 'ROI = ((Revenue - Cost) / Cost) × 100%',
        interpretation: 'Return on investment for your newsletter operations. Positive ROI means you\'re profitable.',
        dataSource: 'Calculated from total revenue and total costs',
        goodRange: '> 0% (profitable)',
        actionIfLow: 'Reduce costs or increase revenue per subscriber.',
        icon: 'percent',
        calculation: [
          'Calculate total revenue from newsletters',
          'Calculate total costs (tools, ads, time)',
          'Subtract costs from revenue for profit',
          'Divide profit by costs',
          'Multiply by 100 for percentage'
        ]
      },
      {
        name: 'RPM (Revenue per Mille)',
        formula: '(Total Revenue / Total Recipients) × 1000',
        mathFormula: 'RPM = (Revenue / Recipients) × 1000',
        interpretation: 'Revenue generated per 1,000 newsletter recipients. Standard industry metric for monetization efficiency.',
        dataSource: 'Revenue / recipients × 1000',
        goodRange: '$2-5 for ad-supported newsletters',
        actionIfLow: 'Improve ad placement, content quality, or audience targeting.',
        icon: 'bar-chart',
        calculation: [
          'Take total revenue for period',
          'Divide by total recipients (emails sent)',
          'Multiply by 1000',
          'Example: $500 / 100,000 recipients × 1000 = $5 RPM'
        ]
      }
    ]
  },
  content: {
    title: 'Content Performance Metrics',
    description: 'Metrics that help identify winning content patterns and optimize future sends.',
    metrics: [
      {
        name: 'Entity Performance Score',
        formula: 'Weighted average of open rate, CTR, and traffic contribution',
        mathFormula: 'Score = (OR × 0.3) + (CTR × 0.3) + (Traffic_Share × 0.4)',
        interpretation: 'Shows which topics, people, or brands consistently perform well in your newsletters.',
        dataSource: 'Extracted from Post Titles and Article Slugs, aggregated by entity',
        goodRange: 'Identify top 3-5 consistent performers',
        actionIfLow: 'Reduce coverage of underperforming entities.',
        icon: 'tag',
        calculation: [
          'Extract entity names from content (titles, URLs)',
          'Group all posts by entity',
          'Calculate average OR, CTR for each entity',
          'Apply weighted formula to get composite score',
          'Rank entities by score'
        ]
      },
      {
        name: 'Trend Score',
        formula: 'Linear regression slope of performance over time',
        mathFormula: 'Trend = Σ(x-x̄)(y-ȳ) / Σ(x-x̄)²',
        interpretation: 'Positive score = improving performance, Negative = declining. Helps identify rising stars vs fading topics.',
        dataSource: 'Calculated from historical performance data',
        goodRange: 'Positive trend score',
        actionIfLow: 'Consider retiring declining topics.',
        icon: 'trending-up',
        calculation: [
          'Plot performance over time (x = date, y = metric)',
          'Calculate linear regression slope',
          'Positive slope = improving trend',
          'Negative slope = declining trend',
          'Magnitude indicates rate of change'
        ]
      },
      {
        name: 'Longevity Index',
        formula: 'Days with above-average performance',
        mathFormula: 'Longevity = COUNT(days WHERE performance > average)',
        interpretation: 'How long a topic/entity maintains strong performance. Higher = more sustainable content.',
        dataSource: 'Calculated from daily performance data',
        goodRange: '> 30 days',
        actionIfLow: 'Topic may be a "flash in the pan" - use while hot but don\'t over-rely.',
        icon: 'clock',
        calculation: [
          'Calculate overall average performance',
          'Count days where entity performed above average',
          'Higher count = more consistent performer',
          'Low count = possibly trend-driven, not evergreen'
        ]
      },
      {
        name: 'Top Articles by Clicks',
        formula: 'Ranked by total clicks to article URL',
        mathFormula: 'Rank by DESC(total_clicks)',
        interpretation: 'Which specific articles drove the most traffic from newsletters.',
        dataSource: 'URL Clicks data from Beehiiv',
        goodRange: 'Top articles should align with content strategy',
        actionIfLow: 'Analyze what makes top performers successful.',
        icon: 'external-link',
        calculation: [
          'Extract all article URLs from click data',
          'Sum clicks per unique URL',
          'Sort by total clicks descending',
          'Identify patterns in top performers'
        ]
      }
    ]
  },
  dataFlow: {
    title: 'Data Flow & Sources',
    description: 'Understanding where data comes from and how it flows through the system.',
    metrics: [
      {
        name: 'Beehiiv API Integration',
        formula: 'Primary data source for all newsletter metrics',
        mathFormula: 'N/A - Data Pipeline',
        interpretation: 'All newsletter data (posts, subscribers, clicks) is fetched from Beehiiv\'s API and cached locally.',
        dataSource: 'Beehiiv REST API v2',
        goodRange: 'Data should refresh every 6 hours',
        actionIfLow: 'Check API connection and refresh manually if needed.',
        icon: 'database',
        calculation: [
          '1. Backend server queries Beehiiv API',
          '2. Data is normalized to consistent format',
          '3. Cached in memory with 6-hour TTL',
          '4. Frontend requests data via /api/data endpoint',
          '5. Manual refresh available via /api/refresh'
        ]
      },
      {
        name: 'Publications Data',
        formula: 'List of all newsletters/publications',
        mathFormula: 'N/A - Entity Data',
        interpretation: 'Each publication (e.g., "Inquisitr", "Lifestyle") has its own subscriber list and post history.',
        dataSource: 'Beehiiv API - /publications endpoint',
        goodRange: 'All publications should be visible',
        actionIfLow: 'Verify API key has access to all publications.',
        icon: 'book',
        calculation: [
          'Fetched on initial load',
          'Used to filter data by source',
          'Each publication has unique ID',
          'Dropdown shows "All Publications" + individual pubs'
        ]
      },
      {
        name: 'Posts/Sends Data',
        formula: 'Individual newsletter sends with engagement metrics',
        mathFormula: 'N/A - Time Series Data',
        interpretation: 'Each row represents one newsletter send with recipients, opens, clicks, etc.',
        dataSource: 'Beehiiv API - /posts endpoint',
        goodRange: 'Should show all sent newsletters',
        actionIfLow: 'Check date range filters.',
        icon: 'mail',
        calculation: [
          'Includes: Title, Publish Date, Recipients',
          'Delivered, Opens, Unique Opens',
          'Clicks, Unique Clicks, Unsubscribes',
          'Article Clicks (nested data)',
          'Filtered by date range and publication'
        ]
      },
      {
        name: 'Subscribers Data',
        formula: 'Individual subscriber records with metadata',
        mathFormula: 'N/A - Entity Data',
        interpretation: 'Each subscriber has status, join date, UTM source, and engagement metrics.',
        dataSource: 'Beehiiv API - /subscriptions endpoint',
        goodRange: 'Should match Beehiiv dashboard counts',
        actionIfLow: 'API may have pagination limits - check total count.',
        icon: 'users',
        calculation: [
          'Includes: Status (active/inactive)',
          'Subscribe Date, UTM Source',
          'Open Rate, Click Rate per subscriber',
          'Engagement Tier classification',
          'Used for growth tracking and segmentation'
        ]
      }
    ]
  }
};

// Icon components
const Icons = {
  users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  'trending-up': () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  'mail-open': () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z" />
      <path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10" />
    </svg>
  ),
  'external-link': () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
  'mouse-pointer': () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  ),
  target: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  calendar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  activity: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  'dollar-sign': () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  'credit-card': () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  percent: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  ),
  'bar-chart': () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  tag: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  clock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  database: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  book: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  mail: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
};

function MetricCard({ metric }) {
  const [expanded, setExpanded] = useState(false);
  const IconComponent = Icons[metric.icon] || Icons.activity;

  return (
    <div className={`help-metric-card ${expanded ? 'expanded' : ''}`} onClick={() => setExpanded(!expanded)}>
      <div className="help-metric-header">
        <div className="help-metric-icon">
          <IconComponent />
        </div>
        <div className="help-metric-info">
          <h4>{metric.name}</h4>
          <p className="help-metric-formula">{metric.formula}</p>
        </div>
        <div className="help-metric-expand">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="help-metric-details">
          {metric.mathFormula && (
            <div className="help-detail-row">
              <span className="help-detail-label">Mathematical Formula</span>
              <code className="help-math-formula">{metric.mathFormula}</code>
            </div>
          )}
          <div className="help-detail-row">
            <span className="help-detail-label">Interpretation</span>
            <p>{metric.interpretation}</p>
          </div>
          <div className="help-detail-row">
            <span className="help-detail-label">Data Source</span>
            <p>{metric.dataSource}</p>
          </div>
          <div className="help-detail-row">
            <span className="help-detail-label">Good Range / Target</span>
            <p className="help-good-range">{metric.goodRange}</p>
          </div>
          {metric.calculation && (
            <div className="help-detail-row">
              <span className="help-detail-label">Calculation Steps</span>
              <ol className="help-calculation-steps">
                {metric.calculation.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          )}
          <div className="help-detail-row">
            <span className="help-detail-label">If Below Target</span>
            <p className="help-action">{metric.actionIfLow}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CategorySection({ category }) {
  return (
    <div className="help-category">
      <div className="help-category-header">
        <h3>{category.title}</h3>
        <p>{category.description}</p>
      </div>
      <div className="help-metrics-list">
        {category.metrics.map((metric, idx) => (
          <MetricCard key={idx} metric={metric} />
        ))}
      </div>
    </div>
  );
}

export default function HelpGuidePage() {
  const [activeCategory, setActiveCategory] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = Object.keys(METRIC_DEFINITIONS);

  const filteredCategory = searchQuery
    ? {
        title: 'Search Results',
        description: `Metrics matching "${searchQuery}"`,
        metrics: Object.values(METRIC_DEFINITIONS)
          .flatMap(cat => cat.metrics)
          .filter(m =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.interpretation.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.formula.toLowerCase().includes(searchQuery.toLowerCase())
          )
      }
    : METRIC_DEFINITIONS[activeCategory];

  return (
    <main className="dashboard-main help-page">
      <div className="help-header">
        <div>
          <h1>Metrics Guide & Documentation</h1>
          <p>Comprehensive documentation of formulas, calculations, data sources, and methodology</p>
        </div>
        <div className="help-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search metrics, formulas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="help-search-clear" onClick={() => setSearchQuery('')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {!searchQuery && (
        <div className="help-category-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`help-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {METRIC_DEFINITIONS[cat].title.replace(' Metrics', '')}
            </button>
          ))}
        </div>
      )}

      <CategorySection category={filteredCategory} />

      {/* Comprehensive Formula Reference */}
      <section className="help-quick-ref">
        <h3>Complete Formula Reference</h3>
        <div className="help-formula-grid">
          <div className="help-formula-card">
            <span className="help-formula-name">Open Rate (OR)</span>
            <code>(Unique Opens / Delivered) × 100</code>
            <span className="help-formula-benchmark">Benchmark: 22%</span>
          </div>
          <div className="help-formula-card">
            <span className="help-formula-name">Click-Through Rate (CTR)</span>
            <code>(Unique Clicks / Delivered) × 100</code>
            <span className="help-formula-benchmark">Benchmark: 2.5%</span>
          </div>
          <div className="help-formula-card">
            <span className="help-formula-name">Click-to-Open Rate (CTOR)</span>
            <code>(Clicks / Opens) × 100</code>
            <span className="help-formula-benchmark">Benchmark: 9%</span>
          </div>
          <div className="help-formula-card">
            <span className="help-formula-name">Growth Rate</span>
            <code>((New - Old) / Old) × 100</code>
            <span className="help-formula-benchmark">Target: Positive</span>
          </div>
          <div className="help-formula-card">
            <span className="help-formula-name">Required Daily Growth</span>
            <code>(Target - Current) / Days Left</code>
            <span className="help-formula-benchmark">Compare to actual</span>
          </div>
          <div className="help-formula-card">
            <span className="help-formula-name">Projected Value</span>
            <code>Current + (Daily Rate × Days)</code>
            <span className="help-formula-benchmark">Should reach target</span>
          </div>
          <div className="help-formula-card">
            <span className="help-formula-name">CPU (Cost per User)</span>
            <code>Total Spend / New Subscribers</code>
            <span className="help-formula-benchmark">Target: &lt; $0.50</span>
          </div>
          <div className="help-formula-card">
            <span className="help-formula-name">ROI</span>
            <code>((Revenue - Cost) / Cost) × 100</code>
            <span className="help-formula-benchmark">Target: &gt; 0%</span>
          </div>
          <div className="help-formula-card">
            <span className="help-formula-name">RPM</span>
            <code>(Revenue / Recipients) × 1000</code>
            <span className="help-formula-benchmark">Target: $2-5</span>
          </div>
        </div>
      </section>

      {/* Understanding Distance-to-Target */}
      <section className="help-targets-section">
        <h3>Understanding Distance-to-Target</h3>
        <div className="help-targets-content">
          <p>
            <strong>Important:</strong> For percentage-based goals like Open Rate (target: 35%),
            we measure <em>distance to target</em> in percentage points, not percent complete.
          </p>
          <div className="help-example-box">
            <div className="help-example-title">Example: Open Rate Tracking</div>
            <ul>
              <li><strong>Target:</strong> 35%</li>
              <li><strong>Current:</strong> 25%</li>
              <li><strong>Distance to Target:</strong> 10 percentage points</li>
              <li><strong>Days Remaining:</strong> 60 days</li>
              <li><strong>Required Daily Improvement:</strong> 0.167 pts/day</li>
            </ul>
            <p className="help-example-note">
              Showing "71% complete" would be misleading because a 10-point gap requires
              fundamentally different strategies than a subscriber count gap.
            </p>
          </div>
        </div>
      </section>

      {/* Projection Methodology */}
      <section className="help-methodology-section">
        <h3>Projection Methodology</h3>
        <div className="help-methodology-content">
          <div className="help-methodology-card">
            <h4>Linear Projection Model</h4>
            <p>We use a linear projection model to estimate future values:</p>
            <code>Projected = Current + (Daily Growth Rate × Days Remaining)</code>
            <p className="help-methodology-note">
              This assumes growth continues at the same rate observed in the recent period.
            </p>
          </div>

          <div className="help-methodology-card">
            <h4>Key Assumptions</h4>
            <ul>
              <li>Growth rate remains constant (linear projection)</li>
              <li>No major external factors affect trajectory</li>
              <li>Historical data is representative of future performance</li>
              <li>Seasonal variations are not explicitly modeled</li>
            </ul>
          </div>

          <div className="help-methodology-card">
            <h4>Limitations</h4>
            <ul>
              <li>Does not account for seasonality or market changes</li>
              <li>Assumes all else remains equal</li>
              <li>May overestimate or underestimate based on recent anomalies</li>
              <li>Best used as directional guidance, not precise prediction</li>
            </ul>
          </div>

          <div className="help-methodology-card">
            <h4>Status Determination</h4>
            <ul>
              <li><strong className="status-on-track">ON TRACK:</strong> Projected value ≥ Target</li>
              <li><strong className="status-at-risk">AT RISK:</strong> Projected value is 80-100% of target</li>
              <li><strong className="status-behind">BEHIND:</strong> Projected value &lt; 80% of target</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Data Pipeline */}
      <section className="help-pipeline-section">
        <h3>Data Pipeline & Refresh</h3>
        <div className="help-pipeline-content">
          <div className="help-pipeline-step">
            <div className="help-pipeline-number">1</div>
            <div className="help-pipeline-info">
              <h4>Beehiiv API</h4>
              <p>Primary data source. Fetches posts, subscribers, and click data.</p>
            </div>
          </div>
          <div className="help-pipeline-arrow">→</div>
          <div className="help-pipeline-step">
            <div className="help-pipeline-number">2</div>
            <div className="help-pipeline-info">
              <h4>Backend Server</h4>
              <p>Normalizes data format, caches for 6 hours, handles rate limits.</p>
            </div>
          </div>
          <div className="help-pipeline-arrow">→</div>
          <div className="help-pipeline-step">
            <div className="help-pipeline-number">3</div>
            <div className="help-pipeline-info">
              <h4>Data Processing</h4>
              <p>Calculates metrics, aggregates by date/source, applies filters.</p>
            </div>
          </div>
          <div className="help-pipeline-arrow">→</div>
          <div className="help-pipeline-step">
            <div className="help-pipeline-number">4</div>
            <div className="help-pipeline-info">
              <h4>Dashboard</h4>
              <p>Displays visualizations, enables filtering, exports data.</p>
            </div>
          </div>
        </div>
        <p className="help-pipeline-note">
          Data refreshes automatically every 6 hours. Click the refresh button to force an immediate update.
        </p>
      </section>
    </main>
  );
}
