import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = 'https://autodm-backend-u93h.onrender.com/api';
const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function MyPage() {
  const { creator } = useAuth();
  const [profile, setProfile] = useState({ name:'', bio:'', category:'', page_slug:'' });
  const [avail, setAvail] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);

  useEffect(() => {
    if (!creator?.id) return;
    Promise.all([
      axios.get(`${API}/auth/me`, { headers: hdrs() }),
      axios.get(`${API}/calendar/availability/${creator.id}`)
    ]).then(([m,a]) => { setProfile(m.data); setAvail(a.data); }).catch(console.error);
  }, [creator]);

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await axios.put(`${API}/auth/profile`, profile, { headers: hdrs() }); toast.success('Profile saved ✓'); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const toggleDay = (i) => {
    const exists = avail.find(a=>a.day_of_week===i);
    if (exists) setAvail(avail.filter(a=>a.day_of_week!==i));
    else setAvail([...avail, { day_of_week:i, start_time:'10:00', end_time:'18:00' }]);
  };

  const updateTime = (i, field, val) => setAvail(avail.map(a=>a.day_of_week===i?{...a,[field]:val}:a));

  const saveAvail = async () => {
    setSavingAvail(true);
    try { await axios.post(`${API}/calendar/availability`, { availability: avail }, { headers: hdrs() }); toast.success('Availability saved ✓'); }
    catch { toast.error('Failed'); } finally { setSavingAvail(false); }
  };

  const pageUrl = `${window.location.origin}/${profile.page_slug}`;

  return (
    <Layout>
      <div className="page-header fade-up">
        <div>
          <div className="page-title">My <span className="page-title-accent">Page</span></div>
          <div className="page-sub">Customize your public booking page</div>
        </div>
        <div style={{display:'flex',gap:'10px'}}>
          <button className="btn btn-ghost" onClick={()=>{navigator.clipboard.writeText(pageUrl);toast.success('Link copied!');}}>
            Copy Link
          </button>
          <a href={`/${profile.page_slug}`} target="_blank" rel="noreferrer" className="btn btn-primary">
            Preview Page →
          </a>
        </div>
      </div>

      {/* URL banner */}
      <div className="page-url-banner fade-up d1">
        <div style={{width:'40px',height:'40px',borderRadius:'10px',background:'rgba(124,106,247,0.15)',border:'1px solid rgba(124,106,247,0.3)',display:'grid',placeItems:'center',fontSize:'18px',flexShrink:0}}>🔗</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:'14px',color:'var(--v3)'}}>Your Public Booking Page</div>
          <div style={{fontSize:'13px',color:'var(--ink2)',marginTop:'2px',fontFamily:"'DM Mono',monospace"}}>{pageUrl}</div>
        </div>
        <div style={{display:'flex',gap:'8px',flexShrink:0}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>{navigator.clipboard.writeText(pageUrl);toast.success('Copied!');}}>Copy</button>
          <a href={`/${profile.page_slug}`} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Open →</a>
        </div>
      </div>

      <div className="fade-up d2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>

        {/* Profile */}
        <div className="card">
          <div className="card-head"><div className="card-title">Profile Settings</div></div>
          <form onSubmit={saveProfile} style={{padding:'22px'}}>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input value={profile.name||''} onChange={e=>setProfile({...profile,name:e.target.value})} placeholder="Your name"/>
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea rows={3} value={profile.bio||''} onChange={e=>setProfile({...profile,bio:e.target.value})} placeholder="Tell clients what you do and how you can help them..." style={{resize:'none'}}/>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select value={profile.category||''} onChange={e=>setProfile({...profile,category:e.target.value})}>
                <option value="">Select your category</option>
                {['Business & Strategy','Marketing & Growth','Content Creation','Fitness & Wellness','Finance & Investment','Career & Personal Dev','Tech & Product'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Page URL Slug</label>
              <div style={{display:'flex',alignItems:'center'}}>
                <span style={{background:'var(--s3)',border:'1px solid var(--border2)',borderRight:'none',borderRadius:'var(--r) 0 0 var(--r)',padding:'11px 14px',fontSize:'13px',color:'var(--ink3)',whiteSpace:'nowrap',flexShrink:0}}>autodm.co/</span>
                <input value={profile.page_slug||''} onChange={e=>setProfile({...profile,page_slug:e.target.value.toLowerCase().replace(/[^a-z0-9]/g,'')})} style={{borderRadius:'0 var(--r) var(--r) 0',borderLeft:'none'}}/>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{width:'100%'}} disabled={saving}>
              {saving?'Saving...':'Save Profile ✓'}
            </button>
          </form>
        </div>

        {/* Availability */}
        <div className="card">
          <div className="card-head">
            <div className="card-title">Availability</div>
            <span style={{fontSize:'12px',color:'var(--ink2)'}}>{avail.length} days active</span>
          </div>
          <div style={{padding:'22px'}}>
            <p style={{fontSize:'13px',color:'var(--ink2)',marginBottom:'16px',lineHeight:1.5}}>Set which days and hours clients can book sessions with you.</p>
            {DAYS.map((day,i) => {
              const a = avail.find(x=>x.day_of_week===i);
              return (
                <div key={i} className={`avail-row ${a?'active':''}`}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:a?'12px':0}}>
                    <button className={`tog ${a?'on':'off'}`} onClick={()=>toggleDay(i)}/>
                    <span style={{fontSize:'14px',fontWeight:600,color:a?'var(--ink)':'var(--ink2)'}}>{day}</span>
                    {!a && <span style={{marginLeft:'auto',fontSize:'12px',color:'var(--ink3)'}}>Unavailable</span>}
                  </div>
                  {a && (
                    <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',gap:'8px'}}>
                      <input type="time" value={a.start_time} onChange={e=>updateTime(i,'start_time',e.target.value)}/>
                      <span style={{color:'var(--ink3)',fontSize:'13px',textAlign:'center'}}>to</span>
                      <input type="time" value={a.end_time} onChange={e=>updateTime(i,'end_time',e.target.value)}/>
                    </div>
                  )}
                </div>
              );
            })}
            <button className="btn btn-primary" onClick={saveAvail} disabled={savingAvail} style={{width:'100%',marginTop:'8px'}}>
              {savingAvail?'Saving...':'Save Availability ✓'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
