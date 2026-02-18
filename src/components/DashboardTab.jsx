import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

import ControlsPanel from './ControlsPanel';
import KpiCards from './KpiCards';
import CompetencyPie from './charts/CompetencyPie';
import CategoryTrendStackedBar from './charts/CategoryTrendStackedBar';
import PrimarySkillBar from './charts/PrimarySkillBar';
import ExportImageButtons from './ExportImageButtons';
import KpiDataTable from './KpiDataTable';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function DashboardTab({ uploadedData, isSampleData }) {
  // ===== State =====
  const [refreshKey, setRefreshKey] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [dashboardData, setDashboardData] = useState(null);

  const [selectedCompetency, setSelectedCompetency] = useState('');
  const [selectedCompetencies, setSelectedCompetencies] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedTSCs, setSelectedTSCs] = useState([]);
  const [tscSearch, setTscSearch] = useState('');

  // KPI table states
  const [isKpiTableVisible, setIsKpiTableVisible] = useState(false);
  const [kpiFilter, setKpiFilter] = useState(null); // 'TOTAL' | 'AVAILABLE' | 'PAF' | 'NEW_JOINER' | 'RESIGNED'

  // Export wrapper for KPI + charts only
  const exportRef = useRef(null);

  // ===== Helpers =====
  const normalize = (s) => (s ?? '').toString().toLowerCase().replace(/[\s_]+/g, '').trim();
  const canonSkill = (s) => (s ?? '').toString().toLowerCase().replace(/[\s_\-–—/]+/g, ' ').trim();
  const isNotTagged = (s) => {
    const c = canonSkill(s);
    return c === 'not tagged' || c === 'nottagged';
  };
  const canonTsc = (s) => (s ?? '').toString().toLowerCase().replace(/[\s_\-–—]+/g, ' ').trim();

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

  const getColumnByAliases = (columns, aliases) =>
    columns.find((c) => aliases.some((a) => normalize(c).includes(normalize(a))));

  const getCompetencyColumn = (columns) => {
    const exact = columns.find((c) => normalize(c) === 'competency');
    if (exact) return exact;
    const wordBoundary = columns.find((c) => /\bcompetency\b/i.test(c));
    if (wordBoundary) return wordBoundary;
    const endsWith = columns.find((c) => normalize(c).endsWith('competency'));
    if (endsWith) return endsWith;
    const includes = columns.find((c) => {
      const nc = normalize(c);
      return nc.includes('competency') && !nc.includes('cluster');
    });
    if (includes) return includes;
    return columns.find((c) => normalize(c).includes('competency')) || null;
  };

  const getSkillColumn = (columns) => {
    const skillExact = columns.find((c) => /\bskill\b/i.test(c));
    if (skillExact) return skillExact;
    const skillPhrase = columns.find((c) =>
      /\b(primary\s*skill|skill\s*category|core\s*skill|main\s*skill)\b/i.test(c)
    );
    if (skillPhrase) return skillPhrase;
    const soft = columns.find((c) => /\b(primary|core|main)\b/i.test(c) && /\bskill\b/i.test(c));
    if (soft) return soft;
    return null;
  };

  const resolveColumn = (columns, aliases) =>
    columns.find((c) => {
      const lc = c?.toString().toLowerCase().trim();
      return aliases.some((a) => lc.includes(a));
    }) || null;

  const COL_ALIAS = {
    associateId: ['associate id', 'emp id', 'employee id', 'id'],
    associateName: ['associate name', 'employee name', 'name', 'resource name'],
    grade: ['grade', 'band', 'level'],
    competency: ['competency'],
    currentCity: ['current city', 'city', 'location', 'base location'],
    skillCategory: ['skill category', 'primary skill', 'skill', 'core skill', 'main skill'],
    tscGrouping: ['tsc grouping', 'tsc_grouping', 'tscgrouping', 'tsc'],
    remarks: ['remarks', 'notes', 'comment', 'comments'],
  };

  // ===== Effects =====
  // Reset selection when sheet changes
  useEffect(() => {
    setSelectedCompetency('');
    setSelectedCompetencies([]);
    setSelectedSkills([]);
    setSelectedTSCs([]);
    setTscSearch('');
  }, [selectedSheet]);

  const compactList = (arr, max = 2) => {
  if (!arr?.length) return '';
  if (arr.length <= max) return arr.join(', ');
  return `${arr.slice(0, max).join(', ')} +${arr.length - max}`;
};
  // Preselect TSCs except default excludes
  const DEFAULT_TSC_EXCLUDE_KEYS = new Set([
    'allocated/allocation wip',
    'extension wip',
    'future release',
    'proactive releases',
  ]);

  useEffect(() => {
    const options = dashboardData?.uniqueTSCs ?? [];
    if (!options.length) return;
    if (selectedTSCs.length === 0) {
      const preselect = options.filter((label) => !DEFAULT_TSC_EXCLUDE_KEYS.has(canonTsc(label)));
      setSelectedTSCs(preselect);
    }
  }, [dashboardData?.uniqueTSCs, selectedTSCs.length]);

  // Load first sheet and process data when filters change
  useEffect(() => {
    if (uploadedData) {
      const sheets = Object.keys(uploadedData);
      if (sheets.length > 0 && !selectedSheet) {
        setSelectedSheet(sheets[0]);
      }
      processDashboardData();
    }
  }, [uploadedData, selectedSheet, selectedCompetency,selectedCompetencies, selectedTSCs, selectedSkills, refreshKey]);

  // Auto refresh (optional)
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => setRefreshKey((prev) => prev + 1), 30000);
    }
    return () => interval && clearInterval(interval);
  }, [autoRefresh]);

  // ===== KPI tile click handler =====
  const handleKpiClick = (type) => {
    setKpiFilter(type);
    setIsKpiTableVisible(true);
  };

  // ===== Data processing =====
  const processDashboardData = () => {
    if (!uploadedData || !selectedSheet || !uploadedData[selectedSheet]) {
      setDashboardData(null);
      return;
    }

    const raw = uploadedData[selectedSheet];
    if (!Array.isArray(raw) || raw.length === 0) {
      setDashboardData(null);
      return;
    }

    // Attach a stable __idx once. If already present, respect it.
    const data = raw.map((r, idx) => (r && r.__idx != null ? r : { ...r, __idx: idx }));

    const columns = Object.keys(data[0] || {});

    const competencyCol = getCompetencyColumn(columns);

    // Apply competency filter
    let filteredData =
      competencyCol && selectedCompetency
        ? data.filter((row) => normalize(row[competencyCol]) === normalize(selectedCompetency))
        : data;

    
    // let filteredData = data;
    if (competencyCol && selectedCompetencies?.length > 0) {
      const compSet = new Set(
        selectedCompetencies.map((c) => normalize(c))
      );
      filteredData = data.filter((row) => compSet.has(normalize(row[competencyCol])));
    }


    // TSC col & unique options
    const tscCol =
      getColumnByAliases(columns, ['tsc grouping', 'tsc_grouping', 'tscgrouping', 'tsc']) || null;

    let uniqueTSCs = [];
    if (tscCol) {
      const mapByCanon = new Map();
      for (const r of filteredData) {
        const rawT = r[tscCol];
        if (!rawT) continue;
        const key = canonTsc(rawT);
        if (!key) continue;
        const display = PREFERRED_TSC_DISPLAY.get(key) || rawT.toString().trim();
        if (!mapByCanon.has(key)) mapByCanon.set(key, display);
      }
      uniqueTSCs = Array.from(mapByCanon.values()).sort((a, b) => a.localeCompare(b));
    }

    // Apply TSC filter
    if (tscCol && selectedTSCs?.length) {
      const tscSet = new Set(selectedTSCs.map((s) => canonTsc(s)));
      filteredData = filteredData.filter((row) => tscSet.has(canonTsc(row[tscCol])));
    }

    // Skills
    const skillCol = getSkillColumn(columns);
    const uniqueSkills = skillCol
      ? Array.from(
          new Set(data.map((r) => r[skillCol]?.toString().trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b))
      : [];

    // Apply Skill filter
    let finalFiltered = filteredData;
    if (skillCol && selectedSkills.length > 0) {
      const selectedSet = new Set(selectedSkills.map((s) => s.trim()));
      finalFiltered = filteredData.filter(
        (r) => selectedSet.has((r[skillCol] ?? '').toString().trim())
      );
    }

    const numericColumns = columns.filter((col) =>
      data.some((row) => !isNaN(parseFloat(row[col])) && isFinite(row[col]))
    );
    const categoricalColumns = columns.filter(
      (col) =>
        !numericColumns.includes(col) && data.some((row) => row[col] && row[col].toString().trim())
    );

    setDashboardData({
      data,
      filteredData: finalFiltered,
      columns,
      numericColumns,
      categoricalColumns,
      competencyCol,
      uniqueCompetencies: competencyCol
        ? Array.from(new Set(data.map((r) => r[competencyCol]?.toString().trim()).filter(Boolean))).sort(
            (a, b) => a.localeCompare(b)
          )
        : [],
      tscCol,
      uniqueTSCs,
      skillCol,
      uniqueSkills,
      totalRecords: finalFiltered.length,
    });
  };

  // ===== Derived UI bits =====
  const kpiTitleMap = {
    TOTAL: 'Associate Details — Total Employees',
    AVAILABLE: 'Associate Details — Available',
    PAF: 'Associate Details — Proposed / Awaiting Feedback / Planned / Reserved / Selected',
    NEW_JOINER: 'Associate Details — New Joiners',
    RESIGNED: 'Associate Details — Resigned',
  };
  // const kpiTitle = kpiTitleMap[kpiFilter] || 'Associate Details';


const suffix = selectedCompetencies?.length ? ` (${compactList(selectedCompetencies)})` : '';
const kpiTitle = (kpiTitleMap[kpiFilter] || 'Associate Details') + suffix;


  // Simple metrics
  const normalizeLoose = (s) => (s ?? '').toString().toLowerCase().replace(/[\s_\-–—]+/g, '').trim();

  // const getKPIMetrics = () => {
  //   if (!dashboardData) return [];
  //   const { filteredData, tscCol, totalRecords } = dashboardData;

  //   const metrics = [
  //     {
  //       label: selectedCompetencies?.length ? `Total Employees (${selectedCompetencies})` : 'Total Employees',
  //       value: totalRecords,
  //       icon: '👥',
  //     },
  //   ];

  //   if (tscCol) {
  //     const availableCount = filteredData.filter(
  //       (row) =>
  //         normalizeLoose(row[tscCol]).includes('available') ||
  //         normalizeLoose(row[tscCol]).includes('nondeployable')
  //     ).length;
  //     metrics.push({ label: 'Available', value: availableCount, icon: '🎯' });

  //     const awaitingFeedback = filteredData.filter(
  //       (row) =>
  //         normalizeLoose(row[tscCol]).includes('proposedawaitingfeedback') ||
  //         normalizeLoose(row[tscCol]).includes('planned') ||
  //         normalizeLoose(row[tscCol]).includes('reserved') ||
  //         normalizeLoose(row[tscCol]).includes('selected')
  //     ).length;
  //     metrics.push({ label: 'Proposed - Awaiting Feedback', value: awaitingFeedback, icon: '📩' });
  //   }

  //   return metrics;
  // };

  const getKPIMetrics = () => {
  if (!dashboardData) return [];
  const { filteredData, tscCol, totalRecords } = dashboardData;

  const metrics = [
    {

     label: selectedCompetencies?.length
       ? `Total Employees (${compactList(selectedCompetencies)})`
       : 'Total Employees',
      value: totalRecords,
      icon: '👥',
     type: 'TOTAL',           // 👈 add type
    },
  ];

  if (tscCol) {
    const availableCount = filteredData.filter(
      (row) =>
        normalizeLoose(row[tscCol]).includes('available') ||
        normalizeLoose(row[tscCol]).includes('nondeployable')
    ).length;

    metrics.push({
      label: 'Available',
      value: availableCount,
      icon: '🎯',
     type: 'AVAILABLE',       // 👈 add type
    });

    const awaitingFeedback = filteredData.filter((row) => {
      const t = normalizeLoose(row[tscCol]);
      return (
        t.includes('proposedawaitingfeedback') ||
        t.includes('planned') ||
        t.includes('reserved') ||
        t.includes('selected')
      );
    }).length;

    metrics.push({
      label: 'Proposed - Awaiting Feedback',
      value: awaitingFeedback,
      icon: '📩',
    type: 'PAF',             // 👈 add type
    });
  }

  return metrics;
};

  // ===== Table data build (with stable __idx) =====
  const cols = dashboardData?.columns || [];
  const compCol = dashboardData?.competencyCol || getCompetencyColumn(cols);
  const skillCol = dashboardData?.skillCol || getSkillColumn(cols);
  const tscCol =
    dashboardData?.tscCol ||
    getColumnByAliases(cols, ['tsc grouping', 'tsc_grouping', 'tscgrouping', 'tsc']);

  const idCol = resolveColumn(cols, COL_ALIAS.associateId);
  const nameCol = resolveColumn(cols, COL_ALIAS.associateName);
  const gradeCol = resolveColumn(cols, COL_ALIAS.grade);
  const cityCol = resolveColumn(cols, COL_ALIAS.currentCity);
  const remCol = resolveColumn(cols, COL_ALIAS.remarks);

  // Base filtered rows from current dashboard filters
  const filtered = dashboardData?.filteredData || [];

  // KPI filter on top of current filtered data
  const filterRowsForKpi = (rows, type) => {
    if (!type) return rows;
    if (!tscCol) return rows;

    const typeKey = (type || '').toUpperCase();
    switch (typeKey) {
      case 'AVAILABLE':
        return rows.filter(
          (r) => canonTsc(r[tscCol]) === 'available' || canonTsc(r[tscCol]) === 'non deployable'
        );
      case 'PAF':
        return rows.filter((r) => {
          const t = canonTsc(r[tscCol]);
          return (
            t.includes('proposed') ||
            t.includes('awaiting feedback') ||
            t.includes('planned') ||
            t.includes('reserved') ||
            t.includes('selected')
          );
        });
      case 'NEW_JOINER':
        return rows.filter((r) => canonTsc(r[tscCol]) === 'new joiner');
      case 'RESIGNED':
        return rows.filter((r) => canonTsc(r[tscCol]) === 'resigned');
      case 'TOTAL':
      default:
        return rows;
    }
  };

  // Compute table rows for current KPI selection (preserve __idx!)
  const kpiFilteredRows = useMemo(() => {
    const base = filterRowsForKpi(filtered, kpiFilter);
    return base.map((r) => ({
      __idx: r.__idx, // 👈 stable id
      associateId: r[idCol] ?? '',
      associateName: r[nameCol] ?? '',
      grade: r[gradeCol] ?? '',
      competency: r[compCol] ?? '',
      currentCity: r[cityCol] ?? '',
      skillCategory: r[skillCol] ?? '',
      tscGrouping: r[tscCol] ?? '',
      remarks: r[remCol] ?? '',
    }));
  }, [filtered, idCol, nameCol, gradeCol, compCol, cityCol, skillCol, tscCol, remCol, kpiFilter]);

  const kpiTableColumns = [
    { key: 'associateId', label: 'Associate ID' },
    { key: 'associateName', label: 'Associate Name' },
    { key: 'grade', label: 'Grade' },
    { key: 'competency', label: 'Competency' },
    { key: 'currentCity', label: 'Current City' },
    { key: 'skillCategory', label: 'Skill Category' },
    { key: 'tscGrouping', label: 'TSC Grouping' },
    { key: 'remarks', label: 'Remarks' },
  ];

  // ===== Early loading state =====
  if (!uploadedData) {
    return (
      <div className="dashboard-tab">
        <div className="card">
          <div className="message message-warning">⚠️ Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  // ===== Derived metrics =====
  const sheets = Object.keys(uploadedData);
  const metrics = useMemo(() => getKPIMetrics(), [
    dashboardData?.filteredData,
    dashboardData?.tscCol,
    dashboardData?.totalRecords,
    selectedCompetencies,
  ]);

  // KPI counts
  const TSC_KEYS = { NEW_JOINER: 'new joiner', RESIGNED: 'resigned' };
  const newJoinersCount = dashboardData?.tscCol
    ? (dashboardData.filteredData || []).filter(
        (r) => canonTsc(r[dashboardData.tscCol]) === TSC_KEYS.NEW_JOINER
      ).length
    : 0;
  const resignedCount = dashboardData?.tscCol
    ? (dashboardData.filteredData || []).filter(
        (r) => canonTsc(r[dashboardData.tscCol]) === TSC_KEYS.RESIGNED
      ).length
    : 0;

  return (
    <div className="dashboard-tab">
      {/* ============== Controls (excluded from export) ============== */}
      <ControlsPanel
        isSampleData={isSampleData}
        sheets={sheets}
        selectedSheet={selectedSheet}
        onChangeSheet={setSelectedSheet}
        hasCompetency={!!dashboardData?.competencyCol}
        uniqueCompetencies={dashboardData?.uniqueCompetencies ?? []}
        selectedCompetency={selectedCompetency}
        onChangeCompetency={setSelectedCompetency}
        selectedCompetencies={selectedCompetencies}
        onChangeSelectedCompetencies={setSelectedCompetencies}
        hasSkill={!!dashboardData?.skillCol}
        uniqueSkills={dashboardData?.uniqueSkills ?? []}
        selectedSkills={selectedSkills}
        onChangeSelectedSkills={setSelectedSkills}
        hasTsc={!!dashboardData?.tscCol}
        uniqueTSCs={dashboardData?.uniqueTSCs ?? []}
        selectedTSCs={selectedTSCs}
        onChangeSelectedTSCs={setSelectedTSCs}
      >
        {/* Global export buttons for KPI + charts */}
        <ExportImageButtons
          targetRef={exportRef}
          headerSelector="#app-header"
          defaultFilename={`dashboard_${selectedSheet || 'Sheet'}`}
          scale={2}
          expandSelectors={['[data-export-full="true"]']}
          ignoreSelectors={['.no-export', '[data-export-ignore="true"]']}
        />
      </ControlsPanel>

      {/* ============== Exportable area: KPI + Charts only ============== */}
      <div ref={exportRef}>
        <KpiCards
          metrics={metrics}
          newJoinersCount={newJoinersCount}
          resignedCount={resignedCount}
          onKpiClick={handleKpiClick}
          activeKpi={kpiFilter}
          selectedSkills={selectedSkills}     
          filteredData={dashboardData?.filteredData || []}  
          tscCol={dashboardData?.tscCol}                

        />

        {/* KPI table drawer */}
        {isKpiTableVisible && (
          <div className="card" style={{ marginTop: 12 }}>
            <div
              className="no-export"
              style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}
            >
              <div>
                <button
                  className="btn dismiss"
                  type="button"
                
                onClick={() => {
                    setIsKpiTableVisible(false);
                    setKpiFilter(null); 
                  }}

                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>
            <KpiDataTable
              title={`${kpiTitle} — ${kpiFilteredRows.length.toLocaleString()} record(s)`}
              columns={kpiTableColumns}
              rows={kpiFilteredRows} 
              pageSize={10}
              height={360}
              editableKeys={[
                'grade',
                'competency',
                'currentCity',
                'skillCategory',
                'tscGrouping',
                'remarks',
              ]}
              rowIdKey="__idx"
              exportFilename={`kpi_${(kpiFilter || 'total').toLowerCase()}_${selectedSheet}`}
              onRowsChange={(updatedRows) => {
                setDashboardData((prev) => {
                  if (!prev?.data) return prev;
                  const patchable = new Set([
                    'grade',
                    'competency',
                    'currentCity',
                    'skillCategory',
                    'tscGrouping',
                    'remarks',
                  ]);

                  const copy = prev.data.map((r) => ({ ...r }));
                  const byId = new Map(copy.map((r) => [r.__idx, r]));

                  updatedRows.forEach((u) => {
                    const target = byId.get(u.__idx);
                    if (!target) return;
                    patchable.forEach((k) => {
                      if (Object.prototype.hasOwnProperty.call(u, k)) {
                        target[k] = u[k];
                      }
                    });
                  });

                  return { ...prev, data: copy };
                });

                // If you want charts to recompute immediately after edits:
                // setRefreshKey((k) => k + 1);
              }}
            />
          </div>
        )}

        <div className="grid grid-1">
          <div className="grid grid-2">
            {/* Charts now build their own models internally (anti-flicker) */}
            <CompetencyPie
              data={dashboardData?.data || []}
              competencyCol={dashboardData?.competencyCol}
              minHeight={460}
              animationDuration={250}
            />
            <PrimarySkillBar
              data={dashboardData?.data || []}
              columns={dashboardData?.columns || []}
              categoricalColumns={dashboardData?.categoricalColumns || []}
              tscCol={dashboardData?.tscCol}
               minHeight={460}
              animationDuration={250}
              updateMode="active"   // 'none' for instant updates
              headroom="10%"        // y-axis headroom above tallest bar
            />
          </div>

          <CategoryTrendStackedBar
            data={dashboardData?.filteredData || []}
            columns={dashboardData?.columns || []}
            categoricalColumns={dashboardData?.categoricalColumns || []}
            minHeight={420}
            growOnly={true}        // prevents shrinking (no layout jank)
            animationDuration={250}
            updateMode="active"    // 'none' for instant updates
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardTab;