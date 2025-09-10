const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const Store = require('electron-store').default;
const campaigns = require('./campaigns');

// NOTE: For production, move these to env or a secure store.
const GMAIL_USER = 'ashacorp.indianoil@gmail.com';
const GMAIL_PASS = 'qgfr ctyc zoiq zpeh';

const CHECK_INTERVAL_MS = 3 * 60 * 1000; // every 3 minutes

const store = new Store({ name: 'bounceWatcher' });
let timer = null;
let running = false;

function startBounceWatcher() {
  if (timer) return; // already started
  console.log('[BounceWatcher] Starting...');
  // Run immediately, then on interval
  runOnce().catch((err) => console.error('[BounceWatcher] Initial run error:', err));
  timer = setInterval(() => {
    runOnce().catch((err) => console.error('[BounceWatcher] Interval run error:', err));
  }, CHECK_INTERVAL_MS);
}

async function runOnce() {
  if (running) return; // avoid overlapping runs
  running = true;

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // look back 14 days
      const lastUid = store.get('lastUid') || 0;

      // Search for likely DSN/bounce senders. We do two searches and merge.
      const uids1 = await client.search({ since, from: 'mailer-daemon@googlemail.com' });
      const uids2 = await client.search({ since, from: 'Mail Delivery Subsystem' });
      const uids = Array.from(new Set([...(uids1 || []), ...(uids2 || [])]))
        .filter((uid) => uid > lastUid)
        .sort((a, b) => a - b);

      let maxUid = lastUid;
      for await (const msg of client.fetch(uids, { uid: true, envelope: true, source: true, flags: true })) {
        maxUid = Math.max(maxUid, msg.uid);
        try {
          const parsed = await simpleParser(msg.source);
          if (!looksLikeBounce(parsed)) {
            continue;
          }

          const { orig, dsnInfo } = await extractOriginalAndDsn(parsed);

          const campaignId = toInt(tryGetHeader(orig || parsed, 'x-cl-campaign'));
          const leadId = toInt(tryGetHeader(orig || parsed, 'x-cl-lead'));
          const uuid = tryGetHeader(orig || parsed, 'x-cl-uuid');

          // Decide action based on DSN info
          const action = (dsnInfo?.action || '').toLowerCase();
          const status = dsnInfo?.status || '';
          const isFailure = action === 'failed' || /^5\./.test(status);
          const isDelay = action === 'delayed' || /^4\./.test(status);

          if (!campaignId || !leadId) {
            const finalRecipient = dsnInfo?.finalRecipient || getRecipientFromParsed(parsed) || getRecipientFromParsed(orig);
            console.warn('[BounceWatcher] Missing correlation headers. Skipping auto-update. Final-Recipient:', finalRecipient, 'UID:', msg.uid);
            await client.messageFlagsAdd(msg.uid, ['\\Seen']);
            continue;
          }

          const extra = {
            via: 'imap-dsn',
            uid: msg.uid,
            uuid: uuid || null,
            messageId: parsed.messageId || null,
            original: {
              messageId: orig?.messageId || null,
              uuid: uuid || null,
            },
            dsn: dsnInfo || null,
          };

          if (isFailure) {
            await new Promise((resolve) => {
              campaigns.updateCampaignLeadStatus(campaignId, leadId, 'FAILED', JSON.stringify(extra), (err) => {
                if (err) console.error('[BounceWatcher] DB update error:', err);
                else console.log('[BounceWatcher] Marked FAILED for campaign', campaignId, 'lead', leadId);
                resolve();
              });
            });
          } else if (isDelay) {
            console.log('[BounceWatcher] Delivery delayed for campaign', campaignId, 'lead', leadId, dsnInfo);
            // Do not flip status; you could optionally append to extra_data here in the future
          } else {
            console.log('[BounceWatcher] DSN without failure/delay, ignoring. campaign', campaignId, 'lead', leadId, dsnInfo);
          }

          // Mark message as seen to avoid clutter; we also track lastUid below
          await client.messageFlagsAdd(msg.uid, ['\\Seen']);
        } catch (procErr) {
          console.error('[BounceWatcher] Error processing UID', msg.uid, procErr);
        }
      }

      if (maxUid > lastUid) {
        store.set('lastUid', maxUid);
      }
    } finally {
      lock.release();
    }
  } catch (err) {
    console.error('[BounceWatcher] IMAP error:', err);
  } finally {
    try {
      await client.logout();
    } catch (e) {}
    running = false;
  }
}

function looksLikeBounce(parsed) {
  const subj = parsed.subject || '';
  const ct = parsed.headers.get('content-type');
  const ctVal = typeof ct === 'string' ? ct : ct?.value || '';
  const hasDSNAtt = (parsed.attachments || []).some((att) => (att.contentType || '').toLowerCase() === 'message/delivery-status');
  return /delivery status notification|undelivered|mail delivery|failure notice/i.test(subj) || /report-type=delivery-status/i.test(String(ctVal)) || hasDSNAtt;
}

async function extractOriginalAndDsn(parsed) {
  let orig = null;
  let dsnInfo = null;
  if (parsed.attachments && parsed.attachments.length) {
    // Original message headers/body
    const origAtt = parsed.attachments.find((att) => att.contentType && /message\/rfc822|text\/rfc822-headers/i.test(att.contentType));
    if (origAtt) {
      try {
        orig = await simpleParser(origAtt.content);
      } catch (e) {}
    }
    // Delivery-status report
    const dsnAtt = parsed.attachments.find((att) => att.contentType && /message\/delivery-status/i.test(att.contentType));
    if (dsnAtt) {
      try {
        const text = dsnAtt.content.toString('utf8');
        dsnInfo = parseDsnText(text);
      } catch (e) {}
    }
  }
  if (!dsnInfo && parsed.text) {
    dsnInfo = parseDsnText(parsed.text);
  }
  return { orig, dsnInfo };
}

function parseDsnText(text) {
  if (!text) return null;
  const get = (re) => {
    const m = text.match(re);
    return m ? m[1].trim() : null;
  };
  return {
    action: get(/Action:\s*([\w-]+)/i),
    status: get(/Status:\s*([\d.]+)/i),
    diagnostic: get(/Diagnostic-Code:\s*([^\n\r]+)/i),
    finalRecipient: get(/Final-Recipient:\s*(?:rfc822|local);\s*([^\n\r]+)/i),
  };
}

function tryGetHeader(parsed, name) {
  if (!parsed || !parsed.headers) return null;
  const v = parsed.headers.get(name);
  if (!v) return null;
  if (typeof v === 'string') return v;
  if (v && v.value) return String(v.value);
  return String(v);
}

function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getRecipientFromParsed(parsed) {
  try {
    const to = parsed?.to?.value?.[0]?.address;
    return to || null;
  } catch {
    return null;
  }
}

module.exports = { startBounceWatcher };
