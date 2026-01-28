# Newsletter Dashboard Refinement Prompt
## Inquisitr Newsletter Analytics Dashboard

---

## Context

The basic architecture for the newsletter dashboard is already set up. This prompt outlines refinements needed to transform it into a professional, production-ready analytics dashboard. The dashboard pulls data from Beehiiv API and integrates with GA4 and Mediavine for comprehensive analytics.

---

## Data Sources & Schema Reference

### Primary: Beehiiv API Data

| Sheet | Key Fields | Use Case |
|-------|------------|----------|
| **Publications** | `Active Subscribers`, `Avg Open Rate %`, `Avg Click Rate %`, `Total Sent`, `Total Opened`, `Total Clicked` | Overview KPIs |
| **Posts** | `Publish Date`, `Recipients`, `Delivered`, `Opens`, `Unique Opens`, `Open Rate %`, `Clicks`, `Unique Clicks`, `Click Rate %`, `Unsubscribes` | Send-level performance |
| **Article Clicks** | `Post Title`, `Article Slug`, `Email Clicks`, `Email Unique Clicks`, `Click Rate %` | Content performance |
| **URL Clicks** | `URL Category`, `Email CTR %`, `Total Clicks`, `Article Slug` | Click attribution |
| **Subscribers** | `Status`, `Subscribe Date`, `UTM Source`, `UTM Medium`, `Open Rate %`, `Click Rate %`, `Engagement Tier` | Growth & source tracking |
| **UTM Source Analysis** | `UTM Source`, `Subscriber Count`, `Active Count`, `Avg Open Rate %`, `% High Engagement`, `% Low Engagement` | Acquisition analysis |

### Secondary Sources
- **GA4**: Traffic attribution, session data, page-level analytics
- **Mediavine**: Revenue data, RPM metrics, ad performance

---

## Dashboard Architecture

### Section 1: Overview

**Purpose**: High-level health metrics at a glance

#### Metrics to Display

| Metric | Calculation Logic | Data Source |
|--------|-------------------|-------------|
| **Subscriber Count** | `SUM(Active Subscribers)` from Publications | Publications sheet |
| **Growth Rate** | `((Current Period Subs - Previous Period Subs) / Previous Period Subs) * 100` | Subscribers sheet (group by date) |
| **Open Rate** | `(Total Unique Opens / Total Delivered) * 100` | Posts sheet (aggregate) |
| **Traffic Sent** | `SUM(Total Clicks)` where clicks lead to site | URL Clicks (filter: URL Category = 'Article') |
| **CTOR** | `(Unique Clicks / Unique Opens) * 100` | Posts sheet |

#### Visualizations Required

1. **Subscriber Count Chart**
   - Type: Multi-line graph
   - X-axis: Date (clean format: "Jan 15", "Jan 16" for daily; "Week 1", "Week 2" for weekly)
   - Y-axis: Subscriber count
   - Lines: One line per UTM Source (direct, ml2, ml3, website, etc.)
   - Legend: Bottom, horizontal layout
   - Include net growth line (total)

2. **Growth Rate Chart**
   - Type: Dual-axis chart
   - Primary Y-axis: Absolute count (bar chart)
   - Secondary Y-axis: Percentage growth (line overlay)
   - X-axis: Time period based on filter
   - Show: New subs, churned subs, net growth

3. **Open Rate Trend**
   - Type: Line graph with area fill
   - X-axis: Date
   - Y-axis: Percentage (0-100%)
   - Benchmark line: Industry average (show as dashed line at 20-25%)
   - Color: Green when above benchmark, red when below

4. **Traffic Sent Summary**
   - Type: KPI card + sparkline
   - Show: Total clicks, clicks per send average
   - Trend indicator: Up/down arrow with percentage change

5. **CTOR Trend**
   - Type: Line graph
   - X-axis: Date
   - Y-axis: Percentage
   - Annotation: Target range (9-10%) as shaded band

---

### Section 2: Target Tracking

**Purpose**: Track progress toward Q1 2026 goals

#### Target Definitions (by March 31, 2026)

| Metric | Target | Current Baseline |
|--------|--------|------------------|
| Subscriber Count | 30,000 | Pull from `Active Subscribers` |
| Open Rate | 35-40% | Pull from `Avg Open Rate %` |
| CTR | 16-17% | Calculate from Posts data |
| CTOR | 9-10% | Calculate: `(Unique Clicks / Unique Opens) * 100` |

#### Target Achievement Logic

```
For each metric:
1. Calculate current value
2. Calculate required daily/weekly growth to hit target
3. Calculate actual growth rate (trailing 7/30 days)
4. Determine if on track:
   - ✅ ON TRACK: Actual growth >= Required growth
   - ⚠️ AT RISK: Actual growth within 80% of required
   - ❌ BEHIND: Actual growth < 80% of required
5. Calculate projected value at target date (linear projection)
6. Calculate gap: Target - Projected
```

