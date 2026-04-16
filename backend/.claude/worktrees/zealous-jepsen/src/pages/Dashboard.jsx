import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getBookingStats, getUpcomingBookings } from '../api/index.js';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { creator } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getBookingStats(), getUpcomingBookings()])
      .then(([statsRes, upcomingRes]) => {
        setStats(statsRes.data);
        setUpcoming(upcomingRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr) => new Date(dateStr).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata'
  });

  return (
    <Layout>
      {/* Header */}
      <div className="rise" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font)', fontWeight: 900, fontSize: '28px', letterSpacing: '-0.8px', background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.7))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Good afternoon, <span style={{ background: 'linear-gradient(135deg, var(--violet), var(--rose))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{creator?.name?.split(' ')[0]} 👋</span>
          </h1>
          <p style={{ color: 'var(--ink2)', fontSize: '13.5px', marginTop: '4px' }}>Here's your consultation business at a glance</p>
        </div>
        <button className="btn btn-violet" onClick={() => navigate('/services')}>+ New Service</button>
      </div>

      {/* Stats */}
      <div className="stats-grid sg-4 rise rise-1">
        <div className="stat">
          <div className="stat-glow" style={{ background: 'var(--coral)' }}></div>
          <div className="stat-label">Revenue This Month</div>
          <div className="stat-number" style={{ color: 'var(--coral)' }}>₹{loading ? '...' : Number(stats?.monthly_revenue || 0).toLocaleString('en-IN')}</div>
          <div className="stat-delta up">Consultation income</div>
        </div>
        <div className="stat">
          <div className="stat-glow" style={{ background: 'var(--violet)' }}></div>
          <div className="stat-label">Total Bookings</div>
          <div className="stat-number" style={{ color: 'var(--violet)' }}>{loading ? '...' : stats?.total_confirmed || 0}</div>
          <div className="stat-delta up">All time</div>
        </div>
        <div className="stat">
          <div className="stat-glow" style={{ background: 'var(--lime)' }}></div>
          <div className="stat-label">Upcoming Sessions</div>
          <div className="stat-number" style={{ color: 'var(--lime)' }}>{loading ? '...' : stats?.upcoming || 0}</div>
          <div className="stat-delta muted">Scheduled</div>
        </div>
        <div className="stat">
          <div className="stat-glow" style={{ background: 'var(--electric)' }}></div>
          <div className="stat-label">Today's Sessions</div>
          <div className="stat-number" style={{ color: 'var(--electric)' }}>{loading ? '...' : stats?.today || 0}</div>
          <div className="stat-delta muted">Booked today</div>
        </div>
      </div>

      {/* Upcoming Bookings */}
      <div className="card rise rise-2">
        <div className="card-head">
          <div className="card-title">📅 Upcoming Sessions</div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/bookings')}>View all →</button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink2)' }}>Loading...</div>
        ) : upcoming.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink2)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📅</div>
            <div style={{ fontWeight: 700, marginBottom: '6px' }}>No upcoming sessions yet</div>
            <div style={{ fontSize: '13px', marginBottom: '16px' }}>Create a service and share your page to get bookings</div>
            <button className="btn btn-violet btn-sm" onClick={() => navigate('/services')}>Create Service →</button>
          </div>
        ) : (
          upcoming.map(booking => (
            <div key={booking.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--violet), var(--rose))', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                {booking.client_name?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{booking.client_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--ink2)', marginTop: '2px' }}>{booking.service_title} · ₹{booking.amount}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{formatDate(booking.slot_start)}</div>
                <div style={{ fontSize: '11px', color: 'var(--ink2)', marginTop: '2px' }}>{booking.duration_minutes} min</div>
              </div>
              <a href={booking.meet_link} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">🎥 Join</a>
            </div>
          ))
        )}
      </div>

      {/* Quick links */}
      <div className="rise rise-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '18px' }}>
        <div className="card" style={{ padding: '24px', cursor: 'pointer' }} onClick={() => navigate('/services')}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>🎯</div>
          <div style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '16px', marginBottom: '4px' }}>Manage Services</div>
          <div style={{ fontSize: '13px', color: 'var(--ink2)' }}>Create and edit your consultation offerings</div>
        </div>
        <div className="card" style={{ padding: '24px', cursor: 'pointer' }} onClick={() => navigate('/my-page')}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>🌐</div>
          <div style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '16px', marginBottom: '4px' }}>My Public Page</div>
          <div style={{ fontSize: '13px', color: 'var(--ink2)' }}>autodm.co/{creator?.page_slug}</div>
        </div>
      </div>
    </Layout>
  );
}