import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

function UploadTab({ onDataUpload, uploadedData, lastUploadTime, isSampleData }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);

  const processExcelFile = (file) => {
    setIsProcessing(true);
    setError(null);

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const processedData = {};
        let totalRecords = 0;
        
        // Process all sheets
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length > 0) {
            // Convert to objects with headers
            const headers = jsonData[0];
            const rows = jsonData.slice(1);
            
            const sheetData = rows
              .filter(row => row.some(cell => cell !== undefined && cell !== ''))
              .map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                  obj[header] = row[index] || '';
                });
                return obj;
              });
            
            processedData[sheetName] = sheetData;
            totalRecords += sheetData.length;
          }
        });
        
        setFileInfo({
          name: file.name,
          size: file.size,
          sheets: Object.keys(processedData).length,
          records: totalRecords
        });
        
        onDataUpload(processedData);
        setIsProcessing(false);
        
      } catch (err) {
        setError(`Error processing file: ${err.message}`);
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
      setIsProcessing(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleFileSelect = (files) => {
    const file = files[0];
    if (file) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        processExcelFile(file);
      } else {
        setError('Please select a valid Excel file (.xlsx or .xls)');
      }
    }
  };

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  }, []);

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    handleFileSelect(files);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="upload-tab">
      <div className="grid">
        <div className="card">
          <h3>📁 File Upload & Data Processing</h3>
          
          {/* Instructions */}
          <div className="card mb-2" style={{background: '#F5F7FA', borderLeft: '4px solid #0066CC'}}>
            <h4 style={{color: '#0066CC', marginBottom: '1rem'}}>📋 Upload Instructions</h4>
            <ul>
              <li>Upload Excel files (.xlsx, .xls) containing your data</li>
              <li>Data will be automatically converted to JSON format</li>
              <li>Focus on <strong>Demand</strong>, <strong>Supply</strong>, and <strong>TAG Pipeline</strong> metrics</li>
              <li>All sheets in the Excel file will be processed</li>
            </ul>
          </div>

          {/* File Upload Area */}
          <div
            className={`file-upload ${isDragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
            
            {isProcessing ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <p style={{ marginTop: '1rem' }}>Processing Excel file...</p>
              </div>
            ) : (
              <>
                <div className="file-upload-text">
                  📊 {isDragActive ? 'Drop Excel file here' : 'Click to select or drag & drop Excel file'}
                </div>
                <div className="file-upload-hint">
                  Supports .xlsx and .xls formats
                </div>
              </>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="message message-error">
              ❌ {error}
            </div>
          )}

          {/* Success Display */}
          {uploadedData && !error && (
           
            <div className="message message-success">
               {console.log('Uploaded data available in UploadTab')}
              ✅ File uploaded and processed successfully!
            </div>
          )}
        </div>

        {/* File Status Card */}
        <div className="card">
          <h3>📊 Upload Status</h3>
          
          {uploadedData && isSampleData && !fileInfo && (
            <>
              <div style={{ 
                backgroundColor: '#e3f2fd', 
                padding: '1rem', 
                borderRadius: '4px', 
                marginBottom: '1rem',
                fontSize: '0.9rem',
                color: '#1976d2'
              }}>
                📋 Currently showing sample data from Adobe staffing analytics dashboard. Upload your own Excel file to replace it.
              </div>
              
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-value">{Object.values(uploadedData).reduce((total, sheet) => total + (Array.isArray(sheet) ? sheet.length : 0), 0).toLocaleString()}</div>
                  <div className="metric-label">Sample Records</div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-value">{Object.keys(uploadedData).length}</div>
                  <div className="metric-label">Sample Sheets</div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-value">Sample</div>
                  <div className="metric-label">Data Type</div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-value">✓</div>
                  <div className="metric-label">Status</div>
                </div>
              </div>
              
              <div style={{ marginTop: '1rem' }}>
                <p><strong>Data Source:</strong> Sample AEM Analytics Data</p>
                {lastUploadTime && (
                  <p><strong>Loaded:</strong> {lastUploadTime.toLocaleString()}</p>
                )}
              </div>
            </>
          )}
          {console.log('fileInfo:', fileInfo)}
          
          {uploadedData && fileInfo ? (
            <>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-value">{fileInfo.records.toLocaleString()}</div>
                  <div className="metric-label">Total Records</div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-value">{fileInfo.sheets}</div>
                  <div className="metric-label">Sheets Processed</div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-value">{formatFileSize(fileInfo.size)}</div>
                  <div className="metric-label">File Size</div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-value">✓</div>
                  <div className="metric-label">Status</div>
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <p><strong>File Name:</strong> {fileInfo.name}</p>
                {lastUploadTime && (
                  <p><strong>Last Updated:</strong> {lastUploadTime.toLocaleString()}</p>
                )}
                <p><strong>Sheets:</strong> {Object.keys(uploadedData).join(', ')}</p>
              </div>

              {/* JSON Preview Button */}
              <button
                className="button mt-1"
                onClick={() => {
                  const jsonWindow = window.open('', '_blank');
                  jsonWindow.document.write(`
                    <html>
                      <head><title>JSON Data Preview</title></head>
                      <body>
                        <pre style="font-family: monospace; padding: 20px;">
                          ${JSON.stringify(uploadedData, null, 2)}
                        </pre>
                      </body>
                    </html>
                  `);
                }}
              >
                👁️ Preview JSON Data
              </button>
            </>
          ) : (
            <div className="message message-info">
              No data uploaded yet. Please upload an Excel file to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadTab;