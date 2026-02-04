# Inquisitr Newsletter Analytics Dashboard

## Overview

A real-time analytics dashboard for monitoring Inquisitr's newsletter performance, subscriber growth, and unit economics. Built with React + Express, fetching data from the Beehiiv API.

**Live URL:** https://inquisitr-dashboard.onrender.com

## Data Sources

| Source | Status | Data Provided |
|--------|--------|---------------|
| Beehiiv API | Active | Posts, subscribers, segments, click data |
| Google Analytics 4 | Not implemented | (Future: page views, revenue attribution) |
| Mediavine | Not implemented | (Future: actual ad revenue) |

## Features

### 1. Overview Page
- **Engagement Metrics:** New Subscribers (period-filtered), Open Rate, CTR, CTOR with sparkline graphs
- **Newsletter Health Metrics:** Bounce Rate, Unsubscribe Rate, Spam Rate
- **Source-wise Subscriber Table:** Shows subscriber counts by acquisition source with date filtering
- **Unsubscribe/Bounce Rate Trends:** Day-wise and newsletter-wise charts and tables
- **Trend Charts:** Daily/weekly performance visualization
- **Top Articles Table:** Best performing articles by clicks with external links
- **Top Newsletters Table:** Best performing newsletters by open rate
- **Subscriber Growth Chart:** Growth by acquisition source (daily counts)
- **Filters:** Time period (Yesterday, 7/30/90 days, All Time, Custom), Publication source, Comparison periods

### 2. Analytics Chat Page
- **Natural Language Queries:** Ask questions about newsletter data in plain English
- **Supported Query Types:**
  - "Top 5 articles by clicks this week"
  - "Compare this week vs last week"
  - "Subscriber growth by source"
  - "How did newsletters perform?"
  - "Show me the open rate trend"
- **Response Format:**
  - Direct answer (2-3 sentences)
  - Data table (max 10 rows, sortable)
  - Visualization (bar, line, or pie chart)
  - Insights (3-5 bullets with actionable recommendation)
- **Conversation Context:** Maintains context for follow-up questions
- **Quick Suggestions:** One-click query shortcuts

### 3. Target Page
- Goal tracking and target monitoring
- Progress visualization toward subscriber/engagement goals

### 4. Unit Economics Page
- **Cost Tracking:** Beehiiv costs ($99/month), paid acquisition costs
- **Revenue Estimation:** Based on article clicks and estimated RPM ($2.70)
- **Funnel Visualization:** Delivered → Opened → Clicked → Article Clicks → Revenue
- **ROI Calculation:** Revenue vs total costs
- **Period Selector:** Day/Week/Month/Custom with comparison toggle
- **Cost Breakdown Chart:** Donut chart showing cost distribution

### 5. Content Performance Page
- **Summary Metrics:** Entities Detected, Events/Trends, Average Open Rate, Average CTOR
- **Entity & Event Performance (Primary):**
  - Top personalities/entities mentioned in content
  - Top events/trends covered
  - Click to expand and see top performing articles for each entity/event
  - Enhanced entity recognition with 150+ personalities database
- **Entity/Event Trend Charts:** Visual trends over time
- **Format Analysis:** Subject line and title format effectiveness
- **Newsletter Analysis:** Sortable table with all newsletters and metrics
- **Top Performing Articles:** Sortable table with click counts and external links

### 6. Diagnostics Page
- API connection status
- Cache status and age
- Manual data refresh capability

### 7. Help/Guide Page
- Documentation and usage instructions

## Technical Architecture

### Frontend
- **Framework:** React 19 with Vite 7
- **Charts:** Recharts
- **Styling:** Tailwind CSS 4 + custom CSS
- **Date Handling:** date-fns

### Backend
- **Server:** Express.js
- **Data Fetching:** Beehiiv API v2
- **Caching:** File-based (data-cache.json)
- **Auto-refresh:** Every 6 hours

### Deployment
- **Platform:** Render (Web Service)
- **Build:** `npm install && npm run build`
- **Start:** `node server.js`
- **Health Check:** `/api/status`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/data` | GET | Returns cached newsletter data |
| `/api/refresh` | POST | Forces fresh fetch from Beehiiv |
| `/api/status` | GET | Returns cache status info |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BEEHIIV_API_KEY` | Yes | Beehiiv API authentication key |
| `NODE_ENV` | No | Set to `production` for prod builds |
| `PORT` | No | Server port (default: 3001, Render sets automatically) |

