import * as XLSX from 'xlsx';

// Returns an array of lead objects parsed from the Excel file
export async function processLeadsExcel(file) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  // Expecting columns: name, address, phone, mobile, email, contact_person, area, details (as JSON string or blank)
  //filter rows with no or blank name
  return rows.filter(row => row.Name && row.Name.trim()).map(row => {
    if (row.Details && typeof row.Details === 'string') {
      try {
        row.Details = JSON.parse(row.Details);
      } catch (e) {
        console.error('Invalid JSON in Details column:', e);
        row.Details = {};
      }
    } else {  
      row.Details = {};
    }

    // Helper to clean phone/mobile values
    function cleanNumber(val) {
      if (val === undefined || val === null) return '';
      let str = String(val).trim();
      // Remove trailing .0 if present (from Excel number conversion)
      if (/^\d+\.0$/.test(str)) {
        str = str.replace(/\.0$/, '');
      }
      // Remove scientific notation if present
      if (/e\+/.test(str)) {
        const num = Number(str);
        if (!isNaN(num)) str = num.toFixed(0);
      }
      return str;
    }

    // Ensure all fields are present and set defaults if missing
    row.name = row.Name || '';
    row.address = row.Address || '';
    row.phone = cleanNumber(row.Phone);
    row.mobile = cleanNumber(row.Mobile);
    row.email = row.Email || '';
    row.contact_person = row.Contact_Person || '';
    row.area = row.Area ? row.Area.trim().toUpperCase() : 'N/A';
    return row;
  });
}

export function exportLeadsToXLSX(leads, filename = 'campaign_leads.xlsx') {
  const ws = XLSX.utils.json_to_sheet(leads);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  XLSX.writeFile(wb, filename);
}

/**
 * Parse and validate uploaded edited leads Excel for campaign update.
 * Returns { valid: boolean, error?: string, leads?: array }
 */
export async function processEditedLeadsExcel(file) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

  // Expected columns (case-sensitive, as in export)
  const expectedCols = [
    'CAMPAIGN_ID',
    'LEAD_ID',
    'COMPANY_NAME',
    'EMAIL',
    'MOBILE',
    'CONTACT_PERSON',
    'STATUS',
    'EMAIL_SENT_DATE',
    'FOLLOW_UP_CALL_DATE',
    'REMARKS'
  ];

  // Validate columns
  const firstRow = rows[0] || {};
  const missingCols = expectedCols.filter(col => !(col in firstRow));
  if (missingCols.length > 0) {
    return { valid: false, error: `Missing columns: ${missingCols.join(', ')}` };
  }

  // Validate and sanitize each row
  const leads = [];
  for (const row of rows) {
    // Required fields
    if (!row.CAMPAIGN_ID || !row.LEAD_ID) {
      return { valid: false, error: 'Each row must have CAMPAIGN_ID and LEAD_ID.' };
    }
    // Only allow valid statuses
    const allowedStatuses = ['SENT', 'FAILED', 'READY'];
    if (row.STATUS && !allowedStatuses.includes(row.STATUS)) {
      return { valid: false, error: `Invalid STATUS: ${row.STATUS} for LEAD_ID ${row.LEAD_ID}` };
    }
    leads.push({
      campaign_id: Number(row.CAMPAIGN_ID),
      lead_id: Number(row.LEAD_ID),
      status: row.STATUS,
      follow_up_call_date: row.FOLLOW_UP_CALL_DATE || null,
      remarks: row.REMARKS || null
    });
  }
  return { valid: true, leads };
}