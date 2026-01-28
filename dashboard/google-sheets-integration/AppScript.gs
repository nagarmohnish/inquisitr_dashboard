/**
 * Inquisitr Newsletter Analytics - Google Sheets Integration
 *
 * This script fetches data from the Inquisitr Analytics API and populates
 * a Google Sheet with multiple tabs containing dashboard metrics and raw data.
 *
 * SETUP:
 * 1. Create a new Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this entire code
 * 4. Update the API_URL constant if your server is hosted elsewhere
 * 5. Run the 'refreshAllData' function
 * 6. Set up a trigger for automatic updates (optional)
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_URL = 'http://localhost:3001/api/data'; // Update this to your API server URL
const SHEET_NAMES = {
  OVERVIEW: 'Overview',
  METRICS: 'Metrics Summary',
  POSTS: 'Posts (Raw)',
  SUBSCRIBERS: 'Subscribers (Raw)',
  ARTICLE_CLICKS: 'Article Clicks (Raw)',
  DAILY_TRENDS: 'Daily Trends',
  TOP_PERFORMERS: 'Top Performers',
  TARGETS: 'Target Tracking'
};

// Target values from prediction.py
const TARGETS = {
  subscribers: 30000,
  openRateMin: 35,
  openRateMax: 40,
  ctorMin: 16,
  ctorMax: 17,
  trafficPerSend: 3000,
  deadline: new Date('2026-03-31')
};

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Main function to refresh all data in the spreadsheet
 */
function refreshAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    // Fetch data from API
    const data = fetchApiData();

    if (!data) {
      SpreadsheetApp.getUi().alert('Error: Could not fetch data from API');
      return;
    }

    // Update all sheets
    updateOverviewSheet(ss, data);
    updateMetricsSheet(ss, data);
    updatePostsSheet(ss, data);
    updateSubscribersSheet(ss, data);
    updateArticleClicksSheet(ss, data);
    updateDailyTrendsSheet(ss, data);
    updateTopPerformersSheet(ss, data);
    updateTargetsSheet(ss, data);

    // Update last refresh timestamp
    const overviewSheet = ss.getSheetByName(SHEET_NAMES.OVERVIEW);
    if (overviewSheet) {
      overviewSheet.getRange('B2').setValue(new Date());
    }

    SpreadsheetApp.getUi().alert('Data refreshed successfully!');

  } catch (error) {
    Logger.log('Error refreshing data: ' + error.toString());
    SpreadsheetApp.getUi().alert('Error refreshing data: ' + error.toString());
  }
}

/**
 * Fetch data from the API
 */
function fetchApiData() {
  try {
    const response = UrlFetchApp.fetch(API_URL, {
      'method': 'get',
      'muteHttpExceptions': true
    });

    if (response.getResponseCode() !== 200) {
      Logger.log('API Error: ' + response.getContentText());
      return null;
    }

    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log('Fetch error: ' + error.toString());
    return null;
  }
}

/**
 * Get or create a sheet by name
 */
function getOrCreateSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * Clear and set up a sheet with headers
 */
function setupSheet(sheet, headers) {
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#1a73e8')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.setFrozenRows(1);
}

// ============================================================================
// SHEET UPDATE FUNCTIONS
// ============================================================================

/**
 * Update Overview sheet with summary information
 */
