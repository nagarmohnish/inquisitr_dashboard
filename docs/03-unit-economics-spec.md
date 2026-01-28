Newsletter Unit Economics Dashboard - Data Architecture & Metrics Specification
Overview
Build a dashboard page for Inquisitr's Newsletter Unit Economics system. The dashboard tracks the full funnel from subscriber acquisition → engagement → clicks → revenue, with the goal of understanding the true ROI of newsletter operations.

1. DATA SOURCES & ENTITIES
1.1 Beehiiv (Newsletter Platform)
API: https://api.beehiiv.com/v2
Authentication: Bearer token

Entities:
├── Subscribers
│   ├── subscriber_id (unique identifier)
│   ├── email
│   ├── status (active/inactive/unsubscribed)
│   ├── source (custom field - acquisition channel)
│   ├── utm_source, utm_medium, utm_campaign
│   ├── created_at (subscription date)
│   ├── is_paid_acquisition (derived: true if source contains 'ml2' or 'ml3')
│   └── acquisition_cost (derived: $0.10 per paid subscriber)
│
├── Posts (Email Campaigns)
│   ├── post_id
│   ├── subject (email subject line)
│   ├── send_date
│   ├── recipients (total sent)
│   ├── delivered
│   ├── unique_opens
│   ├── unique_clicks
│   ├── open_rate (unique_opens / delivered)
│   └── ctr (unique_clicks / unique_opens) — this is CTOR
│
└── Clicks (URL-level click data)
    ├── post_id (foreign key to Posts)
    ├── url (clicked URL)
    ├── total_clicks
    ├── unique_clicks
    ├── click_date
    └── is_article_click (derived: true if inquisitr.com and not unsubscribe/preferences)
1.2 Mediavine (Ad Revenue)
API: Custom proxy endpoint
Data: Daily revenue attribution

Fields:
├── date
├── revenue (total site revenue for that day)
└── pageviews (total site pageviews)
1.3 GA4 (Traffic Attribution)
API: Google Analytics Data API
Filter: sessionSource = 'Beehiiv' AND sessionMedium = 'email'

Fields:
├── date
├── sessions (newsletter-attributed sessions)
└── pageviews (newsletter-attributed pageviews)
1.4 Revenue Attribution (Derived/Calculated)
Combines Mediavine + GA4 to attribute revenue to newsletter

Fields:
├── date
├── newsletter_sessions
├── newsletter_pageviews
├── total_revenue (from Mediavine)
├── newsletter_attributed_revenue = total_revenue × (newsletter_pageviews / total_pageviews)
└── rpm = (newsletter_attributed_revenue / newsletter_pageviews) × 1000

2. METRIC HIERARCHY & CALCULATIONS
2.1 ACQUISITION FUNNEL
┌─────────────────────────────────────────────────────────────────┐
│  ACQUISITION METRICS                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Total Active Subscribers                                       │
│  └── Count of subscribers WHERE status = 'active'               │
│                                                                 │
│  New Subscribers (period)                                       │
│  └── Count WHERE created_at >= period_start                     │
│                                                                 │
│  Paid Subscribers (period)                                      │
│  └── Count WHERE is_paid_acquisition = true AND in period       │
│                                                                 │
│  Organic Subscribers (period)                                   │
│  └── New Subscribers - Paid Subscribers                         │
│                                                                 │
│  Subscriber Growth Rate                                         │
│  └── (New Subscribers - Churned) / Previous Total × 100         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
2.2 COST METRICS
┌─────────────────────────────────────────────────────────────────┐
│  COST METRICS                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Fixed Costs:                                                   │
│  ├── Beehiiv Monthly: $109                                      │
│  └── Beehiiv Weekly: $109 / 4.33 = ~$25.17                      │
│                                                                 │
│  Variable Costs:                                                │
│  └── Paid Acquisition: $0.10 per paid subscriber                │
│                                                                 │
│  Acquisition Cost (period)                                      │
│  └── Paid Subscribers × $0.10                                   │
│                                                                 │
│  Total Cost (period)                                            │
│  └── Acquisition Cost + Beehiiv Fee (prorated)                  │
│                                                                 │
│  Cost per User (CPU)                                            │
│  └── Total Cost / New Subscribers                               │
│                                                                 │
│  Cost per Clicker                                               │
│  └── CPU / (% Users Becoming Clickers / 100)                    │
│  └── OR: Total Cost / Total Unique Clickers                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
2.3 ENGAGEMENT METRICS
┌─────────────────────────────────────────────────────────────────┐
│  ENGAGEMENT METRICS (Email Performance)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Posts Sent (period)                                            │
│  └── Count of posts WHERE send_date in period                   │
│                                                                 │
│  Emails Delivered (period)                                      │
│  └── SUM(delivered) for posts in period                         │
│                                                                 │
│  Open Rate (per post)                                           │
│  └── unique_opens / delivered × 100                             │
│                                                                 │
│  Avg Open Rate (period)                                         │
│  └── AVG(open_rate) for posts in period                         │
│                                                                 │
│  Click-to-Open Rate / CTOR (per post)                           │
│  └── unique_clicks / unique_opens × 100                         │
│                                                                 │
│  Avg CTOR (period)                                              │
│  └── AVG(ctr) for posts in period                               │
│                                                                 │
│  Click Rate / CTR (per post)                                    │
│  └── unique_clicks / delivered × 100                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
2.4 CLICKER METRICS (Key Conversion Stage)
┌─────────────────────────────────────────────────────────────────┐
│  CLICKER METRICS                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Definition: A "Clicker" is a subscriber who clicks through     │
│  to an article on the website from the newsletter               │
│                                                                 │
│  Total Unique Clickers (period)                                 │
│  └── SUM(unique_clicks) from posts in period                    │
│                                                                 │
│  % Users Becoming Clickers                                      │
│  └── Total Unique Clickers / Emails Delivered × 100             │
│                                                                 │
│  Total Article Clicks (period)                                  │
│  └── SUM(unique_clicks) from clicks WHERE is_article_click      │
│                                                                 │
│  Avg Clicks per Clicker                                         │
│  └── Total Article Clicks / Total Unique Clickers               │
│                                                                 │
│  Clicker Retention (if tracking over time)                      │
│  └── % of clickers in period N who were also clickers in N-1    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
2.5 REVENUE METRICS
┌─────────────────────────────────────────────────────────────────┐
│  REVENUE METRICS                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Newsletter Sessions (period)                                   │
│  └── SUM(newsletter_sessions) from GA4 data                     │
│                                                                 │
│  Newsletter Pageviews (period)                                  │
│  └── SUM(newsletter_pageviews) from GA4 data                    │
│                                                                 │
│  Pages per Session                                              │
│  └── Newsletter Pageviews / Newsletter Sessions                 │
│                                                                 │
│  Total Attributed Revenue (period)                              │
│  └── SUM(newsletter_attributed_revenue)                         │
│                                                                 │
│  Newsletter RPM                                                 │
│  └── (Total Attributed Revenue / Newsletter Pageviews) × 1000   │
│                                                                 │
│  Revenue per Clicker                                            │
│  └── Total Attributed Revenue / Total Unique Clickers           │
│                                                                 │
│  Revenue per Click                                              │
│  └── Total Attributed Revenue / Total Article Clicks            │
│                                                                 │
│  Revenue per Session                                            │
│  └── Total Attributed Revenue / Newsletter Sessions             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
2.6 ROI & UNIT ECONOMICS
┌─────────────────────────────────────────────────────────────────┐
│  ROI & UNIT ECONOMICS                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Gross Profit (period)                                          │
│  └── Total Attributed Revenue - Total Cost                      │
│                                                                 │
│  ROI (period)                                                   │
│  └── (Revenue - Cost) / Cost × 100                              │
│                                                                 │
│  Payback Period                                                 │
│  └── CPU / (Revenue per User per Month)                         │
│                                                                 │
│  Lifetime Value (LTV) Proxy                                     │
│  └── Revenue per Clicker × Avg Months Active (if available)     │
│                                                                 │
│  LTV:CAC Ratio                                                  │
│  └── Estimated LTV / Cost per Clicker                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

3. TIME PERIODS & COMPARISON
Supported Periods:
├── Weekly (Last 7 days)
├── Monthly (Last 30 days)
├── Custom date range

Comparison Options:
├── vs Previous Period (week vs prior week, month vs prior month)
├── vs Same Period Last Year
└── vs Custom baseline

Period Constants:
├── BEEHIIV_MONTHLY_COST = $109
├── BEEHIIV_WEEKLY_COST = $109 / 4.33 = $25.17
└── COST_PER_PAID_EMAIL = $0.10

4. DASHBOARD SECTIONS & LAYOUT
┌─────────────────────────────────────────────────────────────────┐
│  HEADER                                                         │
│  ├── Publication Selector                                       │
│  ├── Time Period Selector (Weekly / Monthly / Custom)           │
│  ├── Comparison Selector (vs Previous / vs Last Year / None)    │
│  └── Date Range Display + Post Count                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  KEY METRICS ROW (5 cards, equal width)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. SUBSCRIBERS        2. OPEN RATE         3. CLICK RATE       │
│     9.3K                  22.7%                 2.0%            │
│     ↑ 124 vs prior        ↓ 13.1 pts           ↓ 3.4 pts       │
│     [sparkline]           [sparkline]          [sparkline]      │
│                                                                 │
│  4. CTOR               5. REVENUE                               │
│     6.1%                  $847.32                               │
│     ↓ 3.2 pts             ↑ 12.4%                               │
│     [sparkline]           [sparkline]                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  UNIT ECONOMICS ROW (4 cards)                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CPU (Cost/User)    2. Cost/Clicker    3. Rev/Clicker        │
│     $0.0412               $0.6834            $0.0847            │
│                                                                 │
│  4. ROI                                                         │
│     127.4%                                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  TREND CHARTS (3 columns)                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Open Rate Trend    2. Click Rate Trend  3. Revenue Trend    │
│     [line chart]          [line chart]         [area chart]     │
│     + comparison overlay  + comparison         + comparison     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  FUNNEL VISUALIZATION                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Delivered → Opened → Clicked → Visited Site → Generated Rev    │
│  8,475       1,925     163        142            $84.73         │
│  100%        22.7%     1.9%       1.7%           RPM: $5.97     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  TOP PERFORMERS (2 columns)                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TOP POSTS by Open Rate          TOP ARTICLES by Clicks         │
│  ┌────────────────────────┐      ┌────────────────────────┐     │
│  │ Post Title    | Rate   │      │ Article URL    | Clicks│     │
│  │ Trump Stroke..| 51.4%  │      │ /trump-stroke..| 200   │     │
│  │ Did Machado...| 49.4%  │      │ /gavin-newsom..| 184   │     │
│  └────────────────────────┘      └────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  COST BREAKDOWN                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Donut Chart]           Cost Table:                            │
│  - Beehiiv Fee           ├── Beehiiv: $25.17 (weekly)           │
│  - Paid Acquisition      ├── Paid Acq: $12.40                   │
│                          └── Total: $37.57                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

