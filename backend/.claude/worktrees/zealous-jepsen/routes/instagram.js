const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const axios = require('axios');
const auth = require('../middleware/auth');
const {
  getLongLivedToken,
  getUserPages,
  getIGAccountInfo,
  sendDM,
  subscribePageWebhook,
  doesMessageMatch,
  buildResponseMessage,
} = require('../services/instagramService');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const GRAPH = 'https://graph.facebook.com/v21.0';

// ─────────────────────────────────────────────────────────────
// INSTAGRAM OAUTH — Connect Account
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/instagram/connect
 * Returns the Facebook OAuth URL the user should be redirected to.
 * Scopes needed for Instagram Messaging API.
 */
router.get('/connect', auth, (req, res) => {
  const scopes = [
    'instagram_basic',
    'instagram_manage_messages',
    'instagram_manage_comments',
    'pages_show_list',
    'pages_read_engagement',
    'pages_messaging',
    'business_management',
  ].join(',');

  const redirectUri = `${process.env.BACKEND_URL}/api/instagram/callback`;
  const state = req.creator.id; // pass creator ID as state for callback lookup

  const url =
    `https://www.facebook.com/dialog/oauth` +
    `?client_id=${process.env.META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&state=${state}` +
    `&response_type=code`;

  res.json({ url });
});

/**
 * GET /api/instagram/callback
 * Meta redirects here after the user authorizes.
 * Exchanges code → token → finds linked IG account → saves to DB.
 */
router.get('/callback', async (req, res) => {
  const { code, state: creatorId, error } = req.query;

  if (error || !code) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/automations?error=instagram_denied`
    );
  }

  try {
    // 1. Exchange code for short-lived user token
    const tokenRes = await axios.get(`${GRAPH}/oauth/access_token`, {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: `${process.env.BACKEND_URL}/api/instagram/callback`,
        code,
      },
    });
    const shortToken = tokenRes.data.access_token;

    // 2. Get a long-lived token (60-day)
    const longTokenData = await getLongLivedToken(shortToken);
    const userAccessToken = longTokenData.access_token;

    // 3. Get all Facebook Pages + their linked Instagram Business Accounts
    const pages = await getUserPages(userAccessToken);

    // Find first page that has a linked Instagram Business account
    const pageWithIG = pages.find((p) => p.instagram_business_account);
    if (!pageWithIG) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/automations?error=no_ig_business`
      );
    }

    const pageAccessToken = pageWithIG.access_token;
    const igAccount = pageWithIG.instagram_business_account;

    // 4. Get full Instagram account details
    const igInfo = await getIGAccountInfo(igAccount.id, pageAccessToken);

    // 5. Calculate token expiry (long-lived = ~60 days)
    const expiresAt = new Date(Date.now() + (longTokenData.expires_in || 5184000) * 1000);

    // 6. Upsert into DB
    await pool.query(
      `INSERT INTO instagram_accounts
         (creator_id, ig_user_id, ig_username, ig_name, ig_profile_pic, ig_followers,
          access_token, token_expires_at, page_id, page_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (creator_id, ig_user_id)
       DO UPDATE SET
         ig_username = EXCLUDED.ig_username,
         ig_name = EXCLUDED.ig_name,
         ig_profile_pic = EXCLUDED.ig_profile_pic,
         ig_followers = EXCLUDED.ig_followers,
         access_token = EXCLUDED.access_token,
         token_expires_at = EXCLUDED.token_expires_at,
         page_id = EXCLUDED.page_id,
         page_name = EXCLUDED.page_name,
         is_active = true`,
      [
        creatorId,
        igInfo.id,
        igInfo.username,
        igInfo.name,
        igInfo.profile_picture_url,
        igInfo.followers_count || 0,
        pageAccessToken,
        expiresAt,
        pageWithIG.id,
        pageWithIG.name,
      ]
    );

    // 7. Subscribe the Facebook Page to webhook events
    try {
      await subscribePageWebhook(pageWithIG.id, pageAccessToken);
    } catch (webhookErr) {
      console.warn('Webhook subscription failed (non-fatal):', webhookErr.message);
    }

    res.redirect(`${process.env.FRONTEND_URL}/automations?connected=true`);
  } catch (err) {
    console.error('Instagram callback error:', err.response?.data || err.message);
    res.redirect(
      `${process.env.FRONTEND_URL}/automations?error=connect_failed`
    );
  }
});