function updateOverviewSheet(ss, data) {
  const sheet = getOrCreateSheet(ss, SHEET_NAMES.OVERVIEW);
  sheet.clear();

  // Title
  sheet.getRange('A1').setValue('Inquisitr Newsletter Analytics Dashboard');
  sheet.getRange('A1').setFontSize(18).setFontWeight('bold');
  sheet.getRange('A1:D1').merge();

  // Last updated
  sheet.getRange('A2').setValue('Last Updated:');
  sheet.getRange('B2').setValue(new Date());
  sheet.getRange('B2').setNumberFormat('yyyy-mm-dd hh:mm:ss');

  // Data fetched at
  sheet.getRange('A3').setValue('Data Fetched At:');
  sheet.getRange('B3').setValue(data.fetchedAt || 'N/A');

  // Publications
  sheet.getRange('A5').setValue('Publications:');
  sheet.getRange('A5').setFontWeight('bold');

  const publications = data.publications || [];
  publications.forEach((pub, idx) => {
    sheet.getRange(6 + idx, 1).setValue(pub.name || pub.id);
  });

  // Quick Stats
  sheet.getRange('A10').setValue('Quick Stats');
  sheet.getRange('A10').setFontSize(14).setFontWeight('bold');

  const posts = data.posts || [];
  const subscribers = data.subscribers || [];
  const activeSubscribers = subscribers.filter(s =>
    (s.status || '').toLowerCase() === 'active'
  ).length;

  const stats = [
    ['Total Posts', posts.length],
    ['Total Subscribers', subscribers.length],
    ['Active Subscribers', activeSubscribers],
    ['Publications', publications.length]
  ];

  sheet.getRange(11, 1, stats.length, 2).setValues(stats);

  // Format
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 200);
}

/**
 * Update Metrics Summary sheet
 */
function updateMetricsSheet(ss, data) {
  const sheet = getOrCreateSheet(ss, SHEET_NAMES.METRICS);

  const headers = ['Metric', 'Value', 'Change', 'Status', 'Notes'];
  setupSheet(sheet, headers);

  const posts = data.posts || [];
  const subscribers = data.subscribers || [];

  // Calculate metrics
  const activeSubscribers = subscribers.filter(s =>
    (s.status || '').toLowerCase() === 'active'
  ).length;

  // Get last 30 days of posts
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentPosts = posts.filter(p => {
    const publishDate = new Date(p.publishDate || p.publish_date);
    return publishDate >= thirtyDaysAgo;
  });

  // Calculate aggregated metrics
  let totalDelivered = 0, totalUniqueOpens = 0, totalOpens = 0, totalClicks = 0, totalTrafficSent = 0;

  recentPosts.forEach(post => {
    totalDelivered += post.delivered || 0;
    totalUniqueOpens += post.uniqueOpens || post.unique_opens || 0;
    totalOpens += post.opens || 0;
    totalClicks += post.clicks || 0;

    // Calculate traffic sent from article clicks
    const articleClicks = post.articleClicks || post.article_clicks || [];
    if (Array.isArray(articleClicks)) {
      articleClicks.forEach(article => {
        totalTrafficSent += article.totalClicks || article.total_clicks || 0;
      });
    }
  });

  const openRate = totalDelivered > 0 ? (totalUniqueOpens / totalDelivered) * 100 : 0;
  const ctor = totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0;

  // Calculate growth rate
  const newSubscribers = subscribers.filter(s => {
    const created = new Date(s.created);
    return created >= thirtyDaysAgo;
  }).length;

  const startingSubscribers = activeSubscribers - newSubscribers;
  const growthRate = startingSubscribers > 0 ? (newSubscribers / startingSubscribers) * 100 : 0;

  // Determine status
  const getStatus = (value, min, max) => {
    if (value >= min && value <= max) return '✓ On Track';
    if (value < min) return '⚠ Below Target';
    return '✓ Above Target';
  };

  const metrics = [
    ['Total Subscribers', activeSubscribers, '', activeSubscribers >= TARGETS.subscribers ? '✓ On Track' : '⚠ Below Target', `Target: ${TARGETS.subscribers.toLocaleString()}`],
    ['New Subscribers (30d)', newSubscribers, '', '', 'Subscribers gained in last 30 days'],
    ['Growth Rate', growthRate.toFixed(2) + '%', '', '', '(New subs / Starting subs) × 100'],
    ['Open Rate', openRate.toFixed(2) + '%', '', getStatus(openRate, TARGETS.openRateMin, TARGETS.openRateMax), `Target: ${TARGETS.openRateMin}%-${TARGETS.openRateMax}%`],
    ['CTOR', ctor.toFixed(2) + '%', '', getStatus(ctor, TARGETS.ctorMin, TARGETS.ctorMax), `Target: ${TARGETS.ctorMin}%-${TARGETS.ctorMax}%`],
    ['Traffic Sent', totalTrafficSent, '', totalTrafficSent >= TARGETS.trafficPerSend ? '✓ On Track' : '⚠ Below Target', `Target: ${TARGETS.trafficPerSend.toLocaleString()}`],
    ['Posts Analyzed', recentPosts.length, '', '', 'Last 30 days'],
    ['Total Delivered', totalDelivered, '', '', 'Emails delivered'],
    ['Total Opens', totalOpens, '', '', 'All opens'],
    ['Total Unique Opens', totalUniqueOpens, '', '', 'Unique opens'],
    ['Total Clicks', totalClicks, '', '', 'All clicks']
  ];

  sheet.getRange(2, 1, metrics.length, 5).setValues(metrics);

  // Auto-resize columns
  sheet.autoResizeColumns(1, 5);
}

