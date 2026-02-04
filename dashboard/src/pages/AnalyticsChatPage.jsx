import { useState, useRef, useEffect, useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// Chat message component
function ChatMessage({ message, isUser }) {
  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      {!isUser && (
        <div className="chat-avatar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
      )}
      <div className="chat-content">
        {message.content}
      </div>
    </div>
  );
}

// Response table component
function ResponseTable({ data, columns }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="chat-table-container">
      <table className="chat-table">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map((col, j) => (
                <td key={j}>{row[col] ?? row[col.toLowerCase()] ?? '-'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Response chart component
function ResponseChart({ config, data }) {
  if (!config || !data || data.length === 0) return null;

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  const renderChart = () => {
    switch (config.type) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey={config.xKey} tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#f3f4f6' }}
            />
            <Bar dataKey={config.yKey} fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey={config.xKey} tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#f3f4f6' }}
            />
            <Line type="monotone" dataKey={config.yKey} stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={config.valueKey || 'value'}
              nameKey={config.labelKey || 'name'}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
            />
          </PieChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="chat-chart-container">
      <h4 className="chat-chart-title">{config.title}</h4>
      <ResponsiveContainer width="100%" height={250}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

// Insights component
function ResponseInsights({ insights }) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="chat-insights">
      <h4 className="chat-insights-title">Insights</h4>
      <ul className="chat-insights-list">
        {insights.map((insight, i) => (
          <li key={i} className={insight.startsWith('**Action') || insight.startsWith('Action') ? 'action-item' : ''}>
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Full assistant response component
function AssistantResponse({ response }) {
  return (
    <div className="chat-message assistant">
      <div className="chat-avatar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div className="chat-response-content">
        {response.answer && (
          <div className="chat-answer">{response.answer}</div>
        )}
        {response.table && (
          <ResponseTable data={response.table.data} columns={response.table.columns} />
        )}
        {response.chart && (
          <ResponseChart config={response.chart} data={response.chart.data} />
        )}
        {response.insights && (
          <ResponseInsights insights={response.insights} />
        )}
      </div>
    </div>
  );
}

// Query processor - analyzes user input and generates response
function processQuery(query, data) {
  const queryLower = query.toLowerCase();
  const now = new Date();

  // Default to last 7 days
  let startDate = subDays(now, 7);
  let endDate = now;

  // Parse time references
  if (queryLower.includes('this week') || queryLower.includes('last 7') || queryLower.includes('past week')) {
    startDate = subDays(now, 7);
  } else if (queryLower.includes('last week') || queryLower.includes('previous week')) {
    startDate = subDays(now, 14);
    endDate = subDays(now, 7);
  } else if (queryLower.includes('this month') || queryLower.includes('last 30') || queryLower.includes('past month')) {
    startDate = subDays(now, 30);
  } else if (queryLower.includes('yesterday')) {
    startDate = subDays(now, 1);
    endDate = subDays(now, 1);
  } else if (queryLower.includes('today')) {
    startDate = now;
    endDate = now;
  }

  // Filter posts by date
  const posts = (data?.posts || []).filter(p => {
    const postDate = new Date(p['Publish Date'] || p.publishDate);
    return postDate >= startDate && postDate <= endDate;
  });

  const articles = (data?.articleClicks || []).filter(a => {
    const articleDate = new Date(a['Publish Date'] || a.publishDate);
    return articleDate >= startDate && articleDate <= endDate;
  });

  const subscribers = data?.subscribers || [];

  // TOP ARTICLES query
  if (queryLower.includes('top') && (queryLower.includes('article') || queryLower.includes('content'))) {
    const limit = extractNumber(queryLower) || 5;
    const sortedArticles = [...articles]
      .sort((a, b) => (b['Total Clicks'] || b.totalClicks || 0) - (a['Total Clicks'] || a.totalClicks || 0))
      .slice(0, limit);

    const tableData = sortedArticles.map((a, i) => ({
      '#': i + 1,
      'Article': (a['Title'] || a.title || 'Untitled').substring(0, 50) + '...',
      'Newsletter': format(new Date(a['Publish Date'] || a.publishDate), 'MMM d'),
      'Clicks': (a['Total Clicks'] || a.totalClicks || 0).toLocaleString(),
      'Est. Rev': `$${((a['Total Clicks'] || a.totalClicks || 0) * 1.5 * 2.7 / 1000).toFixed(2)}`
    }));

    const chartData = sortedArticles.map(a => ({
      article: (a['Title'] || a.title || 'Untitled').substring(0, 20) + '...',
      clicks: a['Total Clicks'] || a.totalClicks || 0
    }));

    const totalClicks = sortedArticles.reduce((sum, a) => sum + (a['Total Clicks'] || a.totalClicks || 0), 0);
    const topClicks = sortedArticles[0] ? (sortedArticles[0]['Total Clicks'] || sortedArticles[0].totalClicks || 0) : 0;

    return {
      answer: `"${sortedArticles[0]?.['Title'] || sortedArticles[0]?.title || 'Top article'}" led with ${topClicks.toLocaleString()} clicks. The top ${limit} articles generated ${totalClicks.toLocaleString()} total clicks.`,
      table: {
        columns: ['#', 'Article', 'Newsletter', 'Clicks', 'Est. Rev'],
        data: tableData
      },
      chart: {
        type: 'bar',
        title: `Top ${limit} Articles by Clicks`,
        xKey: 'article',
        yKey: 'clicks',
        data: chartData
      },
      insights: [
        `Top article drove ${((topClicks / totalClicks) * 100).toFixed(0)}% of total clicks`,
        `Average clicks per article: ${(totalClicks / limit).toFixed(0)}`,
        `Estimated total revenue: $${(totalClicks * 1.5 * 2.7 / 1000).toFixed(2)}`,
        `**Action:** Analyze top-performing headlines for patterns to replicate`
      ]
    };
  }

  // COMPARE / VS query
  if (queryLower.includes('compare') || queryLower.includes(' vs ') || queryLower.includes('versus')) {
    const thisWeekPosts = (data?.posts || []).filter(p => {
      const d = new Date(p['Publish Date'] || p.publishDate);
      return d >= subDays(now, 7) && d <= now;
    });
    const lastWeekPosts = (data?.posts || []).filter(p => {
      const d = new Date(p['Publish Date'] || p.publishDate);
      return d >= subDays(now, 14) && d < subDays(now, 7);
    });

    const calcMetrics = (posts) => {
      const delivered = posts.reduce((s, p) => s + (p['Delivered'] || p.delivered || 0), 0);
      const opens = posts.reduce((s, p) => s + (p['Unique Opens'] || p.uniqueOpens || 0), 0);
      const clicks = posts.reduce((s, p) => s + (p['Unique Clicks'] || p.uniqueClicks || 0), 0);
      return {
        delivered,
        openRate: delivered > 0 ? (opens / delivered) * 100 : 0,
        ctr: delivered > 0 ? (clicks / delivered) * 100 : 0,
        clicks
      };
    };

    const thisWeek = calcMetrics(thisWeekPosts);
    const lastWeek = calcMetrics(lastWeekPosts);

    const tableData = [
      { 'Metric': 'Delivered', 'This Week': thisWeek.delivered.toLocaleString(), 'Last Week': lastWeek.delivered.toLocaleString(), 'Change': `${((thisWeek.delivered - lastWeek.delivered) / lastWeek.delivered * 100).toFixed(1)}%` },
      { 'Metric': 'Open Rate', 'This Week': `${thisWeek.openRate.toFixed(1)}%`, 'Last Week': `${lastWeek.openRate.toFixed(1)}%`, 'Change': `${(thisWeek.openRate - lastWeek.openRate).toFixed(1)} pts` },
      { 'Metric': 'CTR', 'This Week': `${thisWeek.ctr.toFixed(1)}%`, 'Last Week': `${lastWeek.ctr.toFixed(1)}%`, 'Change': `${(thisWeek.ctr - lastWeek.ctr).toFixed(1)} pts` },
      { 'Metric': 'Total Clicks', 'This Week': thisWeek.clicks.toLocaleString(), 'Last Week': lastWeek.clicks.toLocaleString(), 'Change': `${((thisWeek.clicks - lastWeek.clicks) / lastWeek.clicks * 100).toFixed(1)}%` }
    ];

    const openRateChange = thisWeek.openRate - lastWeek.openRate;
    const ctrChange = thisWeek.ctr - lastWeek.ctr;

    return {
      answer: `This week ${openRateChange >= 0 ? 'outperformed' : 'underperformed'}: open rate ${openRateChange >= 0 ? '+' : ''}${openRateChange.toFixed(1)} pts, CTR ${ctrChange >= 0 ? '+' : ''}${ctrChange.toFixed(1)} pts, clicks ${((thisWeek.clicks - lastWeek.clicks) / lastWeek.clicks * 100).toFixed(0)}%.`,
      table: {
        columns: ['Metric', 'This Week', 'Last Week', 'Change'],
        data: tableData
      },
      insights: [
        openRateChange > 0 ? 'Open rate improved - subject lines are resonating' : 'Open rate declined - test new subject line formats',
        ctrChange > 0 ? 'CTR up - content engagement is strong' : 'CTR down - review content relevance',
        `${thisWeekPosts.length} newsletters sent this week vs ${lastWeekPosts.length} last week`,
        `**Action:** ${openRateChange > 0 ? 'Document successful subject line patterns' : 'A/B test subject lines next week'}`
      ]
    };
  }

  // SUBSCRIBER GROWTH query
  if (queryLower.includes('subscriber') && (queryLower.includes('growth') || queryLower.includes('source') || queryLower.includes('acquisition'))) {
    const sourceMap = {};
    subscribers.forEach(s => {
      const source = s['UTM Source'] || s.utmSource || 'Direct';
      sourceMap[source] = (sourceMap[source] || 0) + 1;
    });

    const total = Object.values(sourceMap).reduce((a, b) => a + b, 0);
    const sortedSources = Object.entries(sourceMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const tableData = sortedSources.map(([source, count]) => ({
      'Source': source,
      'Count': count.toLocaleString(),
      '%': `${((count / total) * 100).toFixed(0)}%`,
      'Avg/Day': (count / 7).toFixed(1)
    }));

    const chartData = sortedSources.map(([source, count]) => ({
      source,
      count
    }));

    const topSource = sortedSources[0];

    return {
      answer: `${topSource[0]} leads acquisition (${((topSource[1] / total) * 100).toFixed(0)}%), followed by ${sortedSources[1]?.[0] || 'other sources'} (${((sortedSources[1]?.[1] || 0) / total * 100).toFixed(0)}%).`,
      table: {
        columns: ['Source', 'Count', '%', 'Avg/Day'],
        data: tableData
      },
      chart: {
        type: 'pie',
        title: 'Subscribers by Source',
        labelKey: 'source',
        valueKey: 'count',
        data: chartData
      },
      insights: [
        `${topSource[0]} is your top acquisition channel`,
        `Total subscribers in period: ${total.toLocaleString()}`,
        `${sortedSources.length} distinct acquisition sources identified`,
        `**Action:** Double down on ${topSource[0]} - it's working`
      ]
    };
  }

  // TREND query
  if (queryLower.includes('trend') || queryLower.includes('over time') || queryLower.includes('daily')) {
    const dailyData = {};
    posts.forEach(p => {
      const date = format(new Date(p['Publish Date'] || p.publishDate), 'MMM d');
      if (!dailyData[date]) {
        dailyData[date] = { delivered: 0, opens: 0, clicks: 0 };
      }
      dailyData[date].delivered += p['Delivered'] || p.delivered || 0;
      dailyData[date].opens += p['Unique Opens'] || p.uniqueOpens || 0;
      dailyData[date].clicks += p['Unique Clicks'] || p.uniqueClicks || 0;
    });

    const chartData = Object.entries(dailyData).map(([date, stats]) => ({
      date,
      openRate: stats.delivered > 0 ? (stats.opens / stats.delivered) * 100 : 0,
      ctr: stats.delivered > 0 ? (stats.clicks / stats.delivered) * 100 : 0
    }));

    const avgOpenRate = chartData.reduce((s, d) => s + d.openRate, 0) / chartData.length;
    const avgCtr = chartData.reduce((s, d) => s + d.ctr, 0) / chartData.length;

    return {
      answer: `Over the selected period, average open rate was ${avgOpenRate.toFixed(1)}% and CTR was ${avgCtr.toFixed(1)}%.`,
      chart: {
        type: 'line',
        title: 'Performance Trend',
        xKey: 'date',
        yKey: 'openRate',
        data: chartData
      },
      insights: [
        `Average open rate: ${avgOpenRate.toFixed(1)}%`,
        `Average CTR: ${avgCtr.toFixed(1)}%`,
        `${chartData.length} data points in the trend`,
        `**Action:** Identify peak days and replicate their content strategy`
      ]
    };
  }

  // NEWSLETTER PERFORMANCE query
  if (queryLower.includes('newsletter') || queryLower.includes('performance') || queryLower.includes('how did')) {
    const sortedPosts = [...posts]
      .sort((a, b) => (b['Unique Opens'] || b.uniqueOpens || 0) / (b['Delivered'] || b.delivered || 1) -
                      (a['Unique Opens'] || a.uniqueOpens || 0) / (a['Delivered'] || a.delivered || 1))
      .slice(0, 10);

    const tableData = sortedPosts.map((p, i) => {
      const delivered = p['Delivered'] || p.delivered || 0;
      const opens = p['Unique Opens'] || p.uniqueOpens || 0;
      const clicks = p['Unique Clicks'] || p.uniqueClicks || 0;
      return {
        '#': i + 1,
        'Newsletter': (p['Subject'] || p.subject || p['Title'] || p.title || 'Untitled').substring(0, 40) + '...',
        'Date': format(new Date(p['Publish Date'] || p.publishDate), 'MMM d'),
        'Delivered': delivered.toLocaleString(),
        'Open Rate': `${(delivered > 0 ? (opens / delivered) * 100 : 0).toFixed(1)}%`,
        'CTR': `${(delivered > 0 ? (clicks / delivered) * 100 : 0).toFixed(1)}%`
      };
    });

    const totalDelivered = posts.reduce((s, p) => s + (p['Delivered'] || p.delivered || 0), 0);
    const totalOpens = posts.reduce((s, p) => s + (p['Unique Opens'] || p.uniqueOpens || 0), 0);
    const avgOpenRate = totalDelivered > 0 ? (totalOpens / totalDelivered) * 100 : 0;

    return {
      answer: `${posts.length} newsletters were sent. Average open rate: ${avgOpenRate.toFixed(1)}%. Top performer: "${sortedPosts[0]?.['Subject'] || sortedPosts[0]?.subject || 'N/A'}".`,
      table: {
        columns: ['#', 'Newsletter', 'Date', 'Delivered', 'Open Rate', 'CTR'],
        data: tableData
      },
      insights: [
        `${posts.length} newsletters sent in the period`,
        `Total delivered: ${totalDelivered.toLocaleString()}`,
        `Average open rate: ${avgOpenRate.toFixed(1)}%`,
        `**Action:** Study top performer's subject line for patterns`
      ]
    };
  }

  // Default / greeting response
  return {
    answer: "I can analyze newsletter performance, subscriber growth, and content metrics. Try asking:",
    insights: [
      '"How did last week\'s newsletters perform?"',
      '"Top 5 articles by clicks"',
      '"Compare this week vs last week"',
      '"Subscriber growth by source"',
      '"Show me the open rate trend"'
    ]
  };
}

// Helper to extract numbers from query
function extractNumber(text) {
  const match = text.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

// Main component
export default function AnalyticsChatPage({ data }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Show welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        type: 'assistant',
        response: {
          answer: "I can analyze newsletter performance, subscriber growth, and content metrics.",
          insights: [
            '"How did last week\'s newsletters perform?"',
            '"Top 5 articles by clicks this week"',
            '"Compare this week vs last week"',
            '"Subscriber growth by source"',
            '"Show me the open rate trend"'
          ]
        }
      }]);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);

    // Add user message
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Process query and get response
    const response = processQuery(userMessage, data);

    // Add assistant response
    setMessages(prev => [...prev, { type: 'assistant', response }]);
    setIsProcessing(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion.replace(/"/g, ''));
    inputRef.current?.focus();
  };

  return (
    <main className="chat-page">
      <div className="chat-container">
        {/* Messages area */}
        <div className="chat-messages">
          {messages.map((msg, i) => (
            msg.type === 'user' ? (
              <ChatMessage key={i} message={{ content: msg.content }} isUser={true} />
            ) : (
              <AssistantResponse key={i} response={msg.response} />
            )
          ))}

          {isProcessing && (
            <div className="chat-message assistant">
              <div className="chat-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="chat-content">
                <div className="chat-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="chat-input-area">
          <form onSubmit={handleSubmit} className="chat-form">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about newsletter performance, subscriber growth, top articles..."
              className="chat-input"
              disabled={isProcessing}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!input.trim() || isProcessing}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>

          {/* Quick suggestions */}
          <div className="chat-suggestions">
            {['Top 5 articles', 'Compare weeks', 'Subscriber sources', 'Performance trend'].map((suggestion, i) => (
              <button
                key={i}
                className="chat-suggestion-btn"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
