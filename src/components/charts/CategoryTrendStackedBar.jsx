// src/components/charts/CategoryTrendStackedBar.jsx
import React, { useMemo, useRef } from 'react';
import { Bar } from 'react-chartjs-2';

// Display mapping and whitelist (same as before)
const PREFERRED_TSC_DISPLAY = new Map([
  ['available', 'Available'],
  ['proposed - awaiting feedback', 'Proposed - Awaiting Feedback'],
  ['reserved - awaiting feedback', 'Reserved - Awaiting feedback'],
  ['allocated/allocation wip', 'Allocated/Allocation WIP'],
  ['planned', 'Planned'],
  ['extension wip', 'Extension WIP'],
  ['new joiner', 'New Joiner'],
  ['resigned', 'Resigned'],
  ['future release', 'Future Release'],
  ['non deployable', 'Non Deployable'],
]);

const CATEGORY_TREND_SKILL_WHITELIST = [
  'AEM FE',
  'AEM BE',
  'AEM BA',
  'AEM Content Author',
  'AEM FE Architect',
];

function CategoryTrendStackedBar({
  data: filteredData,
  columns,
  categoricalColumns,
  minHeight = 420,
  maxContainerHeight = '100vh',
  growOnly = true,
  animationDuration = 250,
  updateMode = 'active', // 'none' for instant updates
}) {
  const ref = useRef(null);
  const lastHeightRef = useRef(minHeight);

  const normalize = (s) => (s ?? '').toString().toLowerCase().replace(/[\s_]+/g, '').trim();
  const canonTsc = (s) => (s ?? '').toString().toLowerCase().replace(/[\s_\-–—]+/g, ' ').trim();
  const isNotTagged = (s) => {
    const c = (s ?? '').toString().toLowerCase().replace(/[\s_\-–—/]+/g, ' ').trim();
    return c === 'not tagged' || c === 'nottagged';
  };

  const getColumnByAliases = (cols, aliases) =>
    cols.find((c) => aliases.some((a) => normalize(c).includes(normalize(a))));

  const chartModel = useMemo(() => {
    if (!filteredData || !filteredData.length || !columns?.length) return null;

    // Resolve TSC and Skill columns (exactly like your previous function)
    const tscCol =
      getColumnByAliases(columns, ['tsc grouping', 'tsc_grouping', 'tscgrouping', 'tsc']) || null;
    if (!tscCol) return null;

    const getSkillColumn = (cols) => {
      const skillExact = cols.find((c) => /\bskill\b/i.test(c));
      if (skillExact) return skillExact;
      const skillPhrase = (categoricalColumns || []).find((c) => /\bskill\b/i.test(c));
      if (skillPhrase) return skillPhrase;
      return null;
    };
    const skillCol = getSkillColumn(columns);
    if (!skillCol) return null;

    // Helpers (same names/logic as your snippet)
    const clean = (s) => (s ?? '').toString().replace(/\s+/g, ' ').trim();
    const skillKey = (s) => (s ?? '').toString().toLowerCase().replace(/\s+/g, ' ').trim();

    const countsByTscCanon = {};
    const tscTotals = {};
    const tscCanonToDisplay = new Map();

    for (const row of filteredData) {
      const rawT = row[tscCol];
      const rawS = row[skillCol];
      if (!rawT || !rawS) continue;

      const tCanon = canonTsc(rawT);
      if (!tCanon) continue;

      const tPretty = PREFERRED_TSC_DISPLAY.get(tCanon) || clean(rawT);
      if (!tscCanonToDisplay.has(tCanon)) tscCanonToDisplay.set(tCanon, tPretty);

      const sPretty = clean(rawS);
      if (!sPretty || isNotTagged(sPretty)) continue;

      if (!countsByTscCanon[tCanon]) countsByTscCanon[tCanon] = {};
      countsByTscCanon[tCanon][sPretty] = (countsByTscCanon[tCanon][sPretty] || 0) + 1;

      tscTotals[tCanon] = (tscTotals[tCanon] || 0) + 1;
    }

    const tscCanonKeysSorted = Object.keys(tscTotals).sort(
      (a, b) => (tscTotals[b] || 0) - (tscTotals[a] || 0)
    );
    if (tscCanonKeysSorted.length === 0) return null;

    const tscLabels = tscCanonKeysSorted.map((k) => tscCanonToDisplay.get(k) || k);

    // EXACT same palette you had
    const colorPaletteLocal = [
      '#0066CC',
      '#8E44AD',
      '#17A2B8',
      '#DC3545',
      '#FFC107',
      '#6C757D',
      '#00A0E6',
      '#28A745',
    ];

    const datasets = [];
    const barThickness = Math.max(10, Math.min(24, Math.floor(240 / 50)));
    const ellipsize = (s = '', max = 32) => (s.length > max ? s.slice(0, max - 1) + '…' : s);

    CATEGORY_TREND_SKILL_WHITELIST.forEach((skillName, i) => {
      const dataPoints = tscCanonKeysSorted.map((tCanon) => {
        const perTsc = countsByTscCanon[tCanon] || {};
        let sum = 0;
        for (const [sDisplay, v] of Object.entries(perTsc)) {
          if (skillKey(sDisplay) === skillKey(skillName)) sum += v || 0;
        }
        return sum;
      });

      datasets.push({
        id: `skill:${skillName.toLowerCase().replace(/\s+/g, '_')}`, // stable id
        label: skillName,
        data: dataPoints,
        borderColor: colorPaletteLocal[i % colorPaletteLocal.length],
        backgroundColor: colorPaletteLocal[i % colorPaletteLocal.length],
        borderWidth: 0.5,
        fill: true,
        borderRadius: 1,
        barThickness,
        maxBarThickness: barThickness,
        categoryPercentage: 0.6,
        barPercentage: 0.7,
      });
    });

    // Same dynamic height logic
    const perRow = 24;
    const legendAllowance = 120;
    const dynamicHeight = Math.max(minHeight, perRow * tscLabels.length + legendAllowance);

    // EXACT same scales/plugins/title as your latest snippet
    return {
      data: { labels: tscLabels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: animationDuration },
        interaction: { mode: 'nearest', intersect: false },
        layout: { padding: 8 },
        scales: {
          x: {
            stacked: true,
            beginAtZero: true,
            title: { display: true, text: 'Employee Count' },
            ticks: { precision: 0 },
          },
          y: {
            beginAtZero: true,
            grace:'2%',
            title: { text: 'Available Employees', display: true },
            ticks: { precision: 0 },
            // NOTE: Your earlier version had stacked: true on y. 
            // Here we follow your *latest* snippet (non-stacked y).
          },
        },
        plugins: {
          title: { display: true, text: 'TSC Grouping vs Skill Category ' },
          legend: { position: 'bottom', labels: { boxWidth: 12, boxHeight: 12 } },
          tooltip: {
            mode: 'index',
            intersect: false,
            itemSort: (a, b) => (b.raw ?? 0) - (a.raw ?? 0),
            callbacks: {
              title: (items) => {
                const idx = items?.[0]?.dataIndex ?? 0;
                return tscLabels[idx] || '';
              },
            },
          },
        },
        _height: dynamicHeight,
      },
      dynamicHeight,
    };
  }, [filteredData, columns, categoricalColumns, minHeight, animationDuration]);

  // Height smoothing (grow-only to avoid layout jank)
  let desired = Math.max(minHeight, chartModel?.dynamicHeight || minHeight);
  if (growOnly) desired = Math.max(desired, lastHeightRef.current || minHeight);
  lastHeightRef.current = desired;

  return (
    <div
      className="chart-container"
      style={{ maxHeight: maxContainerHeight, overflow: 'auto', position: 'relative' }}
      data-export-full="true"
      ref={ref}
    >
      <div className="chart-title">📊 Category Trend (Stacked Bar)</div>

      <div style={{ height: desired }}>
        {chartModel ? (
          <Bar
            data={chartModel.data}
            options={{
              ...chartModel.options,
              maintainAspectRatio: false,
              animation: { duration: animationDuration },
              responsiveAnimationDuration: 0,
            }}
            datasetIdKey="id"
            updateMode={updateMode}
          />
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#888',
              fontSize: 14,
            }}
            aria-label="No data to display"
          >
            No data
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(CategoryTrendStackedBar);