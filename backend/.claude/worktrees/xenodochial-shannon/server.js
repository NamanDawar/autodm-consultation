const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

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

app.get('/', (req, res) => {
  res.json({ status: 'AutoDM Consultation API running!' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
