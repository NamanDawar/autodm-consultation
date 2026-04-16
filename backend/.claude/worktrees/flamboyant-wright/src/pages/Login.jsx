import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login } from '../api/index.js';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form);
      loginUser(res.data.token, res.data.creator);
      toast.success('Welcome back! 👋');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '20px' }}>
      {/* Orbs */}
      <div style={{ position: 'fixed', top: '-100px', left: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(139,92,246,0.07)', filter: 'blur(90px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '0', right: '0', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(244,114,182,0.05)', filter: 'blur(90px)', pointerEvents: 'none' }} />

      <div className="rise" style={{ background: 'var(--panel)', border: '1px solid var(--border2)', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div className="brand-gem">⚡</div>
          <div className="brand-name">AutoDM</div>
        </div>

        <h2 style={{ fontFamily: 'var(--font)', fontWeight: 900, fontSize: '24px', marginBottom: '6px', letterSpacing: '-0.5px' }}>Welcome back</h2>
        <p style={{ color: 'var(--ink2)', fontSize: '14px', marginBottom: '28px' }}>Sign in to your creator account</p>

        <form onSubmit={handleSubmit}>
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
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-violet"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', marginTop: '8px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--ink2)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--violet-light)', fontWeight: 600 }}>Sign up free</Link>
        </p>
      </div>
    </div>
  );
}