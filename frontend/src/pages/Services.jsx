import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = 'https://autodm-backend-u93h.onrender.com/api';
const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const EMPTY = { title:'', description:'', duration_minutes:30, price:'', video_platform:'google_meet', max_per_day:3 };
const emojis = { 15:'⚡', 30:'💼', 45:'🎯', 60:'🚀', 90:'🌟' };
const colors = { 15:'var(--teal)', 30:'var(--v2)', 45:'var(--rose)', 60:'var(--amber)', 90:'var(--lime)' };

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    try { const r = await axios.get(`${API}/services`, { headers: hdrs() }); setServices(r.data); }
    catch { toast.error('Failed to load'); } finally { setLoading(false); }
  };

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (s) => { setEditing(s); setForm(s); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) {
        const r = await axios.put(`${API}/services/${editing.id}`, form, { headers: hdrs() });
        setServices(services.map(s => s.id===editing.id ? r.data : s));
        toast.success('Service updated ✓');
      } else {
        const r = await axios.post(`${API}/services`, form, { headers: hdrs() });
        setServices([...services, r.data]);
        toast.success('Service created! 🎯');
      }
      setModal(false);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this service? This cannot be undone.')) return;
    try {
      await axios.delete(`${API}/services/${id}`, { headers: hdrs() });
      setServices(services.filter(s => s.id!==id));
      toast.success('Service deleted'); setModal(false);
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggle = async (id) => {
    try {
      const r = await axios.patch(`${API}/services/${id}/toggle`, {}, { headers: hdrs() });
      setServices(services.map(s => s.id===id ? r.data : s));
    } catch { toast.error('Failed'); }
  };

  return (
    <Layout>
      <div className="page-header fade-up">
        <div>
          <div className="page-title">My <span className="page-title-accent">Services</span></div>
          <div className="page-sub">Create consultation offerings that clients can discover and book</div>
        </div>
        <button className="btn btn-rose" onClick={openCreate}>+ Create Service</button>
      </div>

      {loading ? (
        <div className="card"><div className="empty"><div className="empty-icon">⏳</div><div className="empty-title">Loading services...</div></div></div>
      ) : (
        <div className="fade-up d1" style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'16px'}}>
          {services.map(s => (
            <div key={s.id} className="svc-card">
              <div className="svc-body">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div className="svc-emoji">{emojis[s.duration_minutes]||'🎯'}</div>
                  <button className={`tog ${s.is_active?'on':'off'}`} onClick={()=>handleToggle(s.id)}/>
                </div>
                <div className="svc-title">{s.title}</div>
                <div className="svc-desc">{s.description}</div>
                <div className="svc-tags">
                  <span className="svc-tag" style={{background:`${colors[s.duration_minutes]}18`,color:colors[s.duration_minutes]||'var(--v2)'}}>⏱ {s.duration_minutes} min</span>
                  <span className="svc-tag" style={{background:'rgba(38,198,218,0.1)',color:'var(--teal)'}}>🎥 {s.video_platform==='google_meet'?'Meet':s.video_platform}</span>
                  <span className="svc-tag" style={{background:s.is_active?'rgba(156,204,101,0.1)':'rgba(255,255,255,0.05)',color:s.is_active?'var(--lime)':'var(--ink3)'}}>{s.is_active?'● Active':'○ Paused'}</span>
                </div>
              </div>
              <div className="svc-foot">
                <div className="svc-price" style={{color:colors[s.duration_minutes]||'var(--v2)'}}>₹{Number(s.price).toLocaleString('en-IN')} <small>/ session</small></div>
                <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(s)}>Edit →</button>
              </div>
            </div>
          ))}

          {/* Add new */}
          <div onClick={openCreate} style={{border:'2px dashed var(--border2)',borderRadius:'var(--r-lg)',display:'flex',alignItems:'center',justifyContent:'center',minHeight:'220px',cursor:'pointer',transition:'all 0.2s',background:'transparent'}} onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(124,106,247,0.4)';e.currentTarget.style.background='rgba(124,106,247,0.04)';}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.background='transparent';}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'36px',marginBottom:'12px',opacity:0.4}}>+</div>
              <div style={{fontWeight:700,fontSize:'15px',marginBottom:'4px'}}>Add New Service</div>
              <div style={{fontSize:'13px',color:'var(--ink2)'}}>Coaching, reviews, workshops…</div>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal-box">
            <button className="modal-close" onClick={()=>setModal(false)}>✕</button>
            <div className="modal-title">{editing?'Edit Service':'New Service'}</div>
            <div className="modal-sub">{editing?'Update your service details':'Set up a new consultation offering'}</div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Service Title</label>
                <input placeholder="e.g. 30-min Business Review" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows={3} placeholder="What will clients get from this session?" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{resize:'none'}}/>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <select value={form.duration_minutes} onChange={e=>setForm({...form,duration_minutes:Number(e.target.value)})}>
                    {[15,30,45,60,90].map(d=><option key={d} value={d}>{d} minutes</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Price (₹)</label>
                  <input type="number" placeholder="999" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required min={1}/>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Video Platform</label>
                  <select value={form.video_platform} onChange={e=>setForm({...form,video_platform:e.target.value})}>
                    <option value="google_meet">Google Meet</option>
                    <option value="zoom">Zoom</option>
                    <option value="phone">Phone Call</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Max per day</label>
                  <select value={form.max_per_day} onChange={e=>setForm({...form,max_per_day:Number(e.target.value)})}>
                    {[1,2,3,4,5,10].map(n=><option key={n} value={n}>{n} sessions</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:'flex',gap:'10px',marginTop:'6px'}}>
                {editing && <button type="button" className="btn btn-danger btn-sm" onClick={()=>handleDelete(editing.id)}>Delete</button>}
                <button type="button" className="btn btn-ghost" style={{flex:1}} onClick={()=>setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{flex:2}} disabled={saving}>{saving?'Saving...':editing?'Save Changes':'Create Service'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
