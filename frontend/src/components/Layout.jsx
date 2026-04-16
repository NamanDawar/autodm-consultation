import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { creator, logoutUser } = useAuth();
  const navigate = useNavigate();
  const initials = creator?.name?.split(' ').map(n=>n[0]).join('').toUpperCase() || 'ND';

  return (
    <div className="shell">
      <aside className="sidebar">
        {/* Brand */}
        <div className="brand">
          <div className="brand-gem">⚡</div>
          <div style={{fontWeight:800,fontSize:'18px',letterSpacing:'-0.5px'}}>Auto<span style={{color:'var(--v2)'}}>DM</span></div>
        </div>

        <nav className="nav">
          <div className="nav-section-label"><span>Overview</span><div className="nav-section-line"/></div>
          <NavLink to="/dashboard" className={({isActive})=>`nav-link ${isActive?'active':''}`}>
            <span className="nav-icon">⊞</span> Dashboard
          </NavLink>

          <div className="nav-section-label" style={{marginTop:'8px'}}><span>Instagram DMs</span><div className="nav-section-line"/></div>
          <NavLink to="/automations" className={({isActive})=>`nav-link ${isActive?'active':''}`}>
            <span className="nav-icon">⚡</span> Automations
          </NavLink>

          <div className="nav-section-label" style={{marginTop:'8px'}}><span>1:1 Consultation</span><div className="nav-section-line"/></div>
          <NavLink to="/services" className={({isActive})=>`nav-link ${isActive?'active':''}`}>
            <span className="nav-icon">✦</span> My Services
          </NavLink>
          <NavLink to="/bookings" className={({isActive})=>`nav-link ${isActive?'active':''}`}>
            <span className="nav-icon">◈</span> Bookings
          </NavLink>
          <NavLink to="/my-page" className={({isActive})=>`nav-link ${isActive?'active':''}`}>
            <span className="nav-icon">⊕</span> My Page
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-card" onClick={()=>{logoutUser();navigate('/login');}} title="Click to logout">
            <div className="av">{initials}</div>
            <div style={{flex:1,minWidth:0}}>
              <div className="pname" style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{creator?.name}</div>
              <div className="phandle">autodm.co/{creator?.page_slug}</div>
            </div>
            <div className="online-badge">
              <div className="online-dot"/>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="page-wrap">
          {children}
        </div>
      </main>
    </div>
  );
}
