const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const auth = require('../middleware/auth');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Get all my bookings (creator)
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT b.*, s.title as service_title, s.duration_minutes, s.price
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.creator_id=$1
    `;
    const params = [req.creator.id];

    if (status) {
      query += ` AND b.status=$2`;
      params.push(status);
    }

    query += ` ORDER BY b.slot_start ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get bookings' });
  }
});

// Get upcoming bookings
router.get('/upcoming', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, s.title as service_title, s.duration_minutes, s.price
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.creator_id=$1 
       AND b.slot_start >= NOW()
       AND b.status='confirmed'
       ORDER BY b.slot_start ASC
       LIMIT 10`,
      [req.creator.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get upcoming bookings' });
  }
});

// Get single booking
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, s.title as service_title, s.duration_minutes
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.id=$1 AND b.creator_id=$2`,
      [req.params.id, req.creator.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get booking' });
  }
});

// Cancel a booking
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE bookings SET status='cancelled'
       WHERE id=$1 AND creator_id=$2 RETURNING *`,
      [req.params.id, req.creator.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Get booking stats
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status='confirmed') as total_confirmed,
        COUNT(*) FILTER (WHERE status='confirmed' AND slot_start >= NOW()) as upcoming,
        COUNT(*) FILTER (WHERE status='confirmed' AND DATE(slot_start) = CURRENT_DATE) as today,
        COALESCE(SUM(amount) FILTER (WHERE status='confirmed'), 0) as total_revenue,
        COALESCE(SUM(amount) FILTER (WHERE status='confirmed' AND DATE_TRUNC('month', slot_start) = DATE_TRUNC('month', NOW())), 0) as monthly_revenue
       FROM bookings WHERE creator_id=$1`,
      [req.creator.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;