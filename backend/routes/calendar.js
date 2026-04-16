const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const auth = require('../middleware/auth');
const { getAuthUrl, handleOAuthCallback } = require('../services/googleCalendar');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// ─── Google OAuth ─────────────────────────────────────────────

// Step 1: redirect creator to Google consent screen
router.get('/google/connect', auth, (req, res) => {
  const url = getAuthUrl(req.creator.id);
  res.json({ url });
});

// Step 2: Google redirects back here with ?code=...&state=creatorId
router.get('/google/callback', async (req, res) => {
  const { code, state: creatorId, error } = req.query;
  if (error || !code) {
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard?google_error=access_denied`);
  }
  try {
    await handleOAuthCallback(code, creatorId);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?google_connected=true`);
  } catch (err) {
    console.error('Google OAuth callback error:', err.message);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?google_error=failed`);
  }
});

// Check if Google is connected
router.get('/google/status', auth, async (req, res) => {
  const result = await pool.query(
    'SELECT google_refresh_token IS NOT NULL as connected FROM creators WHERE id=$1',
    [req.creator.id]
  );
  res.json({ connected: result.rows[0]?.connected || false });
});

router.post('/availability', auth, async (req, res) => {
  try {
    const { availability } = req.body;
    await pool.query('DELETE FROM availability WHERE creator_id=$1', [req.creator.id]);
    for (const slot of availability) {
      await pool.query('INSERT INTO availability (creator_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4)', [req.creator.id, slot.day_of_week, slot.start_time, slot.end_time]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/availability/:creator_id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM availability WHERE creator_id=$1 ORDER BY day_of_week', [req.params.creator_id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/slots/:creator_id/:service_id/:date', async (req, res) => {
  try {
    const { creator_id, service_id, date } = req.params;
    const serviceResult = await pool.query('SELECT duration_minutes, max_per_day FROM services WHERE id=$1', [service_id]);
    if (serviceResult.rows.length === 0) return res.status(404).json({ error: 'Service not found' });
    const { duration_minutes, max_per_day } = serviceResult.rows[0];
    const dayOfWeek = new Date(date).getDay();
    const availResult = await pool.query('SELECT * FROM availability WHERE creator_id=$1 AND day_of_week=$2', [creator_id, dayOfWeek]);
    if (availResult.rows.length === 0) return res.json({ slots: [] });
    const { start_time, end_time } = availResult.rows[0];
    const bookedResult = await pool.query("SELECT slot_start, slot_end FROM bookings WHERE creator_id=$1 AND DATE(slot_start)=$2 AND status='confirmed'", [creator_id, date]);
    const bookedSlots = bookedResult.rows;
    if (bookedSlots.length >= max_per_day) return res.json({ slots: [] });
    const slots = [];
    let current = new Date(`${date}T${start_time}`);
    const endTime = new Date(`${date}T${end_time}`);
    while (current < endTime) {
      const slotEnd = new Date(current.getTime() + duration_minutes * 60000);
      if (slotEnd > endTime) break;
      const conflict = bookedSlots.some(b => current < new Date(b.slot_end) && slotEnd > new Date(b.slot_start));
      if (!conflict) slots.push({ start: current.toISOString(), end: slotEnd.toISOString(), label: current.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) });
      current = new Date(current.getTime() + duration_minutes * 60000);
    }
    res.json({ slots });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
