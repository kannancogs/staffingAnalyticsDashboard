// sampleDataLoader.js
import * as XLSX from 'xlsx';
// Vite / CRA (with file-loader) can emit URLs for static files:
// import sampleXlsxUrl from '../attached_assets/AEM (1)_1755355780712.xlsx?url';
// (For CRA without ?url, simply: import sampleXlsxUrl from '../attached_assets/AEM (1)_1755355780712.xlsx';

export const loadSampleData = async () => {
  try {
    const response = await fetch(sampleXlsxUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch sample data file: ${response.status} ${response.statusText}`);
    }

    const ct = (response.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('text/html')) {
      const text = await response.text();
      console.error('Received HTML instead of XLSX. First 200 chars:', text.slice(0, 200));
      throw new Error('Expected XLSX but server returned HTML (check bundler asset handling)');
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const result = {};
    workbook.SheetNames.forEach((sheetName) => {
      const ws = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
      if (rows.length > 0) result[sheetName] = rows;
    });

    console.log('[SampleData] Loaded sheets:', Object.keys(result));
    return result;
  } catch (err) {
    console.error('Error loading sample data:', err);
    return null;
  }
};
