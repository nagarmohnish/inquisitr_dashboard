import { useState, useRef, useEffect } from 'react';
import { format, subDays, startOfMonth, startOfYear } from 'date-fns';

// Compact date presets for chart-level filtering
const DATE_PRESETS = [
  { value: '7day', label: '7D', getDates: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
  { value: '30day', label: '30D', getDates: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
  { value: '90day', label: '90D', getDates: () => ({ start: subDays(new Date(), 90), end: new Date() }) },
  { value: 'mtd', label: 'MTD', getDates: () => ({ start: startOfMonth(new Date()), end: new Date() }) },
  { value: 'ytd', label: 'YTD', getDates: () => ({ start: startOfYear(new Date()), end: new Date() }) }
];

// Comparison options
const COMPARISON_OPTIONS = [
  { value: 'none', label: 'No comparison' },
  { value: 'previousPeriod', label: 'Previous period' },
  { value: 'previousYear', label: 'Same period last year' }
];

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function CompareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// Info popover for metric explanations
function MetricInfoPopover({ info, onClose }) {
  if (!info) return null;

  return (
    <div className="chart-info-popover">
      <div className="chart-info-header">
        <span>About this metric</span>
        <button className="chart-info-close" onClick={onClose}>×</button>
      </div>
      <div className="chart-info-content">
        {info.formula && <code>{info.formula}</code>}
        {info.description && <p>{info.description}</p>}
        {info.benchmark && <span className="chart-info-benchmark">{info.benchmark}</span>}
      </div>
    </div>
  );
}

/**
 * ChartFilters - Reusable filter bar for all charts
 * Provides: Date range selector, Comparison toggle, Info button
 */
export default function ChartFilters({
  title,
  metricInfo,
  timePeriod = '30day',
  onTimePeriodChange,
  comparisonMode = 'none',
  onComparisonChange,
  showDateFilter = true,
  showComparison = true,
  showInfo = true,
  compact = false,
  customDateRange,
  onCustomDateChange
}) {
  const [showInfoPopover, setShowInfoPopover] = useState(false);
  const [showCompareDropdown, setShowCompareDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [localStart, setLocalStart] = useState('');
  const [localEnd, setLocalEnd] = useState('');

  const compareRef = useRef(null);
  const datePickerRef = useRef(null);
  const infoRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (compareRef.current && !compareRef.current.contains(event.target)) {
        setShowCompareDropdown(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
      if (infoRef.current && !infoRef.current.contains(event.target)) {
        setShowInfoPopover(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetClick = (preset) => {
    if (onTimePeriodChange) {
      onTimePeriodChange(preset.value);
    }
    if (preset.getDates && onCustomDateChange) {
      onCustomDateChange(preset.getDates());
    }
  };

  const handleApplyCustomDate = () => {
    if (localStart && localEnd && onCustomDateChange) {
      onCustomDateChange({
        start: new Date(localStart),
        end: new Date(localEnd)
      });
      if (onTimePeriodChange) {
        onTimePeriodChange('custom');
      }
      setShowDatePicker(false);
    }
  };

  const currentComparison = COMPARISON_OPTIONS.find(o => o.value === comparisonMode) || COMPARISON_OPTIONS[0];

  return (
    <div className={`chart-filters ${compact ? 'chart-filters-compact' : ''}`}>
      {/* Date Range Pills */}
      {showDateFilter && (
        <div className="chart-filter-dates">
          {DATE_PRESETS.map(preset => (
            <button
              key={preset.value}
              className={`chart-date-pill ${timePeriod === preset.value ? 'active' : ''}`}
              onClick={() => handlePresetClick(preset)}
            >
              {preset.label}
            </button>
          ))}

          {/* Custom date button */}
          <div className="chart-date-custom-wrapper" ref={datePickerRef}>
            <button
              className={`chart-date-pill chart-date-custom ${timePeriod === 'custom' ? 'active' : ''}`}
              onClick={() => setShowDatePicker(!showDatePicker)}
              title="Custom date range"
            >
              <CalendarIcon />
            </button>

            {showDatePicker && (
              <div className="chart-date-picker">
                <div className="chart-date-picker-header">
                  <span>Custom Range</span>
                </div>
                <div className="chart-date-picker-body">
                  <div className="chart-date-field">
                    <label>From</label>
                    <input
                      type="date"
                      value={localStart}
                      onChange={(e) => setLocalStart(e.target.value)}
                    />
                  </div>
                  <div className="chart-date-field">
                    <label>To</label>
                    <input
                      type="date"
                      value={localEnd}
                      onChange={(e) => setLocalEnd(e.target.value)}
                    />
                  </div>
                </div>
                <div className="chart-date-picker-footer">
                  <button className="chart-btn-secondary" onClick={() => setShowDatePicker(false)}>
                    Cancel
                  </button>
                  <button
                    className="chart-btn-primary"
                    onClick={handleApplyCustomDate}
                    disabled={!localStart || !localEnd}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comparison Dropdown */}
      {showComparison && (
        <div className="chart-filter-compare" ref={compareRef}>
          <button
            className={`chart-compare-btn ${comparisonMode !== 'none' ? 'active' : ''}`}
            onClick={() => setShowCompareDropdown(!showCompareDropdown)}
            title="Compare with previous period"
          >
            <CompareIcon />
            {!compact && <span>{comparisonMode !== 'none' ? 'Comparing' : 'Compare'}</span>}
            <ChevronDownIcon />
          </button>

          {showCompareDropdown && (
            <div className="chart-compare-dropdown">
              {COMPARISON_OPTIONS.map(option => (
                <button
                  key={option.value}
                  className={`chart-compare-option ${comparisonMode === option.value ? 'active' : ''}`}
                  onClick={() => {
                    onComparisonChange?.(option.value);
                    setShowCompareDropdown(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info Button */}
      {showInfo && metricInfo && (
        <div className="chart-filter-info" ref={infoRef}>
          <button
            className={`chart-info-btn ${showInfoPopover ? 'active' : ''}`}
            onClick={() => setShowInfoPopover(!showInfoPopover)}
            title={`About ${title || 'this metric'}`}
          >
            <InfoIcon />
          </button>

          {showInfoPopover && (
            <MetricInfoPopover info={metricInfo} onClose={() => setShowInfoPopover(false)} />
          )}
        </div>
      )}
    </div>
  );
}

// Compact inline version for metric cards
export function ChartFiltersInline({
  timePeriod,
  onTimePeriodChange,
  showComparison = false,
  comparisonMode,
  onComparisonChange
}) {
  return (
    <div className="chart-filters-inline">
      <div className="chart-filter-dates-inline">
        {DATE_PRESETS.slice(0, 3).map(preset => (
          <button
            key={preset.value}
            className={`chart-date-pill-sm ${timePeriod === preset.value ? 'active' : ''}`}
            onClick={() => onTimePeriodChange?.(preset.value)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {showComparison && (
        <button
          className={`chart-compare-btn-sm ${comparisonMode !== 'none' ? 'active' : ''}`}
          onClick={() => onComparisonChange?.(comparisonMode === 'none' ? 'previousPeriod' : 'none')}
          title="Toggle comparison"
        >
          <CompareIcon />
        </button>
      )}
    </div>
  );
}