5. DATA FLOW & RELATIONSHIPS
                    ┌─────────────┐
                    │  BEEHIIV    │
                    │  API        │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ Subscribers │ │   Posts     │ │   Clicks    │
    │             │ │             │ │             │
    │ - id        │ │ - id        │ │ - post_id   │
    │ - status    │ │ - subject   │ │ - url       │
    │ - source    │ │ - stats     │ │ - clicks    │
    │ - created   │ │ - date      │ │ - date      │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           └───────────────┴───────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  AGGREGATIONS   │
                  │  (by period)    │
                  └────────┬────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    GA4       │  │  MEDIAVINE   │  │   BEEHIIV    │
│  Sessions    │  │   Revenue    │  │   Metrics    │
│  Pageviews   │  │   Pageviews  │  │   Clickers   │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┴─────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  REVENUE ATTRIBUTION│
              │                     │
              │  newsletter_revenue │
              │  = total_revenue ×  │
              │    (nl_pv/total_pv) │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   UNIT ECONOMICS    │
              │                     │
              │  - CPU              │
              │  - Cost per Clicker │
              │  - Rev per Clicker  │
              │  - ROI              │
              └─────────────────────┘

6. MOCK DATA STRUCTURE (for development)
typescriptinterface DashboardData {
  // Filters
  publication: string;
  timeRange: 'weekly' | 'monthly' | 'custom';
  comparison: 'none' | 'prev_period' | 'prev_year';
  dateRange: { start: Date; end: Date };
  
  // Key Metrics
  metrics: {
    subscribers: { value: number; change: number; trend: number[] };
    openRate: { value: number; change: number; trend: number[] };
    clickRate: { value: number; change: number; trend: number[] };
    ctor: { value: number; change: number; trend: number[] };
    revenue: { value: number; change: number; trend: number[] };
  };
  
  // Unit Economics
  unitEconomics: {
    cpu: number;  // Cost per User
    costPerClicker: number;
    revenuePerClicker: number;
    revenuePerClick: number;
    rpm: number;  // Revenue per 1000 pageviews
    roi: number;
  };
  
  // Funnel
  funnel: {
    delivered: number;
    opened: number;
    clicked: number;
    sessions: number;
    pageviews: number;
    revenue: number;
  };
  
  // Costs
  costs: {
    beehiivFee: number;
    acquisitionCost: number;
    totalCost: number;
  };
  
  // Time Series (for charts)
  timeSeries: {
    dates: string[];
    openRate: number[];
    clickRate: number[];
    ctor: number[];
    revenue: number[];
    // Comparison data (if enabled)
    compOpenRate?: number[];
    compClickRate?: number[];
    compCtor?: number[];
    compRevenue?: number[];
  };
  
  // Top Performers
  topPosts: Array<{
    id: string;
    subject: string;
    date: string;
    recipients: number;
    openRate: number;
    clickRate: number;
  }>;
  
  topArticles: Array<{
    url: string;
    title: string;
    clicks: number;
    date: string;
  }>;
}

7. REQUIREMENTS FOR CLAUDE CODE

Use the design system from previous prompt (CSS Grid, design tokens, etc.)
Metric cards must be clickable — expanding to show:

Full trend chart for that metric
Breakdown by post/day
Comparison with previous period


Implement real comparison logic:

When "vs Previous Week" selected, fetch data for both periods
Show delta (↑/↓ X pts or X%)
Overlay dashed line on charts


Funnel visualization:

Horizontal funnel showing conversion at each stage
Percentage drop-off between stages
Click to drill into each stage


Cost tracking:

Donut chart for cost breakdown
Table showing itemized costs


Data should be fetched via API (or mock for now):

Endpoint structure: /api/newsletter/metrics?period=weekly&compare=prev_period


Export functionality:

CSV export of all metrics
PDF report generation