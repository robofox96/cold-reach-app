const { app } = require('electron');
const campaigns = require('./campaigns');
const emailService = require('./emailService');

const CHECK_INTERVAL_MS = 30 * 1000; // Check every 30 seconds

function startCampaignCron() {
  setInterval(async () => {
    console.log('Running campaign cron...');
    // 1. Get all active campaigns
    campaigns.getAllCampaigns({ status: 'ACTIVE' }, async (err, result) => {
      if (err || !result || !result.campaigns) return;
      for (const campaign of result.campaigns) {
        console.log(`Processing campaign ${campaign.id} - ${campaign.name}`);
        // 2. For each campaign, get READY leads with their tentative_send_date
        campaigns.getLeadsForCampaign(
          campaign.id,
          { statuses: ['READY'], page: 1, pageSize: 1000 }, // get all, adjust pageSize as needed
          (err, leadsResult) => {
            if (err || !leadsResult || !leadsResult.leads) return;
            // If there are no READY leads, stop the campaign
            if (leadsResult.leads.length === 0) {
              campaigns.updateCampaignStatus(campaign.id, 'FINISHED', () => {
                console.log(`Campaign ${campaign.id} stopped (no more READY leads).`);
              });
              return;
            }
            const now = new Date();
            leadsResult.leads.forEach((lead) => {
              if (
                lead.tentative_send_date &&
                new Date(lead.tentative_send_date) <= now
              ) {
                // 3. Send email for this lead
                emailService.sendCampaignLeadEmail(lead, (err, sendResult) => {
                  if (err) {
                    console.error(
                      `Failed to send email for campaign ${campaign.id}, lead ${lead.id}:`,
                      err
                    );
                  } else {
                    console.log(
                      `Email sent for campaign ${campaign.id}, lead ${lead.id} at ${lead.email}`
                    );
                  }
                });
              }
            });
          }
        );
      }
    });
  }, CHECK_INTERVAL_MS);
}


module.exports = { startCampaignCron };