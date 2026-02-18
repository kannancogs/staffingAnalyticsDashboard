import React, { useState, useEffect, useMemo } from 'react';

function DataTableTab({ uploadedData, isSampleData }) {
  const [selectedSheet, setSelectedSheet] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Get available sheets
  const sheets = uploadedData ? Object.keys(uploadedData) : [];

  // Set default sheet when data changes
  useEffect(() => {
    if (sheets.length > 0 && !selectedSheet) {
      setSelectedSheet(sheets[0]);
    }
  }, [uploadedData, sheets, selectedSheet]);

  // Get current sheet data
  const currentData = useMemo(() => {
    if (!uploadedData || !selectedSheet || !uploadedData[selectedSheet]) {
      return [];
    }
    const data = uploadedData[selectedSheet];
    return Array.isArray(data) ? data : [];
  }, [uploadedData, selectedSheet]);

  // Get available columns
  const availableColumns = useMemo(() => {
    if (currentData.length === 0) return [];
    return Object.keys(currentData[0]);
  }, [currentData]);

  // Set default selected columns
  useEffect(() => {
    if (availableColumns.length > 0 && selectedColumns.length === 0) {
      const defaultColumns = availableColumns.slice(0, 10);
      setSelectedColumns(defaultColumns);
    }
  }, [availableColumns, selectedColumns.length]);

  // Filter and search data
  const filteredData = useMemo(() => {
    if (!currentData.length) return [];

    let filtered = currentData;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          value && value.toString().toLowerCase().includes(searchLower)
        )
      );
    }

    return filtered;
  }, [currentData, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle numeric values
      const aNumeric = parseFloat(aValue);
      const bNumeric = parseFloat(bValue);
      
      if (!isNaN(aNumeric) && !isNaN(bNumeric)) {
        return sortConfig.direction === 'asc' 
          ? aNumeric - bNumeric 
          : bNumeric - aNumeric;
      }

      // Handle string values
      const aString = (aValue || '').toString();
      const bString = (bValue || '').toString();
      
      if (sortConfig.direction === 'asc') {
        return aString.localeCompare(bString);
      } else {
        return bString.localeCompare(aString);
      }
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  // Handle sorting
  const handleSort = (column) => {
    setSortConfig(prev => ({
      key: column,
      direction: prev.key === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle column selection
  const handleColumnToggle = (column) => {
    setSelectedColumns(prev => 
      prev.includes(column)
        ? prev.filter(col => col !== column)
        : [...prev, column]
    );
  };

  // Download CSV
  const downloadCSV = () => {
    if (!sortedData.length || !selectedColumns.length) return;

    const headers = selectedColumns.join(',');
    const rows = sortedData.map(row => 
      selectedColumns.map(col => {
        const value = row[col] || '';
        // Escape commas and quotes in CSV
        return value.toString().includes(',') || value.toString().includes('"')
          ? `"${value.toString().replace(/"/g, '""')}"`
          : value;
      }).join(',')
    ).join('\n');
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedSheet}_data.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download JSON
  const downloadJSON = () => {
    if (!sortedData.length) return;

    const jsonData = selectedColumns.length > 0 
      ? sortedData.map(row => {
          const filteredRow = {};
          selectedColumns.forEach(col => {
            filteredRow[col] = row[col];
          });
          return filteredRow;
        })
      : sortedData;
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedSheet}_data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!uploadedData) {
    return (
      <div className="data-table-tab">
        <div className="card">
          <div className="message message-warning">
            ⚠️ Loading data table...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="data-table-tab">
      <div className="card">
        <h3>📋 Data Table & Analysis</h3>
      {console.log('Rendered DataTableTab')}
      {console.log('uploadedData:', uploadedData)}
      
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
        {console.log('isSampleData:', isSampleData)}
        {/* Controls */}
        <div className="search-filters">
          <div className="input-group search-input">
            <label>🔍 Search in data</label>
            <input
              type="text"
              className="input"
              placeholder="Enter search term..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          
          <div className="input-group filter-select">
            <label>📄 Select Sheet</label>
            <select
              className="select"
              value={selectedSheet}
              onChange={(e) => {
                setSelectedSheet(e.target.value);
                setCurrentPage(1);
                setSelectedColumns([]);
                setSearchTerm('');
              }}
            >
              {sheets.map(sheet => (
                <option key={sheet} value={sheet}>{sheet}</option>
              ))}
            </select>
          </div>
          
          <div className="input-group filter-select">
            <label>📊 Rows per page</label>
            <select
              className="select"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>

        {/* Column Selection */}
        {availableColumns.length > 0 && (
          <div className="card" style={{background: '#F8FBFF'}}>
            <h4>📋 Select Columns to Display:</h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.5rem',
              marginTop: '1rem'
            }}>
              {availableColumns.map(column => (
                <label key={column} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column)}
                    onChange={() => handleColumnToggle(column)}
                  />
                  <span style={{ fontSize: '0.9rem' }}>{column}</span>
                </label>
              ))}
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button
                className="button-secondary"
                onClick={() => setSelectedColumns(availableColumns)}
              >
                Select All
              </button>
              <button
                className="button-secondary"
                onClick={() => setSelectedColumns([])}
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Metrics */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-value">{currentData.length.toLocaleString()}</div>
            <div className="metric-label">Total Rows</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{sortedData.length.toLocaleString()}</div>
            <div className="metric-label">Filtered Rows</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{availableColumns.length}</div>
            <div className="metric-label">Total Columns</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{selectedColumns.length}</div>
            <div className="metric-label">Selected Columns</div>
          </div>
        </div>

        {/* Data Table */}
        {paginatedData.length > 0 && selectedColumns.length > 0 ? (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    {selectedColumns.map(column => (
                      <th key={column} onClick={() => handleSort(column)} style={{ cursor: 'pointer' }}>
                        {column}
                        {sortConfig.key === column && (
                          <span style={{ marginLeft: '0.5rem' }}>
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, index) => (
                    <tr key={index}>
                      {selectedColumns.map(column => (
                        <td key={column}>
                          {row[column] !== undefined && row[column] !== null 
                            ? row[column].toString() 
                            : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '1rem'
              }}>
                <button
                  className="button-secondary"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="button-secondary"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            )}

            {/* Download Options */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '1rem',
              justifyContent: 'center'
            }}>
              <button className="button" onClick={downloadCSV}>
                💾 Download as CSV
              </button>
              <button className="button" onClick={downloadJSON}>
                💾 Download as JSON
              </button>
            </div>
          </>
        ) : (
          <div className="message message-info">
            {selectedColumns.length === 0 
              ? "Please select columns to display the data table."
              : "No data matches your search criteria."}
          </div>
        )}
      </div>
    </div>
  );
}

export default DataTableTab;