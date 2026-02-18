import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';

// Default rows per page
const DEFAULT_PAGE_SIZE = 10;

// Utility: detect numeric values
const isNumeric = (v) => {
  if (v == null || v === '') return false;
  const n = Number(v);
  return Number.isFinite(n);
};

function KpiDataTable({
  title = 'Associate Details',
  rows = [],
  editableKeys = ['grade', 'competency', 'currentCity', 'skillCategory', 'tscGrouping', 'remarks'],
  rowIdKey = '__idx',
  onRowsChange,
  exportFilename = 'kpi_associates',
  notifyMode = 'mutations', // 'mutations' | 'all' | 'none'

  // Optional: parent can pass a page size – if omitted, defaults to 10
  pageSize: controlledPageSize,
}) {
  // ===== columns (stable) =====
  const columns = useMemo(
    () => [
      { key: 'associateId', label: 'Associate ID', width: 120 },
      { key: 'associateName', label: 'Associate Name', minWidth: 180 },
      { key: 'grade', label: 'Grade', width: 60 },
      { key: 'currentCity', label: 'City', width: 90 },
      { key: 'competency', label: 'Competency', minWidth: 160 },
      { key: 'skillCategory', label: 'Skill', minWidth: 120 },
      { key: 'tscGrouping', label: 'TSC Group', minWidth: 160 },
      { key: 'remarks', label: 'Remarks', minWidth: 140 },
    ],
    []
  );

  // ===== page size (default 10; can be changed with pills) =====
  const [pageSize, setPageSize] = useState(controlledPageSize ?? DEFAULT_PAGE_SIZE);
  useEffect(() => {
    if (controlledPageSize != null) setPageSize(controlledPageSize);
  }, [controlledPageSize]);

  // ===== sorting =====
  const [sortBy, setSortBy] = useState(null);    // column key
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'

  // ===== table data state =====
  const [tableRows, setTableRows] = useState(() => (Array.isArray(rows) ? rows : []));
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [checked, setChecked] = useState(() => new Set());

  // reset table when incoming rows change
  useEffect(() => {
    setTableRows(Array.isArray(rows) ? rows : []);
    setPage(1);
    setEditingId(null);
    setDraft({});
    setChecked(new Set());
  }, [rows]);

  // notify parent (optional stream)
  useEffect(() => {
    if (notifyMode === 'all' && typeof onRowsChange === 'function') {
      onRowsChange(tableRows);
    }
  }, [notifyMode, tableRows, onRowsChange]);

  // sorting handlers
  const onHeaderClick = useCallback((colKey) => {
    if (!colKey) return;
    setPage(1); // reset page when sorting
    setSortBy((prev) => {
      if (prev !== colKey) {
        setSortDir('asc');
        return colKey;
      }
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return colKey;
    });
  }, []);

  const comparator = useCallback(
    (a, b) => {
      if (!sortBy) return 0;

      const av = a?.[sortBy];
      const bv = b?.[sortBy];

      // Null/undefined handling (push to bottom on asc)
      const aU = av == null || av === '';
      const bU = bv == null || bv === '';
      if (aU && bU) return 0;
      if (aU) return 1;
      if (bU) return -1;

      // Numeric compare if both numeric
      if (isNumeric(av) && isNumeric(bv)) {
        const diff = Number(av) - Number(bv);
        return sortDir === 'asc' ? diff : -diff;
      }

      // String compare (locale-aware, case-insensitive)
      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      const cmp = as.localeCompare(bs);
      return sortDir === 'asc' ? cmp : -cmp;
    },
    [sortBy, sortDir]
  );

  // stable sorted rows
  const sortedRows = useMemo(() => {
    if (!sortBy) return tableRows;
    const tagged = tableRows.map((r, i) => ({ r, i }));
    tagged.sort((x, y) => {
      const c = comparator(x.r, y.r);
      return c !== 0 ? c : x.i - y.i;
    });
    return tagged.map((t) => t.r);
  }, [tableRows, sortBy, comparator]);

  // paging
  const total = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);

  const visibleSlice = useMemo(() => {
    const start = (current - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, current, pageSize]);

  // helpers
  const isEditable = useCallback((key) => editableKeys.includes(key), [editableKeys]);

  const getColWidthStyle = (col) => {
    const style = {};
    if (col?.width != null) style.width = col.width;
    if (col?.minWidth != null) style.minWidth = col.minWidth;
    if (col?.maxWidth != null) style.maxWidth = col.maxWidth;
    return style;
  };

  // edit
  const beginEdit = useCallback(
    (rowId) => {
      setEditingId(rowId);
      const row = tableRows.find((r) => (r?.[rowIdKey] ?? r) === rowId) || {};
      const d = {};
      for (const col of columns) d[col.key] = row[col.key] ?? '';
      setDraft(d);
    },
    [columns, rowIdKey, tableRows]
  );

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setDraft({});
  }, []);

  const saveEdit = useCallback(
    (rowId) => {
      setTableRows((prev) => {
        const idx = prev.findIndex((r) => (r?.[rowIdKey] ?? r) === rowId);
        if (idx < 0) return prev;

        const next = [...prev];
        const existing = { ...next[idx] };
        for (const k of editableKeys) {
          if (k in draft && draft[k] !== existing[k]) {
            existing[k] = draft[k];
          }
        }
        next[idx] = existing;

        if (notifyMode !== 'none' && typeof onRowsChange === 'function') {
          onRowsChange(next);
        }
        return next;
      });
      cancelEdit();
    },
    [draft, editableKeys, rowIdKey, onRowsChange, notifyMode, cancelEdit]
  );

  // selection
  const toggleChecked = useCallback((rowId, on) => {
    setChecked((prev) => {
      const n = new Set(prev);
      if (on) n.add(rowId);
      else n.delete(rowId);
      return n;
    });
  }, []);

  const toggleAllOnPage = useCallback(
    (on) => {
      setChecked((prev) => {
        const n = new Set(prev);
        visibleSlice.forEach((r) => {
          const id = r?.[rowIdKey] ?? r;
          if (on) n.add(id);
          else n.delete(id);
        });
        return n;
      });
    },
    [rowIdKey, visibleSlice]
  );

  // CSV in sorted order
  const downloadCsv = useCallback(() => {
    const head = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',');
    const body = sortedRows
      .map((r) => columns.map((c) => `"${(r[c.key] ?? '').toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const csv = head + '\n' + body;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFilename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [columns, exportFilename, sortedRows]);

  // master checkbox helpers
  const allOnPage =
    visibleSlice.length > 0 && visibleSlice.every((r) => checked.has(r?.[rowIdKey] ?? r));
  const someOnPage =
    visibleSlice.some((r) => checked.has(r?.[rowIdKey] ?? r)) && !allOnPage;

  const masterRef = useRef(null);
  useEffect(() => {
    if (masterRef.current) masterRef.current.indeterminate = someOnPage;
  }, [someOnPage]);

  // layout helpers
  const tableStyleBase = {
    width: '100%',
    minWidth: 1000,
    borderCollapse: 'separate',
    borderSpacing: 0,
    tableLayout: 'fixed',
  };

  const cellTextBase = {
    fontSize: 13,
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const headerSortIcon = (colKey) => {
    if (sortBy !== colKey) return '⇅';
    return sortDir === 'asc' ? '↑' : '↓';
  };
  const ariaSort = (colKey) => {
    if (sortBy !== colKey) return 'none';
    return sortDir === 'asc' ? 'ascending' : 'descending';
  };

  const pageSizes = [10, 20, 40, 80, 100];

  // ===== page picker =====
  const [isPagePickerOpen, setIsPagePickerOpen] = useState(false);
  const [gotoInput, setGotoInput] = useState('');
  const pagePickerBtnRef = useRef(null);
  const pagePickerPanelRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!isPagePickerOpen) return;
      const withinBtn = pagePickerBtnRef.current?.contains(e.target);
      const withinPanel = pagePickerPanelRef.current?.contains(e.target);
      if (!withinBtn && !withinPanel) setIsPagePickerOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsPagePickerOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isPagePickerOpen]);

  const setPageClamped = useCallback(
    (p) => {
      const next = Math.max(1, Math.min(Math.max(1, Math.ceil(total / pageSize)), Number(p) || 1));
      setPage(next);
    },
    [total, pageSize]
  );

  return (
    <div className="card">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div
          className="flex tableHeadingMain"
          style={{ display: 'flex', width: '100%', fontWeight: 400, justifyContent: 'space-between' }}
        >
          <div className="tableHeadRight" style={{ width: '50%' }}>
            <h3 style={{ margin: 0 }}>{title}</h3>
          </div>

          <div
            className="no-export ss"
            style={{ display: 'flex', gap: 12, width: '50%', justifyContent: 'right', alignItems: 'center', flexWrap: 'wrap' }}
          >
            {/* Download CSV */}
            <div
              className="buttonDwnld"
              data-tooltip="CSV"
              onClick={downloadCsv}
              title="Download CSV"
              role="button"
              tabIndex={0}
              style={{ cursor: 'pointer' }}
            >
              <div className="button-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="text">Download</div>
                <span className="icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="1.25em" height="1.25em" viewBox="0 0 24 24">
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-card" style={{ border: '1px solid #e5e7eb', borderRadius: 6, marginTop: 8 }}>
        <div className="table-scroll-x" style={{ overflowX: 'auto', overflowY: 'visible', width: '100%'}}>
          <table className="table-el" style={tableStyleBase}>
            {/* Column widths */}
            <colgroup>
              <col style={{ width: 36 }} />
              {columns.map((col) => (
                <col key={col.key} style={getColWidthStyle(col)} />
              ))}
              <col style={{ width: 160 }} />
            </colgroup>

            <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f8fafc' }}>
              <tr>
                <th style={{ width: 36, padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
                  <input
                    ref={masterRef}
                    type="checkbox"
                    aria-label="Select all on page"
                    onChange={(e) => toggleAllOnPage(e.target.checked)}
                    checked={allOnPage}
                  />
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => onHeaderClick(col.key)}
                    style={{
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: 12,
                      color: '#334155',
                      padding: '10px 12px',
                      borderBottom: '1px solid #e5e7eb',
                      background: '#f8fafc',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      userSelect: 'none',
                      ...getColWidthStyle(col),
                    }}
                    title={`Sort by ${col.label}`}
                    aria-sort={ariaSort(col.key)}
                    scope="col"
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {col.label} <span style={{ color: '#9ca3af' }}>{headerSortIcon(col.key)}</span>
                    </span>
                  </th>
                ))}
                <th
                  style={{
                    width: 160,
                    padding: '10px 12px',
                    borderBottom: '1px solid #e5e7eb',
                    background: '#f8fafc',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {visibleSlice.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 2} style={{ padding: 16, fontSize: 13, color: '#6b7280' }}>
                    No rows to display.
                  </td>
                </tr>
              )}

              {visibleSlice.map((r, i) => {
                const id = r?.[rowIdKey] ?? (current - 1) * pageSize + i;
                const isEditing = editingId === id;

                return (
                  <tr key={id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {/* select */}
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="checkbox"
                        checked={checked.has(id)}
                        onChange={(e) => toggleChecked(id, e.target.checked)}
                        aria-label="Select row"
                      />
                    </td>

                    {/* data cells */}
                    {columns.map((col) => {
                      const raw = r[col.key];
                      const val = raw == null ? '' : String(raw);
                      const widthStyle = getColWidthStyle(col);

                      if (isEditing && isEditable(col.key)) {
                        return (
                          <td key={col.key} style={{ padding: '6px 10px', ...widthStyle }} title={val}>
                            <input
                              value={draft[col.key] ?? ''}
                              onChange={(e) => setDraft((d) => ({ ...d, [col.key]: e.target.value }))}
                              title={draft[col.key] == null ? '' : String(draft[col.key])}
                              style={{
                                width: '100%',
                                border: '1px solid #d0d7de',
                                borderRadius: 4,
                                padding: '6px 8px',
                              }}
                            />
                          </td>
                        );
                      }

                      return (
                        <td
                          key={col.key}
                          style={{ padding: '8px 12px', ...cellTextBase, ...widthStyle }}
                          title={val}
                          aria-label={val}
                        >
                          <span title={val}>{val}</span>
                        </td>
                      );
                    })}

                    {/* actions */}
                    <td style={{ padding: '8px 12px', display: 'flex', gap: 8, justifyContent: 'center' }}>
                      {!isEditing ? (
                        <>
                          <button className="editBtn" onClick={() => beginEdit(id)} title="Edit row" aria-label="Edit row">
                            <svg height="1em" viewBox="0 0 512 512" aria-hidden="true" focusable="false">
                              <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="actionBar" style={{ display: 'flex', gap: 8 }}>
                            {/* SAVE */}
                            <button
                              className="action_has has_saved saveBtn"
                              onClick={() => saveEdit(id)}
                              title="Save changes"
                              aria-label="Save changes"
                              type="button"
                            >
                              <svg
                                width="10"
                                viewBox="0 0 50 70"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="svgIcon"
                                aria-hidden="true"
                                focusable="false"
                              >
                                <path
                                  d="M46 62.0085L46 3.88139L3.99609 3.88139L3.99609 62.0085L24.5 45.5L46 62.0085Z"
                                  stroke="currentColor"
                                  strokeWidth="7"
                                />
                              </svg>
                            </button>

                            {/* CANCEL */}
                            <button
                              className="action_has cancelBtn color-red"
                              onClick={() => cancelEdit?.(id)}
                              title="Cancel changes"
                              aria-label="Cancel changes"
                              type="button"
                            >
                              <svg
                                className="svgIcon"
                                width="18"
                                height="18"
                                viewBox="0 0 48 48"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                                focusable="false"
                              >
                                <circle className="ring" cx="24" cy="24" r="21" />
                                <line className="x" x1="16" y1="16" x2="32" y2="32" />
                                <line className="x" x1="32" y1="16" x2="16" y2="32" />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pager */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
              padding: 8,
              borderTop: '1px solid #e5e7eb',
              flexWrap: 'wrap',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              Showing {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, total)} of {total.toLocaleString()}
            </div>

            {/* Rows-per-page pills (default is 10) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Rows per page:</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {[10, 20, 40, 80, 100].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    className={`btn btn-sm ${pageSize === sz ? 'active' : ''}`}
                    onClick={() => {
                      setPageSize(sz);
                      setPage(1);
                    }}
                    title={`Show ${sz} rows per page`}
                    aria-pressed={pageSize === sz}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="btn btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={current <= 1}
                title="Previous page"
              >
                ◀ Prev
              </button>

              {/* Page X / Y with dropdown picker */}
              <PagePicker
                current={current}
                totalPages={totalPages}
                pageSize={pageSize}
                total={total}
                onSelect={(p) => setPage(p)}
              />

              <button
                className="btn btn-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={current >= totalPages}
                title="Next page"
              >
                Next ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== PagePicker sub-component (encapsulated) =====
function PagePicker({ current, totalPages, pageSize, total, onSelect }) {
  const [open, setOpen] = useState(false);
  const [gotoInput, setGotoInput] = useState(String(current));
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => setGotoInput(String(current)), [current]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      const withinBtn = btnRef.current?.contains(e.target);
      const withinPanel = panelRef.current?.contains(e.target);
      if (!withinBtn && !withinPanel) setOpen(false);
    };
    const onKeyDown = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const setPageClamped = (p) => {
    const next = Math.max(1, Math.min(totalPages, Number(p) || 1));
    onSelect(next);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        type="button"
        className="btn btn-sm"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Jump to page"
      >
        Page {current} / {totalPages} ▾
      </button>

      {open && (
        <div
          ref={panelRef}
          role="listbox"
          aria-label="Select page"
          style={{
            position: 'absolute',
            zIndex: 1000,
            top: 'calc(100% + 6px)',
            left: 0,
            width: 260,
            background: '#fff',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}
        >
          {/* Quick go-to input */}
          <div
            style={{
              padding: 8,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              borderBottom: '1px solid #eee',
              background: '#f9fafb',
            }}
          >
            <label htmlFor="gotoPageInput" style={{ fontSize: 12, color: '#6b7280' }}>
              Go to page
            </label>
            <input
              id="gotoPageInput"
              type="number"
              min={1}
              max={totalPages}
              value={gotoInput}
              onChange={(e) => setGotoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPageClamped(gotoInput);
                  setOpen(false);
                }
              }}
              style={{
                width: 84,
                border: '1px solid #d1d5db',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 13,
              }}
            />
            <button
              className="btn btn-sm"
              onClick={() => {
                setPageClamped(gotoInput);
                setOpen(false);
              }}
              title="Go"
            >
              Go
            </button>
          </div>

          {/* List of pages with row ranges */}
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const start = (p - 1) * pageSize + 1;
              const end = Math.min(p * pageSize, total);
              const active = p === current;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    onSelect(p);
                    setOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    background: active ? '#eef2ff' : '#fff',
                    color: active ? '#3730a3' : '#111827',
                    border: 'none',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                  aria-selected={active}
                >
                  <span>Page {p}</span>
                  <span style={{ color: '#6b7280', fontSize: 12 }}>
                    {start}–{end}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(KpiDataTable);
