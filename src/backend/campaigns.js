const sqlite3 = require('sqlite3').verbose();
const dbPath = require('./dbPath');

const db = new sqlite3.Database(dbPath);
const leads = require('./leads');

// Create campaigns table
db.run(`
  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    status TEXT,
    type TEXT CHECK(type IN ('EMAIL', 'SMS', 'WHATSAPP')) NOT NULL DEFAULT 'EMAIL'
  )
`);

// Create campaign_leads table for many-to-many
db.run(`
  CREATE TABLE IF NOT EXISTS campaign_leads (
    campaign_id INTEGER,
    lead_id INTEGER,
    status TEXT CHECK(status IN ('READY', 'SENT', 'FAILED')) NOT NULL DEFAULT 'READY',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    updated_by TEXT,
    extra_data TEXT,
    tentative_send_date TEXT,
    follow_up_call_date TEXT, -- new column
    remarks TEXT,             -- new column
    UNIQUE(campaign_id, lead_id),
    PRIMARY KEY (campaign_id, lead_id),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (lead_id) REFERENCES leads(id)
  )
`);

// Function to get all campaigns with pagination and filtering
function getAllCampaigns({ search = '', type, status, page = 1, pageSize = 20 }, callback) {
  let where = [];
  let params = [];
  if (search) {
    where.push('(name LIKE ?)');
    params.push(`%${search}%`);
  }
  if (type) {
    where.push('type = ?');
    params.push(type);
  }
  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  const offset = (page - 1) * pageSize;
  const query = `SELECT * FROM campaigns
    ${where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY start_date DESC
    LIMIT ? OFFSET ?`;
  params.push(pageSize, offset);
  db.all(query, params, (err, rows) => {
    if (err) return callback(err);
    // Count total for pagination
    db.get(`SELECT COUNT(*) as total FROM campaigns ${where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''}`, params.slice(0, -2), (err, countRow) => {
      if (err) return callback(err);
      callback(null, { campaigns: rows, total: countRow.total });
    });
  });
}

function addCampaign(campaign, filter, callback) {
  db.run(
    `INSERT INTO campaigns (name, start_date, end_date, status, type)
     VALUES (?, ?, ?, ?, ?)`,
    [campaign.name, campaign.start_date, campaign.end_date, campaign.status, campaign.type],
    function (err) {
      if (err) return callback(err);
      const campaignId = this.lastID;

      // Support manual selection of leads
      if (filter && Array.isArray(filter.selectedLeadIds) && filter.selectedLeadIds.length > 0) {
        addLeadsToCampaign(campaignId, filter.selectedLeadIds, callback);
        return;
      }

      // Remove page and pageSize from filter before fetching leads
      const filterForLeads = { ...(filter || {}) };
      delete filterForLeads.page;
      delete filterForLeads.pageSize;
      delete filterForLeads.selectedLeadIds;

      leads.getAllLeads(filterForLeads, (err, result) => {
        if (err) return callback(err);
        const leadIds = result.leads.map(lead => lead.id);
        addLeadsToCampaign(campaignId, leadIds, callback);
      });
    }
  );
}

/**
 * Distributes tentative send dates for a list of leadIds.
 * - Max 300 per day.
 * - 5 seconds between each.
 * @param {Array<number>} leadIds
 * @param {Date|string} [startDate] - Optional start date/time (default: now)
 * @returns {Array<string>} ISO date strings for each leadId
 */
function getTentativeSendDates(leadIds, startDate = new Date()) {
  const maxPerDay = 300;
  const intervalMs = 5000; // 5 seconds
  const start = typeof startDate === 'string' ? new Date(startDate) : new Date(startDate);
  return leadIds.map((_, idx) => {
    const dayOffset = Math.floor(idx / maxPerDay);
    const timeOffset = idx % maxPerDay;
    const sendDate = new Date(start.getTime() + dayOffset * 24 * 60 * 60 * 1000 + timeOffset * intervalMs);
    return sendDate.toISOString();
  });
}

function addLeadsToCampaign(campaignId, leadIds, callback) {
  if (!leadIds || leadIds.length === 0) {
    return callback(null, campaignId); // No leads to add
  }
  const tentativeSendDates = getTentativeSendDates(leadIds);
  const stmt = db.prepare('INSERT INTO campaign_leads (campaign_id, lead_id, tentative_send_date) VALUES (?, ?, ?)');
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    leadIds.forEach((leadId, idx) => {
      stmt.run(campaignId, leadId, tentativeSendDates[idx], (err) => {
        if (err && err.code !== 'SQLITE_CONSTRAINT') {
          console.error('Error inserting lead into campaign:', err);
        }
      });
    });
    db.run('COMMIT');
  });
  stmt.finalize(() => callback(null, campaignId));
}

/**
 * Get campaign details by campaignId
 * @param {number} campaignId
 * @param {function} callback
 */
function getCampaignById(campaignId, callback) {
  db.get(
    `SELECT * FROM campaigns WHERE id = ?`,
    [campaignId],
    (err, row) => {
      if (err) return callback(err);
      callback(null, { campaign: row });
    }
  );
}

