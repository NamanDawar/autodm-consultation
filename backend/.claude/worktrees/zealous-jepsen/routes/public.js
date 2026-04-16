const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Get creator public page by slug
router.get('/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, bio, photo_url, category, page_slug 
       FROM creators WHERE page_slug=$1`,
      [req.params.slug]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    const creator = result.rows[0];

    // Get active services
    const services = await pool.query(
      `SELECT id, title, description, duration_minutes, price, video_platform
       FROM services 
       WHERE creator_id=$1 AND is_active=true
       ORDER BY price ASC`,
      [creator.id]
    );

    res.json({
      creator,
      services: services.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get public page' });
  }
});

module.exports = router;