// ─────────────────────────────────────────────────────────────
// WEBHOOK — Receive Instagram Messages
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/instagram/webhook
 * Meta verifies the webhook endpoint during setup.
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

/**
 * POST /api/instagram/webhook
 * Meta sends all incoming messages/events here.
 * Processes the message and fires matching automations.
 */
router.post('/webhook', async (req, res) => {
  // Always respond 200 immediately so Meta doesn't retry
  res.sendStatus(200);

  const body = req.body;
  console.log('📨 Webhook received:', JSON.stringify(body).slice(0, 500));

  // Handle both instagram and page object types
  if (body.object !== 'instagram' && body.object !== 'page') return;

  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {
      // Skip echoes (our own outbound messages)
      if (event.message?.is_echo) continue;

      const senderIgsid = event.sender?.id;   // sender's IGSID
      const recipientId = event.recipient?.id; // our IG Business User ID or Page ID
      const messageText = event.message?.text;

      console.log(`📩 Message from ${senderIgsid} to ${recipientId}: "${messageText}"`);

      if (!messageText || !senderIgsid) continue;

      try {
        await processIncomingMessage(recipientId, senderIgsid, messageText);
      } catch (err) {
        console.error('Error processing webhook message:', err.message);
      }
    }
  }
});

/**
 * Core automation engine — called for each inbound DM
 */
async function processIncomingMessage(igBusinessUserId, senderIgsid, messageText) {
  // 1. Find the instagram_account record in DB — try ig_user_id first, then page_id
  let acctResult = await pool.query(
    `SELECT ia.*, c.page_slug FROM instagram_accounts ia
     JOIN creators c ON c.id = ia.creator_id
     WHERE ia.ig_user_id = $1 AND ia.is_active = true`,
    [igBusinessUserId]
  );
  if (acctResult.rows.length === 0) {
    // Fallback: for page-object webhooks, recipient.id is the Page ID
    acctResult = await pool.query(
      `SELECT ia.*, c.page_slug FROM instagram_accounts ia
       JOIN creators c ON c.id = ia.creator_id
       WHERE ia.page_id = $1 AND ia.is_active = true`,
      [igBusinessUserId]
    );
  }
  if (acctResult.rows.length === 0) {
    console.log('⚠️ No account found for recipient ID:', igBusinessUserId);
    return;
  }

  const account = acctResult.rows[0];
  const creatorId = account.creator_id;
  const igAccountId = account.id;

  // 2. Upsert subscriber
  const subResult = await pool.query(
    `INSERT INTO dm_subscribers (creator_id, ig_account_id, ig_user_id, last_interaction)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (ig_account_id, ig_user_id)
     DO UPDATE SET last_interaction = NOW()
     RETURNING id`,
    [creatorId, igAccountId, senderIgsid]
  );
  const subscriberId = subResult.rows[0].id;

  // 3. Log inbound message
  await pool.query(
    `INSERT INTO dm_messages (creator_id, ig_account_id, subscriber_id, direction, message_text)
     VALUES ($1, $2, $3, 'inbound', $4)`,
    [creatorId, igAccountId, subscriberId, messageText]
  );

  // 4. Check if this is the first-ever DM from this sender
  const msgCount = await pool.query(
    `SELECT COUNT(*) FROM dm_messages
     WHERE ig_account_id = $1 AND subscriber_id = $2 AND direction = 'inbound'`,
    [igAccountId, subscriberId]
  );
  const isFirstDM = parseInt(msgCount.rows[0].count) <= 1;

  // 5. Find all active automations for this account
  const automations = await pool.query(
    `SELECT * FROM dm_automations
     WHERE ig_account_id = $1 AND is_active = true
     ORDER BY created_at ASC`,
    [igAccountId]
  );

  // 6. Match automations and fire the first matching one
  for (const automation of automations.rows) {
    let matched = false;

    if (automation.trigger_type === 'first_dm' && isFirstDM) {
      matched = true;
    } else if (
      automation.trigger_type === 'dm_keyword' &&
      doesMessageMatch(messageText, automation.keywords, automation.match_type)
    ) {
      matched = true;
    }

    if (!matched) continue;

    // 7. Build response (replace variables)
    const bookingLink = `${process.env.FRONTEND_URL}/${account.page_slug}`;
    let response = buildResponseMessage(automation.response_message, {
      first_name: senderIgsid, // We don't have the name yet; Instagram API can fetch it
      username: senderIgsid,
      booking_link: automation.include_booking_link ? bookingLink : '',
    });

    // Append booking link cleanly if flag is set and not already in template
    if (automation.include_booking_link && !automation.response_message.includes('{{booking_link}}')) {
      response += `\n\nBook here 👇\n${bookingLink}`;
    }

    // 8. Apply delay if set
    if (automation.delay_seconds > 0) {
      await new Promise((r) => setTimeout(r, automation.delay_seconds * 1000));
    }

    // 9. Send the DM via Meta API
    try {
      await sendDM(account.ig_user_id, senderIgsid, response, account.access_token);

      // 10. Log outbound message
      await pool.query(
        `INSERT INTO dm_messages (creator_id, ig_account_id, subscriber_id, direction, message_text, automation_id)
         VALUES ($1, $2, $3, 'outbound', $4, $5)`,
        [creatorId, igAccountId, subscriberId, response, automation.id]
      );

      // 11. Increment trigger counter
      await pool.query(
        `UPDATE dm_automations SET total_triggered = total_triggered + 1 WHERE id = $1`,
        [automation.id]
      );
    } catch (sendErr) {
      console.error('Failed to send DM:', sendErr.response?.data || sendErr.message);
    }

    break; // Only fire the first matching automation per message
  }
}

// ─────────────────────────────────────────────────────────────
// DEBUG / TEST ENDPOINTS
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/instagram/test-webhook
 * Simulates an incoming DM to test the full automation pipeline.
 * Body: { ig_user_id_or_page_id, sender_id, message }
 */
router.post('/test-webhook', auth, async (req, res) => {
  try {
    const { message = 'book', sender_id = 'test_sender_123' } = req.body;

    // Get connected account for this creator
    const acct = await pool.query(
      `SELECT ig_user_id, page_id FROM instagram_accounts WHERE creator_id = $1 AND is_active = true LIMIT 1`,
      [req.creator.id]
    );
    if (acct.rows.length === 0) {
      return res.status(400).json({ error: 'No connected Instagram account' });
    }

    const recipientId = acct.rows[0].ig_user_id;
    console.log(`🧪 Test webhook: message="${message}" to ig_user_id=${recipientId}`);
    await processIncomingMessage(recipientId, sender_id, message);
    res.json({ success: true, tested_with: { recipientId, sender_id, message } });
  } catch (err) {
    console.error('Test webhook error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/instagram/debug-accounts
 * Returns current DB state for debugging.
 */
router.get('/debug-accounts', auth, async (req, res) => {
  try {
    const accounts = await pool.query(
      `SELECT id, ig_user_id, ig_username, page_id, page_name, is_active FROM instagram_accounts WHERE creator_id = $1`,
      [req.creator.id]
    );
    const automations = await pool.query(
      `SELECT id, ig_account_id, name, trigger_type, keywords, is_active, total_triggered FROM dm_automations WHERE creator_id = $1`,
      [req.creator.id]
    );
    const messages = await pool.query(
      `SELECT direction, message_text, created_at FROM dm_messages WHERE creator_id = $1 ORDER BY id DESC LIMIT 10`,
      [req.creator.id]
    );
    res.json({ accounts: accounts.rows, automations: automations.rows, recent_messages: messages.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// INSTAGRAM ACCOUNT — CRUD
// ─────────────────────────────────────────────────────────────

/** GET /api/instagram/account — get connected IG account */
router.get('/account', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, ig_user_id, ig_username, ig_name, ig_profile_pic, ig_followers,
              page_id, page_name, is_active, connected_at, token_expires_at
       FROM instagram_accounts WHERE creator_id = $1 AND is_active = true LIMIT 1`,
      [req.creator.id]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

/** DELETE /api/instagram/disconnect — disconnect IG account */
router.delete('/disconnect', auth, async (req, res) => {
  try {
    await pool.query(
      `UPDATE instagram_accounts SET is_active = false WHERE creator_id = $1`,
      [req.creator.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// ─────────────────────────────────────────────────────────────
// AUTOMATIONS — CRUD
// ─────────────────────────────────────────────────────────────

/** GET /api/instagram/automations */
router.get('/automations', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, ia.ig_username
       FROM dm_automations a
       JOIN instagram_accounts ia ON ia.id = a.ig_account_id
       WHERE a.creator_id = $1
       ORDER BY a.created_at DESC`,
      [req.creator.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch automations' });
  }
});

/** POST /api/instagram/automations — create */
router.post('/automations', auth, async (req, res) => {
  try {
    const {
      name,
      trigger_type = 'dm_keyword',
      keywords = [],
      match_type = 'contains',
      response_message,
      include_booking_link = false,
      delay_seconds = 0,
    } = req.body;

    if (!name || !response_message) {
      return res.status(400).json({ error: 'name and response_message are required' });
    }

    // Get connected IG account
    const acct = await pool.query(
      `SELECT id FROM instagram_accounts WHERE creator_id = $1 AND is_active = true LIMIT 1`,
      [req.creator.id]
    );
    if (acct.rows.length === 0) {
      return res.status(400).json({ error: 'No connected Instagram account' });
    }

    const result = await pool.query(
      `INSERT INTO dm_automations
         (creator_id, ig_account_id, name, trigger_type, keywords, match_type,
          response_message, include_booking_link, delay_seconds)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        req.creator.id,
        acct.rows[0].id,
        name,
        trigger_type,
        keywords,
        match_type,
        response_message,
        include_booking_link,
        delay_seconds,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create automation' });
  }
});

/** PUT /api/instagram/automations/:id — update */
router.put('/automations/:id', auth, async (req, res) => {
  try {
    const {
      name,
      trigger_type,
      keywords,
      match_type,
      response_message,
      include_booking_link,
      delay_seconds,
    } = req.body;

    const result = await pool.query(
      `UPDATE dm_automations
       SET name=$1, trigger_type=$2, keywords=$3, match_type=$4,
           response_message=$5, include_booking_link=$6, delay_seconds=$7
       WHERE id=$8 AND creator_id=$9
       RETURNING *`,
      [
        name,
        trigger_type,
        keywords,
        match_type,
        response_message,
        include_booking_link,
        delay_seconds,
        req.params.id,
        req.creator.id,
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update automation' });
  }
});

/** PATCH /api/instagram/automations/:id/toggle — toggle active */
router.patch('/automations/:id/toggle', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE dm_automations
       SET is_active = NOT is_active
       WHERE id=$1 AND creator_id=$2
       RETURNING *`,
      [req.params.id, req.creator.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle automation' });
  }
});

/** DELETE /api/instagram/automations/:id */
router.delete('/automations/:id', auth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM dm_automations WHERE id=$1 AND creator_id=$2`,
      [req.params.id, req.creator.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete automation' });
  }
});

// ─────────────────────────────────────────────────────────────
// SUBSCRIBERS
// ─────────────────────────────────────────────────────────────

/** GET /api/instagram/subscribers */
router.get('/subscribers', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*,
              COUNT(m.id) FILTER (WHERE m.direction='inbound')  AS messages_received,
              COUNT(m.id) FILTER (WHERE m.direction='outbound') AS messages_sent
       FROM dm_subscribers s
       LEFT JOIN dm_messages m ON m.subscriber_id = s.id
       WHERE s.creator_id = $1
       GROUP BY s.id
       ORDER BY s.last_interaction DESC`,
      [req.creator.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

// ─────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────

/** GET /api/instagram/stats */
router.get('/stats', auth, async (req, res) => {
  try {
    const [subs, autos, msgs] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) FROM dm_subscribers WHERE creator_id=$1`,
        [req.creator.id]
      ),
      pool.query(
        `SELECT COUNT(*) FILTER (WHERE is_active=true) AS active,
                COUNT(*) AS total,
                COALESCE(SUM(total_triggered),0) AS total_triggered
         FROM dm_automations WHERE creator_id=$1`,
        [req.creator.id]
      ),
      pool.query(
        `SELECT COUNT(*) FILTER (WHERE direction='outbound') AS sent,
                COUNT(*) FILTER (WHERE direction='inbound')  AS received
         FROM dm_messages WHERE creator_id=$1`,
        [req.creator.id]
      ),
    ]);

    res.json({
      subscribers: parseInt(subs.rows[0].count),
      automations_active: parseInt(autos.rows[0].active),
      automations_total: parseInt(autos.rows[0].total),
      total_triggered: parseInt(autos.rows[0].total_triggered),
      messages_sent: parseInt(msgs.rows[0].sent),
      messages_received: parseInt(msgs.rows[0].received),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