/**
 * Get leads for a campaign, including campaign_leads status and extra_data
 * Supports pagination and filtering by status.
 * @param {number} campaignId
 * @param {object} options - { statuses, page, pageSize }
 * @param {function} callback
 */
function getLeadsForCampaign(campaignId, options = {}, callback) {
  const { statuses, page = 1, pageSize = 20 } = options;
  let where = ['cl.campaign_id = ?'];
  let params = [campaignId];

  if (statuses && statuses.length > 0) {
    where.push(`cl.status IN (${statuses.map(() => '?').join(',')})`);
    params.push(...statuses);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  db.get(
    `SELECT COUNT(*) as total FROM leads
     JOIN campaign_leads cl ON leads.id = cl.lead_id
     ${whereClause}`,
    params,
    (err, countRow) => {
      if (err) return callback(err);

      db.all(
        `SELECT 
            leads.id,
            leads.name,
            leads.email,
            leads.mobile,
            leads.contact_person,
            cl.status AS campaign_lead_status,
            cl.extra_data AS campaign_lead_extra,
            cl.updated_at AS campaign_lead_updated_at,
            cl.campaign_id AS campaign_id,
            cl.tentative_send_date AS tentative_send_date,
            cl.follow_up_call_date AS follow_up_call_date, -- new
            cl.remarks AS remarks                         -- new
          FROM leads
          JOIN campaign_leads cl ON leads.id = cl.lead_id
          ${whereClause}
          ORDER BY cl.updated_at DESC
          LIMIT ? OFFSET ?`,
        [...params, pageSize, offset],
        (err, rows) => {
          if (err) return callback(err);
          callback(null, { leads: rows, total: countRow.total });
        }
      );
    }
  );
}

/**
 * Update the status and extra_data for a campaign lead.
 * @param {number} campaignId
 * @param {number} leadId
 * @param {string} status
 * @param {string} extraData
 * @param {function} callback
 */
function updateCampaignLeadStatus(campaignId, leadId, status, extraData, callback) {
  console.log(`Updating campaign lead status: campaignId=${campaignId}, leadId=${leadId}, status=${status}, extraData=${extraData}`);
  db.run(
    `UPDATE campaign_leads
     SET status = ?, extra_data = ?, updated_at = datetime('now')
     WHERE campaign_id = ? AND lead_id = ?`,
    [status, extraData, campaignId, leadId],
    function (err) {
      callback(err, { updated: this.changes });
    }
  );
}

// Add/Update tentative_send_date when adding leads to campaign
function addLeadsToCampaign(campaignId, leadIds, callback) {
  if (!leadIds || leadIds.length === 0) {
    return callback(null, campaignId); // No leads to add
  }
  if (leadIds.length > 0) {
    const stmt = db.prepare('INSERT INTO campaign_leads (campaign_id, lead_id, tentative_send_date) VALUES (?, ?, ?)');
    // Use a transaction for better performance
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      let now = new Date();
      leadIds.forEach((leadId, idx) => {
        // Store as SQLite-compatible datetime string (YYYY-MM-DD HH:MM:SS)
        const tentativeSendDate = new Date(now.getTime() + idx * 60000)
          .toISOString()
          .replace('T', ' ')
          .substring(0, 19); // "YYYY-MM-DD HH:MM:SS"
        stmt.run(campaignId, leadId, tentativeSendDate, (err) => {
          if (err && err.code !== 'SQLITE_CONSTRAINT') {
            console.error('Error inserting lead into campaign:', err);
          }
        });
      });
      db.run('COMMIT');
    });
    stmt.finalize(() => callback(null, campaignId));
  } else {
    callback(null, campaignId); // No leads to add
  }
}

// Add start/stop campaign logic
function updateCampaignStatus(campaignId, status, callback) {
  db.run(
    `UPDATE campaigns SET status = ? WHERE id = ?`,
    [status, campaignId],
    function (err) {
      callback(err, { updated: this.changes });
    }
  );
}

/**
 * Get all leads for a campaign (no pagination), for export.
 */
function getAllLeadsForCampaignExport(campaignId, callback) {
  db.all(
    `SELECT 
        cl.campaign_id AS CAMPAIGN_ID,
        leads.id AS LEAD_ID,
        leads.name AS COMPANY_NAME,
        leads.email AS EMAIL,
        leads.mobile AS MOBILE,
        leads.contact_person AS CONTACT_PERSON,
        cl.status AS STATUS,
        cl.updated_at AS EMAIL_SENT_DATE,
        cl.follow_up_call_date AS FOLLOW_UP_CALL_DATE,
        cl.remarks AS REMARKS
      FROM leads
      JOIN campaign_leads cl ON leads.id = cl.lead_id
      WHERE cl.campaign_id = ? AND cl.status != 'READY'
      ORDER BY cl.updated_at DESC`,
    [campaignId],
    (err, rows) => {
      if (err) return callback(err);
      callback(null, rows);
    }
  );
}

module.exports = {
  getAllCampaigns,
  addCampaign,
  getLeadsForCampaign,
  getCampaignById,
  updateCampaignLeadStatus,
  updateCampaignStatus, // export new function
  getAllLeadsForCampaignExport,
};