const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, page_slug } = req.body;

    // Check if email or slug already exists
    const exists = await pool.query(
      'SELECT id FROM creators WHERE email=$1 OR page_slug=$2',
      [email, page_slug]
    );
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: 'Email or page URL already taken' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO creators (name, email, password, page_slug)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, page_slug`,
      [name, email, hashed, page_slug]
    );

    const creator = result.rows[0];
    const token = jwt.sign({ id: creator.id, email: creator.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, creator });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM creators WHERE email=$1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const creator = result.rows[0];
    const valid = await bcrypt.compare(password, creator.password);
    if (!valid) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: creator.id, email: creator.email }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, creator: { id: creator.id, name: creator.name, email: creator.email, page_slug: creator.page_slug } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get my profile
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, page_slug, bio, photo_url, category FROM creators WHERE id=$1',
      [req.creator.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update profile
router.put('/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const { name, bio, category, page_slug } = req.body;
    const result = await pool.query(
      `UPDATE creators SET name=$1, bio=$2, category=$3, page_slug=$4 
       WHERE id=$5 RETURNING id, name, email, page_slug, bio, category`,
      [name, bio, category, page_slug, req.creator.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;