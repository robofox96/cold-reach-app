const fs = require('fs');
const campaigns = require('./campaigns');
const nodemailer = require('nodemailer');
const path = require('path');
const { app } = require('electron');

// Configure the email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'robo.ai.96@gmail.com',
    pass: 'btla aglb cjkk uqrv', // Remove this before pushing to git
  },
});

// Helper to get static path in both dev and production
function getStaticPath() {
  if (process.env.NODE_ENV === 'development') {
    // In dev, static is at project root
    return path.join(__dirname, '../../static');
  } else {
    // In production, static is in resources
    return path.join(app.getAppPath(), '.webpack/main/static');
  }
}

const staticPath = getStaticPath();

const htmlBody = fs.readFileSync(
  path.join(staticPath, 'email_template_3.html'),
  'utf8'
);

function sendCampaignLeadEmail(campaign_lead, callback) {
  const mailOptions = {
    from: 'robo.ai.96@gmail.com',
    to: campaign_lead.email,
    // to: 'jayrajawat5@gmail.com',
    subject: 'Introduction to Asha Corporation – Your One-Stop Solution for Lubrication & Chemicals',
    html: htmlBody.replace('{{first_name|there}}', campaign_lead.contact_person ? campaign_lead.contact_person : 'Sir/Madam')
      .replace('{{company_name}}', campaign_lead.name ? campaign_lead.name : 'your company'),
    attachments: [
      // {
      //   filename: "Brochure.pdf",
      //   path: path.join(staticPath, 'brochure1.pdf')
      // },
      {
        filename: "servo2.png",
        path: path.join(staticPath, 'servo2.png'),
        cid: "servo2@asha.com"
      },
      {
        filename: "servo3.png",
        path: path.join(staticPath, 'servo3.png'),
        cid: "servo3@asha.com"
      }
    ]
  };

  transporter.sendMail(mailOptions, (err, info) => {
    let status, extra;
    if (err) {
      status = 'FAILED';
      extra = JSON.stringify({ error: err.message });
    } else {
      status = 'SENT';
      extra = JSON.stringify({ info });
    }

    // Use campaigns.js function to update status
    console.log(`Updating email to ${campaign_lead} - Status: ${status}`);
    campaigns.updateCampaignLeadStatus(
      campaign_lead.campaign_id,
      campaign_lead.id,
      status,
      extra,
      (dbErr, result) => {
        if (dbErr) return callback(dbErr);
        callback(null, { status, info, error: err, dbResult: result });
      }
    );
  });
}

module.exports = {
  sendCampaignLeadEmail
};