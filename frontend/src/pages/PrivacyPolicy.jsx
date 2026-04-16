export default function PrivacyPolicy() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#080810',
      color: '#f7f6ff',
      fontFamily: 'Inter, sans-serif',
      padding: '60px 24px',
    }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: '#888', marginBottom: 48 }}>Last updated: April 3, 2026</p>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>1. Introduction</h2>
          <p style={{ lineHeight: 1.8, color: '#ccc' }}>
            AutoDM ("we", "our", or "us") operates as a SaaS platform that enables creators to
            automate Instagram direct message responses. This Privacy Policy explains how we collect,
            use, and protect information when you use our platform at{' '}
            <a href="https://frontend-sage-two-97.vercel.app" style={{ color: '#a78bfa' }}>
              https://frontend-sage-two-97.vercel.app
            </a>.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>2. Information We Collect</h2>
          <ul style={{ lineHeight: 2, color: '#ccc', paddingLeft: 20 }}>
            <li><strong style={{ color: '#f7f6ff' }}>Account Information:</strong> Name, email address, and password when you register.</li>
            <li><strong style={{ color: '#f7f6ff' }}>Instagram Data:</strong> When you connect your Instagram Business account via Facebook Login, we access your Instagram profile information, Instagram Business Account ID, and linked Facebook Page details.</li>
            <li><strong style={{ color: '#f7f6ff' }}>Message Data:</strong> Incoming DM text and sender identifiers (Instagram-scoped IDs) for the purpose of triggering automated replies.</li>
            <li><strong style={{ color: '#f7f6ff' }}>Usage Data:</strong> Automation trigger counts and message logs to provide analytics within the platform.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>3. How We Use Your Information</h2>
          <ul style={{ lineHeight: 2, color: '#ccc', paddingLeft: 20 }}>
            <li>To operate and provide the DM automation service.</li>
            <li>To send automated replies on your behalf via the Instagram Messaging API.</li>
            <li>To display message analytics and subscriber counts within your dashboard.</li>
            <li>To maintain and improve the platform.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>4. Instagram / Meta Data</h2>
          <p style={{ lineHeight: 1.8, color: '#ccc' }}>
            We access Instagram data solely to provide the automation features you configure. We do not
            sell, share, or use Instagram message content for advertising or profiling. Access tokens
            are stored securely and used only to send messages and subscribe to webhook events on your
            behalf. You can revoke access at any time by disconnecting your Instagram account in the
            dashboard or through Facebook's Apps and Websites settings.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>5. Data Retention</h2>
          <p style={{ lineHeight: 1.8, color: '#ccc' }}>
            Message logs are retained while your account is active to provide analytics. You can delete
            your account and all associated data at any time by contacting us. Access tokens are
            invalidated and deleted upon Instagram account disconnection.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>6. Data Sharing</h2>
          <p style={{ lineHeight: 1.8, color: '#ccc' }}>
            We do not sell or share your personal data or Instagram data with third parties, except as
            required by law or as necessary to operate the service (e.g., our cloud infrastructure
            provider, Railway).
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>7. Security</h2>
          <p style={{ lineHeight: 1.8, color: '#ccc' }}>
            We use industry-standard security measures including HTTPS encryption, hashed passwords,
            and JWT-based authentication. Access tokens are stored encrypted in our database.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>8. Your Rights</h2>
          <p style={{ lineHeight: 1.8, color: '#ccc' }}>
            You have the right to access, correct, or delete your personal data. To exercise these
            rights, contact us at the email below.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>9. Contact</h2>
          <p style={{ lineHeight: 1.8, color: '#ccc' }}>
            For privacy-related questions, contact us at:{' '}
            <a href="mailto:support@autodm.app" style={{ color: '#a78bfa' }}>support@autodm.app</a>
          </p>
        </section>
      </div>
    </div>
  );
}
