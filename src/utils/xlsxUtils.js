import * as XLSX from 'xlsx';

// Returns an array of lead objects parsed from the Excel file
export async function processLeadsExcel(file) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  // Expecting columns: name, address, phone, mobile, email, contact_person, area, details (as JSON string or blank)
  return rows.map(row => ({
    name: row.name || '',
    address: row.address || '',
    phone: row.phone || '',
    mobile: row.mobile || '',
    email: row.email || '',
    contact_person: row.contact_person || '',
    area: row.area || 'N/A',
    details: row.details ? JSON.parse(row.details) : {}
  }));
}

export function exportLeadsToXLSX(leads, filename = 'campaign_leads.xlsx') {
  const ws = XLSX.utils.json_to_sheet(leads);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  XLSX.writeFile(wb, filename);
}