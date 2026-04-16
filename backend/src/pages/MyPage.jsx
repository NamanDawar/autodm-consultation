import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getMe, updateProfile, setAvailability, getAvailability } from '../api/index.js';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function MyPage() {
  const { creator } = useAuth();
  const [profile, setProfile] = useState({ name: '', bio: '', category: '', page_slug: '' });
  const [availability, setAvailabilityState] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMe(), getAvailability(creator?.id)])
      .then(([meRes, availRes]) => {
        setProfile(meRes.data);
        setAvailabilityState(availRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profile);
      toast.success('Profile saved! ✅');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayIndex) => {
    const exists = availability.find(a => a.day_of_week === dayIndex);
    if (exists) {
      setAvailabilityState(availability.filter(a => a.day_of_week !== dayIndex));
    } else {
      setAvailabilityState([...availability, { day_of_week: dayIndex, start_time: '10:00', end_time: '18:00' }]);
    }
  };

  const updateDayTime = (dayIndex, field, value) => {
    setAvailabilityState(availability.map(a => a.day_of_week === dayIndex ? { ...a, [field]: value } : a));
  };

  const handleSaveAvailability = async () => {
    setSavingAvail(true);
    try {
      await setAvailability({ availability });
      toast.success('Availability saved! 📅');
    } catch (err) {
      toast.error('Failed to save availability');
    } finally {
      setSavingAvail(false);
    }
  };

  const pageUrl = `${window.location.origin}/${profile.page_slug}`;

  return (
    <Layout>
      <div className="rise" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'var(--font)', fontWeight: 900, fontSize: '28px', letterSpacing: '-0.8px' }}>🌐 My Public Page</h1>
        <p style={{ color: 'var(--ink2)', fontSize: '13.5px', marginTop: '4px' }}>Customize what clients see when they visit your booking page</p>
      </div>

      {/* Page URL banner */}
      <div className="rise rise-1" style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 'var(--r-lg)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
        <span style={{ fontSize: '20px' }}>🔗</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--violet-light)' }}>Your Public Booking Page</div>
          <div style={{ fontSize: '13px', color: 'var(--ink2)', marginTop: '2px' }}>{pageUrl}</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(pageUrl); toast.success('Link copied!'); }}>Copy Link</button>
        <a href={`/${profile.page_slug}`} target="_blank" rel="noreferrer" className="btn btn-violet btn-sm">Preview →</a>
      </div>

      <div className="rise rise-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Profile settings */}
        <div className="card">
          <div className="card-head"><div className="card-title">Profile Settings</div></div>
          <form onSubmit={handleSaveProfile} style={{ padding: '20px' }}>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input value={profile.name || ''} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="Your name" />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea rows={3} value={profile.bio || ''} onChange={e => setProfile({...profile, bio: e.target.value})} placeholder="Tell clients what you do..." />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select value={profile.category || ''} onChange={e => setProfile({...profile, category: e.target.value})}>
                <option value="">Select category</option>
                <option>Business & Strategy</option>
                <option>Marketing & Growth</option>
                <option>Content Creation</option>
                <option>Fitness & Wellness</option>
                <option>Finance & Investment</option>
                <option>Career & Personal Dev</option>
                <option>Tech & Product</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Page URL</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--ink2)', whiteSpace: 'nowrap' }}>autodm.co/</span>
                <input value={profile.page_slug || ''} onChange={e => setProfile({...profile, page_slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})} placeholder="yourname" />
              </div>
            </div>
            <button type="submit" className="btn btn-violet" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
              {saving ? 'Saving...' : 'Save Profile ✓'}
            </button>
          </form>
        </div>

        {/* Availability */}
        <div className="card">
          <div className="card-head"><div className="card-title">📅 Availability</div></div>
          <div style={{ padding: '20px' }}>
            <p style={{ fontSize: '13px', color: 'var(--ink2)', marginBottom: '16px' }}>Select which days and hours you're available for bookings</p>

            {DAYS.map((day, index) => {
              const avail = availability.find(a => a.day_of_week === index);
              const isActive = !!avail;
              return (
                <div key={index} style={{ marginBottom: '10px', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: `1px solid ${isActive ? 'rgba(139,92,246,0.2)' : 'var(--border)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: isActive ? '10px' : '0' }}>
                    <button className={`tog ${isActive ? 'on' : 'off'}`} onClick={() => toggleDay(index)}></button>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: isActive ? 'var(--ink)' : 'var(--ink2)' }}>{day}</span>
                  </div>
                  {isActive && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input type="time" value={avail.start_time} onChange={e => updateDayTime(index, 'start_time', e.target.value)} style={{ flex: 1 }} />
                      <span style={{ color: 'var(--ink3)', fontSize: '13px' }}>to</span>
                      <input type="time" value={avail.end_time} onChange={e => updateDayTime(index, 'end_time', e.target.value)} style={{ flex: 1 }} />
                    </div>
                  )}
                </div>
              );
            })}

            <button className="btn btn-violet" onClick={handleSaveAvailability} disabled={savingAvail} style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
              {savingAvail ? 'Saving...' : 'Save Availability ✓'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}