#### Visualizations Required

1. **Progress Gauges**
   - Type: Radial gauge (one per metric)
   - Display: Current value, target, percentage complete
   - Color coding: Green (on track), Yellow (at risk), Red (behind)

2. **Trajectory Chart**
   - Type: Line graph with projection
   - Solid line: Historical data
   - Dashed line: Required trajectory to target
   - Dotted line: Projected trajectory (based on current trend)
   - Shaded area: Target range (for metrics with ranges like Open Rate 35-40%)

3. **Days Remaining Counter**
   - Type: KPI card
   - Show: Days until March 31, 2026
   - Sub-metrics: Required daily growth for each KPI

4. **Gap Analysis Table**
   - Columns: Metric | Current | Target | Gap | Daily Required | Status
   - Sortable by gap severity

---

### Section 3: Unit Economics

**Purpose**: Understand cost efficiency and revenue generation

#### Metrics & Calculations

| Metric | Formula | Notes |
|--------|---------|-------|
| **Cost per User (CPU)** | `Total Acquisition Spend / New Subscribers` | Input: Manual or API |
| **% Users → Clickers** | `(Users with Click Rate > 0 / Total Users) * 100` | From Subscribers sheet |
| **Cost per Clicker** | `CPU / (% Users → Clickers / 100)` | Derived |
| **Monthly Avg Clicks** | `SUM(Total Clicks) / Months in Range` | From URL Clicks |
| **Avg Clicks per Clicker** | `Total Clicks / Count of Clickers` | 30-day window |
| **Clicker Retention (30-day)** | `(Clickers Active Day 30 / Clickers Day 1) * 100` | Cohort analysis |
| **New Clickers Added** | `COUNT(First Click Date = Current Month)` | Track first-click events |
| **Retained vs Dropped** | Compare month-over-month clicker counts | Show as waterfall |
| **Revenue per Clicker** | `Total Newsletter Revenue / Unique Clickers` | Mediavine data |
| **Revenue per Click** | `Total Newsletter Revenue / Total Clicks` | Mediavine data |
| **RPM (Newsletter)** | `(Total Revenue / Total Recipients) * 1000` | Per 1,000 users |
| **User → Clicker Funnel** | Subscriber → Opener → Clicker → Revenue | Conversion at each step |
| **Input vs Output Mapping** | CPU vs Revenue per User | Break-even analysis |

#### Visualizations Required

1. **Unit Economics Summary Cards**
   - Row of KPI cards for core metrics
   - Each card: Value, trend arrow, period comparison
   - Color coding for healthy/unhealthy thresholds

2. **Acquisition Funnel**
   - Type: Funnel chart
   - Stages: Subscribers → Openers → Clickers → Revenue Contributors
   - Show: Count and conversion % at each stage

3. **Clicker Cohort Analysis**
   - Type: Heatmap or cohort table
   - Rows: Acquisition week
   - Columns: Weeks since signup
   - Values: % still clicking

4. **Retention Waterfall**
   - Type: Waterfall chart
   - Show: Starting clickers → New → Retained → Churned → Ending

5. **Cost vs Revenue Scatter**
   - Type: Scatter plot
   - X-axis: Cost per user (by source)
   - Y-axis: Revenue per user (by source)
   - Quadrant lines: Show break-even threshold

6. **RPM Trend**
   - Type: Line chart
   - Show newsletter-level RPM over time
   - Overlay: Rep content RPM vs Media RPM breakdown

---

### Section 4: Content Performance

**Purpose**: Identify winning content patterns and optimize future sends

#### Analysis Dimensions

1. **Content Type Performance**
   - Categorize by: Entity (person/brand), Event type, Subject line pattern
   - Metrics: Open rate, CTR, CTOR per category

2. **Entity/Event Tracking**
   - Extract entities from `Post Title` and `Article Slug`
   - Track performance over time per entity
   - Identify: Short-lived spikes vs sustained performers

3. **Subject Line Analysis**
   - Pattern recognition: Questions, numbers, names, urgency words
   - A/B test tracking (if applicable)
   - Character length correlation with open rate

#### Metrics & Calculations

| Metric | Calculation |
|--------|-------------|
| **Avg Open Rate by Entity** | Group by extracted entity, calculate mean open rate |
| **Avg CTR by Content Type** | Group by content category, calculate mean CTR |
| **Trend Score** | Linear regression slope of performance over time |
| **Longevity Index** | Days with above-average performance |
| **Velocity** | Rate of performance change (acceleration/deceleration) |

#### Visualizations Required

1. **Top Performers Table**
   - Columns: Content/Entity | Sends | Avg Open Rate | Avg CTR | CTOR | Trend
   - Sortable by any column
   - Sparkline in trend column
   - Pagination: 10/25/50 rows

