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