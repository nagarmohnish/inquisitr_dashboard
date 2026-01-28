# Inquisitr Analytics Dashboard - Metrics Documentation

## Table of Contents
1. [Overview Page](#overview-page)
2. [Target Page](#target-page)
3. [Unit Economics Page](#unit-economics-page)
4. [Filters & Data Flow](#filters--data-flow)
5. [Appendix A: Metric Definitions & Assumptions](#appendix-a-metric-definitions--assumptions)
6. [Appendix B: Data Source Assumptions](#appendix-b-data-source-assumptions)
7. [Appendix C: Glossary](#appendix-c-glossary)
8. [Appendix D: Limitations & Caveats](#appendix-d-limitations--caveats)

---

## Overview Page

### Key Metrics Cards (5 cards)

| Metric | Definition | Calculation | Target |
|--------|------------|-------------|--------|
| **Subscribers** | Total active subscribers | Count where `status = 'active'` | - |
| **Growth Rate** | Period subscriber growth % | `(New Subs / Starting Subs) × 100` | - |
| **Open Rate** | % of delivered emails opened | `(Unique Opens / Delivered) × 100` | 35-40% |
| **Traffic Sent** | Clicks to inquisitr.com articles | Sum of `articleClicks[].totalClicks` | 3,000/send |
| **CTOR** | Click-to-Open Rate | `(Clicks / Opens) × 100` | 16-17% |

### Trend Charts

| Chart | X-Axis | Y-Axis | Aggregation |
|-------|--------|--------|-------------|
| Open Rate Trend | Date | Open Rate % | `(Day's Unique Opens / Day's Delivered) × 100` |
| Traffic Sent Trend | Date | Article Clicks | Sum of article clicks per day |
| CTOR Trend | Date | CTOR % | `(Day's Clicks / Day's Unique Opens) × 100` |

### Comparison Mode
- **Dashed Line**: Prior period data aligned by day index
- **Period Options**: Previous Day, Week, Month, Same Period Last Year

### Top Performers Tables

| Table | Ranking | Columns |
|-------|---------|---------|
| Top Articles | By total clicks | Title, URL, Total Clicks, Unique Clicks |
| Top Posts | By open rate | Title, Date, Open Rate, Click Rate, Recipients |

---

## Target Page

### Subscriber Target Metrics

| Metric | Definition | Calculation |
|--------|------------|-------------|
| **Current Subscribers** | Total active subs | Count where `status = 'active'` |
| **Target** | Goal by deadline | 30,000 (configurable) |
| **Gap** | Remaining to reach target | `Target - Current` |
| **Actual Daily Growth** | Current growth rate | `(Subs created last 30 days) / 30` |
| **Required Daily Growth** | Needed rate for target | `Gap / Days Remaining` |
| **Projected Subscribers** | Estimated at deadline | `Current + (Actual Daily Growth × Days Remaining)` |

### Status Indicators

| Status | Condition |
|--------|-----------|
| **AHEAD** | Projected ≥ Target × 1.05 |
| **ON TRACK** | Projected ≥ Target |
| **BEHIND** | Projected < Target |

### Engagement Targets

| Metric | Target | Status |
|--------|--------|--------|
| Open Rate | 35-40% | On Track if within range |
| CTOR | 16-17% | On Track if ≥ 16% |
| Traffic/Send | 3,000 | On Track if ≥ 3,000 |

### Projection Chart
- **Solid Line**: Historical subscriber data
- **Dashed Line**: Projected growth at current rate
- **Red Line**: Target (30,000)

---

## Unit Economics Page

### Period Selector
| Period | Date Range | Beehiiv Cost |
|--------|------------|--------------|
| **Weekly** | Last 7 days | $25.17 (~$109/4.33 weeks) |
| **Monthly** | Last 30 days | $109 |

### Cost Constants
```
Beehiiv Monthly Fee: $109
Cost per Paid Subscriber: $0.10
Paid Sources (UTM): 'ml2', 'ml3'
Revenue Estimation: $15 RPM, 1.5 PV/click
```

---

### Key Metrics Row (5 cards)

| Metric | Definition | Calculation | Change Indicator |
|--------|------------|-------------|------------------|
| **Subscribers** | Total active subscribers | Count where `status = 'active'` | New subs in period |
| **Open Rate** | % emails opened | `(Unique Opens / Delivered) × 100` | pts vs prior period |
| **Click Rate** | % emails clicked | `(Unique Clicks / Delivered) × 100` | pts vs prior period |
| **CTOR** | Click-to-Open Rate | `(Unique Clicks / Unique Opens) × 100` | pts vs prior period |
| **Revenue** | Estimated revenue | `(Article Clicks × 1.5 PV × $15 RPM) / 1000` | % vs prior period |

---

### Unit Economics Row (4 cards)

| Metric | Definition | Formula |
|--------|------------|---------|
| **CPU** | Cost per User (subscriber) | `Total Cost / New Subscribers` |
| **Cost/Clicker** | Cost per unique clicker | `Total Cost / Unique Clickers` |
| **Rev/Clicker** | Revenue per clicker | `Estimated Revenue / Unique Clickers` |
| **ROI** | Return on Investment | `((Revenue - Cost) / Cost) × 100` |

**Cost Components:**
- `Acquisition Cost = Paid Subscribers × $0.10`
- `Total Cost = Beehiiv Fee + Acquisition Cost`

---

### Trend Charts (3 columns)

| Chart | Data Key | Format | Comparison |
|-------|----------|--------|------------|
| Open Rate Trend | `openRate` | Percentage | Dashed line (prior period) |
| Click Rate Trend | `clickRate` | Percentage | Dashed line (prior period) |
| Revenue Trend | `revenue` | Currency | Dashed line (prior period) |

---

### Conversion Funnel (Horizontal)

```
Delivered → Opened → Clicked → Visits → Revenue
   100%      OR%       CR%      PV      $$$
```

| Stage | Value | Percentage | Dropoff Label |
|-------|-------|------------|---------------|
| Delivered | Total delivered | 100% | `{openRate}% open` |
| Opened | Unique opens | Open Rate | `{ctor}% click` |
| Clicked | Unique clicks | Click Rate | `{avgClicksPerUser} clicks/user` |
| Visits | Article clicks | % of delivered | `RPM: ${rpm}` |
| Revenue | Est. revenue | `ROI: {roi}%` | - |

---

### Top Performers Tables

#### Top Posts by Open Rate
| Column | Source |
|--------|--------|
| # | Rank (1-5) |
| Subject | `post.subject` or `post.Title` |
| Open Rate | `post.openRate` |
| CTR | `post.clickRate` |

#### Top Articles by Clicks
| Column | Source |
|--------|--------|
| # | Rank (1-5) |
| Article | URL slug converted to title |
| Clicks | `articleClick.totalClicks` |

---

### Cost Breakdown Section

#### Donut Chart
- **Beehiiv Fee**: Platform cost (weekly/monthly)
- **Paid Acquisition**: `Paid subs × $0.10`

#### Cost Table
| Row | Calculation |
|-----|-------------|
| Beehiiv Fee | $109/month or $25.17/week |
| Paid Acquisition | `paidSubs × $0.10` |
| **Total Cost** | Sum of above |

#### Summary Box
| Item | Value |
|------|-------|
| Input | Total Cost |
| Output | Estimated Revenue |
| Profit | `Revenue - Cost` (green/red) |

---

### Assumptions & Notes
- Revenue: $15 RPM (industry average)
- Pageviews per click: 1.5
- Paid sources: `ml2`, `ml3` UTM parameters
- Future: Connect Mediavine + GA4 APIs for actual revenue

---

## Filters & Data Flow

### Time Period Filters

| Filter | Date Range |
|--------|------------|
| Yesterday | Previous day |
| Last 7 Days | Most recent 7 days |
| Last 30 Days | Most recent 30 days |
| Last 90 Days | Most recent 90 days |
| All Time | Last 365 days |
| Custom | User-selected range |

### Publication Filter
- **All Publications**: Aggregates all publications
- **Individual**: Filters by publication name

### Data Pipeline
```
Beehiiv API v2 → API Server (port 3001) → data-cache.json
                       ↓
              Auto-refresh (6 hours)
                       ↓
              Normalization → Filtering → Calculations → UI
```

### Data Sources
| Source | Data Type |
|--------|-----------|
| Beehiiv API | Subscribers, Posts, Article Clicks |
| Mediavine (future) | Actual ad revenue |
| GA4 (future) | Session data, attribution |

---

## Display Conventions

- **Percentages**: 1 decimal place (e.g., `35.2%`)
- **Currency**: 2 decimals standard, 4 decimals for unit economics
- **Numbers**: Locale formatting with commas
- **Changes**: Color-coded (green positive, red negative)
- **Sparklines**: Show trend direction over period

---

## Appendix A: Metric Definitions & Assumptions

### A.1 Subscriber Metrics

#### Total Active Subscribers
- **What it is**: The count of all subscribers with `status = 'active'` in Beehiiv
- **Excludes**: Unsubscribed, bounced, or inactive subscribers
- **Source**: Beehiiv Subscribers API

#### New Subscribers (Period)
- **What it is**: Subscribers whose `created_at` date falls within the selected period
- **Weekly**: Subscribers created in the last 7 days
- **Monthly**: Subscribers created in the last 30 days
- **Why it matters**: Used as the denominator in CPU (Cost per User) calculation
- **Important**: This is NOT the same as net subscriber growth (which accounts for churn)

#### Paid Subscribers
- **What it is**: New subscribers acquired through paid channels
- **How identified**: UTM source contains `'ml2'` or `'ml3'`
- **Cost**: Each paid subscriber costs **$0.10** in acquisition cost
- **Organic Subscribers**: `New Subscribers - Paid Subscribers`

---

### A.2 Email Engagement Metrics

#### Delivered
- **What it is**: Total emails successfully delivered (not bounced)
- **Source**: Beehiiv post stats
- **Note**: This is less than "Recipients" due to bounces

#### Unique Opens
- **What it is**: Count of unique subscribers who opened the email at least once
- **Tracking**: Via tracking pixel in email
- **Limitation**: Apple Mail Privacy Protection may inflate this number

#### Unique Clicks
- **What it is**: Count of unique subscribers who clicked at least one link
- **Includes**: All links in the email (articles, CTAs, etc.)
- **Also called**: "Clickers" in unit economics

#### Open Rate
```
Open Rate = (Unique Opens / Delivered) × 100
```
- **Industry benchmark**: 15-25%
- **Dashboard target**: 35-40%

#### Click Rate (CTR)
```
Click Rate = (Unique Clicks / Delivered) × 100
```
- **What it measures**: % of all recipients who clicked
- **Industry benchmark**: 2-5%

#### CTOR (Click-to-Open Rate)
```
CTOR = (Unique Clicks / Unique Opens) × 100
```
- **What it measures**: % of openers who clicked (engagement quality)
- **Dashboard target**: 16-17%
- **Why it matters**: Better indicator of content quality than CTR

---

### A.3 Article Click Metrics

#### Article Clicks
- **What it is**: Clicks specifically to inquisitr.com article URLs
- **Filter**: URL must contain `inquisitr.com` AND NOT be unsubscribe/preferences link
- **Source**: Beehiiv click tracking data

#### Avg Clicks per Clicker
```
Avg Clicks per Clicker = Total Article Clicks / Unique Clickers
```
- **What it measures**: How many articles each clicker visits on average
- **Assumption**: Higher = more engaged audience

---

### A.4 Cost Metrics

#### Beehiiv Platform Fee
| Period | Cost | Calculation |
|--------|------|-------------|
| Monthly | $109 | Fixed subscription |
| Weekly | $25.17 | $109 ÷ 4.33 weeks/month |

#### Acquisition Cost
```
Acquisition Cost = Paid Subscribers × $0.10
```
- **$0.10/subscriber**: Cost paid to acquisition partners (ml2, ml3)
- **Organic subs**: $0 acquisition cost

#### Total Cost
```
Total Cost = Beehiiv Fee + Acquisition Cost
```
- **Weekly**: `$25.17 + (Paid Subs × $0.10)`
- **Monthly**: `$109 + (Paid Subs × $0.10)`

#### CPU (Cost per User)
```
CPU = Total Cost / New Subscribers
```
- **Numerator**: Total cost for the period (Beehiiv + Acquisition)
- **Denominator**: ALL new subscribers in period (paid + organic)
- **Why this way**: Measures blended cost of acquiring any subscriber
- **Example**: $134.17 total cost / 500 new subs = $0.27 CPU

#### Cost per Clicker
```
Cost per Clicker = Total Cost / Unique Clickers
```
- **What it measures**: Cost to get someone to actually click to the site
- **Denominator**: `Unique Clicks` from posts in the period
- **Why it matters**: Not all subscribers engage; this measures cost of engaged users

---

### A.5 Revenue Metrics (Estimated)

#### Revenue Estimation Method

Since Mediavine and GA4 APIs are not yet connected, revenue is **estimated** using:

```
Estimated Revenue = (Article Clicks × PV per Click × RPM) / 1000
```

| Variable | Value | Source |
|----------|-------|--------|
| Article Clicks | From Beehiiv | Actual data |
| PV per Click | 1.5 | Assumption |
| RPM | $15 | Industry average |

**Example Calculation:**
```
1,000 article clicks × 1.5 PV/click = 1,500 pageviews
1,500 pageviews × ($15 / 1000) = $22.50 estimated revenue
```

#### Why 1.5 Pageviews per Click?
- Users don't just view one page; they often browse
- Conservative estimate based on typical session behavior
- **Future**: Will be replaced with actual GA4 session data

#### Why $15 RPM?
- RPM = Revenue per 1,000 pageviews
- $15 is a conservative industry average for display ads
- Mediavine sites typically range $15-$30+ RPM
- **Future**: Will be replaced with actual Mediavine revenue data

#### Revenue per Clicker
```
Revenue per Clicker = Estimated Revenue / Unique Clickers
```
- **What it measures**: Average revenue generated per person who clicks
- **Example**: $150 revenue / 200 clickers = $0.75/clicker

#### Revenue per Click
```
Revenue per Click = Estimated Revenue / Total Article Clicks
```
- **What it measures**: Revenue per individual click (not per person)
- **Will be lower than Rev/Clicker** if users click multiple articles

#### Newsletter RPM
```
RPM = (Estimated Revenue / Estimated Pageviews) × 1000
```
- Currently uses the assumed $15 RPM
- **Future**: Actual RPM from Mediavine data

---

### A.6 ROI & Profitability

#### Gross Profit
```
Profit = Estimated Revenue - Total Cost
```
- Positive = profitable period
- Negative = loss (displayed in red)

#### ROI (Return on Investment)
```
ROI = ((Revenue - Cost) / Cost) × 100
```
- **100%** = doubled your money
- **0%** = broke even
- **-50%** = lost half your investment

**Example:**
```
Revenue: $150 | Cost: $75
ROI = ((150 - 75) / 75) × 100 = 100%
```

---

### A.7 Funnel Metrics

The conversion funnel tracks drop-off at each stage:

```
Delivered (100%) → Opened (OR%) → Clicked (CR%) → Visits → Revenue
```

| Stage | Metric | Typical Value |
|-------|--------|---------------|
| Delivered → Opened | Open Rate | 35-40% |
| Opened → Clicked | CTOR | 16-17% |
| Clicked → Visits | Varies | ~1:1 to 1:1.5 |
| Visits → Revenue | RPM-based | $15/1000 PV |

---

## Appendix B: Data Source Assumptions

### Current State (Estimated)

| Data Point | Source | Status |
|------------|--------|--------|
| Subscribers | Beehiiv API | ✅ Live |
| Posts/Stats | Beehiiv API | ✅ Live |
| Article Clicks | Beehiiv API | ✅ Live |
| Pageviews | Estimated (1.5/click) | ⚠️ Assumed |
| Revenue | Estimated ($15 RPM) | ⚠️ Assumed |
| Sessions | Not tracked | ❌ Future |

### Future State (Actual Data)

When APIs are connected:

| Data Point | Source | Calculation |
|------------|--------|-------------|
| Newsletter Sessions | GA4 | `sessionSource = 'Beehiiv'` |
| Newsletter Pageviews | GA4 | Attributed to newsletter sessions |
| Total Site Revenue | Mediavine | Daily revenue export |
| Newsletter Revenue | Calculated | `Total Revenue × (NL PV / Total PV)` |
| Actual RPM | Mediavine | `Revenue / Pageviews × 1000` |

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **CPU** | Cost per User - blended cost to acquire one subscriber |
| **CTOR** | Click-to-Open Rate - % of openers who clicked |
| **CTR** | Click-Through Rate - % of all recipients who clicked |
| **RPM** | Revenue per Mille - revenue per 1,000 pageviews |
| **Clicker** | A subscriber who clicks through to the website |
| **Organic Sub** | Subscriber acquired without paid promotion |
| **Paid Sub** | Subscriber acquired via ml2/ml3 campaigns |
| **PV** | Pageview |
| **ROI** | Return on Investment |
| **LTV** | Lifetime Value (not yet implemented) |
| **CAC** | Customer Acquisition Cost (similar to CPU) |

---

## Appendix D: Limitations & Caveats

1. **Revenue is estimated** until Mediavine + GA4 integration
2. **Apple Mail Privacy** may inflate open rates
3. **1.5 PV/click assumption** may vary by content type
4. **$15 RPM assumption** may differ from actual Mediavine performance
5. **Paid subscriber identification** relies on UTM tagging accuracy
6. **CPU uses new subs** not net growth (doesn't account for churn)
7. **Weekly Beehiiv cost** is prorated from monthly ($109 ÷ 4.33)
