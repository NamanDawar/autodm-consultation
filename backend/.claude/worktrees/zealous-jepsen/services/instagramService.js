const axios = require('axios');

const GRAPH = 'https://graph.facebook.com/v21.0';

// ─── Token Exchange ────────────────────────────────────────────────────────────

/**
 * Exchange a short-lived user token for a long-lived one (60-day)
 */
async function getLongLivedToken(shortToken) {
  const { data } = await axios.get(`${GRAPH}/oauth/access_token`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      fb_exchange_token: shortToken,
    },
  });
  return data; // { access_token, token_type, expires_in }
}

// ─── Pages & Instagram Account Discovery ──────────────────────────────────────

/**
 * Get all Facebook Pages the user manages + their linked Instagram accounts
 */
async function getUserPages(userAccessToken) {
  const { data } = await axios.get(`${GRAPH}/me/accounts`, {
    params: {
      access_token: userAccessToken,
      fields:
        'id,name,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count}',
    },
  });
  return data.data || [];
}

/**
 * Get detailed info about an Instagram Business Account
 */
async function getIGAccountInfo(igUserId, accessToken) {
  const { data } = await axios.get(`${GRAPH}/${igUserId}`, {
    params: {
      access_token: accessToken,
      fields: 'id,username,name,profile_picture_url,followers_count,biography',
    },
  });
  return data;
}

// ─── Messaging ─────────────────────────────────────────────────────────────────

/**
 * Send a DM to an Instagram user from a Business Account
 * igAccountId  → your Instagram Business User ID
 * recipientId  → the IGSID (Instagram-scoped user ID) of the recipient
 */
async function sendDM(igAccountId, recipientId, messageText, pageAccessToken) {
  const { data } = await axios.post(
    `${GRAPH}/${igAccountId}/messages`,
    {
      recipient: { id: recipientId },
      message: { text: messageText },
    },
    { params: { access_token: pageAccessToken } }
  );
  return data; // { recipient_id, message_id }
}

// ─── Webhook Management ────────────────────────────────────────────────────────

/**
 * Subscribe a Facebook Page to receive webhook events
 */
async function subscribePageWebhook(pageId, pageAccessToken) {
  const { data } = await axios.post(
    `${GRAPH}/${pageId}/subscribed_apps`,
    {
      subscribed_fields: [
        'messages',
        'messaging_postbacks',
        'message_echoes',
        'messaging_seen',
        'comments',
        'mention',
        'feed',
      ],
    },
    { params: { access_token: pageAccessToken } }
  );
  return data; // { success: true }
}

/**
 * Check if the Page is already subscribed to webhook
 */
async function getPageWebhookSubscriptions(pageId, pageAccessToken) {
  const { data } = await axios.get(`${GRAPH}/${pageId}/subscribed_apps`, {
    params: { access_token: pageAccessToken },
  });
  return data.data || [];
}

// ─── Keyword Matching ──────────────────────────────────────────────────────────

/**
 * Check if an incoming message text matches an automation's keyword rules.
 * Returns true if the message triggers the automation.
 */
function doesMessageMatch(messageText, keywords, matchType) {
  if (!keywords || keywords.length === 0) return false;
  const text = (messageText || '').toLowerCase().trim();

  return keywords.some((kw) => {
    const keyword = kw.toLowerCase().trim();
    switch (matchType) {
      case 'exact':
        return text === keyword;
      case 'starts_with':
        return text.startsWith(keyword);
      case 'contains':
      default:
        return text.includes(keyword);
    }
  });
}

// ─── Response Builder ──────────────────────────────────────────────────────────

/**
 * Replace template variables in a response message
 * Supported: {{first_name}}, {{username}}, {{booking_link}}
 */
function buildResponseMessage(template, vars = {}) {
  return template
    .replace(/\{\{first_name\}\}/gi, vars.first_name || 'there')
    .replace(/\{\{username\}\}/gi, vars.username || '')
    .replace(/\{\{booking_link\}\}/gi, vars.booking_link || '');
}

module.exports = {
  getLongLivedToken,
  getUserPages,
  getIGAccountInfo,
  sendDM,
  subscribePageWebhook,
  getPageWebhookSubscriptions,
  doesMessageMatch,
  buildResponseMessage,
};
