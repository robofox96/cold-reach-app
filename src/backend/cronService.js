const { app } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const campaigns = require('./campaigns');
const emailService = require('./emailService');
const dbPath = require('./dbPath');
const db = new sqlite3.Database(dbPath);

const CHECK_INTERVAL_MS = 60 * 1000; // Check every 60 seconds
const DAILY_EMAIL_LIMIT = 400;

function getTodayRange() {
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );
  return { start, end };
}

function countEmailsSentToday(callback) {
  const { start, end } = getTodayRange();
  db.get(
    `SELECT COUNT(*) as count FROM campaign_leads WHERE status = 'SENT' AND updated_at >= ? AND updated_at <= ?`,
    [start.toISOString(), end.toISOString()],
    (err, row) => {
      if (err) return callback(err);
      callback(null, row.count || 0);
    }
  );
}

function startCampaignCron() {
  setInterval(() => {
    countEmailsSentToday((err, sentToday) => {
      if (err) {
        console.error('Failed to count sent emails:', err);
        return;
      }
      if (sentToday >= DAILY_EMAIL_LIMIT) {
        console.log('Daily email limit reached, skipping this cron run.');
        return;
      }
      const emailsLeft = DAILY_EMAIL_LIMIT - sentToday;

      // 1. Get all active campaigns, oldest first
      campaigns.getAllCampaigns(
        { status: 'ACTIVE', orderBy: 'start_date ASC' },
        (err, result) => {
          if (err || !result || !result.campaigns) return;
          let emailsSent = 0;
          (async function processCampaigns() {
            const EMAIL_BATCH_LIMIT = 15;
            let emailList = [];

            for (const campaign of result.campaigns) {
              if (emailList.length >= EMAIL_BATCH_LIMIT) break;

              // Get up to (remaining) READY leads for this campaign
              const leadsToFetch = EMAIL_BATCH_LIMIT - emailList.length;
              await new Promise((resolve) => {
                campaigns.getLeadsForCampaign(
                  campaign.id,
                  { statuses: ['READY'], page: 1, pageSize: leadsToFetch },
                  (err, leadsResult) => {
                    if (!err && leadsResult && Array.isArray(leadsResult.leads) && leadsResult.leads.length > 0) {
                      // No longer filter by tentative_send_date
                      emailList.push(
                        ...leadsResult.leads.map((lead) => ({
                          ...lead,
                          campaignId: campaign.id,
                        }))
                      );
                    } else if (!err && leadsResult && leadsResult.leads.length === 0) {
                      // If no more READY leads, mark campaign as FINISHED
                      campaigns.updateCampaignStatus(campaign.id, 'FINISHED', () => {
                        console.log(
                          `Campaign ${campaign.id} stopped (no more READY leads).`
                        );
                      });
                    }
                    resolve();
                  }
                );
              });
            }

            // Send emails one by one from the collected emailList (max 30)
            for (const lead of emailList) {
              const waitTime = 3200;
              await new Promise((resolve) => setTimeout(resolve, waitTime));
              emailService.sendCampaignLeadEmail(lead, (err, sendResult) => {
                if (err) {
                  console.error(
                    `Failed to send email for campaign ${lead.campaignId}, lead ${lead.id}:`,
                    err
                  );
                } else {
                  console.log(
                    `Email sent for campaign ${lead.campaignId}, lead ${lead.id} at ${lead.email}`
                  );
                }
              });
            }
          })();
        }
      );
    });
  }, CHECK_INTERVAL_MS);
}

module.exports = { startCampaignCron };