/**
 * Update Posts (Raw) sheet
 */
function updatePostsSheet(ss, data) {
  const sheet = getOrCreateSheet(ss, SHEET_NAMES.POSTS);

  const headers = [
    'Title', 'Publish Date', 'Publication', 'Recipients', 'Delivered',
    'Opens', 'Unique Opens', 'Open Rate %', 'Clicks', 'Unique Clicks',
    'Click Rate %', 'CTOR %', 'Unsubscribes', 'Article Clicks Total'
  ];
  setupSheet(sheet, headers);

  const posts = data.posts || [];

  const rows = posts.map(post => {
    // Calculate article clicks total
    const articleClicks = post.articleClicks || post.article_clicks || [];
    const articleClicksTotal = Array.isArray(articleClicks)
      ? articleClicks.reduce((sum, a) => sum + (a.totalClicks || a.total_clicks || 0), 0)
      : 0;

    const uniqueOpens = post.uniqueOpens || post.unique_opens || 0;
    const clicks = post.clicks || 0;
    const ctor = uniqueOpens > 0 ? (clicks / uniqueOpens) * 100 : 0;

    return [
      post.title || 'Untitled',
      post.publishDate || post.publish_date || '',
      post.publicationName || post.publication_name || '',
      post.recipients || 0,
      post.delivered || 0,
      post.opens || 0,
      uniqueOpens,
      post.openRate || post.open_rate || 0,
      clicks,
      post.uniqueClicks || post.unique_clicks || 0,
      post.clickRate || post.click_rate || 0,
      ctor.toFixed(2),
      post.unsubscribes || 0,
      articleClicksTotal
    ];
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  // Format date column
  sheet.getRange(2, 2, Math.max(rows.length, 1), 1).setNumberFormat('yyyy-mm-dd hh:mm');

  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Update Subscribers (Raw) sheet
 */
function updateSubscribersSheet(ss, data) {
  const sheet = getOrCreateSheet(ss, SHEET_NAMES.SUBSCRIBERS);

  const headers = [
    'Status', 'Subscribe Date', 'Publication', 'Open Rate %',
    'Click Rate %', 'UTM Source', 'Engagement Tier'
  ];
  setupSheet(sheet, headers);

  const subscribers = data.subscribers || [];

  const rows = subscribers.map(sub => [
    sub.status || '',
    sub.created || sub.subscribeDate || '',
    sub.publicationName || sub.publication_name || '',
    sub.openRate || sub.open_rate || 0,
    sub.clickRate || sub.click_rate || 0,
    sub.utmSource || sub.utm_source || '',
    sub.engagementTier || sub.engagement_tier || ''
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  // Format date column
  sheet.getRange(2, 2, Math.max(rows.length, 1), 1).setNumberFormat('yyyy-mm-dd hh:mm');

  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Update Article Clicks (Raw) sheet
 */
function updateArticleClicksSheet(ss, data) {
  const sheet = getOrCreateSheet(ss, SHEET_NAMES.ARTICLE_CLICKS);

  const headers = [
    'Post Title', 'Article URL', 'Publish Date', 'Publication',
    'Total Clicks', 'Unique Clicks'
  ];
  setupSheet(sheet, headers);

  const topArticles = data.topArticles || [];

  const rows = topArticles.map(article => [
    article.postTitle || article.post_title || '',
    article.url || '',
    article.publishDate || article.publish_date || '',
    article.publicationName || article.publication_name || '',
    article.totalClicks || article.total_clicks || 0,
    article.uniqueClicks || article.unique_clicks || 0
  ]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Update Daily Trends sheet
 */
function updateDailyTrendsSheet(ss, data) {
  const sheet = getOrCreateSheet(ss, SHEET_NAMES.DAILY_TRENDS);

  const headers = [
    'Date', 'Posts', 'Delivered', 'Unique Opens', 'Clicks',
    'Open Rate %', 'CTOR %', 'Traffic Sent'
  ];
  setupSheet(sheet, headers);

  const posts = data.posts || [];

  // Group by date
  const dailyData = {};

  posts.forEach(post => {
    const publishDate = post.publishDate || post.publish_date;
    if (!publishDate) return;

    const dateKey = publishDate.split('T')[0];

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        posts: 0,
        delivered: 0,
        uniqueOpens: 0,
        clicks: 0,
        trafficSent: 0
      };
    }

    dailyData[dateKey].posts += 1;
    dailyData[dateKey].delivered += post.delivered || 0;
    dailyData[dateKey].uniqueOpens += post.uniqueOpens || post.unique_opens || 0;
    dailyData[dateKey].clicks += post.clicks || 0;

    // Article clicks
    const articleClicks = post.articleClicks || post.article_clicks || [];
    if (Array.isArray(articleClicks)) {
      articleClicks.forEach(article => {
        dailyData[dateKey].trafficSent += article.totalClicks || article.total_clicks || 0;
      });
    }
  });

  // Convert to rows and sort by date
  const rows = Object.values(dailyData)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(day => {
      const openRate = day.delivered > 0 ? (day.uniqueOpens / day.delivered) * 100 : 0;
      const ctor = day.uniqueOpens > 0 ? (day.clicks / day.uniqueOpens) * 100 : 0;

      return [
        day.date,
        day.posts,
        day.delivered,
        day.uniqueOpens,
        day.clicks,
        openRate.toFixed(2),
        ctor.toFixed(2),
        day.trafficSent
      ];
    });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Update Top Performers sheet
 */
function updateTopPerformersSheet(ss, data) {
  const sheet = getOrCreateSheet(ss, SHEET_NAMES.TOP_PERFORMERS);
  sheet.clear();

  // Top Posts by Open Rate
  sheet.getRange('A1').setValue('Top Posts by Open Rate');
  sheet.getRange('A1').setFontSize(14).setFontWeight('bold');

  const postsHeaders = ['Rank', 'Title', 'Publish Date', 'Open Rate %', 'Recipients'];
  sheet.getRange(2, 1, 1, postsHeaders.length).setValues([postsHeaders]);
  sheet.getRange(2, 1, 1, postsHeaders.length)
    .setBackground('#34a853')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  const posts = data.posts || [];
  const topPosts = [...posts]
    .sort((a, b) => (b.openRate || b.open_rate || 0) - (a.openRate || a.open_rate || 0))
    .slice(0, 10);

  const postsRows = topPosts.map((post, idx) => [
    idx + 1,
    post.title || 'Untitled',
    (post.publishDate || post.publish_date || '').split('T')[0],
    (post.openRate || post.open_rate || 0).toFixed(2) + '%',
    post.recipients || 0
  ]);

  if (postsRows.length > 0) {
    sheet.getRange(3, 1, postsRows.length, postsHeaders.length).setValues(postsRows);
  }

  // Top Articles by Clicks
  const articlesStartRow = 3 + postsRows.length + 2;
  sheet.getRange(articlesStartRow, 1).setValue('Top Articles by Clicks');
  sheet.getRange(articlesStartRow, 1).setFontSize(14).setFontWeight('bold');

  const articlesHeaders = ['Rank', 'Post Title', 'URL', 'Total Clicks', 'Unique Clicks'];
  sheet.getRange(articlesStartRow + 1, 1, 1, articlesHeaders.length).setValues([articlesHeaders]);
  sheet.getRange(articlesStartRow + 1, 1, 1, articlesHeaders.length)
    .setBackground('#ea4335')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  const topArticles = (data.topArticles || []).slice(0, 10);

  const articlesRows = topArticles.map((article, idx) => [
    idx + 1,
    article.postTitle || article.post_title || '',
    article.url || '',
    article.totalClicks || article.total_clicks || 0,
    article.uniqueClicks || article.unique_clicks || 0
  ]);

  if (articlesRows.length > 0) {
    sheet.getRange(articlesStartRow + 2, 1, articlesRows.length, articlesHeaders.length).setValues(articlesRows);
  }

  sheet.autoResizeColumns(1, 5);
}

/**
 * Update Target Tracking sheet
 */
function updateTargetsSheet(ss, data) {
  const sheet = getOrCreateSheet(ss, SHEET_NAMES.TARGETS);
  sheet.clear();

  // Title
  sheet.getRange('A1').setValue('Target Progress Tracking');
  sheet.getRange('A1').setFontSize(18).setFontWeight('bold');
  sheet.getRange('A1:E1').merge();

  // Deadline info
  const today = new Date();
  const daysRemaining = Math.ceil((TARGETS.deadline - today) / (1000 * 60 * 60 * 24));

  sheet.getRange('A3').setValue('Target Deadline:');
  sheet.getRange('B3').setValue(TARGETS.deadline);
  sheet.getRange('B3').setNumberFormat('mmmm d, yyyy');

  sheet.getRange('A4').setValue('Days Remaining:');
  sheet.getRange('B4').setValue(daysRemaining);

  // Calculate current metrics
  const subscribers = data.subscribers || [];
  const posts = data.posts || [];

  const activeSubscribers = subscribers.filter(s =>
    (s.status || '').toLowerCase() === 'active'
  ).length;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newSubscribers = subscribers.filter(s => {
    const created = new Date(s.created);
    return created >= thirtyDaysAgo;
  }).length;

  const dailyGrowth = newSubscribers / 30;
  const subsNeeded = TARGETS.subscribers - activeSubscribers;
  const requiredDailyGrowth = daysRemaining > 0 ? subsNeeded / daysRemaining : 0;
  const projectedSubscribers = activeSubscribers + (dailyGrowth * daysRemaining);

  // Calculate engagement metrics
  const recentPosts = posts.filter(p => {
    const publishDate = new Date(p.publishDate || p.publish_date);
    return publishDate >= thirtyDaysAgo;
  });

  let totalDelivered = 0, totalUniqueOpens = 0, totalOpens = 0, totalClicks = 0, totalTrafficSent = 0;

  recentPosts.forEach(post => {
    totalDelivered += post.delivered || 0;
    totalUniqueOpens += post.uniqueOpens || post.unique_opens || 0;
    totalOpens += post.opens || 0;
    totalClicks += post.clicks || 0;

    const articleClicks = post.articleClicks || post.article_clicks || [];
    if (Array.isArray(articleClicks)) {
      articleClicks.forEach(article => {
        totalTrafficSent += article.totalClicks || article.total_clicks || 0;
      });
    }
  });

  const openRate = totalDelivered > 0 ? (totalUniqueOpens / totalDelivered) * 100 : 0;
  const ctor = totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0;

  // Targets table
  const headers = ['Metric', 'Current', 'Target', 'Progress %', 'Status', 'Gap'];
  sheet.getRange(6, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(6, 1, 1, headers.length)
    .setBackground('#fbbc04')
    .setFontWeight('bold');

  const getProgress = (current, target) => ((current / target) * 100).toFixed(1);
  const getStatus = (current, target, isRange = false, min = 0, max = 0) => {
    if (isRange) {
      if (current >= min && current <= max) return '✓ On Track';
      if (current < min) return '⚠ Below Target';
      return '✓ Above Target';
    }
    return current >= target ? '✓ On Track' : '⚠ Behind';
  };

  const targetRows = [
    [
      'Subscribers',
      activeSubscribers,
      TARGETS.subscribers,
      getProgress(activeSubscribers, TARGETS.subscribers),
      getStatus(projectedSubscribers, TARGETS.subscribers),
      TARGETS.subscribers - activeSubscribers
    ],
    [
      'Open Rate',
      openRate.toFixed(2) + '%',
      `${TARGETS.openRateMin}%-${TARGETS.openRateMax}%`,
      getProgress(openRate, TARGETS.openRateMin),
      getStatus(openRate, 0, true, TARGETS.openRateMin, TARGETS.openRateMax),
      openRate < TARGETS.openRateMin ? (TARGETS.openRateMin - openRate).toFixed(2) + ' pts' : '0'
    ],
    [
      'CTOR',
      ctor.toFixed(2) + '%',
      `${TARGETS.ctorMin}%-${TARGETS.ctorMax}%`,
      getProgress(ctor, TARGETS.ctorMin),
      getStatus(ctor, 0, true, TARGETS.ctorMin, TARGETS.ctorMax),
      ctor < TARGETS.ctorMin ? (TARGETS.ctorMin - ctor).toFixed(2) + ' pts' : '0'
    ],
    [
      'Traffic/Send',
      totalTrafficSent,
      TARGETS.trafficPerSend,
      getProgress(totalTrafficSent, TARGETS.trafficPerSend),
      getStatus(totalTrafficSent, TARGETS.trafficPerSend),
      Math.max(0, TARGETS.trafficPerSend - totalTrafficSent)
    ]
  ];

  sheet.getRange(7, 1, targetRows.length, headers.length).setValues(targetRows);

  // Growth projections
  sheet.getRange('A13').setValue('Growth Projections');
  sheet.getRange('A13').setFontSize(14).setFontWeight('bold');

  const projections = [
    ['Current Daily Growth', dailyGrowth.toFixed(2) + ' subs/day'],
    ['Required Daily Growth', requiredDailyGrowth.toFixed(2) + ' subs/day'],
    ['Growth Gap', (dailyGrowth - requiredDailyGrowth).toFixed(2) + ' subs/day'],
    ['Projected Subscribers by Deadline', Math.round(projectedSubscribers).toLocaleString()],
    ['Will Hit Target?', projectedSubscribers >= TARGETS.subscribers ? 'YES ✓' : 'NO ⚠']
  ];

  sheet.getRange(14, 1, projections.length, 2).setValues(projections);

  sheet.autoResizeColumns(1, 6);
}

// ============================================================================
// MENU & TRIGGERS
// ============================================================================

/**
 * Create custom menu when spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 Inquisitr Analytics')
    .addItem('🔄 Refresh All Data', 'refreshAllData')
    .addSeparator()
    .addItem('📈 Update Metrics Only', 'updateMetricsOnly')
    .addItem('🎯 Update Targets Only', 'updateTargetsOnly')
    .addSeparator()
    .addItem('⚙️ Setup Auto-Refresh', 'setupAutoRefresh')
    .addItem('❌ Remove Auto-Refresh', 'removeAutoRefresh')
    .addToUi();
}

/**
 * Update only metrics sheet
 */
function updateMetricsOnly() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = fetchApiData();

  if (data) {
    updateMetricsSheet(ss, data);
    SpreadsheetApp.getUi().alert('Metrics updated!');
  }
}

/**
 * Update only targets sheet
 */
function updateTargetsOnly() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = fetchApiData();

  if (data) {
    updateTargetsSheet(ss, data);
    SpreadsheetApp.getUi().alert('Targets updated!');
  }
}

/**
 * Setup automatic refresh trigger (runs every 6 hours)
 */
function setupAutoRefresh() {
  // Remove existing triggers first
  removeAutoRefresh();

  // Create new trigger
  ScriptApp.newTrigger('refreshAllData')
    .timeBased()
    .everyHours(6)
    .create();

  SpreadsheetApp.getUi().alert('Auto-refresh set up! Data will refresh every 6 hours.');
}

/**
 * Remove automatic refresh trigger
 */
function removeAutoRefresh() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'refreshAllData') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  SpreadsheetApp.getUi().alert('Auto-refresh removed.');
}
