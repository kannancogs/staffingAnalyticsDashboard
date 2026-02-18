// components/ControlsPanel.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function ControlsPanel({
  isSampleData,
  sheets, selectedSheet, onChangeSheet,
  // hasCompetency, uniqueCompetencies, selectedCompetency, onChangeCompetency,
hasCompetency, uniqueCompetencies, selectedCompetencies = [], onChangeSelectedCompetencies = () => {},
  hasSkill, uniqueSkills, selectedSkills, onChangeSelectedSkills,
  hasTsc, uniqueTSCs, selectedTSCs, onChangeSelectedTSCs,

  children // for extra actions like Export buttons
}) {
  console.log(children);
  // Local UI state for multi-selects
  const [isSkillOpen, setIsSkillOpen] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const skillFieldRef = useRef(null);
  const skillPanelRef = useRef(null);

  const [isTSCPopOpen, setIsTSCPopOpen] = useState(false);
  const [tscSearch, setTscSearch] = useState('');
  const tscFieldRef = useRef(null);
  const tscPanelRef = useRef(null);

  const [isCompOpen, setIsCompOpen] = useState(false);
  const [compSearch, setCompSearch] = useState('');
  const compFieldRef = useRef(null);
  const compPanelRef = useRef(null);

  // Outside click + ESC
  useEffect(() => {
    const onDocClick = (e) => {
      if (isSkillOpen) {
        const withinField = skillFieldRef.current?.contains(e.target);
        const withinPanel = skillPanelRef.current?.contains(e.target);
        if (!withinField && !withinPanel) setIsSkillOpen(false);
      }
      if (isTSCPopOpen) {
        const withinField = tscFieldRef.current?.contains(e.target);
        const withinPanel = tscPanelRef.current?.contains(e.target);
        if (!withinField && !withinPanel) setIsTSCPopOpen(false);
      }

    if (isCompOpen) {
         const withinField = compFieldRef.current?.contains(e.target);
         const withinPanel = compPanelRef.current?.contains(e.target);
         if (!withinField && !withinPanel) setIsCompOpen(false);
     }

    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSkillOpen(false);
        setIsTSCPopOpen(false);
        setIsCompOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isSkillOpen, isTSCPopOpen,isCompOpen]);

  const filteredSkills = useMemo(() => {
    const list = uniqueSkills ?? [];
    if (!skillSearch.trim()) return list;
    const q = skillSearch.toLowerCase();
    return list.filter(s => s.toLowerCase().includes(q));
  }, [uniqueSkills, skillSearch]);

  const filteredCompetencies = React.useMemo(() => {
  const list = uniqueCompetencies ?? [];
  const q = compSearch.trim().toLowerCase();
  if (!q) return list;
  return list.filter(c => c.toLowerCase().includes(q));
}, [uniqueCompetencies, compSearch]);


  const filteredTSCs = useMemo(() => {
    const list = uniqueTSCs ?? [];
    const q = tscSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(s => s.toLowerCase().includes(q));
  }, [uniqueTSCs, tscSearch]);

  // const selectedSkillsLabel = useMemo(() => {
  //   if (!selectedSkills?.length) return '';
  //   if (selectedSkills.length <= 2) return selectedSkills.join(', ');
  //   return `${selectedSkills.slice(0, 2).join(', ')} +${selectedSkills.length - 2}`;
  // }, [selectedSkills]);

  

  // const selectedTSCsLabel = useMemo(() => {
  //   if (!selectedTSCs?.length) return '';
  //   if (selectedTSCs.length <= 2) return selectedTSCs.join(', ');
  //   return `${selectedTSCs.slice(0, 2).join(', ')} +${selectedTSCs.length - 2}`;
  // }, [selectedTSCs]);

  const selectedSkillsLabel = useMemo(() => {
 if (!selectedSkills?.length) return '';
 if (selectedSkills?.length <= 2) return selectedSkills.join(', ');
  return `${selectedSkills.slice(0, 2).join(', ')} +${selectedSkills.length - 2}`;
}, [selectedSkills]);

const selectedTSCsLabel = useMemo(() => {
 if (!selectedTSCs?.length) return '';
 if (selectedTSCs?.length <= 2) return selectedTSCs.join(', ');
  return `${selectedTSCs.slice(0, 2).join(', ')} +${selectedTSCs.length - 2}`;
}, [selectedTSCs]);

const selectedCompetenciesLabel = React.useMemo(() => {
  if (!selectedCompetencies?.length) return '';
  if (selectedCompetencies?.length <= 2) return selectedCompetencies.join(', ');
  return `${selectedCompetencies.slice(0, 2).join(', ')} +${selectedCompetencies.length - 2}`;
}, [selectedCompetencies]);

  return (
    <div className="card no-export">
      {isSampleData && (
        <div style={{
          backgroundColor: '#e3f2fd',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          color: '#1976d2'
        }}>
          📋 Sample Data Preview - Upload your own Excel file to replace this data
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center'}}>
        {/* Sheet selector */}
        <div>
          <label>Select Sheet:</label>
          <select
            className="select"
            value={selectedSheet}
            onChange={(e) => onChangeSheet(e.target.value)}
            style={{ marginLeft: '0.5rem', minWidth: '200px' }}
          >
            {sheets.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Competency selector */}
        {/* {hasCompetency && (
          <div>
            <label>Select Competency:</label>
            <select
              className="select"
              value={selectedCompetency}
              onChange={(e) => onChangeCompetency(e.target.value)}
              style={{ marginLeft: '0.5rem', minWidth: '220px' }}
            >
              <option value="">All</option>
              {uniqueCompetencies.map((comp) => (
                <option key={comp} value={comp}>{comp}</option>
              ))}
            </select>
          </div>
        )} */}

 {/* Competency multi-select (new) */}
 {hasCompetency && (
   <div style={{ position: 'relative' }}>
     <label htmlFor="compSelectInput">Competency:</label>
     <div
       ref={compFieldRef}
       style={{
         marginTop: 6,
         display: 'flex',
         alignItems: 'center',
         gap: 8,
         border: '1px solid #d0d7de',
         borderRadius: 6,
         padding: '8px 10px',
         background: '#fff',
         cursor: 'pointer',
         minHeight: 38,
         width: 280
       }}
       onClick={() => setIsCompOpen(o => !o)}
       onKeyDown={(e) => {
         if (e.key === 'Enter' || e.key === ' ') {
           e.preventDefault();
           setIsCompOpen(o => !o);
         }
       }}
       tabIndex={0}
       role="combobox"
       aria-expanded={isCompOpen}
       aria-controls="compMultiPanel"
       aria-haspopup="listbox"
     >
       <input
         id="compSelectInput"
         type="text"
         readOnly
         value={selectedCompetenciesLabel}
         placeholder="Select competency"
         style={{
           border: 'none',
           outline: 'none',
           width: '100%',
           cursor: 'pointer',
           background: 'transparent',
           fontSize: 14,
           color: selectedCompetencies.length ? '#111' : '#6b7280'
         }}
       />
       <span style={{ marginLeft: 'auto', color: '#6b7280' }}>▾</span>
     </div>

     {isCompOpen && (
       <div
         ref={compPanelRef}
         id="compMultiPanel"
         style={{
           position: 'absolute',
           zIndex: 1000,
           top: 'calc(100%  6px)',
           left: 0,
           width: 320,
           maxHeight: 320,
           overflow: 'hidden',
           background: '#fff',
           border: '1px solid #d0d7de',
           borderRadius: 8,
           boxShadow: '0 2px 4px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.12)'
         }}
         role="listbox"
         aria-multiselectable="true"
       >
         <div
           style={{
             display: 'flex',
             alignItems: 'center',
             gap: 8,
             padding: '8px 10px',
             borderBottom: '1px solid #eee',
             background: '#f9fafb'
           }}
         >
           <button
             type="button"
             className="btn btn-sm"
             onClick={() => onChangeSelectedCompetencies(uniqueCompetencies)}
             disabled={(uniqueCompetencies?.length ?? 0) === 0}
           >
             Select All
           </button>
           <button
             type="button"
             className="btn btn-sm"
             onClick={() => { onChangeSelectedCompetencies([]); setCompSearch(''); }}
           >
             Clear
           </button>
           <div style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}>
             {selectedCompetencies.length ? `${selectedCompetencies.length} selected` : 'None selected'}
           </div>
         </div>

         <div style={{ padding: '8px 10px', borderBottom: '1px solid #eee' }}>
           <input
             type="text"
             value={compSearch}
             onChange={(e) => setCompSearch(e.target.value)}
             placeholder="Search competencies…"
             style={{
               width: '100%',
               border: '1px solid #d0d7de',
               borderRadius: 6,
               padding: '6px 8px',
               outline: 'none',
               cursor: 'pointer',
             }}
           />
         </div>

         <div style={{ maxHeight: 220, overflow: 'auto', padding: '8px 10px' }}>
           {filteredCompetencies.length === 0 && (
             <div style={{ fontSize: 12, color: '#9ca3af' }}>No competencies found</div>
           )}
           {filteredCompetencies.map((comp, idx) => {
             const checked = selectedCompetencies.includes(comp);
             return (
               <label
                 key={`${comp}-${idx}`}
                 style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}
               >
                 <input
                   type="checkbox"
                   checked={checked}
                   onChange={(e) => {
                     if (e.target.checked) {
                       onChangeSelectedCompetencies([...new Set([...selectedCompetencies, comp])]);
                     } else {
                       onChangeSelectedCompetencies(selectedCompetencies.filter(c => c !== comp));
                     }
                   }}
                 />
                 <span style={{ fontSize: 14 }}>{comp}</span>
               </label>
             );
           })}
         </div>

         <div style={{ padding: '8px 10px', borderTop: '1px solid #eee', textAlign: 'right' }}>
           <button type="button" className="btn btn-sm" onClick={() => setIsCompOpen(false)}>
             Done
           </button>
         </div>
       </div>
     )}
   </div>
 )}
        {/* Skill multi-select */}
        {hasSkill && (
          <div style={{ position: 'relative' }}>
            <label htmlFor="skillSelectInput">Skill Category:</label>
            <div
              ref={skillFieldRef}
              style={{
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid #d0d7de',
                borderRadius: 6,
                padding: '8px 10px',
                background: '#fff',
                cursor: 'pointer',
                minHeight: 38,
                width: 280
              }}
              onClick={() => setIsSkillOpen(o => !o)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsSkillOpen(o => !o);
                }
              }}
              tabIndex={0}
              role="combobox"
              aria-expanded={isSkillOpen}
              aria-controls="skillMultiPanel"
              aria-haspopup="listbox"
            >
              <input
                id="skillSelectInput"
                type="text"
                readOnly
                value={selectedSkillsLabel}
                placeholder="Select skill set"
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  cursor: 'pointer',
                  background: 'transparent',
                  fontSize: 14,
                  color: selectedSkills.length ? '#111' : '#6b7280'
                }}
              />
              <span style={{ marginLeft: 'auto', color: '#6b7280' }}>▾</span>
            </div>

            {isSkillOpen && (
              <div
                ref={skillPanelRef}
                id="skillMultiPanel"
                style={{
                  position: 'absolute',
                  zIndex: 1000,
                  top: 'calc(100% + 6px)',
                  left: 0,
                  width: 320,
                  maxHeight: 320,
                  overflow: 'hidden',
                  background: '#fff',
                  border: '1px solid #d0d7de',
                  borderRadius: 8,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.12)'
                }}
                role="listbox"
                aria-multiselectable="true"
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    borderBottom: '1px solid #eee',
                    background: '#f9fafb'
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => onChangeSelectedSkills(uniqueSkills)}
                    disabled={(uniqueSkills?.length ?? 0) === 0}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => { onChangeSelectedSkills([]); setSkillSearch(''); }}
                  >
                    Clear
                  </button>
                  <div style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}>
                    {selectedSkills.length ? `${selectedSkills.length} selected` : 'None selected'}
                  </div>
                </div>

                <div style={{ padding: '8px 10px', borderBottom: '1px solid #eee' }}>
                  <input
                    type="text"
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    placeholder="Search skills…"
                    style={{
                      width: '100%',
                      border: '1px solid #d0d7de',
                      borderRadius: 6,
                      padding: '6px 8px',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  />
                </div>

                <div style={{ maxHeight: 220, overflow: 'auto', padding: '8px 10px' }}>
                  {filteredSkills.length === 0 && (
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>No skills found</div>
                  )}
                  {filteredSkills.map((skill, idx) => {
                    const checked = selectedSkills.includes(skill);
                    return (
                      <label
                        key={`${skill}-${idx}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              onChangeSelectedSkills([...new Set([...selectedSkills, skill])]);
                            } else {
                              onChangeSelectedSkills(selectedSkills.filter(s => s !== skill));
                            }
                          }}
                        />
                        <span style={{ fontSize: 14 }}>{skill}</span>
                      </label>
                    );
                  })}
                </div>

                <div style={{ padding: '8px 10px', borderTop: '1px solid #eee', textAlign: 'right' }}>
                  <button type="button" className="btn btn-sm" onClick={() => setIsSkillOpen(false)}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TSC multi-select */}
        {hasTsc && (
          <div style={{ position: 'relative' }}>
            <label htmlFor="tscSelectInput">TSC Grouping:</label>
            <div
              ref={tscFieldRef}
              style={{
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid #d0d7de',
                borderRadius: 6,
                padding: '8px 10px',
                background: '#fff',
                cursor: 'pointer',
                minHeight: 38,
                width: 280
              }}
              onClick={() => setIsTSCPopOpen(o => !o)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsTSCPopOpen(o => !o);
                }
              }}
              tabIndex={0}
              role="combobox"
              aria-expanded={isTSCPopOpen}
              aria-controls="tscMultiPanel"
              aria-haspopup="listbox"
            >
              <input
                id="tscSelectInput"
                type="text"
                readOnly
                value={selectedTSCsLabel}
                placeholder="Select TSC"
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: selectedTSCs.length ? '#111' : '#6b7280'
                }}
              />
              <span style={{ marginLeft: 'auto', color: '#6b7280' }}>▾</span>
            </div>

            {isTSCPopOpen && (
              <div
                ref={tscPanelRef}
                id="tscMultiPanel"
                style={{
                  position: 'absolute',
                  zIndex: 1000,
                  top: 'calc(100% + 6px)',
                  left: 0,
                  width: 320,
                  maxHeight: 320,
                  overflow: 'hidden',
                  background: '#fff',
                  border: '1px solid #d0d7de',
                  borderRadius: 8,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.12)'
                }}
                role="listbox"
                aria-multiselectable="true"
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    borderBottom: '1px solid #eee',
                    background: '#f9fafb'
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => onChangeSelectedTSCs(uniqueTSCs)}
                    disabled={(uniqueTSCs?.length ?? 0) === 0}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => { onChangeSelectedTSCs([]); setTscSearch(''); }}
                  >
                    Clear
                  </button>
                  <div style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}>
                    {selectedTSCs.length ? `${selectedTSCs.length} selected` : 'None selected'}
                  </div>
                </div>

                <div style={{ padding: '8px 10px', borderBottom: '1px solid #eee' }}>
                  <input
                    type="text"
                    value={tscSearch}
                    onChange={(e) => setTscSearch(e.target.value)}
                    placeholder="Search TSC…"
                    style={{
                      width: '100%',
                      border: '1px solid #d0d7de',
                      borderRadius: 6,
                      padding: '6px 8px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ maxHeight: 220, overflow: 'auto', padding: '8px 10px' }}>
                  {(filteredTSCs?.length ?? 0) === 0 && (
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>No TSC found</div>
                  )}
                  {filteredTSCs?.map((tsc, idx) => {
                    const checked = selectedTSCs.includes(tsc);
                    return (
                      <label
                        key={`${tsc}-${idx}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              onChangeSelectedTSCs([...new Set([...selectedTSCs, tsc])]);
                            } else {
                              onChangeSelectedTSCs(selectedTSCs.filter(s => s !== tsc));
                            }
                          }}
                        />
                        <span style={{ fontSize: 14 }}>{tsc}</span>
                      </label>
                    );
                  })}
                </div>

                <div style={{ padding: '8px 10px', borderTop: '1px solid #eee', textAlign: 'right' }}>
                  <button type="button" className="btn btn-sm" onClick={() => setIsTSCPopOpen(false)}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action slot (e.g., download/export buttons) */}
      {console.log(children,'childer')}
      {children && (
        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'end', }}>
          {children}
        </div>
      )}
    </div>
  );
}