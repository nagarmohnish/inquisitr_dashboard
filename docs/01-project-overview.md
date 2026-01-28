# Beehiiv Growth Prediction Tool - Specification

## Objective
Build a Python script that analyzes current Beehiiv newsletter metrics and predicts whether we'll hit our March 31, 2026 targets.

---

## Targets

| Metric | Target Value |
|--------|--------------|
| Active Subscribers | 30,000 |
| Website Traffic per Send | 3,000 clicks |
| Open Rate | 35-40% |
| CTOR (Click-to-Open Rate) | 16-17% |

**Deadline:** March 31, 2026

---

## API Configuration

```python
API_KEY = "VhYyKKTmtmwtPcNyPaGsH14ipeDwmksxqKgkYpk3GfCLYvxeAIoeDT9mfMzd6e7u"
BASE_URL = "https://api.beehiiv.com/v2"
CONTENT_DOMAIN = "inquisitr.com"  # For filtering article clicks
```

**Headers:**
```python
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}
```

---

## Data Collection Steps

### Step 1: Get Publication ID and Current Stats
```
GET /publications?expand[]=stats
```

Extract:
- `id` → publication_id (needed for all other calls)
- `stats.active_subscriptions` → current subscriber count
- `stats.average_open_rate` → current avg open rate (convert from decimal)
- `stats.average_click_rate` → current avg click rate

### Step 2: Get Post Performance (Last 60 Days)
```
GET /publications/{pub_id}/posts?expand[]=stats&status=confirmed&limit=100
```

For each post, extract:
- `publish_date` (Unix timestamp)
- `stats.email.recipients`
- `stats.email.unique_opens`
- `stats.email.open_rate`
- `stats.email.unique_clicks`
- `stats.email.click_rate`
- `stats.clicks[]` → array of URL click data

**Calculate CTOR per post:**
```python
ctor = (unique_clicks / unique_opens) * 100 if unique_opens > 0 else 0
```

**Calculate website traffic per post:**
```python
# Filter clicks array for URLs containing CONTENT_DOMAIN
article_clicks = sum(click['total_clicks'] for click in stats['clicks'] 
                     if CONTENT_DOMAIN in click.get('url', '').lower())
```

### Step 3: Get Subscriber Growth Data
```
GET /publications/{pub_id}/subscriptions?status=active&limit=100
```

Use cursor pagination to fetch all subscribers. Extract:
- `created` (Unix timestamp) → subscribe date
- `status`

Group by date to calculate daily net growth.

---

## Calculations Required

### 1. Subscriber Projection
```python
current_subs = <from API>
target_subs = 30000
today = datetime.now()
deadline = datetime(2026, 3, 31)
days_remaining = (deadline - today).days

subs_needed = target_subs - current_subs
required_daily_growth = subs_needed / days_remaining

# Calculate actual daily growth from last 30 days of subscriber data
actual_daily_growth = <new_subscribers_last_30_days> / 30

# Projection
projected_subs_by_deadline = current_subs + (actual_daily_growth * days_remaining)
on_track = projected_subs_by_deadline >= target_subs
```

### 2. Open Rate Analysis
```python
# From last 20 posts with recipients > 100
avg_open_rate = mean([post['open_rate'] for post in recent_posts])
target_open_rate_min = 35
target_open_rate_max = 40
open_rate_status = "On Track" if 35 <= avg_open_rate <= 40 else "Below Target"
```

### 3. CTOR Analysis
```python
# CTOR = Click-to-Open Rate = (unique_clicks / unique_opens) * 100
avg_ctor = mean([post['ctor'] for post in recent_posts])
target_ctor_min = 16
target_ctor_max = 17
ctor_status = "On Track" if avg_ctor >= 16 else "Below Target"
```

### 4. Website Traffic Analysis
```python
avg_traffic_per_send = mean([post['article_clicks'] for post in recent_posts])
target_traffic = 3000
traffic_status = "On Track" if avg_traffic_per_send >= 3000 else "Below Target"
```

---

## Output Format

Generate a summary report (print to console + save as JSON):

```
============================================================
         BEEHIIV GROWTH PREDICTION REPORT
         Generated: {timestamp}
============================================================

📊 SUBSCRIBER PROJECTION
------------------------------------------------------------
Current Subscribers:     {current_subs:,}
Target (Mar 31):         30,000
Gap:                     {gap:,}
Days Remaining:          {days}

Current Daily Growth:    {actual_daily_growth:.1f} subs/day
Required Daily Growth:   {required_daily_growth:.1f} subs/day

Projected by Mar 31:     {projected:,}
Status:                  {ON_TRACK / BEHIND / AHEAD}

📈 ENGAGEMENT METRICS (Last 20 Posts)
------------------------------------------------------------
                    Current     Target      Status
Open Rate:          {x}%        35-40%      {status}
CTOR:               {x}%        16-17%      {status}
Traffic/Send:       {x}         3,000       {status}

📉 TREND ANALYSIS
------------------------------------------------------------
Open Rate Trend:    {improving/declining/stable}
CTOR Trend:         {improving/declining/stable}
Growth Trend:       {improving/declining/stable}

🎯 RECOMMENDATIONS
------------------------------------------------------------
{Generate 2-3 actionable recommendations based on gaps}

============================================================
```

---

## Implementation Notes

1. **Rate Limiting:** Add 200ms delay between API calls
2. **Pagination:** Use cursor-based pagination for subscribers (may have many)
3. **Date Handling:** API returns Unix timestamps - convert appropriately
4. **Percentage Conversion:** API may return decimals (0.35) or percentages (35) - normalize all to percentages
5. **Error Handling:** Handle API errors gracefully, log issues

---

## File Structure

```
beehiiv_prediction/
├── prediction.py      # Main script
├── output/
│   ├── report.txt     # Human-readable report
│   └── data.json      # Raw data for further analysis
```

---

## Run Command

```bash
python prediction.py
```

---

## Optional Enhancements (if time permits)

1. Generate a simple chart showing subscriber growth trajectory
2. Export to CSV for spreadsheet analysis
3. Compare week-over-week metrics
4. Identify best/worst performing posts