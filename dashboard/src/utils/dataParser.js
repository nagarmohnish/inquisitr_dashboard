import { parseISO, subDays, isWithinInterval, startOfDay, endOfDay, format } from 'date-fns';

// Use relative URLs - Vite proxy will handle /api in dev, production serves from same origin
const API_BASE = '';

// Fetch data from backend API
export async function fetchApiData() {
  try {
    const response = await fetch(`${API_BASE}/api/data`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Cannot connect to API server. Make sure the server is running on port 3001.');
    }
    throw err;
  }
}

// Force refresh data from Beehiiv API
export async function refreshApiData() {
  try {
    const response = await fetch(`${API_BASE}/api/refresh`, { method: 'POST' });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }
    return await response.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Cannot connect to API server. Make sure the server is running on port 3001.');
    }
    throw err;
  }
}

// Get API cache status
export async function getApiStatus() {
  const response = await fetch(`${API_BASE}/api/status`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return await response.json();
}

// Normalize API data to consistent format for the dashboard
// Handles both camelCase (new) and snake_case (old) formats
// Now supports multiple publications
export function normalizeApiData(apiData) {
  const { publications = [], publication, overview, posts = [], subscribers = [], segments = [], topArticles = [] } = apiData || {};

  // Get list of publication names for the dropdown
  const publicationsList = publications.length > 0
    ? publications.map(p => ({ id: p.id, name: p.name }))
    : publication ? [{ id: publication.id, name: publication.name }] : [];

  return {
    publications: publicationsList,
    publication: publication || (publications.length > 0 ? publications[0] : null),
    overview: overview || {},
    posts: (posts || []).map(p => ({
      'Title': p.title,
      'Publish Date': p.publishDate || p.publish_date,
      'Publication Name': p.publicationName || p.publication_name,
      'Recipients': p.recipients || 0,
      'Delivered': p.delivered || 0,
      'Opens': p.opens || 0,
      'Unique Opens': p.uniqueOpens || p.unique_opens || 0,
      'Open Rate %': p.openRate || p.open_rate || 0,
      'Clicks': p.clicks || 0,
      'Unique Clicks': p.uniqueClicks || p.unique_clicks || 0,
      'Click Rate %': p.clickRate || p.click_rate || 0,
      'CTOR': (p.uniqueOpens || p.unique_opens) > 0 ? (p.clicks / (p.uniqueOpens || p.unique_opens)) * 100 : (p.ctor || 0),
      'Unsubscribes': p.unsubscribes || 0,
      'Article Clicks': p.articleClicks || p.article_clicks || []
    })),
    subscribers: (subscribers || []).map(s => ({
      'Status': s.status,
      'Subscribe Date': s.created,
      'Publication Name': s.publicationName || s.publication_name,
      'Open Rate %': s.openRate || s.open_rate || 0,
      'Click Rate %': s.clickRate || s.click_rate || 0,
      'UTM Source': s.utmSource || s.utm_source,
      'Engagement Tier': s.engagementTier || s.engagement_tier
    })),
    articleClicks: (topArticles || []).map(a => ({
      'Article URL': a.url,
      'Post Title': a.postTitle,
      'Publish Date': a.publishDate,
      'Publication Name': a.publicationName || '',
      'Total Clicks': a.totalClicks || 0,
      'Unique Clicks': a.uniqueClicks || 0
    })),
    segments: segments || [],
    fetchedAt: apiData?.fetchedAt || new Date().toISOString()
  };
}

export function filterBySource(data, source, publications = []) {
  if (source === 'overall') return data;

  // Find publication name from source (which could be publication id or name)
  const pub = publications.find(p => p.id === source || p.name === source);
  const pubName = pub?.name || source;

  return data.filter(item => {
    const itemPubName = item['Publication Name'] || item['publicationName'] || '';
    // Exact match comparison (case-insensitive)
    return itemPubName.toLowerCase() === pubName.toLowerCase();
  });
}

export function getDateRange(posts, timePeriod, customRange = null) {
  // If custom range is provided and timePeriod is custom, use it directly
  if (timePeriod === 'custom' && customRange) {
    return {
      start: startOfDay(customRange.start),
      end: endOfDay(customRange.end)
    };
  }

  const dates = posts
    .map(p => p['Publish Date'] || p['publishDate'])
    .filter(Boolean)
    .map(d => {
      if (d instanceof Date) return d;
      try {
        return parseISO(d);
      } catch {
        return new Date(d);
      }
    })
    .filter(d => !isNaN(d.getTime()))
    .sort((a, b) => b - a);

  if (dates.length === 0) return { start: subDays(new Date(), 30), end: endOfDay(new Date()) };

  const mostRecent = endOfDay(dates[0]);

  switch (timePeriod) {
    case 'yesterday':
      const yesterday = subDays(mostRecent, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    case '7day':
      return { start: startOfDay(subDays(mostRecent, 7)), end: mostRecent };
    case '30day':
    case 'monthly':
      return { start: startOfDay(subDays(mostRecent, 30)), end: mostRecent };
    case '90day':
      return { start: startOfDay(subDays(mostRecent, 90)), end: mostRecent };
    case 'alltime':
      return { start: startOfDay(subDays(mostRecent, 365)), end: mostRecent };
    default:
      return { start: startOfDay(subDays(mostRecent, 7)), end: mostRecent };
  }
}

export function filterByDateRange(data, dateRange, dateField = 'Publish Date') {
  return data.filter(item => {
    const itemDate = item[dateField] || item['publishDate'];
    if (!itemDate) return false;
    try {
      const date = itemDate instanceof Date ? itemDate : parseISO(itemDate);
      if (isNaN(date.getTime())) return false;
      return isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
    } catch {
      return false;
    }
  });
}

// Filter subscribers by subscription date within a date range
export function filterSubscribersByDateRange(subscribers, dateRange) {
  return subscribers.filter(s => {
    const subscribeDate = s['Subscribe Date'] || s['created'];
    if (!subscribeDate) return false;
    try {
      const date = subscribeDate instanceof Date ? subscribeDate : parseISO(subscribeDate);
      if (isNaN(date.getTime())) return false;
      return isWithinInterval(date, { start: startOfDay(dateRange.start), end: endOfDay(dateRange.end) });
    } catch {
      return false;
    }
  });
}

// Calculate traffic sent (article clicks) from posts
export function calculateTrafficSent(posts) {
  let totalTrafficSent = 0;
  posts.forEach(post => {
    const articleClicks = post['Article Clicks'] || post['articleClicks'] || [];
    if (Array.isArray(articleClicks)) {
      articleClicks.forEach(article => {
        totalTrafficSent += article.totalClicks || article['Total Clicks'] || 0;
      });
    }
  });
  return totalTrafficSent;
}

export function calculateMetrics(posts, subscribers, priorPosts, priorSubscribers, dateRange, priorDateRange) {
  // Total active subscribers (all time - this is the current subscriber count)
  const activeSubscribers = subscribers.filter(s =>
    (s['Status'] || s['status'])?.toLowerCase() === 'active'
  ).length;

  // New subscribers in the current period (subscribed within the date range)
  const newSubscribersInPeriod = dateRange
    ? filterSubscribersByDateRange(subscribers, dateRange).length
    : 0;

  // New subscribers in the prior period
  const newSubscribersInPriorPeriod = priorDateRange
    ? filterSubscribersByDateRange(subscribers, priorDateRange).length
    : 0;

  // Calculate starting subscribers at the beginning of the period
  // Starting subs = current active subs - new subs gained in period
  const startingSubscribers = activeSubscribers - newSubscribersInPeriod;

  // Subscriber growth rate = (new subs in period / starting subs) * 100
  const subsGrowthRate = startingSubscribers > 0
    ? (newSubscribersInPeriod / startingSubscribers) * 100
    : (newSubscribersInPeriod > 0 ? 100 : 0);

  // Prior period growth rate for comparison
  const startingSubsPrior = startingSubscribers - newSubscribersInPriorPeriod;
  const priorSubsGrowthRate = startingSubsPrior > 0
    ? (newSubscribersInPriorPeriod / startingSubsPrior) * 100
    : (newSubscribersInPriorPeriod > 0 ? 100 : 0);

  // Aggregate post metrics
  const totalDelivered = posts.reduce((sum, p) => sum + (p['Delivered'] || p['delivered'] || 0), 0);
  const totalOpens = posts.reduce((sum, p) => sum + (p['Opens'] || p['opens'] || 0), 0);
  const totalUniqueOpens = posts.reduce((sum, p) => sum + (p['Unique Opens'] || p['uniqueOpens'] || 0), 0);
  const totalClicks = posts.reduce((sum, p) => sum + (p['Clicks'] || p['clicks'] || 0), 0);

  const priorTotalDelivered = priorPosts.reduce((sum, p) => sum + (p['Delivered'] || p['delivered'] || 0), 0);
  const priorTotalOpens = priorPosts.reduce((sum, p) => sum + (p['Opens'] || p['opens'] || 0), 0);
  const priorTotalUniqueOpens = priorPosts.reduce((sum, p) => sum + (p['Unique Opens'] || p['uniqueOpens'] || 0), 0);
  const priorTotalClicks = priorPosts.reduce((sum, p) => sum + (p['Clicks'] || p['clicks'] || 0), 0);

  // Open Rate = unique opens / delivered
  const openRate = totalDelivered > 0 ? (totalUniqueOpens / totalDelivered) * 100 : 0;
  const priorOpenRate = priorTotalDelivered > 0 ? (priorTotalUniqueOpens / priorTotalDelivered) * 100 : 0;
  const openRateChange = openRate - priorOpenRate;

  // Traffic Sent = sum of all article clicks from posts
  const trafficSent = calculateTrafficSent(posts);
  const priorTrafficSent = calculateTrafficSent(priorPosts);
  const trafficSentChange = trafficSent - priorTrafficSent;

  // CTR (Click-through Rate) = unique clicks / delivered * 100
  const totalUniqueClicks = posts.reduce((sum, p) => sum + (p['Unique Clicks'] || p['uniqueClicks'] || 0), 0);
  const priorTotalUniqueClicks = priorPosts.reduce((sum, p) => sum + (p['Unique Clicks'] || p['uniqueClicks'] || 0), 0);
  const ctr = totalDelivered > 0 ? (totalUniqueClicks / totalDelivered) * 100 : 0;
  const priorCtr = priorTotalDelivered > 0 ? (priorTotalUniqueClicks / priorTotalDelivered) * 100 : 0;
  const ctrChange = ctr - priorCtr;

  // CTOR (Click-to-Open Rate) = unique clicks / unique opens * 100
  // This matches Beehiiv's "CTR" metric
  const ctor = totalUniqueOpens > 0 ? (totalUniqueClicks / totalUniqueOpens) * 100 : 0;
  const priorCtor = priorTotalUniqueOpens > 0 ? (priorTotalUniqueClicks / priorTotalUniqueOpens) * 100 : 0;
  const ctorChange = ctor - priorCtor;

  // Unsubscribe Rate = total unsubscribes / total delivered * 100
  const totalUnsubscribes = posts.reduce((sum, p) => sum + (p['Unsubscribes'] || p['unsubscribes'] || 0), 0);
  const priorTotalUnsubscribes = priorPosts.reduce((sum, p) => sum + (p['Unsubscribes'] || p['unsubscribes'] || 0), 0);
  const unsubscribeRate = totalDelivered > 0 ? (totalUnsubscribes / totalDelivered) * 100 : 0;
  const priorUnsubscribeRate = priorTotalDelivered > 0 ? (priorTotalUnsubscribes / priorTotalDelivered) * 100 : 0;
  const unsubscribeRateChange = unsubscribeRate - priorUnsubscribeRate;

  // Active Subscriber Rate (based on engagement tier)
  // Calculate what percentage of subscribers are "engaged" (not inactive)
  const engagedSubscribers = subscribers.filter(s => {
    const tier = (s['Engagement Tier'] || s['engagementTier'] || '').toLowerCase();
    const status = (s['Status'] || s['status'] || '').toLowerCase();
    // Count as engaged if active and not in the "cold" or inactive tier
    return status === 'active' && tier !== 'cold' && tier !== 'inactive';
  }).length;
  const activeRate = activeSubscribers > 0 ? (engagedSubscribers / activeSubscribers) * 100 : 0;

  // Bounce Rate estimate (delivered vs recipients)
  // Bounce Rate = (recipients - delivered) / recipients * 100
  const totalRecipients = posts.reduce((sum, p) => sum + (p['Recipients'] || p['recipients'] || 0), 0);
  const priorTotalRecipients = priorPosts.reduce((sum, p) => sum + (p['Recipients'] || p['recipients'] || 0), 0);
  const bounceRate = totalRecipients > 0 ? ((totalRecipients - totalDelivered) / totalRecipients) * 100 : 0;
  const priorBounceRate = priorTotalRecipients > 0 ? ((priorTotalRecipients - priorTotalDelivered) / priorTotalRecipients) * 100 : 0;
  const bounceRateChange = bounceRate - priorBounceRate;

  return {
    totalSubs: { value: activeSubscribers, change: newSubscribersInPeriod },
    newSubscribers: { value: newSubscribersInPeriod, change: newSubscribersInPeriod - newSubscribersInPriorPeriod },
    subsGrowthRate: { value: subsGrowthRate, change: subsGrowthRate - priorSubsGrowthRate },
    openRate: { value: openRate, change: openRateChange },
    ctr: { value: ctr, change: ctrChange },
    trafficSent: { value: trafficSent, change: trafficSentChange },
    ctor: { value: ctor, change: ctorChange },
    unsubscribeRate: { value: unsubscribeRate, change: unsubscribeRateChange },
    activeRate: { value: activeRate, change: 0 },
    bounceRate: { value: bounceRate, change: bounceRateChange },
    totalUnsubscribes: { value: totalUnsubscribes, change: totalUnsubscribes - priorTotalUnsubscribes }
  };
}

export function calculateTrendData(posts) {
  const dailyData = {};

  posts.forEach(post => {
    const date = post['Publish Date'] || post['publishDate'];
    if (!date) return;

    let dateKey;
    try {
      const parsedDate = date instanceof Date ? date : parseISO(date);
      if (isNaN(parsedDate.getTime())) return;
      dateKey = format(parsedDate, 'yyyy-MM-dd');
    } catch {
      return;
    }

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        delivered: 0,
        recipients: 0,
        uniqueOpens: 0,
        uniqueClicks: 0,
        clicks: 0,
        unsubscribes: 0,
        trafficSent: 0,
        posts: 0
      };
    }

    dailyData[dateKey].delivered += post['Delivered'] || post['delivered'] || 0;
    dailyData[dateKey].recipients += post['Recipients'] || post['recipients'] || post['Delivered'] || post['delivered'] || 0;
    dailyData[dateKey].uniqueOpens += post['Unique Opens'] || post['uniqueOpens'] || 0;
    dailyData[dateKey].uniqueClicks += post['Unique Clicks'] || post['uniqueClicks'] || 0;
    dailyData[dateKey].clicks += post['Clicks'] || post['clicks'] || 0;
    dailyData[dateKey].unsubscribes += post['Unsubscribes'] || post['unsubscribes'] || 0;
    dailyData[dateKey].posts += 1;

    // Calculate traffic sent from article clicks
    const articleClicks = post['Article Clicks'] || post['articleClicks'] || [];
    if (Array.isArray(articleClicks)) {
      articleClicks.forEach(article => {
        dailyData[dateKey].trafficSent += article.totalClicks || article['Total Clicks'] || 0;
      });
    }
  });

  return Object.values(dailyData)
    .map(day => ({
      date: day.date,
      openRate: day.delivered > 0 ? (day.uniqueOpens / day.delivered) * 100 : 0,
      ctr: day.delivered > 0 ? (day.uniqueClicks / day.delivered) * 100 : 0,
      ctor: day.uniqueOpens > 0 ? (day.uniqueClicks / day.uniqueOpens) * 100 : 0, // Matches Beehiiv's CTR
      unsubscribeRate: day.delivered > 0 ? (day.unsubscribes / day.delivered) * 100 : 0,
      bounceRate: day.recipients > 0 ? ((day.recipients - day.delivered) / day.recipients) * 100 : 0,
      delivered: day.delivered,
      recipients: day.recipients,
      uniqueClicks: day.uniqueClicks,
      clicks: day.clicks,
      trafficSent: day.trafficSent
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getTopArticles(articleClicks, limit = 10) {
  return [...articleClicks]
    .sort((a, b) => (b['Total Clicks'] || b['totalClicks'] || 0) - (a['Total Clicks'] || a['totalClicks'] || 0))
    .slice(0, limit)
    .map(article => ({
      title: article['Post Title'] || article['postTitle'] || article['Article URL'] || 'Untitled',
      url: article['Article URL'] || article['url'] || '',
      publishDate: article['Publish Date'] || article['publishDate'],
      totalClicks: article['Total Clicks'] || article['totalClicks'] || 0,
      uniqueClicks: article['Unique Clicks'] || article['uniqueClicks'] || 0
    }));
}

export function getTopPosts(posts, limit = 10) {
  return [...posts]
    .sort((a, b) => (b['Open Rate %'] || b['openRate'] || 0) - (a['Open Rate %'] || a['openRate'] || 0))
    .slice(0, limit)
    .map(post => ({
      title: post['Title'] || post['title'] || 'Untitled',
      publishDate: post['Publish Date'] || post['publishDate'],
      openRate: post['Open Rate %'] || post['openRate'] || 0,
      clickRate: post['Click Rate %'] || post['clickRate'] || 0,
      recipients: post['Recipients'] || post['recipients'] || 0
    }));
}

/**
 * Calculate subscriber growth data grouped by UTM source over time
 * Returns an array of daily data points with daily subscriber counts by source
 */
export function calculateSubscriberGrowthBySource(subscribers, dateRange = null) {
  if (!subscribers || subscribers.length === 0) return { data: [], sources: [] };

  // Group subscribers by date and source
  const dailyBySource = {};
  const allSources = new Set();

  subscribers.forEach(sub => {
    const subscribeDate = sub['Subscribe Date'] || sub['created'];
    if (!subscribeDate) return;

    let date;
    try {
      date = subscribeDate instanceof Date ? subscribeDate : parseISO(subscribeDate);
      if (isNaN(date.getTime())) return;
    } catch {
      return;
    }

    // Skip if outside date range
    if (dateRange && !isWithinInterval(date, { start: startOfDay(dateRange.start), end: endOfDay(dateRange.end) })) {
      return;
    }

    const dateKey = format(date, 'yyyy-MM-dd');
    const source = (sub['UTM Source'] || sub['utmSource'] || 'direct').toLowerCase();

    // Normalize common source names
    const normalizedSource = normalizeSourceName(source);
    allSources.add(normalizedSource);

    if (!dailyBySource[dateKey]) {
      dailyBySource[dateKey] = { date: dateKey };
    }

    dailyBySource[dateKey][normalizedSource] = (dailyBySource[dateKey][normalizedSource] || 0) + 1;
  });

  // Convert to array and sort by date
  const sortedDates = Object.keys(dailyBySource).sort();
  const sources = Array.from(allSources).sort();

  // Build daily data (not cumulative)
  const dailyData = [];

  sortedDates.forEach(dateKey => {
    const dayData = { date: dateKey };

    sources.forEach(source => {
      // Use daily count directly, not cumulative
      dayData[source] = dailyBySource[dateKey][source] || 0;
    });

    // Calculate daily total
    dayData.total = sources.reduce((sum, source) => sum + (dayData[source] || 0), 0);
    dailyData.push(dayData);
  });

  return {
    data: dailyData,
    sources: ['total', ...sources]
  };
}

/**
 * Normalize UTM source names for consistent grouping
 */
function normalizeSourceName(source) {
  if (!source) return 'direct';

  const normalized = source.toLowerCase().trim();

  // Map common variations to standard names
  if (normalized === '' || normalized === 'null' || normalized === 'undefined') return 'direct';
  if (normalized.includes('ml2') || normalized.includes('mailerlite2')) return 'ml2';
  if (normalized.includes('ml3') || normalized.includes('mailerlite3')) return 'ml3';
  if (normalized.includes('website') || normalized.includes('web')) return 'website';
  if (normalized.includes('referral') || normalized.includes('refer')) return 'referral';
  if (normalized.includes('organic') || normalized.includes('search')) return 'organic';
  if (normalized.includes('direct') || normalized === 'none') return 'direct';

  // Keep other sources as-is if they appear frequently
  return normalized.length > 15 ? normalized.substring(0, 15) : normalized;
}

/**
 * Calculate daily new subscribers for trend data
 * Returns an object keyed by date with the count of new subscribers that day
 */
export function calculateDailyNewSubscribers(subscribers, dateRange = null) {
  const dailyNewSubs = {};

  subscribers.forEach(sub => {
    const subscribeDate = sub['Subscribe Date'] || sub['created'];
    if (!subscribeDate) return;

    let date;
    try {
      date = subscribeDate instanceof Date ? subscribeDate : parseISO(subscribeDate);
      if (isNaN(date.getTime())) return;
    } catch {
      return;
    }

    // Skip if outside date range
    if (dateRange && !isWithinInterval(date, { start: startOfDay(dateRange.start), end: endOfDay(dateRange.end) })) {
      return;
    }

    const dateKey = format(date, 'yyyy-MM-dd');
    dailyNewSubs[dateKey] = (dailyNewSubs[dateKey] || 0) + 1;
  });

  return dailyNewSubs;
}
