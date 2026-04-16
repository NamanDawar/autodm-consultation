const { google } = require('googleapis');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BACKEND_URL}/api/calendar/google/callback`
  );
}

/**
 * Generate the Google OAuth URL for a creator to connect their Google account.
 */
function getAuthUrl(creatorId) {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // force refresh_token to be returned every time
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state: creatorId,
  });
}

/**
 * Exchange authorization code for tokens and store refresh_token in DB.
 */
async function handleOAuthCallback(code, creatorId) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error('No refresh token returned — user may need to re-authorize');
  }
  await pool.query(
    'UPDATE creators SET google_refresh_token=$1 WHERE id=$2',
    [tokens.refresh_token, creatorId]
  );
  return tokens;
}

/**
 * Create a Google Calendar event with a real Meet link for a confirmed booking.
 * Returns the Meet link string.
 */
async function createMeetEvent(creatorId, booking) {
  const result = await pool.query(
    'SELECT email, google_refresh_token FROM creators WHERE id=$1',
    [creatorId]
  );
  const creator = result.rows[0];

  if (!creator?.google_refresh_token) {
    throw new Error('Google Calendar not connected');
  }

  const client = getOAuthClient();
  client.setCredentials({ refresh_token: creator.google_refresh_token });

  const calendar = google.calendar({ version: 'v3', auth: client });

  const event = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1, // tells Google to generate a Meet link
    resource: {
      summary: `Consultation with ${booking.client_name}`,
      description: `Booking confirmed via AutoDM.\nClient: ${booking.client_name}\nEmail: ${booking.client_email}`,
      start: { dateTime: new Date(booking.slot_start).toISOString(), timeZone: 'Asia/Kolkata' },
      end:   { dateTime: new Date(booking.slot_end).toISOString(),   timeZone: 'Asia/Kolkata' },
      attendees: [
        { email: creator.email },
        { email: booking.client_email },
      ],
      conferenceData: {
        createRequest: {
          requestId: booking.id, // must be unique per event
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  });

  // Google returns the Meet link in hangoutLink or conferenceData.entryPoints
  const meetLink =
    event.data.hangoutLink ||
    event.data.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri;

  if (!meetLink) throw new Error('Google did not return a Meet link');
  return meetLink;
}

module.exports = { getAuthUrl, handleOAuthCallback, createMeetEvent };
