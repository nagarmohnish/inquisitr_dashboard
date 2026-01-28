# Inquisitr Analytics - Google Sheets Integration

This Google Apps Script pulls all dashboard data into a Google Sheet with multiple tabs for different data views.

## Sheet Structure

The script creates the following tabs:

| Sheet Name | Description |
|------------|-------------|
| **Overview** | Summary with last update time, publications list, quick stats |
| **Metrics Summary** | Calculated KPIs with status indicators and targets |
| **Posts (Raw)** | All newsletter posts with full metrics |
| **Subscribers (Raw)** | All subscriber records with status and engagement |
| **Article Clicks (Raw)** | Top performing article links |
| **Daily Trends** | Day-by-day aggregated metrics |
| **Top Performers** | Top posts by open rate and top articles by clicks |
| **Target Tracking** | Progress towards March 2026 targets with projections |

## Setup Instructions

### Step 1: Create a Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it "Inquisitr Analytics Dashboard"

### Step 2: Add the Script
1. Go to **Extensions** > **Apps Script**
2. Delete any existing code in the editor
3. Copy the entire contents of `AppScript.gs`
4. Paste it into the script editor
5. Save the project (Ctrl+S or Cmd+S)

### Step 3: Configure the API URL
Update the `API_URL` constant at the top of the script:

```javascript
const API_URL = 'http://localhost:3001/api/data';
```

If your API server is hosted remotely, update this to the correct URL.

**Note:** For the script to access a remote API, you may need to:
- Host the API on a publicly accessible server with HTTPS
- Or use a tunneling service like ngrok for local development

### Step 4: Authorize the Script
1. Click **Run** > **refreshAllData**
2. A dialog will appear asking for authorization
3. Click **Review permissions**
4. Select your Google account
5. Click **Advanced** > **Go to Inquisitr Analytics (unsafe)**
6. Click **Allow**

### Step 5: Run the Script
1. Close the Apps Script editor
2. Refresh your Google Sheet
3. A new menu **📊 Inquisitr Analytics** will appear
4. Click **📊 Inquisitr Analytics** > **🔄 Refresh All Data**

## Menu Options

| Menu Item | Description |
|-----------|-------------|
| 🔄 Refresh All Data | Updates all sheets with latest data |
| 📈 Update Metrics Only | Updates only the Metrics Summary sheet |
| 🎯 Update Targets Only | Updates only the Target Tracking sheet |
| ⚙️ Setup Auto-Refresh | Creates a trigger to refresh every 6 hours |
| ❌ Remove Auto-Refresh | Removes the automatic refresh trigger |

## Data Fields

### Posts (Raw)
| Field | Description |
|-------|-------------|
| Title | Newsletter title |
| Publish Date | When the newsletter was sent |
| Publication | Which publication it belongs to |
| Recipients | Number of email addresses |
| Delivered | Successfully delivered emails |
| Opens | Total opens (includes repeat opens) |
| Unique Opens | Unique people who opened |
| Open Rate % | (Unique Opens / Delivered) × 100 |
| Clicks | Total link clicks |
| Unique Clicks | Unique people who clicked |
| Click Rate % | (Unique Clicks / Delivered) × 100 |
| CTOR % | (Clicks / Opens) × 100 |
| Unsubscribes | People who unsubscribed from this email |
| Article Clicks Total | Total clicks to inquisitr.com articles |

### Subscribers (Raw)
| Field | Description |
|-------|-------------|
| Status | active, inactive, unsubscribed |
| Subscribe Date | When they subscribed |
| Publication | Which publication they're subscribed to |
| Open Rate % | Their personal open rate |
| Click Rate % | Their personal click rate |
| UTM Source | How they found the newsletter |
| Engagement Tier | Low/Medium/High engagement |

### Metrics Summary
| Metric | Calculation |
|--------|-------------|
| Total Subscribers | Count of active subscribers |
| New Subscribers (30d) | Subscribers created in last 30 days |
| Growth Rate | (New subs / Starting subs) × 100 |
| Open Rate | (Total Unique Opens / Total Delivered) × 100 |
| CTOR | (Total Clicks / Total Opens) × 100 |
| Traffic Sent | Sum of all article clicks |

### Target Tracking
| Target | Value | Deadline |
|--------|-------|----------|
| Subscribers | 30,000 | March 31, 2026 |
| Open Rate | 35-40% | Ongoing |
| CTOR | 16-17% | Ongoing |
| Traffic/Send | 3,000 | Ongoing |

## Troubleshooting

### "Cannot connect to API"
- Ensure the API server is running (`npm run dev` in server directory)
- Check that the API_URL is correct
- If using localhost, the script may not be able to reach it from Google's servers

### "Authorization required"
- Follow Step 4 above to grant permissions
- The script needs access to external URLs and your spreadsheet

### Data not updating
- Check the browser console for errors
- Verify the API returns valid JSON
- Try running `refreshAllData()` from the script editor to see error logs

### Trigger not working
- Go to **Extensions** > **Apps Script** > **Triggers** (clock icon)
- Check if the trigger exists and is enabled
- View execution logs for any errors

## Local Development Note

For local development, you'll need to expose your API server to the internet. Options:

1. **ngrok** (recommended for testing):
   ```bash
   ngrok http 3001
   ```
   Then update `API_URL` to the ngrok URL.

2. **Deploy to a server** with HTTPS for production use.

## Customization

### Change Targets
Edit the `TARGETS` object at the top of the script:

```javascript
const TARGETS = {
  subscribers: 30000,
  openRateMin: 35,
  openRateMax: 40,
  ctorMin: 16,
  ctorMax: 17,
  trafficPerSend: 3000,
  deadline: new Date('2026-03-31')
};
```

### Add New Sheets
Create a new function following the pattern:

```javascript
function updateMyCustomSheet(ss, data) {
  const sheet = getOrCreateSheet(ss, 'My Custom Sheet');
  // ... populate sheet with data
}
```

Then add it to `refreshAllData()`.

### Change Refresh Interval
Modify the `setupAutoRefresh()` function:

```javascript
ScriptApp.newTrigger('refreshAllData')
  .timeBased()
  .everyHours(6)  // Change this number
  .create();
```
