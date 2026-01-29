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
- **Engagement Metrics:** Subscribers, Open Rate, CTR, CTOR with sparkline graphs
- **Trend Charts:** Daily/weekly performance visualization
- **Top Articles Table:** Best performing articles by clicks with external links
- **Top Newsletters Table:** Best performing newsletters by open rate
- **Subscriber Growth Chart:** Growth by acquisition source (daily counts)
- **Filters:** Time period (Yesterday, 7/30/90 days, All Time, Custom), Publication source, Comparison periods

### 2. Target Page
- Goal tracking and target monitoring
- Progress visualization toward subscriber/engagement goals

### 3. Unit Economics Page
- **Cost Tracking:** Beehiiv costs ($99/month), paid acquisition costs
- **Revenue Estimation:** Based on article clicks and estimated RPM ($2.70)
- **Funnel Visualization:** Delivered → Opened → Clicked → Article Clicks → Revenue
- **ROI Calculation:** Revenue vs total costs
- **Period Selector:** Day/Week/Month/Custom with comparison toggle
- **Cost Breakdown Chart:** Donut chart showing cost distribution

### 4. Content Performance Page
- **Newsletter Analysis:** Sortable table with all newsletters and metrics
- **Top Performing Articles:** Sortable table with click counts and external links
- **Entity Performance:** Analysis by people/topics mentioned
- **Event Performance:** Analysis by events covered
- **Format Analysis:** Subject line and title format effectiveness

### 5. Diagnostics Page
- API connection status
- Cache status and age
- Manual data refresh capability

### 6. Help/Guide Page
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

### January 29, 2026
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
