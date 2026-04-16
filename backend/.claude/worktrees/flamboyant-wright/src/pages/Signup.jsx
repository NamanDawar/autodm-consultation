import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { signup } from '../api/index.js';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', page_slug: '' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signup(form);
      loginUser(res.data.token, res.data.creator);
      toast.success('Account created! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    setForm({ ...form, name, page_slug: slug });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '20px' }}>
      <div style={{ position: 'fixed', top: '-100px', left: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(139,92,246,0.07)', filter: 'blur(90px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '0', right: '0', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(244,114,182,0.05)', filter: 'blur(90px)', pointerEvents: 'none' }} />

      <div className="rise" style={{ background: 'var(--panel)', border: '1px solid var(--border2)', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div className="brand-gem">⚡</div>
          <div className="brand-name">AutoDM</div>
        </div>

        <h2 style={{ fontFamily: 'var(--font)', fontWeight: 900, fontSize: '24px', marginBottom: '6px', letterSpacing: '-0.5px' }}>Create your account</h2>
        <p style={{ color: 'var(--ink2)', fontSize: '14px', marginBottom: '28px' }}>Start selling consultations in minutes</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              placeholder="Naman Dawar"
              value={form.name}
              onChange={handleNameChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              placeholder="Min 8 characters"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Your Page URL</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--ink2)', whiteSpace: 'nowrap' }}>autodm.co/</span>
              <input
                type="text"
                placeholder="yourname"
                value={form.page_slug}
                onChange={e => setForm({ ...form, page_slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-violet"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', marginTop: '8px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--ink2)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--violet-light)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}