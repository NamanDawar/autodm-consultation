import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getBookings, getBookingStats, cancelBooking } from '../api/index.js';
import toast from 'react-hot-toast';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, statsRes] = await Promise.all([getBookings(), getBookingStats()]);
      setBookings(bookingsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await cancelBooking(id);
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking cancelled');
    } catch (err) {
      toast.error('Failed to cancel');
    }
  };

  const filtered = bookings.filter(b => {
    if (filter === 'upcoming') return b.status === 'confirmed' && new Date(b.slot_start) >= new Date();
    if (filter === 'confirmed') return b.status === 'confirmed';
    if (filter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  const formatDate = (dateStr) => new Date(dateStr).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata'
  });

  const statusColor = {
    confirmed: { bg: 'rgba(163,230,53,0.1)', color: 'var(--lime)' },
    pending: { bg: 'rgba(251,146,60,0.1)', color: 'var(--coral)' },
    cancelled: { bg: 'rgba(255,255,255,0.06)', color: 'var(--ink3)' },
  };

  return (
    <Layout>
      {/* Header */}
      <div className="rise" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font)', fontWeight: 900, fontSize: '28px', letterSpacing: '-0.8px' }}>📅 Bookings</h1>
        <p style={{ color: 'var(--ink2)', fontSize: '13.5px', marginTop: '4px' }}>All your consultation sessions in one place</p>
      </div>

      {/* Stats */}
      <div className="stats-grid sg-3 rise rise-1">
        <div className="stat">
          <div className="stat-glow" style={{ background: 'var(--coral)' }}></div>
          <div className="stat-label">Revenue This Month</div>
          <div className="stat-number" style={{ color: 'var(--coral)' }}>₹{loading ? '...' : Number(stats?.monthly_revenue || 0).toLocaleString('en-IN')}</div>
          <div className="stat-delta up">Consultation income</div>
        </div>
        <div className="stat">
          <div className="stat-glow" style={{ background: 'var(--violet)' }}></div>
          <div className="stat-label">Total Sessions</div>
          <div className="stat-number" style={{ color: 'var(--violet)' }}>{loading ? '...' : stats?.total_confirmed || 0}</div>
          <div className="stat-delta up">All time</div>
        </div>
        <div className="stat">
          <div className="stat-glow" style={{ background: 'var(--lime)' }}></div>
          <div className="stat-label">Upcoming</div>
          <div className="stat-number" style={{ color: 'var(--lime)' }}>{loading ? '...' : stats?.upcoming || 0}</div>
          <div className="stat-delta muted">Scheduled ahead</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="rise rise-2" style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '4px', borderRadius: '10px', width: 'fit-content', marginBottom: '18px' }}>
        {['all', 'upcoming', 'confirmed', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 18px', borderRadius: '7px', fontSize: '13px', fontWeight: 600, background: filter === f ? 'var(--panel2)' : 'transparent', color: filter === f ? 'var(--ink)' : 'var(--ink2)', border: filter === f ? '1px solid var(--border2)' : '1px solid transparent' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      <div className="card rise rise-3">
        <div className="card-head">
          <div className="card-title">Sessions</div>
          <span style={{ fontSize: '12px', color: 'var(--ink2)' }}>{filtered.length} total</span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink2)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink2)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
            <div style={{ fontWeight: 700, marginBottom: '6px' }}>No bookings yet</div>
            <div style={{ fontSize: '13px' }}>Share your page to start getting bookings</div>
          </div>
        ) : (
          filtered.map(booking => (
            <div key={booking.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--violet), var(--rose))', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                {booking.client_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{booking.client_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--ink2)', marginTop: '2px' }}>{booking.service_title} · {booking.client_email}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{formatDate(booking.slot_start)}</div>
                <div style={{ fontSize: '11px', color: 'var(--ink2)', marginTop: '2px' }}>{booking.duration_minutes} min</div>
              </div>
              <div style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '15px', color: 'var(--coral)', flexShrink: 0 }}>₹{Number(booking.amount).toLocaleString('en-IN')}</div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', flexShrink: 0, ...statusColor[booking.status] }}>
                {booking.status}
              </span>
              {booking.meet_link && booking.status === 'confirmed' && (
                <a href={booking.meet_link} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">🎥 Join</a>
              )}
              {booking.status === 'confirmed' && (
                <button className="btn btn-ghost btn-sm" style={{ color: '#f87171' }} onClick={() => handleCancel(booking.id)}>Cancel</button>
              )}
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}