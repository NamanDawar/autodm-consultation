const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const auth = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order (called before checkout)
router.post('/create-order', async (req, res) => {
  try {
    const { service_id, client_name, client_email, client_phone, slot_start, slot_end } = req.body;

    // Get service details
    const serviceResult = await pool.query('SELECT * FROM services WHERE id=$1', [service_id]);
    if (serviceResult.rows.length === 0) return res.status(404).json({ error: 'Service not found' });

    const service = serviceResult.rows[0];

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: service.price * 100, // paise
      currency: 'INR',
      receipt: `booking_${Date.now()}`,
      notes: {
        service_id,
        client_name,
        client_email,
        slot_start,
        slot_end,
      },
    });

    // Create pending booking
    const bookingResult = await pool.query(
      `INSERT INTO bookings 
       (service_id, creator_id, client_name, client_email, client_phone, slot_start, slot_end, amount, razorpay_order_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending') RETURNING *`,
      [service_id, service.creator_id, client_name, client_email, client_phone, slot_start, slot_end, service.price, order.id]
    );

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      booking_id: bookingResult.rows[0].id,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Verify payment after Razorpay checkout
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Generate Google Meet link (simple unique link)
    const chars = "abcdefghijklmnopqrstuvwxyz"; const rand = (n) => Array.from({length:n}, () => chars[Math.floor(Math.random()*chars.length)]).join(""); const meetLink = `https://meet.google.com/${rand(4)}-${rand(4)}-${rand(4)}`;

    // Update booking to confirmed
    const bookingResult = await pool.query(
      `UPDATE bookings SET 
       status='confirmed', payment_id=$1, meet_link=$2
       WHERE id=$3 RETURNING *`,
      [razorpay_payment_id, meetLink, booking_id]
    );

    const booking = bookingResult.rows[0];

    // Save payment record
    await pool.query(
      `INSERT INTO payments (booking_id, razorpay_order_id, razorpay_payment_id, amount, status)
       VALUES ($1, $2, $3, $4, 'paid')`,
      [booking_id, razorpay_order_id, razorpay_payment_id, booking.amount]
    );

    // Send confirmation email
    const emailService = require('../services/email');
    await emailService.sendConfirmation(booking);

    res.json({ success: true, booking, meet_link: meetLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Get all payments for creator
router.get('/my-payments', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, b.client_name, b.client_email, b.slot_start, s.title
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       JOIN services s ON b.service_id = s.id
       WHERE b.creator_id=$1
       ORDER BY p.created_at DESC`,
      [req.creator.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get payments' });
  }
});

module.exports = router;