const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const auth = require('../middleware/auth');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Get all my services
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM services WHERE creator_id=$1 ORDER BY created_at ASC',
      [req.creator.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get services' });
  }
});

// Create a service
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, duration_minutes, price, video_platform, max_per_day } = req.body;
    const result = await pool.query(
      `INSERT INTO services (creator_id, title, description, duration_minutes, price, video_platform, max_per_day)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.creator.id, title, description, duration_minutes, price, video_platform || 'google_meet', max_per_day || 3]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Update a service
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, duration_minutes, price, video_platform, max_per_day, is_active } = req.body;
    const result = await pool.query(
      `UPDATE services SET title=$1, description=$2, duration_minutes=$3, 
       price=$4, video_platform=$5, max_per_day=$6, is_active=$7
       WHERE id=$8 AND creator_id=$9 RETURNING *`,
      [title, description, duration_minutes, price, video_platform, max_per_day, is_active, req.params.id, req.creator.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Service not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Delete a service
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM services WHERE id=$1 AND creator_id=$2',
      [req.params.id, req.creator.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Toggle active/inactive
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE services SET is_active = NOT is_active 
       WHERE id=$1 AND creator_id=$2 RETURNING *`,
      [req.params.id, req.creator.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle service' });
  }
});

module.exports = router;