import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';

function formatDate(date) {
  if (!date) return '-';
  try {
    return format(date instanceof Date ? date : parseISO(date), 'MMM d');
  } catch {
    return '-';
  }
}

function SortIcon({ active, direction }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      style={{ marginLeft: '4px', opacity: active ? 1 : 0.3 }}
    >
      <path
        d="M6 2L9 5H3L6 2Z"
        fill={active && direction === 'asc' ? 'var(--accent-blue)' : '#94a3b8'}
      />
      <path
        d="M6 10L3 7H9L6 10Z"
        fill={active && direction === 'desc' ? 'var(--accent-blue)' : '#94a3b8'}
      />
    </svg>
  );
}

function RankBadge({ rank }) {
  const rankClass = rank <= 3 ? `rank-${rank}` : '';
  return (
    <span className={`rank-badge ${rankClass}`}>
      {rank}
    </span>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 1.5h2.5v2.5M7 7l5.5-5.5M12.5 7.5v4.5a1 1 0 01-1 1h-9a1 1 0 01-1-1v-9a1 1 0 011-1H7" />
    </svg>
  );
}

export function TopArticlesTable({ articles, timeFilter }) {
  const [sort, setSort] = useState({ key: 'totalClicks', direction: 'desc' });

  const handleSort = (key) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortedArticles = useMemo(() => {
    return [...articles].sort((a, b) => {
      let aVal = a[sort.key];
      let bVal = b[sort.key];

      if (sort.key === 'publishDate') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [articles, sort]);

  return (
    <div className="table-card">
      <div className="table-header">
        <div className="table-title">
          <h3>Top Articles</h3>
          <span className="table-subtitle">By total clicks {timeFilter && `• ${timeFilter}`}</span>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '48px' }}>#</th>
              <th onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>
                Article
                <SortIcon active={sort.key === 'title'} direction={sort.direction} />
              </th>
              <th onClick={() => handleSort('publishDate')} style={{ cursor: 'pointer' }}>
                Date
                <SortIcon active={sort.key === 'publishDate'} direction={sort.direction} />
              </th>
              <th onClick={() => handleSort('totalClicks')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                Clicks
                <SortIcon active={sort.key === 'totalClicks'} direction={sort.direction} />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedArticles.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <div className="empty-state">
                    <p>No articles found</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedArticles.map((article, idx) => (
                <tr key={idx} className="table-row">
                  <td>
                    <RankBadge rank={idx + 1} />
                  </td>
                  <td>
                    <div className="title-cell">
                      <span className="title-text" title={article.title}>
                        {article.title}
                      </span>
                      {article.url && (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="view-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLinkIcon />
                        </a>
                      )}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {formatDate(article.publishDate)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="metric-value-cell">
                      {article.totalClicks.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {sortedArticles.length > 10 && (
        <div className="table-footer">
          <button className="btn-text">View All →</button>
        </div>
      )}
    </div>
  );
}

export function TopPostsTable({ posts, timeFilter }) {
  const [sort, setSort] = useState({ key: 'openRate', direction: 'desc' });

  const handleSort = (key) => {
    setSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      let aVal = a[sort.key];
      let bVal = b[sort.key];

      if (sort.key === 'publishDate') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [posts, sort]);

  return (
    <div className="table-card">
      <div className="table-header">
        <div className="table-title">
          <h3>Top Newsletters</h3>
          <span className="table-subtitle">By open rate {timeFilter && `• ${timeFilter}`}</span>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '48px' }}>#</th>
              <th onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>
                Newsletter
                <SortIcon active={sort.key === 'title'} direction={sort.direction} />
              </th>
              <th onClick={() => handleSort('publishDate')} style={{ cursor: 'pointer' }}>
                Date
                <SortIcon active={sort.key === 'publishDate'} direction={sort.direction} />
              </th>
              <th onClick={() => handleSort('recipients')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                Recipients
                <SortIcon active={sort.key === 'recipients'} direction={sort.direction} />
              </th>
              <th onClick={() => handleSort('openRate')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                Open Rate
                <SortIcon active={sort.key === 'openRate'} direction={sort.direction} />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPosts.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <p>No newsletters found</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedPosts.map((post, idx) => (
                <tr key={idx} className="table-row">
                  <td>
                    <RankBadge rank={idx + 1} />
                  </td>
                  <td>
                    <div className="title-cell">
                      <span className="title-text" title={post.title}>
                        {post.title}
                      </span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {formatDate(post.publishDate)}
                  </td>
                  <td style={{ textAlign: 'right' }} className="tabular-nums">
                    {post.recipients.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="badge badge-blue">
                      {post.openRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {sortedPosts.length > 10 && (
        <div className="table-footer">
          <button className="btn-text">View All →</button>
        </div>
      )}
    </div>
  );
}
