// KpiCards.jsx
import React from 'react';
import { Counter } from './Counter';

export default function KpiCards({
  metrics,
  newJoinersCount,
  resignedCount,
  onKpiClick,
  activeKpi,
  filteredData = [],
  tscCol,
  selectedSkills = [],
}) {
  const onClickTile = (type) => {
    if (typeof onKpiClick === 'function') onKpiClick(type);
  };

  const cardStyle = { cursor: 'pointer', outline: 'none' };
  const isActive = (key) => (activeKpi || '').toUpperCase() === key;

  const compactList = (arr, max = 3) => {
    if (!arr || arr.length === 0) return '';
    if (arr.length <= max) return arr.join(', ');
    return `${arr.slice(0, max).join(', ')} +${arr.length - max}`;
  };

  const normalizeLoose = (s) =>
    (s ?? '').toString().toLowerCase().replace(/[\s_\-–—/]+/g, '').trim();

  // Central helpers – keep in sync with DashboardTab
  const isAvailableKey = (v) => {
    const t = normalizeLoose(v);
    return t.includes('available') || t.includes('nondeployable');
  };
  const isPAFKey = (v) => {
    const t = normalizeLoose(v);
    return (
      t.includes('proposedawaitingfeedback') ||
      t.includes('awaitingfeedback') ||
      t.includes('planned') ||
      t.includes('reserved') ||
      t.includes('selected') ||
      t.includes('allocated') ||
      t.includes('allocationwip')
    );
  };

  // Compute locally from tscCol + filteredData (fallback to incoming metrics)
  let availableMetric = null;
  let pafMetric = null;

  if (tscCol) {
    const availableCount = filteredData.filter((row) => isAvailableKey(row[tscCol])).length;
    availableMetric = { label: 'Available', value: availableCount, icon: '🎯' };

    const pafCount = filteredData.filter((row) => isPAFKey(row[tscCol])).length;
    pafMetric = { label: 'Proposed - Awaiting Feedback', value: pafCount, icon: '📩' };
  } else {
    availableMetric = metrics?.find((m) => m.label?.startsWith('Available'));
    pafMetric = metrics?.find((m) => m.label?.startsWith('Proposed - Awaiting Feedback'));
  }

  const skillsSuffix = selectedSkills?.length ? ` — ${compactList(selectedSkills)}` : '';

  return (
    <div className="card">
      <h3>📊 PDP Performance Indicators {skillsSuffix}</h3>

      <div className="metrics-grid">
        {/* Total Employees */}
        {metrics?.[0] && (
          <div
            className={`metric-card ${isActive('TOTAL') ? 'active' : ''}`}
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
        {availableMetric && (
          <div
            className={`metric-card ${isActive('AVAILABLE') ? 'active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => onClickTile('AVAILABLE')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClickTile('AVAILABLE')}
            style={cardStyle}
            aria-label="View available employees list"
            title="Click to view Available"
          >
            <div className="metric-value">
              <Counter value={Number(availableMetric?.value) || 0} duration={1200} />
            </div>
            <div className="metric-label">{availableMetric.icon} {availableMetric.label}</div>
          </div>
        )}

        {/* PAF */}
        {pafMetric && (
          <div
            className={`metric-card ${isActive('PAF') ? 'active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => onClickTile('PAF')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClickTile('PAF')}
            style={cardStyle}
            aria-label="View Proposed / Awaiting Feedback list"
            title="Click to view Proposed / Awaiting Feedback"
          >
            <div className="metric-value">
              <Counter value={Number(pafMetric?.value) || 0} duration={1200} />
            </div>
            <div className="metric-label">{pafMetric.icon} {pafMetric.label}</div>
          </div>
        )}

        {/* New Joiner / Resigned pair */}
        <div className="metric-card">
          <div className="metric-value" style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {newJoinersCount} / {resignedCount}
          </div>

          <div className="metric-label metricNewjoinRes" style={{ textAlign: 'center', display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button
              className={`btn btn-sm ${isActive('NEW_JOINER') ? 'active' : ''}`}
              onClick={() => onClickTile('NEW_JOINER')}
              title="Click to view New Joiners"
              aria-pressed={isActive('NEW_JOINER')}
            >
              <strong style={{ marginLeft: 6 }}>➡️🚪 New Joiner</strong>
            </button>

            <button
              className={`btn btn-sm ${isActive('RESIGNED') ? 'active' : ''}`}
              onClick={() => onClickTile('RESIGNED')}
              title="Click to view Resigned"
              aria-pressed={isActive('RESIGNED')}
            >
              <strong style={{ marginLeft: 6 }}>🚪➡️ Resigned</strong>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
``