/**
 * Inquisitr Newsletter Analytics - API Server
 * Fetches data from Beehiiv API and serves to React dashboard
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// ===================== CONFIGURATION =====================
const CONFIG = {
  API_KEY: process.env.BEEHIIV_API_KEY || 'aUIfwXllHrpVDbCFu9kTuJdWxvwwVALTqeGGC2TLWPY1zF3ZlMed0bYD0iEe5EGM',
  API_BASE_URL: 'https://api.beehiiv.com/v2',
  CONTENT_DOMAINS: ['inquisitr.com', 'www.inquisitr.com'],
  RATE_LIMIT_DELAY_MS: 200,
  MAX_PER_PAGE: 100,
  CACHE_FILE: path.join(__dirname, 'data-cache.json'),
  REFRESH_INTERVAL_MS: parseInt(process.env.REFRESH_INTERVAL_HOURS || '2', 10) * 60 * 60 * 1000 // Default 2 hours, configurable
};

const HEADERS = {
  'Authorization': `Bearer ${CONFIG.API_KEY}`,
  'Content-Type': 'application/json'
};

app.use(cors());
app.use(express.json());

// ===================== UTILITIES =====================
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function toPercentage(rate) {
  if (!rate || rate === 0) return 0;
  const num = parseFloat(rate);
  if (num > 100) return num / 100;
  if (num > 1 && num <= 100) return num;
  if (num > 0 && num <= 1) return num * 100;
  return 0;
}

function categorizeUrl(url) {
  if (!url) return 'Unknown';
  const urlLower = url.toLowerCase();
  for (const domain of CONFIG.CONTENT_DOMAINS) {
    if (urlLower.includes(domain.toLowerCase())) return 'Article';
  }
  if (urlLower.includes('facebook.com/sharer') || urlLower.includes('twitter.com/intent')) return 'Social';
  if (urlLower.includes('beehiiv.com')) return 'Beehiiv';
  return 'Other';
}

// ===================== API HELPERS =====================
async function makeApiRequest(endpoint, params = {}) {
  await delay(CONFIG.RATE_LIMIT_DELAY_MS);

  const url = new URL(`${CONFIG.API_BASE_URL}${endpoint}`);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      value.forEach(v => url.searchParams.append(`${key}[]`, v));
    } else {
      url.searchParams.append(key, value);
    }
  }

  const response = await fetch(url.toString(), { headers: HEADERS });

  if (response.status === 429) {
    console.log('Rate limited, waiting 60s...');
    await delay(60000);
    return makeApiRequest(endpoint, params);
  }

  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function fetchAllPages(endpoint, params = {}) {
  const allData = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await makeApiRequest(endpoint, { ...params, page, limit: CONFIG.MAX_PER_PAGE });
    if (response.data?.length > 0) {
      allData.push(...response.data);
      page++;
      hasMore = page <= (response.total_pages || 1);
    } else {
      hasMore = false;
    }
  }
  return allData;
}

async function fetchAllPagesCursor(endpoint, params = {}) {
  const allData = [];
  let cursor = null;
  let pageCount = 0;

  while (pageCount < 500) {
    const requestParams = { ...params, limit: CONFIG.MAX_PER_PAGE };
    if (cursor) requestParams.cursor = cursor;

    const response = await makeApiRequest(endpoint, requestParams);

    if (response.data?.length > 0) {
      allData.push(...response.data);
      cursor = response.next_cursor;
      if (!response.has_more || !cursor) break;
      pageCount++;
      if (pageCount % 10 === 0) console.log(`  Fetched ${allData.length} records...`);
    } else {
      break;
    }
  }
  return allData;
}

// ===================== DATA FETCHERS =====================
async function getPublications() {
  console.log('  Fetching publications...');
  const response = await makeApiRequest('/publications', { 'expand[]': 'stats' });
  return response.data || [];
}

async function getPosts(pubId) {
  console.log('  Fetching posts...');
  return fetchAllPages(`/publications/${pubId}/posts`, {
    'expand[]': 'stats',
    status: 'confirmed',
    direction: 'desc',
    order_by: 'publish_date'
  });
}

async function getSubscribers(pubId) {
  console.log('  Fetching subscribers...');
  return fetchAllPagesCursor(`/publications/${pubId}/subscriptions`, {
    'expand[]': 'stats',
    status: 'all'
  });
}

async function getSegments(pubId) {
  console.log('  Fetching segments...');
  const segments = await fetchAllPages(`/publications/${pubId}/segments`, {});

  // Fetch detailed stats for each segment
  const detailedSegments = [];
  for (const seg of segments.slice(0, 20)) { // Limit to 20 segments
    try {
      const detail = await makeApiRequest(`/publications/${pubId}/segments/${seg.id}`, {
        'expand[]': 'stats'
      });
      detailedSegments.push(detail.data || seg);
    } catch (e) {
      detailedSegments.push(seg);
    }
  }
  return detailedSegments;
}

// ===================== DATA PROCESSING =====================
function processPublicationData(pub) {
  const stats = pub.stats || {};
  return {
    id: pub.id,
    name: pub.name,
    activeSubscribers: stats.active_subscriptions || 0,
    premiumSubscribers: stats.active_premium_subscriptions || 0,
    freeSubscribers: stats.active_free_subscriptions || 0,
    avgOpenRate: toPercentage(stats.average_open_rate),
    avgClickRate: toPercentage(stats.average_click_rate),
    totalSent: stats.total_sent || 0,
    totalOpened: stats.total_unique_opened || 0,
    totalClicked: stats.total_clicked || 0
  };
}

function processPostData(post, pubName) {
  const emailStats = post.stats?.email || {};
  const clicks = post.stats?.clicks || [];

  // Extract article clicks
  const articleClicks = clicks
    .filter(c => categorizeUrl(c.url) === 'Article')
    .map(c => ({
      url: c.url,
      totalClicks: c.total_clicks || 0,
      uniqueClicks: c.total_unique_clicks || 0,
      emailClicks: c.email?.clicks || 0
    }));

  return {
    id: post.id,
    title: post.title || 'Untitled',
    subtitle: post.subtitle || '',
    publishDate: post.publish_date ? new Date(post.publish_date * 1000).toISOString() : null,
    status: post.status,
    webUrl: post.web_url,
    publicationName: pubName,
    recipients: emailStats.recipients || 0,
    delivered: emailStats.delivered || 0,
    opens: emailStats.opens || 0,
    uniqueOpens: emailStats.unique_opens || 0,
    openRate: toPercentage(emailStats.open_rate),
    clicks: emailStats.clicks || 0,
    uniqueClicks: emailStats.unique_clicks || 0,
    clickRate: toPercentage(emailStats.click_rate),
    unsubscribes: emailStats.unsubscribes || 0,
    spamReports: emailStats.spam_reports || 0,
    articleClicks
  };
}

function processSubscriberData(sub, pubName) {
  const stats = sub.stats || {};
  const openRate = toPercentage(stats.open_rate || 0);

  let engagementTier;
  if (openRate >= 50) engagementTier = 'High';
  else if (openRate >= 20) engagementTier = 'Medium';
  else if (openRate >= 5) engagementTier = 'Low';
  else if (openRate > 0) engagementTier = 'Very Low';
  else engagementTier = 'No Data';

  return {
    id: sub.id,
    email: sub.email,
    status: sub.status,
    tier: sub.subscription_tier || 'free',
    created: sub.created ? new Date(sub.created * 1000).toISOString() : null,
    publicationName: pubName,
    utmSource: sub.utm_source || 'direct',
    utmMedium: sub.utm_medium || '',
    utmCampaign: sub.utm_campaign || '',
    emailsReceived: stats.emails_received || stats.total_emails || 0,
    openRate: openRate,
    clickRate: toPercentage(stats.click_through_rate || stats.click_rate || 0),
    engagementTier
  };
}

function processSegmentData(seg, pubName) {
  const stats = seg.stats || {};
  return {
    id: seg.id,
    name: seg.name,
    type: seg.type,
    status: seg.status,
    publicationName: pubName,
    totalSubscribers: seg.total_results || stats.total_subscribers || 0,
    openRate: toPercentage(stats.open_rate),
    clickRate: toPercentage(stats.clickthrough_rate),
    totalSent: stats.total_sent || 0,
    totalDelivered: stats.total_delivered || 0
  };
}

function calculateOverviewMetrics(posts, subscribers) {
  const activeSubs = subscribers.filter(s => s.status === 'active');
  const organicSubs = activeSubs.filter(s => !s.utmSource || s.utmSource === 'direct' || s.utmSource === 'website');
  const inorganicSubs = activeSubs.filter(s => s.utmSource && s.utmSource !== 'direct' && s.utmSource !== 'website');

  const confirmedPosts = posts.filter(p => p.status === 'confirmed' && p.recipients >= 100);

  let totalRecipients = 0, totalUnsubscribes = 0, totalSpam = 0;
  let sumOpenRate = 0, sumClickRate = 0;

  for (const post of confirmedPosts) {
    totalRecipients += post.recipients;
    totalUnsubscribes += post.unsubscribes;
    totalSpam += post.spamReports;
    sumOpenRate += post.openRate;
    sumClickRate += post.clickRate;
  }

  const avgOpenRate = confirmedPosts.length > 0 ? sumOpenRate / confirmedPosts.length : 0;
  const avgClickRate = confirmedPosts.length > 0 ? sumClickRate / confirmedPosts.length : 0;
  const unsubRate = totalRecipients > 0 ? (totalUnsubscribes / totalRecipients) * 100 : 0;
  const spamRate = totalRecipients > 0 ? (totalSpam / totalRecipients) * 100 : 0;

  // Engagement distribution
  const engagementDist = { High: 0, Medium: 0, Low: 0, 'Very Low': 0, 'No Data': 0 };
  for (const sub of activeSubs) {
    engagementDist[sub.engagementTier] = (engagementDist[sub.engagementTier] || 0) + 1;
  }

  // UTM source distribution
  const utmDist = {};
  for (const sub of activeSubs) {
    const src = sub.utmSource || 'direct';
    utmDist[src] = (utmDist[src] || 0) + 1;
  }

  return {
    totalSubscribers: activeSubs.length,
    organicUsers: organicSubs.length,
    inorganicUsers: inorganicSubs.length,
    totalUnsubscribes,
    totalSpamReports: totalSpam,
    totalNewsletterSends: confirmedPosts.length,
    avgOpenRate,
    avgClickRate,
    unsubscribeRate: unsubRate,
    spamRate,
    engagementDistribution: engagementDist,
    utmDistribution: utmDist
  };
}

function extractTopArticles(posts) {
  const articleMap = new Map();

  for (const post of posts) {
    for (const article of post.articleClicks) {
      const key = article.url;
      if (articleMap.has(key)) {
        const existing = articleMap.get(key);
        existing.totalClicks += article.totalClicks;
        existing.uniqueClicks += article.uniqueClicks;
      } else {
        articleMap.set(key, {
          url: article.url,
          postTitle: post.title,
          publishDate: post.publishDate,
          totalClicks: article.totalClicks,
          uniqueClicks: article.uniqueClicks
        });
      }
    }
  }

  return Array.from(articleMap.values())
    .sort((a, b) => b.totalClicks - a.totalClicks)
    .slice(0, 15);
}

// ===================== MAIN FETCH =====================
async function fetchAllData() {
  console.log('\n=== Fetching Beehiiv Data (All Publications) ===');
  const startTime = Date.now();

  try {
    // First, get all publications in the account
    const publications = await getPublications();
    console.log(`  Found ${publications.length} publication(s)`);

    const allPosts = [];
    const allSubscribers = [];
    const allSegments = [];
    const publicationsInfo = [];

    // Fetch data for each publication
    for (const pub of publications) {
      const pubId = pub.id;
      const pubName = pub.name || 'Unknown';
      console.log(`\n  Processing: ${pubName} (${pubId})`);

      publicationsInfo.push(processPublicationData(pub));

      // Fetch posts and subscribers for this publication
      try {
        const [rawPosts, rawSubscribers] = await Promise.all([
          getPosts(pubId),
          getSubscribers(pubId)
        ]);

        console.log(`    Posts: ${rawPosts.length}, Subscribers: ${rawSubscribers.length}`);

        // Process and add to combined arrays
        const posts = rawPosts.map(p => processPostData(p, pubName));
        const subscribers = rawSubscribers.map(s => processSubscriberData(s, pubName));

        allPosts.push(...posts);
        allSubscribers.push(...subscribers);

        // Fetch segments (optional)
        try {
          const rawSegments = await getSegments(pubId);
          const segments = rawSegments.map(s => processSegmentData(s, pubName));
          allSegments.push(...segments);
        } catch (e) {
          console.log(`    Segments fetch failed for ${pubName}, continuing...`);
        }
      } catch (e) {
        console.error(`    Error fetching data for ${pubName}:`, e.message);
      }
    }

    console.log(`\n  Total: ${allPosts.length} posts, ${allSubscribers.length} subscribers`);

    // Calculate combined overview
    const overview = calculateOverviewMetrics(allPosts, allSubscribers);
    const topArticles = extractTopArticles(allPosts);

    const data = {
      publications: publicationsInfo,
      overview,
      posts: allPosts,
      subscribers: allSubscribers,
      segments: allSegments,
      topArticles,
      fetchedAt: new Date().toISOString(),
      fetchDuration: Date.now() - startTime
    };

    // Cache
    fs.writeFileSync(CONFIG.CACHE_FILE, JSON.stringify(data, null, 2));
    console.log(`=== Data fetched in ${data.fetchDuration}ms ===\n`);

    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

function loadCache() {
  try {
    if (fs.existsSync(CONFIG.CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG.CACHE_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Cache load error:', e);
  }
  return null;
}

function isCacheStale(data) {
  if (!data?.fetchedAt) return true;
  return Date.now() - new Date(data.fetchedAt).getTime() > CONFIG.REFRESH_INTERVAL_MS;
}

// ===================== ROUTES =====================
app.get('/api/data', async (_req, res) => {
  try {
    let data = loadCache();
    if (!data || isCacheStale(data)) {
      data = await fetchAllData();
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/refresh', async (_req, res) => {
  try {
    const data = await fetchAllData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/status', (_req, res) => {
  const data = loadCache();
  const fetchedAt = data?.fetchedAt || null;
  const ageMinutes = fetchedAt ? Math.round((Date.now() - new Date(fetchedAt).getTime()) / 60000) : null;
  res.json({
    hasCachedData: !!data,
    fetchedAt,
    ageMinutes,
    isStale: data ? isCacheStale(data) : true,
    refreshIntervalHours: Math.round(CONFIG.REFRESH_INTERVAL_MS / 3600000),
    nextRefresh: fetchedAt
      ? new Date(new Date(fetchedAt).getTime() + CONFIG.REFRESH_INTERVAL_MS).toISOString()
      : null
  });
});

// ===================== AUTO REFRESH =====================
let refreshTimer = null;

function scheduleRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);

  const data = loadCache();
  let nextIn = CONFIG.REFRESH_INTERVAL_MS;

  if (data?.fetchedAt) {
    const elapsed = Date.now() - new Date(data.fetchedAt).getTime();
    nextIn = Math.max(60000, CONFIG.REFRESH_INTERVAL_MS - elapsed); // Min 1 minute
  }

  const refreshHours = Math.round(CONFIG.REFRESH_INTERVAL_MS / 3600000);
  console.log(`Auto-refresh interval: ${refreshHours}h | Next refresh in ${Math.round(nextIn / 60000)} minutes`);

  refreshTimer = setTimeout(async () => {
    console.log('Auto-refresh triggered at', new Date().toISOString());
    try {
      await fetchAllData();
      console.log('Auto-refresh completed successfully');
    } catch (e) {
      console.error('Auto-refresh failed:', e.message);
    }
    scheduleRefresh();
  }, nextIn);
}

// ===================== PRODUCTION STATIC FILES =====================
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || PORT;

if (isProduction) {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));

  // Serve index.html for all non-API routes (SPA support)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ===================== START =====================
app.listen(port, async () => {
  const refreshHours = Math.round(CONFIG.REFRESH_INTERVAL_MS / 3600000);
  console.log(`\n${'═'.repeat(50)}`);
  console.log('  Inquisitr Analytics API Server');
  console.log(`  http://localhost:${port}`);
  console.log(`  Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`${'═'.repeat(50)}`);
  console.log('\nEndpoints:');
  console.log('  GET  /api/data    - Cached data');
  console.log('  POST /api/refresh - Force refresh');
  console.log('  GET  /api/status  - Cache status');
  console.log(`\nAuto-refresh: Every ${refreshHours} hour(s)\n`);

  const cached = loadCache();
  if (!cached || isCacheStale(cached)) {
    const reason = !cached ? 'No cache found' : `Cache stale (fetched ${cached.fetchedAt})`;
    console.log(`${reason}, fetching fresh data...`);
    try {
      await fetchAllData();
    } catch (e) {
      console.error('Initial fetch failed:', e.message);
    }
  } else {
    console.log(`Cache is fresh (fetched ${cached.fetchedAt})`);
  }
  scheduleRefresh();
});
