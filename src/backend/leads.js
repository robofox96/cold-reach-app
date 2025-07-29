const sqlite3 = require('sqlite3').verbose();
const dbPath = require('./dbPath');

const db = new sqlite3.Database(dbPath);

// Create leads table with unique name constraint
db.run(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    address TEXT,
    phone TEXT,
    mobile TEXT,
    email TEXT,
    contact_person TEXT,
    area TEXT NOT NULL DEFAULT 'N/A',
    isSurveyLead INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    details TEXT
  )
`);

// Upsert logic: update if name exists, else insert new
function addLead(lead, callback) {
  if (lead.area) {
    lead.area = lead.area.trim().toUpperCase();
  } else {
    lead.area = 'N/A'; // Default area if not provided
  }
  db.get(
    'SELECT id FROM leads WHERE name = ?',
    [lead.name],
    (err, row) => {
      if (err) return callback(err);
      const isSurveyLead = lead.isSurveyLead ? 1 : 0;
      const now = new Date().toISOString();
      if (row) {
        // Update existing lead
        db.run(
          `UPDATE leads SET address = ?, phone = ?, mobile = ?, email = ?, contact_person = ?, area = ?, isSurveyLead = ?, updated_at = ?, details = ?
           WHERE name = ?`,
          [
            lead.address,
            lead.phone,
            lead.mobile,
            lead.email,
            lead.contact_person,
            lead.area || 'N/A',
            isSurveyLead,
            now,
            JSON.stringify(lead.details || {}),
            lead.name
          ],
          function (err) {
            callback(err, row.id);
          }
        );
      } else {
        // Insert new lead
        db.run(
          `INSERT INTO leads (name, address, phone, mobile, email, contact_person, area, isSurveyLead, created_at, updated_at, details)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            lead.name,
            lead.address,
            lead.phone,
            lead.mobile,
            lead.email,
            lead.contact_person,
            lead.area || 'N/A',
            isSurveyLead,
            now,
            now,
            JSON.stringify(lead.details || {})
          ],
          function (err) {
            callback(err, this.lastID);
          }
        );
      }
    }
  );
}

function seedLeads(callback) {
  const sampleLeads = [
    {
      name: "Acme Corp",
      address: "123 Main St, Springfield",
      phone: "555-1234",
      mobile: "555-5678",
      email: "info@acme.com",
      contact_person: "John Doe",
      area: "Springfield",
      details: { industry: "Manufacturing", notes: "Top client" }
    },
    {
      name: "Globex Inc",
      address: "456 Elm St, Metropolis",
      phone: "555-8765",
      mobile: "555-4321",
      email: "contact@globex.com",
      contact_person: "Jane Smith",
      area: "Metropolis",
      details: { industry: "Tech", notes: "Interested in new campaign" }
    },
    {
      name: "Initech",
      address: "789 Oak St, Gotham",
      phone: "555-2468",
      mobile: "555-1357",
      email: "hello@initech.com",
      contact_person: "Peter Gibbons",
      area: "Gotham",
      details: { industry: "Software", notes: "Follow up next week" }
    }
  ];

  let inserted = 0;
  sampleLeads.forEach(lead => {
    addLead(lead, () => {
      inserted++;
      if (inserted === sampleLeads.length && callback) callback();
    });
  });
}
/**
 * Get all leads with optional filters, pagination, and fuzzy search.
 * @param {Object} options - { phone, email, mobileNotNull, search, page, pageSize }
 * @param {Function} callback - (err, { leads, total })
 */

function getAllLeads(options = {}, callback) {
  let {
    phone,
    email,
    area,
    emailNotNull,
    phoneNotNull,
    mobileNotNull,
    search,
    page,
    pageSize,
    isSurveyLead
  } = options;

  let where = [];
  let params = [];

  if (area) {
    where.push('area = ?');
    params.push(area);
  }
  if (phone) {
    where.push('phone = ?');
    params.push(phone);
  }
  if (email) {
    where.push('email = ?');
    params.push(email);
  }
  if (typeof isSurveyLead === 'boolean') {
    where.push('isSurveyLead = ?');
    params.push(isSurveyLead ? 1 : 0);
  }
  if (mobileNotNull) {
    where.push('mobile IS NOT NULL AND mobile != ""');
  }
  if (emailNotNull) {
    where.push('email IS NOT NULL AND email != ""');
  }
  if (phoneNotNull) {
    where.push('phone IS NOT NULL AND phone != ""');
  }
  if (search) {
    where.push('(name LIKE ? OR email LIKE ? OR contact_person LIKE ?)');
    const fuzzy = `%${search}%`;
    params.push(fuzzy, fuzzy, fuzzy);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // If page and pageSize are provided, use pagination; otherwise, return all
  let limitOffset = '';
  let queryParams = [...params];
  if (typeof page === 'number' && typeof pageSize === 'number') {
    const offset = (page - 1) * pageSize;
    limitOffset = ' LIMIT ? OFFSET ?';
    queryParams.push(pageSize, offset);
  }

  // Count total for pagination or total leads
  db.get(
    `SELECT COUNT(*) as total FROM leads ${whereClause}`,
    params,
    (err, countRow) => {
      if (err) return callback(err);

      db.all(
        `SELECT * FROM leads ${whereClause} ORDER BY updated_at DESC${limitOffset}`,
        queryParams,
        (err, rows) => {
          if (err) return callback(err);
          callback(null, { leads: rows, total: countRow.total });
        }
      );
    }
  );
}

/**
 * Fetch all distinct areas from leads table (case-insensitive, sorted).
 * @param {Function} callback - (err, areas)
 */
function getAllAreas(callback) {
  db.all(
    `SELECT DISTINCT area FROM leads WHERE area IS NOT NULL AND area != '' ORDER BY area ASC`,
    [],
    (err, rows) => {
      if (err) return callback(err);
      const areas = rows.map(row => row.area);
      callback(null, areas);
    }
  );
}

module.exports = { getAllLeads, addLead, seedLeads, getAllAreas };