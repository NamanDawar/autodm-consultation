const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// ─── Run DB migrations on startup ────────────────────────────
(async () => {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
    await pool.query(schema);
    await pool.end();
    console.log('✅ DB migrations applied');
  } catch (err) {
    console.error('⚠️  Migration error (non-fatal):', err.message);
  }
})();

app.use(cors({
  origin: ['https://frontend-sage-two-97.vercel.app', 'http://localhost:5174', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/services'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/public', require('./routes/public'));
app.use('/api/instagram', require('./routes/instagram'));

app.get('/', (req, res) => {
  res.json({ status: 'AutoDM Consultation API running!' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
