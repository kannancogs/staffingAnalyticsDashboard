// src/components/charts/CompetencyPie.jsx
import React, { useMemo, useRef } from 'react';
import { Pie } from 'react-chartjs-2';

function CompetencyPie({
  data: rows,
  competencyCol,
  minHeight = 360,
  animationDuration = 250,
}) {
  const ref = useRef(null);

  const chartModel = useMemo(() => {
    if (!rows || !rows.length || !competencyCol) return null;

    const canon = (s) =>
      (s ?? '').toString().toLowerCase().replace(/[\s_\-–—]+/g, ' ').trim();

    const PREFERRED_COMPETENCY_DISPLAY = new Map([
      ['available', 'Available'],
      ['allocated', 'Allocated'],
      ['allocation wip', 'Allocation WIP'],
      ['allocated/allocation wip', 'Allocated/Allocation WIP'],
      ['planned', 'Planned'],
      ['proposed - awaiting feedback', 'Proposed - Awaiting Feedback'],
      ['reserved - awaiting feedback', 'Reserved - Awaiting Feedback'],
      ['extension wip', 'Extension WIP'],
      ['new joiner', 'New Joiner'],
      ['resigned', 'Resigned'],
      ['future release', 'Future Release'],
      ['non deployable', 'Non Deployable'],
    ]);

    const countsByCanon = new Map();
    const displayByCanon = new Map();

    for (const row of rows) {
      const raw = row[competencyCol];
      if (!raw) continue;
      const displayTrimmed = raw.toString().trim().replace(/\s+/g, ' ');
      const key = canon(raw);
      if (!key) continue;
      const pretty = PREFERRED_COMPETENCY_DISPLAY.get(key) || displayTrimmed;

      countsByCanon.set(key, (countsByCanon.get(key) || 0) + 1);
      if (!displayByCanon.has(key)) displayByCanon.set(key, pretty);
    }

    if (countsByCanon.size === 0) return null;

    const sorted = Array.from(countsByCanon.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const labels = sorted.map(([key]) => displayByCanon.get(key) || key);
    const values = sorted.map(([, v]) => v);

    return {
      data: {
        labels,
        datasets: [
          {
            id: 'competency:counts',
            label: 'Count',
            data: values,
            backgroundColor: ['#8E44AD', '#33B5FF', '#E67E22', '#28B463', '#F1C40F', '#E67E22', '#2E86C1', '#17A2B8'],
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: animationDuration },
        plugins: {
          title: { display: true, text: 'Competency Distribution' },
          legend: { position: 'bottom' },
        },
      },
    };
  }, [rows, competencyCol, animationDuration]);

  const model = chartModel;

  return (
    <div className="chart-container" style={{ position: 'relative' }} data-export-full="true" ref={ref}>
      <div style={{ height: minHeight }}>
        {model ? (
          <Pie data={model.data} options={model.options} datasetIdKey="id" />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            No data
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(CompetencyPie);