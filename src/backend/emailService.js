const fs = require('fs');
const campaigns = require('./campaigns');
const nodemailer = require('nodemailer');
const path = require('path');
const { app } = require('electron'); // Add this line

// Configure the email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'robo.ai.96@gmail.com',
    pass: 'btla aglb cjkk uqrv', // use environment variables in production
  },
});

const htmlBody = fs.readFileSync(
  path.join(app.getAppPath(), 'src/utils/email_template_3.html'),
  'utf8'
);

function sendCampaignLeadEmail(campaign_lead, callback) {
  const mailOptions = {
    from: 'robo.ai.96@gmail.com',
    // to: campaign_lead.email,
    to: 'a19101996@gmail.com',
    subject: 'Introduction to Asha Corporation – Your One-Stop Solution for Lubrication & Chemicals',
    html: htmlBody.replace('{{first_name|there}}', campaign_lead.contact_person?campaign_lead.contact_person:'Sir/Madam')
    .replace('{{company_name}}', campaign_lead.name?campaign_lead.name:'your company'),
    attachments: [
        // {
        //     filename: "Brochure.pdf",
        //     path: path.join(app.getAppPath(), 'src/utils/brochure1.pdf')
        // },
        {
            filename: "servo2.png",
            path: path.join(app.getAppPath(), 'src/utils/servo2.png'),
            cid: "servo2@asha.com"
        },
        {
            filename: "servo3.png",
            path: path.join(app.getAppPath(), 'src/utils/servo3.png'),
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