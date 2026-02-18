// src/components/charts/PrimarySkillBar.jsx
import React, { useMemo, useRef } from 'react';
import { Bar } from 'react-chartjs-2';

function PrimarySkillBar({
  data: rows,
  columns,
  categoricalColumns,
  tscCol,
  minHeight = 360,
  animationDuration = 250,
  updateMode = 'active', // 'none' for instant
  headroom = '10%', // y-axis grace (e.g., '10%' or a number)
}) {
  const ref = useRef(null);

  const chartModel = useMemo(() => {
    if (!rows || !rows.length) return null;

    const canonTsc = (s) => (s ?? '').toString().toLowerCase().replace(/[\s_\-–—]+/g, ' ').trim();
    const isNotTagged = (s) => {
      const c = (s ?? '').toString().toLowerCase().replace(/[\s_\-–—/]+/g, ' ').trim();
      return c === 'not tagged' || c === 'nottagged';
    };

    const skillCol =
      (columns && columns.find((c) => /\bskill\b/i.test(c))) ||
      (categoricalColumns && categoricalColumns.find((c) => /\bskill\b/i.test(c)));
    if (!skillCol) return null;

    // Strict Available
    let availableOnly = rows;
    if (tscCol) {
      availableOnly = rows.filter((row) => canonTsc(row[tscCol]) === 'available');
    }

    const cleanDisplay = (s) => (s ?? '').toString().replace(/\s+/g, ' ').trim();
    const canonSkillKey = (s) => (s ?? '').toString().toLowerCase().replace(/\s+/g, ' ').trim();

    const WHITELIST = ['AEM BE', 'AEM FE', 'AEM Content Author', 'AEM QA','AEM BA'];

    const keyToDisplay = new Map();
    const counts = {};

    for (const row of availableOnly) {
      const pretty = cleanDisplay(row[skillCol]);
      if (!pretty) continue;
      if (isNotTagged(pretty)) continue;

      const key = canonSkillKey(pretty);
      if (!key) continue;

      if (!keyToDisplay.has(key)) keyToDisplay.set(key, pretty);
      counts[key] = (counts[key] || 0) + 1;
    }

    const labels = [];
    const dataPoints = [];
    WHITELIST.forEach((prettyWanted) => {
      const k = canonSkillKey(prettyWanted);
      const pretty = keyToDisplay.get(k) || prettyWanted;
      labels.push(pretty);
      dataPoints.push(counts[k] || 0);
    });

    const ellipsize = (s, max = 16) => (s.length > max ? s.slice(0, max - 1) + '…' : s);
    const n = labels.length || 1;
    const barThickness = Math.max(10, Math.min(24, Math.floor(240 / n)));

    // If everything zero, fallback to top 10
    if (dataPoints.every((v) => v === 0)) {
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
      if (!sorted.length) return null;

      const fallbackLabels = sorted.map(([key]) => keyToDisplay.get(key) || key);
      const fallbackPoints = sorted.map(([, v]) => v);

      return {
        data: {
          labels: fallbackLabels,
          datasets: [
            {
              id: 'primaryskill:fallback',
              label: 'Available Employee Count',
              data: fallbackPoints,
              backgroundColor: '#0066CC',
              borderColor: '#004499',
              borderWidth: 1,
              borderRadius: 4,
              barThickness: Math.max(10, Math.min(24, Math.floor(240 / fallbackLabels.length || 1))),
              maxBarThickness: 28,
              categoryPercentage: 0.6,
              barPercentage: 0.7,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: animationDuration },
          plugins: {
            title: { display: true, text: 'Primary Skill Distribution — Available Only' },
            tooltip: {
              callbacks: {
                title: (items) => items?.[0]?.label || '',
                label: (ctx) => `${ctx.dataset?.label || 'Count'}: ${ctx.raw ?? 0}`,
              },
            },
            legend: { position: 'top' },
          },
          layout: { padding: { left: 8, right: 8, top: 0, bottom: 0 } },
          scales: {
            y: {
              beginAtZero: true,
              grace: headroom, // 👈 headroom here too
              title: { text: 'Available Employees', display: true },
              ticks: { precision: 0 },
            },
            x: {
              offset: true,
              title: { text: 'Primary Skills', display: true },
                  ticks: {
            autoSkip: false,           
            callback: (val, idx) => ellipsize(theLabels[idx] ?? '', 20),
          },
              grid: { offset: true },
            },
          },
          indexAxis: 'x',
        },
      };
    }

    return {
      data: {
        labels,
        datasets: [
          {
            id: 'primaryskill:available',
            label: 'Available Employee Count',
            data: dataPoints,
            backgroundColor: '#0066CC',
            borderColor: '#004499',
            borderWidth: 1,
            borderRadius: 4,
            barThickness,
            maxBarThickness: 28,
            categoryPercentage: 0.6,
            barPercentage: 0.7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: animationDuration },
        plugins: {
          title: { display: true, text: 'Primary Skill Distribution — Available Only' },
          tooltip: {
            callbacks: {
              title: (items) => items?.[0]?.label || '',
              label: (ctx) => `${ctx.dataset?.label || 'Count'}: ${ctx.raw ?? 0}`,
            },
          },
          legend: { position: 'top' },
        },
        layout: { padding: { left: 8, right: 8, top: 0, bottom: 0 } },
        scales: {
          y: {
            beginAtZero: true,
            grace: headroom, // 👈 headroom above tallest bar
            title: { text: 'Available Employees', display: true },
            ticks: { precision: 0 },
          },
          x: {
            offset: true,
            title: { text: 'Primary Skills', display: true },
            ticks: {
              autoSkip: false,
              maxRotation: 0,
              minRotation: 0,
              callback: (val, idx) => ellipsize((labels[idx] ?? '').toString(), 18),
            },
            grid: { offset: true },
          },
        },
        indexAxis: 'x',
      },
    };
  }, [rows, columns, categoricalColumns, tscCol, minHeight, animationDuration, headroom]);

  return (
    <div className="chart-container" style={{ position: 'relative' }} data-export-full="true" ref={ref}>
      <div style={{ height: minHeight }}>
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
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            No data
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(PrimarySkillBar);