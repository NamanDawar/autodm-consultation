import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = 'https://autodm-backend-u93h.onrender.com/api';
const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/bookings`, { headers: hdrs() }),
      axios.get(`${API}/bookings/stats/summary`, { headers: hdrs() })
    ]).then(([b,s]) => { setBookings(b.data); setStats(s.data); })
    .catch(()=>toast.error('Failed to load')).finally(()=>setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await axios.patch(`${API}/bookings/${id}/cancel`, {}, { headers: hdrs() });
      setBookings(bookings.map(b => b.id===id ? {...b,status:'cancelled'} : b));
      toast.success('Booking cancelled');
    } catch { toast.error('Failed'); }
  };

  const filtered = bookings.filter(b => {
    if (filter==='upcoming') return b.status==='confirmed' && new Date(b.slot_start)>=new Date();
    if (filter==='confirmed') return b.status==='confirmed';
    if (filter==='cancelled') return b.status==='cancelled';
    return true;
  });

  const fmt = (d) => new Date(d).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short', timeZone:'Asia/Kolkata' });

  return (
    <Layout>
      <div className="page-header fade-up">
        <div>
          <div className="page-title">My <span className="page-title-accent">Bookings</span></div>
          <div className="page-sub">All your consultation sessions in one place</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid sg-3 fade-up d1">
        <div className="stat-card">
          <div className="stat-glow" style={{background:'var(--amber)'}}/>
          <div className="stat-label">Revenue This Month</div>
          <div className="stat-value" style={{color:'var(--amber)'}}>₹{loading?'—':Number(stats?.monthly_revenue||0).toLocaleString('en-IN')}</div>
          <div className="stat-delta delta-up">↑ Consultation income</div>
        </div>
        <div className="stat-card">
          <div className="stat-glow" style={{background:'var(--v)'}}/>
          <div className="stat-label">Total Sessions</div>
          <div className="stat-value" style={{color:'var(--v2)'}}>{loading?'—':stats?.total_confirmed||0}</div>
          <div className="stat-delta delta-up">All time</div>
        </div>
        <div className="stat-card">
          <div className="stat-glow" style={{background:'var(--lime)'}}/>
          <div className="stat-label">Upcoming</div>
          <div className="stat-value" style={{color:'var(--lime)'}}>{loading?'—':stats?.upcoming||0}</div>
          <div className="stat-delta delta-neutral">Scheduled ahead</div>
        </div>
      </div>

      {/* Filter */}
      <div className="fade-up d2" style={{marginBottom:'20px'}}>
        <div className="pill-tabs">
          {['all','upcoming','confirmed','cancelled'].map(f=>(
            <button key={f} className={`pt ${filter===f?'active':''}`} onClick={()=>setFilter(f)}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="card fade-up d3">
        <div className="card-head">
          <div className="card-title">Sessions</div>
          <span style={{fontSize:'13px',color:'var(--ink2)',fontWeight:500}}>{filtered.length} {filter==='all'?'total':filter}</span>
        </div>

        {loading ? (
          <div className="empty"><div className="empty-icon">⏳</div><div className="empty-title">Loading...</div></div>
        ) : filtered.length===0 ? (
          <div className="empty">
            <div className="empty-icon">📭</div>
            <div className="empty-title">No bookings yet</div>
            <div className="empty-sub">Share your public page to start receiving consultation bookings</div>
          </div>
        ) : filtered.map(b => (
          <div key={b.id} className="list-row">
            <div style={{width:'42px',height:'42px',borderRadius:'50%',background:'linear-gradient(135deg,var(--v),var(--rose))',display:'grid',placeItems:'center',fontWeight:700,fontSize:'13px',flexShrink:0}}>
              {b.client_name?.split(' ').map(n=>n[0]).join('').toUpperCase()}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:'14px'}}>{b.client_name}</div>
              <div style={{fontSize:'12px',color:'var(--ink2)',marginTop:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.service_title} · {b.client_email}</div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontSize:'13px',fontWeight:600}}>{fmt(b.slot_start)}</div>
              <div style={{fontSize:'11px',color:'var(--ink2)',marginTop:'2px'}}>{b.duration_minutes} min</div>
            </div>
            <div style={{fontWeight:800,fontSize:'15px',color:'var(--amber)',flexShrink:0,minWidth:'60px',textAlign:'right'}}>₹{Number(b.amount).toLocaleString('en-IN')}</div>
            <span className={`badge badge-${b.status}`}>{b.status}</span>
            {b.meet_link && b.status==='confirmed' && (
              <a href={b.meet_link} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">🎥 Join</a>
            )}
            {b.status==='confirmed' && (
              <button className="btn btn-danger btn-sm" onClick={()=>handleCancel(b.id)}>Cancel</button>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}
