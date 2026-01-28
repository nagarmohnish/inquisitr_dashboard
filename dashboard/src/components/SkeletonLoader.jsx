export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton" style={{ width: '80px', height: '12px', marginBottom: '16px' }} />
      <div className="skeleton" style={{ width: '100px', height: '36px', marginBottom: '8px' }} />
      <div className="skeleton" style={{ width: '120px', height: '20px' }} />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div className="skeleton" style={{ width: '100px', height: '14px', marginBottom: '4px' }} />
          <div className="skeleton" style={{ width: '60px', height: '12px' }} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="skeleton" style={{ width: '60px', height: '24px', marginBottom: '4px', marginLeft: 'auto' }} />
          <div className="skeleton" style={{ width: '40px', height: '12px', marginLeft: 'auto' }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: '100%', height: '200px', borderRadius: '8px' }} />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="table-card">
      <div className="table-header">
        <div>
          <div className="skeleton" style={{ width: '100px', height: '16px', marginBottom: '4px' }} />
          <div className="skeleton" style={{ width: '80px', height: '12px' }} />
        </div>
      </div>
      <div style={{ padding: '16px' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
            <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
            <div className="skeleton" style={{ flex: 1, height: '16px' }} />
            <div className="skeleton" style={{ width: '60px', height: '16px' }} />
            <div className="skeleton" style={{ width: '48px', height: '16px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonFilterBar() {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <div className="skeleton" style={{ width: '160px', height: '40px', borderRadius: '12px' }} />
        <div className="skeleton" style={{ width: '140px', height: '40px', borderRadius: '12px' }} />
        <div className="skeleton" style={{ width: '160px', height: '40px', borderRadius: '12px' }} />
      </div>
      <div className="filter-info">
        <div className="skeleton" style={{ width: '140px', height: '14px' }} />
        <div className="skeleton" style={{ width: '60px', height: '24px', borderRadius: '8px' }} />
      </div>
    </div>
  );
}

export function SkeletonHeader() {
  return (
    <div className="dashboard-header">
      <div className="header-content">
        <div>
          <div className="skeleton" style={{ width: '160px', height: '20px', marginBottom: '4px' }} />
          <div className="skeleton" style={{ width: '100px', height: '12px' }} />
        </div>
        <div className="header-actions">
          <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
          <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ message = 'No data available', icon }) {
  return (
    <div className="empty-state">
      {icon || (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#94a3b8" strokeWidth="1.5">
          <circle cx="24" cy="24" r="20" />
          <path d="M24 14v10l6 4" strokeLinecap="round" />
        </svg>
      )}
      <p>{message}</p>
    </div>
  );
}
