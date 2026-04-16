const { Resend } = require('resend');
const { Pool } = require('pg');

const resend = new Resend(process.env.RESEND_API_KEY);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sendConfirmation = async (booking) => {
  try {
    // Get creator email + name
    const creatorResult = await pool.query(
      'SELECT name, email FROM creators WHERE id=$1',
      [booking.creator_id]
    );
    const creator = creatorResult.rows[0];

    const slotTime = new Date(booking.slot_start).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const meetBlock = booking.meet_link
      ? `<p><strong>Meeting Link:</strong> <a href="${booking.meet_link}" style="color:#7c6af7">${booking.meet_link}</a></p>`
      : '';

    // Email to CREATOR
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: creator.email,
      subject: `New Booking — ${booking.client_name}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#7c6af7">New Booking Confirmed</h2>
          <p><strong>Client:</strong> ${booking.client_name}</p>
          <p><strong>Email:</strong> ${booking.client_email}</p>
          <p><strong>Phone:</strong> ${booking.client_phone || '—'}</p>
          <p><strong>Date & Time:</strong> ${slotTime} IST</p>
          <p><strong>Amount:</strong> ₹${booking.amount}</p>
          ${meetBlock}
        </div>
      `,
    });

    // Email to CLIENT
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: booking.client_email,
      subject: `Your booking with ${creator.name} is confirmed!`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#7c6af7">Booking Confirmed</h2>
          <p>Hi ${booking.client_name},</p>
          <p>Your consultation with <strong>${creator.name}</strong> is confirmed.</p>
          <p><strong>Date & Time:</strong> ${slotTime} IST</p>
          ${meetBlock}
          <p style="color:#888;font-size:13px;margin-top:24px">Add this to your calendar and join the meeting at the scheduled time.</p>
        </div>
      `,
    });

    console.log('✅ Confirmation emails sent to creator and client');
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

module.exports = { sendConfirmation };