## Publications Tracked

1. **Inquisitr Main** - Primary newsletter
2. **Inquisitr Ads** - Promotional/advertising newsletter

## Key Metrics Definitions

| Metric | Definition |
|--------|------------|
| Open Rate | Unique opens / Delivered emails × 100 |
| CTR | Unique clicks / Delivered emails × 100 |
| CTOR | Unique clicks / Unique opens × 100 |
| Article Clicks | Clicks on inquisitr.com links in newsletters |
| Estimated Revenue | Article clicks × 1.5 pageviews × $2.70 RPM / 1000 |

## File Structure

```
dashboard/
├── src/
│   ├── App.jsx                 # Main app with Overview page
│   ├── main.jsx               # React entry point
│   ├── index.css              # Global styles
│   ├── components/
│   │   ├── Sidebar.jsx        # Navigation sidebar
│   │   ├── MetricCard.jsx     # Basic metric display
│   │   ├── MetricCardWithGraph.jsx  # Metric with sparkline
│   │   ├── TopPerformersTable.jsx   # Articles/Posts tables
│   │   ├── SubscriberChart.jsx      # Growth visualization
│   │   ├── TrendChartAdvanced.jsx   # Time series charts
│   │   ├── SkeletonLoader.jsx       # Loading states
│   │   ├── DateRangePicker.jsx      # Custom date selection
│   │   └── ChartFilters.jsx         # Chart filter controls
│   ├── pages/
│   │   ├── AnalyticsChatPage.jsx    # Natural language analytics chat
│   │   ├── TargetPage.jsx           # Goal tracking
│   │   ├── UnitEconomicsPage.jsx    # Cost/revenue analysis
│   │   ├── ContentPerformancePage.jsx # Content analysis
│   │   ├── DiagnosticsPage.jsx      # System status
│   │   └── HelpGuidePage.jsx        # Documentation
│   └── utils/
│       └── dataParser.js      # API calls & data processing
├── server.js                  # Express API server
├── index.html                 # HTML template
├── vite.config.js            # Vite configuration
├── package.json              # Dependencies
└── render.yaml               # Render deployment config
```

## Recent Changes

### February 3, 2026
- **Overview Page Enhancements:**
  - Added source-wise subscriber table with date filtering
  - Engagement metrics now update based on selected time period (7D shows only 7 days data)
  - Changed "Subscribers" to "New Subscribers" showing period-filtered counts
  - Added day-wise and newsletter-wise unsubscribe/bounce rate trends and tables
  - Removed "List Growth" metric from Newsletter Health section

- **Content Performance Page Improvements:**
  - Reordered sections: Entity & Event Performance now primary (first)
  - Expandable entity/event rows showing top 5 performing articles when clicked
  - Enhanced entity recognition with comprehensive database of 150+ personalities
  - Categories include: Politics, Tech, Music, Entertainment, Sports, Royalty, Media, Business
  - Full name and alias matching (e.g., "Elon Musk", "elon", "musk" all map to "Elon Musk")

### January 29, 2026
- **Added Analytics Chat page** - Natural language interface for querying newsletter data
  - Supports queries like "Top 5 articles", "Compare weeks", "Subscriber sources"
  - Returns formatted answers with tables, charts, and actionable insights
  - Quick suggestion buttons for common queries
- Deployed to Render (https://inquisitr-dashboard.onrender.com)
- Removed Railway configuration, added Render config
- Moved vite build tools to dependencies for Render compatibility
- Added environment variable support for BEEHIIV_API_KEY

### January 28, 2026
- Changed subscriber growth chart from cumulative to daily counts
- Added Top Performing Articles table to Content page
- Removed unused components (7 files)
- Cleaned up codebase and organized documentation
- Pushed to GitHub (nagarmohnish/inquisitr_dashboard)

## Known Limitations

1. **Free Tier Spin-down:** Render free tier spins down after 15 min inactivity (~30s cold start)
2. **Rate Limiting:** Beehiiv API rate limits cause initial data fetch to take 2-3 minutes
3. **No Real Revenue:** Revenue is estimated; needs GA4/Mediavine integration for actual data
4. **Cache Persistence:** Cache file doesn't persist across Render redeploys

## Future Enhancements

- [ ] GA4 integration for actual page view data
- [ ] Mediavine API for real ad revenue
- [ ] Email alerts for metric thresholds
- [ ] Historical data storage (database)
- [ ] A/B test tracking for subject lines
- [ ] Subscriber cohort analysis