2. **Performance Heatmap**
   - Rows: Content categories/entities
   - Columns: Time periods (weeks/months)
   - Color: Performance intensity

3. **Trend Classification**
   - Type: Scatter plot
   - X-axis: Longevity (days active)
   - Y-axis: Peak performance
   - Bubble size: Total sends
   - Color: Trend direction (growing/declining)
   - Quadrants: "Flash in pan", "Rising star", "Consistent performer", "Declining"

4. **Subject Line Analysis**
   - Type: Bar chart
   - Compare: Open rates by subject line pattern
   - Include: Character count distribution vs open rate

5. **Send Time Analysis**
   - Type: Heatmap
   - Rows: Day of week
   - Columns: Hour of day
   - Color: Performance metric (configurable)

---

## Global Design Specifications

### Time Filters (Apply to All Sections)

Implement a unified filter bar with the following options:

| Filter Type | Options |
|-------------|---------|
| **Preset Ranges** | Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Last Month |
| **Relative** | Month to Date (MTD), Year to Date (YTD) |
| **Granularity** | Day, Week, Month |
| **Custom** | Date picker with start/end selection |

**Filter Behavior**:
- Filters persist across tab navigation
- URL params update with filter state (shareable links)
- Default: Last 30 Days, Daily granularity

### Chart Standards

#### Axis Formatting

| Element | Specification |
|---------|---------------|
| **Date (Daily)** | "Jan 15" format, show every 5th label if >15 points |
| **Date (Weekly)** | "Jan 6-12" or "Week 2" |
| **Date (Monthly)** | "Jan 2026" or "Jan '26" |
| **Percentages** | One decimal place, include % symbol |
| **Large Numbers** | Use K/M suffixes (10.5K, 1.2M) |
| **Currency** | $X.XX format |

#### Visual Styling

```
Colors:
- Primary: #2563EB (Blue)
- Success: #10B981 (Green)  
- Warning: #F59E0B (Amber)
- Danger: #EF4444 (Red)
- Neutral: #6B7280 (Gray)

Typography:
- Headers: Inter/System, 600 weight
- Body: Inter/System, 400 weight
- Numbers: Tabular figures enabled

Spacing:
- Card padding: 24px
- Grid gap: 16px
- Section margin: 32px

Charts:
- Grid lines: Light gray (#E5E7EB), dashed
- Tooltip: White background, subtle shadow
- Legend: Below chart, horizontal
- Responsive breakpoints: 640px, 1024px, 1280px
```

### Layout Grid

```
Desktop (≥1280px):
├── Overview: 2x2 grid of metric cards + 2 charts below
├── Target: Full-width gauges row + trajectory chart
├── Unit Economics: 3-column metric cards + 2x2 chart grid
└── Content: Full-width table + 2-column charts

Tablet (768-1279px):
├── 2-column layout
└── Charts stack vertically

Mobile (<768px):
├── Single column
└── Horizontal scroll for tables
```

### Interactivity

1. **Tooltips**: Show detailed values on hover
2. **Click-through**: Charts link to filtered detail views
3. **Export**: CSV/PNG export buttons on each chart
4. **Drill-down**: Click entity → show all sends featuring it

---

## Known Issues to Address

1. **Traffic Per Send Error**: Review calculation logic
   - Current issue: Verify if counting total clicks or unique clicks
   - Fix: Ensure using `Email Unique Clicks` for accurate traffic attribution

2. **Source Attribution Gaps**: Some subscribers have null UTM Source
   - Solution: Create "Unknown" category, investigate signup flow

---

## Implementation Priority

| Priority | Section | Components |
|----------|---------|------------|
| P0 | Global | Time filter implementation |
| P0 | Overview | All 5 core metrics + charts |
| P1 | Target | Gauge components + trajectory |
| P1 | Content | Top performers table |
| P2 | Unit Economics | Core metrics + funnel |
| P2 | Content | Trend analysis charts |
| P3 | Unit Economics | Cohort analysis |
| P3 | Content | Subject line analysis |

---

## Acceptance Criteria

- [ ] All time filters functional across all sections
- [ ] Charts render cleanly with proper axis labels (no overlapping dates)
- [ ] Mobile responsive down to 375px width
- [ ] Loading states for data fetching
- [ ] Empty states for no-data scenarios
- [ ] Error handling with user-friendly messages
- [ ] Export functionality on all data tables
- [ ] Target tracking shows real-time gap analysis
- [ ] Unit economics integrates with Mediavine revenue data
- [ ] Content performance identifies top 3 trending entities

---

## Notes

- LTV calculation intentionally postponed (insufficient data history)
- Revenue data requires Mediavine API integration
- Consider caching strategy for heavy aggregate queries
- Plan for real-time vs daily refresh cadence per metric