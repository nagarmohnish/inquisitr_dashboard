import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';

export default function DateRangePicker({ startDate, endDate, onChange, onClose }) {
  const [localStart, setLocalStart] = useState(startDate ? format(startDate, 'yyyy-MM-dd') : '');
  const [localEnd, setLocalEnd] = useState(endDate ? format(endDate, 'yyyy-MM-dd') : '');
  const modalRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleApply = () => {
    if (localStart && localEnd) {
      onChange({
        start: new Date(localStart),
        end: new Date(localEnd)
      });
      onClose();
    }
  };

  return (
    <div className="date-picker-overlay">
      <div className="date-picker-modal" ref={modalRef}>
        <div className="date-picker-header">
          <h3>Custom Date Range</h3>
          <button className="date-picker-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="date-picker-body">
          <div className="date-input-group">
            <label>Start Date</label>
            <input
              type="date"
              value={localStart}
              onChange={(e) => setLocalStart(e.target.value)}
              className="date-input"
            />
          </div>

          <div className="date-input-group">
            <label>End Date</label>
            <input
              type="date"
              value={localEnd}
              onChange={(e) => setLocalEnd(e.target.value)}
              className="date-input"
            />
          </div>
        </div>

        <div className="date-picker-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleApply}
            disabled={!localStart || !localEnd}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
