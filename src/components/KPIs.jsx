// components/KPIs.jsx
import React from 'react';
import { Counter } from './Counter';


export default function KPIs({ metrics, newJoinersCount, resignedCount, onKpiClick, activeKpi,selectedSkills = [],   }) {
  // Safe click wrapper
  const onClickTile = (type) => {
    if (typeof onKpiClick === 'function') onKpiClick(type);
  };


  const cardStyle = {
    cursor: 'pointer',
    outline: 'none',
  };

 // Compact list helper (e.g., "FE, AEM BE +3")
 const compactList = (arr, max = 3) => {
   if (!arr || arr.length === 0) return '';
   if (arr.length <= max) return arr.join(', ');
   return `${arr.slice(0, max).join(', ')} +${arr.length - max}`;
 };

  // Helpers to determine active state for each tile
  const isActive = (key) => (activeKpi || '').toUpperCase() === key;


  const skillsSuffix = selectedSkills?.length ? ` — ${compactList(selectedSkills)}` : '';
  console.log(skillsSuffix,'skillsSuffix');
  return (
    <div className="card">
      <h3>📊 PDP Perf ormance Indicators{skillsSuffix}</h3>

        {/* Total Employees */}
        {metrics?.[0] && (
          <div
            className="metric-card"
            role="button"
            tabIndex={0}
            onClick={() => onClickTile('TOTAL')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClickTile('TOTAL')}
            style={cardStyle}
            aria-label="View total employees list"
            title="Click to view Total Employees"
          >
            <div className="metric-value">
              <Counter value={Number(metrics[0].value) || 0} duration={1200} />
            </div>
            <div className="metric-label">
              {metrics[0].icon} {metrics[0].label}
            </div>
          </div>
        )}

        {/* Available */}
        {metrics?.find(m => m.label?.startsWith('Available')) && (
          <div
            className="metric-card"
            role="button"
            tabIndex={0}
            onClick={() => onClickTile('AVAILABLE')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClickTile('AVAILABLE')}
            style={cardStyle}
            aria-label="View available employees list"
            title="Click to view Available"
          >
            <div className="metric-value">
              <Counter
                value={Number(metrics.find(m => m.label?.startsWith('Available'))?.value) || 0}
                duration={1200}
              />
            </div>
            <div className="metric-label">
              🎯 Available
            </div>
          </div>
        )}

        {/* Proposed - Awaiting Feedback (and similar) */}
        {metrics?.find(m => m.label?.startsWith('Proposed - Awaiting Feedback')) && (
          <div
            className="metric-card"
            role="button"
            tabIndex={0}
            onClick={() => onClickTile('PAF')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClickTile('PAF')}
            style={cardStyle}
            aria-label="View Proposed / Awaiting Feedback list"
            title="Click to view Proposed / Awaiting Feedback"
          >
            <div className="metric-value">
              <Counter
                value={Number(metrics.find(m => m.label?.startsWith('Proposed - Awaiting Feedback'))?.value) || 0}
                duration={1200}
              />
            </div>
            <div className="metric-label">
              📩 Proposed - Awaiting Feedback
            </div>
          </div>
        )}

        {/* New Joiner / Resigned (combined tile with 2 click targets) */}
        <div className="metric-card" style={{ display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              className="btn btn-sm"
              onClick={() => onClickTile('NEW_JOINER')}
              title="Click to view New Joiners"
            >
              New Joiner: <strong style={{ marginLeft: 6 }}>{newJoinersCount}</strong>
            </button>
            <button
              className="btn btn-sm"
              onClick={() => onClickTile('RESIGNED')}
              title="Click to view Resigned"
            >
              Resigned: <strong style={{ marginLeft: 6 }}>{resignedCount}</strong>
            </button>
          </div>
          <div className="metric-label" style={{ textAlign: 'center' }}>
            ➡️🚪 New Joiner / 🚪➡️ Resigned
          </div>
        </div>
      </div>
  );
}

// components/KPIs.jsx

