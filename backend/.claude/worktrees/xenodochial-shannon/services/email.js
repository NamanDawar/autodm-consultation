const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const sendConfirmation = async (booking) => {
  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'naman@classplus.co',
      subject: `New Booking - ${booking.client_name}`,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
          <h2 style="color:#7c6af7">New Booking Confirmed</h2>
          <p><strong>Client:</strong> ${booking.client_name}</p>
          <p><strong>Email:</strong> ${booking.client_email}</p>
          <p><strong>Date:</strong> ${new Date(booking.slot_start).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
          <p><strong>Amount:</strong> Rs.${booking.amount}</p>
          <p><strong>Meet Link:</strong> <a href="${booking.meet_link}">${booking.meet_link}</a></p>
        </div>
      `,
    });
    console.log('Email sent successfully');
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

module.exports = { sendConfirmation };
