import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getServices, createService, updateService, deleteService, toggleService } from '../api/index.js';
import toast from 'react-hot-toast';

const EMPTY_FORM = { title: '', description: '', duration_minutes: 30, price: '', video_platform: 'google_meet', max_per_day: 3 };

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await getServices();
      setServices(res.data);
    } catch (err) {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (service) => {
    setEditing(service);
    setForm(service);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const res = await updateService(editing.id, form);
        setServices(services.map(s => s.id === editing.id ? res.data : s));
        toast.success('Service updated!');
      } else {
        const res = await createService(form);
        setServices([...services, res.data]);
        toast.success('Service created! 🎯');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this service?')) return;
    try {
      await deleteService(id);
      setServices(services.filter(s => s.id !== id));
      toast.success('Service deleted');
      setShowModal(false);
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await toggleService(id);
      setServices(services.map(s => s.id === id ? res.data : s));
    } catch (err) {
      toast.error('Failed to toggle');
    }
  };

  const durations = [15, 30, 45, 60, 90];
  const emojis = { 15: '⚡', 30: '💼', 45: '🎯', 60: '🚀', 90: '🌟' };

  return (
    <Layout>
      {/* Header */}
      <div className="rise" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font)', fontWeight: 900, fontSize: '28px', letterSpacing: '-0.8px' }}>🎯 My Services</h1>
          <p style={{ color: 'var(--ink2)', fontSize: '13.5px', marginTop: '4px' }}>Create consultation services clients can book and pay for</p>
        </div>
        <button className="btn btn-rose" onClick={openCreate}>+ New Service</button>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--ink2)' }}>Loading...</div>
      ) : (
        <div className="rise rise-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '16px' }}>
          {services.map(service => (
            <div key={service.id} className="card" style={{ transition: 'transform 0.2s, border-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-3px)'} onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>{emojis[service.duration_minutes] || '🎯'}</div>
                    <div style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '16px', marginBottom: '4px' }}>{service.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--ink2)', lineHeight: 1.5 }}>{service.description}</div>
                  </div>
                  <button
                    className={`tog ${service.is_active ? 'on' : 'off'}`}
                    onClick={() => handleToggle(service.id)}
                    style={{ marginTop: '4px' }}
                  ></button>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: 'rgba(139,92,246,0.1)', color: 'var(--violet-light)' }}>⏱ {service.duration_minutes} min</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: 'rgba(0,212,255,0.08)', color: '#67e8f9' }}>🎥 {service.video_platform === 'google_meet' ? 'Google Meet' : service.video_platform}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: service.is_active ? 'rgba(163,230,53,0.08)' : 'rgba(255,255,255,0.04)', color: service.is_active ? 'var(--lime)' : 'var(--ink3)' }}>{service.is_active ? '✓ Active' : '⏸ Paused'}</span>
                </div>
              </div>
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: 'var(--font)', fontWeight: 900, fontSize: '22px', color: 'var(--violet)' }}>₹{Number(service.price).toLocaleString('en-IN')} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink2)' }}>/ session</span></div>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(service)}>Edit</button>
              </div>
            </div>
          ))}

          {/* Add new card */}
          <div
            className="card"
            style={{ border: '1px dashed var(--border2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', opacity: 0.5, transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
            onClick={openCreate}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>+</div>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>Add New Service</div>
              <div style={{ fontSize: '12px', color: 'var(--ink2)', marginTop: '4px' }}>Coaching, workshops, reviews…</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', zIndex: 500, display: 'grid', placeItems: 'center' }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="rise" style={{ background: 'var(--panel)', border: '1px solid var(--border2)', borderRadius: '20px', padding: '32px', width: '480px', maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <h2 style={{ fontFamily: 'var(--font)', fontWeight: 900, fontSize: '22px', marginBottom: '4px' }}>{editing ? 'Edit Service' : 'New Service'}</h2>
            <p style={{ fontSize: '13px', color: 'var(--ink2)', marginBottom: '24px' }}>Set up what clients can book from your page</p>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', color: 'var(--ink2)', fontSize: '22px', lineHeight: 1 }}>×</button>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Service Title</label>
                <input placeholder="e.g. 30-min Business Review" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows={3} placeholder="What will clients get from this session?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <select value={form.duration_minutes} onChange={e => setForm({...form, duration_minutes: Number(e.target.value)})}>
                    {durations.map(d => <option key={d} value={d}>{d} minutes</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Price (₹)</label>
                  <input type="number" placeholder="999" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required min={1} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Video Platform</label>
                  <select value={form.video_platform} onChange={e => setForm({...form, video_platform: e.target.value})}>
                    <option value="google_meet">Google Meet</option>
                    <option value="zoom">Zoom</option>
                    <option value="phone">Phone Call</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Max per day</label>
                  <select value={form.max_per_day} onChange={e => setForm({...form, max_per_day: Number(e.target.value)})}>
                    {[1,2,3,4,5,10].map(n => <option key={n} value={n}>{n} sessions</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                {editing && (
                  <button type="button" className="btn btn-ghost" style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }} onClick={() => handleDelete(editing.id)}>Delete</button>
                )}
                <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-rose" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Service'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}