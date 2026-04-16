import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getBookingStats, getUpcomingBookings, getGoogleStatus, connectGoogle } from '../api';

export default function Dashboard() {
  const { creator } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      getBookingStats(),
      getUpcomingBookings(),
      getGoogleStatus(),
    ]).then(([s, u, g]) => {
      setStats(s.data);
      setUpcoming(u.data);
      setGoogleConnected(g.data.connected);
    }).catch(console.error).finally(() => setLoading(false));

    // Handle OAuth callback result
    if (searchParams.get('google_connected') === 'true') {
      setGoogleConnected(true);
      navigate('/dashboard', { replace: true });
    }
  }, []);

  const handleConnectGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { data } = await connectGoogle();
      window.location.href = data.url;
    } catch {
      setGoogleLoading(false);
    }
  };

  const fmt = (d) => new Date(d).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short', timeZone:'Asia/Kolkata' });
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Layout>
      {/* Header */}
      <div className="page-header fade-up">
        <div>
          <div className="page-title">{greet}, <span className="page-title-accent">{creator?.name?.split(' ')[0]} 👋</span></div>
          <div className="page-sub">Here's your consultation business overview</div>
        </div>
        <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
          <span className="badge badge-live">Live</span>
          <button className="btn btn-primary" onClick={()=>navigate('/services')}>+ New Service</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid sg-4 fade-up d1">
        <div className="stat-card">
          <div className="stat-glow" style={{background:'var(--amber)'}}/>
          <div className="stat-label">Revenue This Month</div>
          <div className="stat-value" style={{color:'var(--amber)'}}>₹{loading?'—':Number(stats?.monthly_revenue||0).toLocaleString('en-IN')}</div>
          <div className="stat-delta delta-up">↑ Consultation income</div>
        </div>
        <div className="stat-card">
          <div className="stat-glow" style={{background:'var(--v)'}}/>
          <div className="stat-label">Total Bookings</div>
          <div className="stat-value" style={{color:'var(--v2)'}}>{loading?'—':stats?.total_confirmed||0}</div>
          <div className="stat-delta delta-up">↑ All time</div>
        </div>
        <div className="stat-card">
          <div className="stat-glow" style={{background:'var(--lime)'}}/>
          <div className="stat-label">Upcoming Sessions</div>
          <div className="stat-value" style={{color:'var(--lime)'}}>{loading?'—':stats?.upcoming||0}</div>
          <div className="stat-delta delta-neutral">Scheduled ahead</div>
        </div>
        <div className="stat-card">
          <div className="stat-glow" style={{background:'var(--teal)'}}/>
          <div className="stat-label">Today's Sessions</div>
          <div className="stat-value" style={{color:'var(--teal)'}}>{loading?'—':stats?.today||0}</div>
          <div className="stat-delta delta-neutral">Booked today</div>
        </div>
      </div>

      {/* Upcoming */}
      <div className="card fade-up d2">
        <div className="card-head">
          <div>
            <div className="card-title">Upcoming Sessions</div>
            <div style={{fontSize:'12px',color:'var(--ink2)',marginTop:'2px'}}>Your next scheduled consultations</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/bookings')}>View all →</button>
        </div>

        {loading ? (
          <div className="empty"><div className="empty-icon">⏳</div><div className="empty-title">Loading...</div></div>
        ) : upcoming.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📭</div>
            <div className="empty-title">No upcoming sessions</div>
            <div className="empty-sub">Create a service and share your page to start getting bookings</div>
            <button className="btn btn-primary btn-sm" style={{marginTop:'8px'}} onClick={()=>navigate('/services')}>Create your first service →</button>
          </div>
        ) : upcoming.map(b => (
          <div key={b.id} className="list-row">
            <div style={{width:'40px',height:'40px',borderRadius:'50%',background:'linear-gradient(135deg,var(--v),var(--rose))',display:'grid',placeItems:'center',fontWeight:700,fontSize:'13px',flexShrink:0,boxShadow:'0 0 12px rgba(124,106,247,0.3)'}}>
              {b.client_name?.split(' ').map(n=>n[0]).join('').toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:'14px'}}>{b.client_name}</div>
              <div style={{fontSize:'12px',color:'var(--ink2)',marginTop:'2px'}}>{b.service_title}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:'13px',fontWeight:600}}>{fmt(b.slot_start)}</div>
              <div style={{fontSize:'11px',color:'var(--ink2)',marginTop:'2px'}}>{b.duration_minutes} min · ₹{Number(b.amount).toLocaleString('en-IN')}</div>
            </div>
            {b.meet_link && <a href={b.meet_link} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">🎥 Join</a>}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="fade-up d3" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'16px',marginTop:'20px'}}>
        {[
          {icon:'◈',title:'My Services',sub:'Create & manage consultation offerings',action:()=>navigate('/services'),color:'var(--v)'},
          {icon:'⊙',title:'Bookings',sub:'View all upcoming and past sessions',action:()=>navigate('/bookings'),color:'var(--teal)'},
          {icon:'⊕',title:'My Page',sub:`Share autodm.co/${creator?.page_slug}`,action:()=>navigate('/my-page'),color:'var(--rose)'},
        ].map(({icon,title,sub,action,color})=>(
          <div key={title} className="card" style={{padding:'22px',cursor:'pointer',transition:'transform 0.2s,border-color 0.2s'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.borderColor='var(--border2)';}} onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.borderColor='var(--border)';}} onClick={action}>
            <div style={{fontSize:'24px',marginBottom:'12px',color}}>{icon}</div>
            <div style={{fontWeight:700,fontSize:'15px',marginBottom:'5px'}}>{title}</div>
            <div style={{fontSize:'13px',color:'var(--ink2)',lineHeight:1.5}}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Google Calendar connect */}
      <div className="card fade-up d4" style={{marginTop:'20px',padding:'22px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <div style={{width:'44px',height:'44px',borderRadius:'12px',background:'linear-gradient(135deg,#4285F4,#34A853)',display:'grid',placeItems:'center',fontSize:'22px',flexShrink:0}}>
            📅
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:'15px',marginBottom:'3px'}}>Google Calendar & Meet</div>
            <div style={{fontSize:'13px',color:'var(--ink2)'}}>
              {googleConnected === null ? 'Checking...' : googleConnected
                ? 'Connected — every booking automatically gets a unique Google Meet link'
                : 'Connect to auto-generate a Google Meet link for every booking'}
            </div>
          </div>
        </div>
        {googleConnected === false && (
          <button
            className="btn btn-primary"
            style={{flexShrink:0,whiteSpace:'nowrap'}}
            onClick={handleConnectGoogle}
            disabled={googleLoading}
          >
            {googleLoading ? 'Redirecting...' : 'Connect Google'}
          </button>
        )}
        {googleConnected === true && (
          <span style={{flexShrink:0,color:'var(--lime)',fontWeight:600,fontSize:'13px',display:'flex',alignItems:'center',gap:'6px'}}>
            ✓ Connected
          </span>
        )}
      </div>
    </Layout>
  );
}
