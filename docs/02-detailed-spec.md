Critical Issues to Fix:
The current implementation has fundamental layout problems: inconsistent card heights, improper use of CSS units, no responsive grid system, cramped spacing, and poor visual hierarchy. Rebuild from scratch using a proper design system.

1. Base Layout & Design System
css/* Design Tokens - Use these consistently */
:root {
  /* Colors */
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  
  /* Accent Colors for Metrics */
  --accent-blue: #3b82f6;
  --accent-green: #10b981;
  --accent-purple: #8b5cf6;
  --accent-amber: #f59e0b;
  --accent-rose: #f43f5e;
  
  /* Semantic */
  --positive: #10b981;
  --negative: #ef4444;
  
  /* Spacing Scale */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05);
}

2. Page Structure (Use CSS Grid)
jsx// Main layout structure
<div className="dashboard-container">
  <Header />
  <main className="dashboard-main">
    <FilterBar />
    <MetricsGrid />      {/* 5 equal columns */}
    <ChartsSection />    {/* 3 equal columns */}
    <TrendingSection />  {/* New: Entities/Events */}
    <TablesSection />    {/* 2 columns */}
  </main>
</div>
css.dashboard-container {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: var(--space-lg);
}

.dashboard-main {
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* Metrics Grid - MUST be equal width */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-md);
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

/* Tables Grid */
.tables-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-md);
}

/* Responsive */
@media (max-width: 1400px) {
  .metrics-grid { grid-template-columns: repeat(3, 1fr); }
  .charts-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 900px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-grid { grid-template-columns: 1fr; }
  .tables-grid { grid-template-columns: 1fr; }
}

