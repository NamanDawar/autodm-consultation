require('dotenv').config();
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'naman@classplus.co',
  subject: 'Test email from AutoDM',
  html: '<h1>Test email working</h1>'
}).then(r => console.log('Result:', JSON.stringify(r.data)))
.catch(e => console.log('Error:', e.message));