3. Metric Card Component (Clickable with Expand)
Each metric card should be clickable and expand to show detailed breakdown.
jsxconst MetricCard = ({ 
  title, 
  value, 
  change, 
  changeLabel,
  sparklineData,
  accentColor,
  icon,
  onClick,
  isExpanded,
  detailData 
}) => {
  return (
    <div 
      className={`metric-card ${isExpanded ? 'expanded' : ''}`}
      onClick={onClick}
      style={{ '--accent': accentColor }}
    >
      <div className="metric-card-header">
        <div className="metric-icon">{icon}</div>
        <span className="metric-title">{title}</span>
        <ChevronIcon className={`expand-icon ${isExpanded ? 'rotated' : ''}`} />
      </div>
      
      <div className="metric-value">{value}</div>
      
      <div className="metric-footer">
        <span className={`metric-change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)} pts
        </span>
        <span className="metric-label">{changeLabel}</span>
      </div>
      
      <div className="metric-sparkline">
        <Sparkline data={sparklineData} color={accentColor} />
      </div>
      
      {/* Expanded Detail Panel */}
      {isExpanded && (
        <div className="metric-detail-panel">
          <div className="detail-chart">
            {/* Full chart with comparison */}
          </div>
          <div className="detail-breakdown">
            {/* Breakdown by segment */}
          </div>
          <div className="detail-insights">
            {/* AI-generated insights */}
          </div>
        </div>
      )}
    </div>
  );
};
css.metric-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
  
  /* Subtle gradient accent */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--accent);
  }
}

.metric-card:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--accent);
  transform: translateY(-2px);
}

.metric-card.expanded {
  grid-column: span 2;
  grid-row: span 2;
}

.metric-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.metric-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  flex: 1;
}

.metric-value {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: var(--space-sm);
}

.metric-change {
  font-size: 13px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.metric-change.positive {
  color: var(--positive);
  background: rgba(16, 185, 129, 0.1);
}

.metric-change.negative {
  color: var(--negative);
  background: rgba(239, 68, 68, 0.1);
}

.metric-sparkline {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  opacity: 0.3;
}

/* Expanded Panel */
.metric-detail-panel {
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--bg-tertiary);
  display: grid;
  gap: var(--space-md);
}

4. NEW: Trending Section (Entities, Events, Topics)
Add a new section that shows trending entities extracted from newsletter content:
jsxconst TrendingSection = ({ timeFilter, data }) => {
  const [activeTab, setActiveTab] = useState('entities');
  
  return (
    <section className="trending-section">
      <div className="section-header">
        <h2>Trending This {timeFilter}</h2>
        <div className="tab-switcher">
          <button 
            className={activeTab === 'entities' ? 'active' : ''}
            onClick={() => setActiveTab('entities')}
          >
            People & Orgs
          </button>
          <button 
            className={activeTab === 'topics' ? 'active' : ''}
            onClick={() => setActiveTab('topics')}
          >
            Topics
          </button>
          <button 
            className={activeTab === 'events' ? 'active' : ''}
            onClick={() => setActiveTab('events')}
          >
            Events
          </button>
        </div>
      </div>
      
      <div className="trending-grid">
        {activeTab === 'entities' && (
          <EntityCloud entities={data.entities} />
        )}
        {activeTab === 'topics' && (
          <TopicBubbles topics={data.topics} />
        )}
        {activeTab === 'events' && (
          <EventTimeline events={data.events} />
        )}
      </div>
      
      {/* Correlation with performance */}
      <div className="trending-insights">
        <h3>Performance Correlation</h3>
        <div className="insight-cards">
          {data.insights.map(insight => (
            <InsightCard key={insight.id} {...insight} />
          ))}
        </div>
      </div>
    </section>
  );
};

// Entity display component
const EntityCloud = ({ entities }) => (
  <div className="entity-cloud">
    {entities.map(entity => (
      <div 
        key={entity.name}
        className="entity-pill"
        style={{
          '--size': entity.frequency,
          '--performance': entity.avgOpenRate > 25 ? 'high' : 'normal'
        }}
      >
        <span className="entity-name">{entity.name}</span>
        <span className="entity-stats">
          {entity.mentions} mentions • {entity.avgOpenRate}% avg open
        </span>
      </div>
    ))}
  </div>
);
css.trending-section {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-md);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.tab-switcher {
  display: flex;
  gap: var(--space-xs);
  background: var(--bg-tertiary);
  padding: 4px;
  border-radius: var(--radius-md);
}

.tab-switcher button {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-switcher button.active {
  background: var(--bg-secondary);
  color: var(--text-primary);
  box-shadow: var(--shadow-sm);
}

.entity-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.entity-pill {
  display: flex;
  flex-direction: column;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  transition: all 0.2s;
}

.entity-pill:hover {
  border-color: var(--accent-blue);
  background: white;
}

.entity-pill[style*="--performance: high"] {
  border-color: var(--positive);
  background: rgba(16, 185, 129, 0.05);
}

.entity-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.entity-stats {
  font-size: 11px;
  color: var(--text-muted);
}

5. Comparison Feature Implementation
jsxconst ComparisonSelector = ({ value, onChange }) => {
  const options = [
    { value: 'none', label: 'No Comparison' },
    { value: 'prev_day', label: 'vs Previous Day' },
    { value: 'prev_week', label: 'vs Previous Week' },
    { value: 'prev_month', label: 'vs Previous Month' },
    { value: 'prev_year', label: 'vs Same Period Last Year' },
  ];
  
  return (
    <Select 
      value={value} 
      onChange={onChange}
      options={options}
      className="comparison-select"
    />
  );
};

// Chart with comparison overlay
const TrendChart = ({ data, comparisonData, metric }) => {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={getMetricColor(metric)} stopOpacity={0.2} />
            <stop offset="100%" stopColor={getMetricColor(metric)} stopOpacity={0} />
          </linearGradient>
        </defs>
        
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false}
          tick={{ fontSize: 12, fill: '#94a3b8' }}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false}
          tick={{ fontSize: 12, fill: '#94a3b8' }}
          tickFormatter={(v) => `${v}%`}
        />
        
        {/* Comparison line (dashed) */}
        {comparisonData && (
          <Line
            data={comparisonData}
            type="monotone"
            dataKey="value"
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        )}
        
        {/* Current period */}
        <Area
          type="monotone"
          dataKey="value"
          stroke={getMetricColor(metric)}
          strokeWidth={2}
          fill={`url(#gradient-${metric})`}
        />
        
        <Tooltip content={<CustomTooltip comparison={comparisonData} />} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

6. Top Articles/Posts Table (Improved)
jsxconst TopPerformersTable = ({ 
  data, 
  type, 
  sortBy, 
  onSort, 
  timeFilter 
}) => {
  return (
    <div className="table-card">
      <div className="table-header">
        <div className="table-title">
          <h3>Top {type === 'articles' ? 'Articles' : 'Posts'}</h3>
          <span className="table-subtitle">
            By {type === 'articles' ? 'total clicks' : 'open rate'} • {timeFilter}
          </span>
        </div>
        <div className="table-actions">
          <button className="btn-icon"><FilterIcon /></button>
          <button className="btn-icon"><DownloadIcon /></button>
        </div>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th className="col-rank">#</th>
              <th className="col-title" onClick={() => onSort('title')}>
                {type === 'articles' ? 'Article' : 'Post'}
                <SortIcon active={sortBy === 'title'} />
              </th>
              <th className="col-date" onClick={() => onSort('date')}>
                Date
                <SortIcon active={sortBy === 'date'} />
              </th>
              {type === 'posts' && (
                <th className="col-recipients" onClick={() => onSort('recipients')}>
                  Recipients
                  <SortIcon active={sortBy === 'recipients'} />
                </th>
              )}
              <th className="col-metric" onClick={() => onSort('metric')}>
                {type === 'articles' ? 'Clicks' : 'Open Rate'}
                <SortIcon active={sortBy === 'metric'} />
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.id} className="table-row">
                <td className="col-rank">
                  <span className={`rank-badge rank-${index + 1}`}>
                    {index + 1}
                  </span>
                </td>
                <td className="col-title">
                  <div className="title-cell">
                    <span className="title-text" title={item.title}>
                      {item.title}
                    </span>
                    <a href={item.url} className="view-link" target="_blank">
                      <ExternalLinkIcon />
                    </a>
                  </div>
                </td>
                <td className="col-date">{formatDate(item.date)}</td>
                {type === 'posts' && (
                  <td className="col-recipients">
                    {formatNumber(item.recipients)}
                  </td>
                )}
                <td className="col-metric">
                  <span className="metric-value-cell">
                    {type === 'articles' 
                      ? formatNumber(item.clicks)
                      : `${item.openRate}%`
                    }
                  </span>
                  {item.trend && (
                    <span className={`trend-indicator ${item.trend > 0 ? 'up' : 'down'}`}>
                      {item.trend > 0 ? '↑' : '↓'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {data.length > 10 && (
        <div className="table-footer">
          <button className="btn-text">View All →</button>
        </div>
      )}
    </div>
  );
};
css.table-card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--bg-tertiary);
}

.table-title h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.table-subtitle {
  font-size: 12px;
  color: var(--text-muted);
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: var(--bg-tertiary);
}

th {
  padding: var(--space-sm) var(--space-md);
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

th:hover {
  color: var(--text-primary);
}

td {
  padding: var(--space-md);
  border-bottom: 1px solid var(--bg-tertiary);
  font-size: 14px;
  color: var(--text-primary);
}

.table-row:hover {
  background: var(--bg-tertiary);
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.rank-badge.rank-1 { background: #fef3c7; color: #d97706; }
.rank-badge.rank-2 { background: #e5e7eb; color: #6b7280; }
.rank-badge.rank-3 { background: #fed7aa; color: #c2410c; }

.title-cell {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  max-width: 300px;
}

.title-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.view-link {
  opacity: 0;
  color: var(--accent-blue);
  transition: opacity 0.2s;
}

.table-row:hover .view-link {
  opacity: 1;
}

.metric-value-cell {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

7. Filter Bar (Fixed)
jsxconst FilterBar = ({ 
  publication, 
  setPublication,
  timeRange,
  setTimeRange,
  comparison,
  setComparison,
  dateDisplay,
  postCount
}) => {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <Select
          value={publication}
          onChange={setPublication}
          options={publicationOptions}
          className="filter-select"
          prefix={<PublicationIcon />}
        />
        
        <Select
          value={timeRange}
          onChange={setTimeRange}
          options={timeRangeOptions}
          className="filter-select"
          prefix={<CalendarIcon />}
        />
        
        <Select
          value={comparison}
          onChange={setComparison}
          options={comparisonOptions}
          className="filter-select"
          prefix={<CompareIcon />}
        />
      </div>
      
      <div className="filter-info">
        <span className="date-range">{dateDisplay}</span>
        <span className="post-count">{postCount} posts</span>
      </div>
    </div>
  );
};
css.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.filter-group {
  display: flex;
  gap: var(--space-sm);
}

.filter-select {
  min-width: 160px;
}

.filter-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.date-range {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.post-count {
  font-size: 13px;
  color: var(--text-muted);
  padding: 4px 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

8. Additional Requirements
State Management:
jsxconst [expandedMetric, setExpandedMetric] = useState(null);
const [comparison, setComparison] = useState('none');
const [timeRange, setTimeRange] = useState('last_30_days');
const [activeTab, setActiveTab] = useState('entities');

// Fetch data based on filters
useEffect(() => {
  fetchDashboardData({ timeRange, comparison });
}, [timeRange, comparison]);
Loading States:
jsxconst SkeletonCard = () => (
  <div className="metric-card skeleton">
    <div className="skeleton-line w-24 h-3" />
    <div className="skeleton-line w-32 h-10 mt-4" />
    <div className="skeleton-line w-20 h-4 mt-2" />
  </div>
);
Empty States:
jsxconst EmptyState = ({ message }) => (
  <div className="empty-state">
    <EmptyIcon />
    <p>{message}</p>
  </div>
);

Summary Checklist for Claude Code:

☐ Use CSS Grid with grid-template-columns: repeat(n, 1fr) for all grids
☐ All cards must have equal heights within their row
☐ Use design tokens (CSS variables) for all colors, spacing, radii
☐ Implement clickable metric cards that expand with detail view
☐ Add comparison selector with overlay on charts
☐ Create new Trending section with entities/topics/events tabs
☐ Fix table layout with proper column widths and hover states
☐ Add loading skeletons and empty states
☐ Ensure responsive breakpoints at 1400px and 900px
☐ No horizontal overflow - all content must fit viewport
☐ Minimum chart height: 280px
☐ Use font-variant-numeric: tabular-nums for all numbers