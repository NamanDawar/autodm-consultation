import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('https://autodm-backend-u93h.onrender.com/api/auth/login', form);
      loginUser(res.data.token, res.data.creator);
      toast.success('Welcome back! 👋');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      {/* Ambient orbs */}
      <div style={{position:'fixed',top:'-150px',left:'-150px',width:'600px',height:'600px',borderRadius:'50%',background:'rgba(124,106,247,0.06)',filter:'blur(100px)',pointerEvents:'none',zIndex:0}}/>
      <div style={{position:'fixed',bottom:'-100px',right:'-100px',width:'400px',height:'400px',borderRadius:'50%',background:'rgba(240,98,146,0.05)',filter:'blur(100px)',pointerEvents:'none',zIndex:0}}/>

      <div className="auth-card">
        {/* Brand */}
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'36px'}}>
          <div className="brand-gem">⚡</div>
          <div style={{fontWeight:800,fontSize:'20px',letterSpacing:'-0.5px'}}>Auto<span style={{color:'var(--v2)'}}>DM</span></div>
        </div>

        <div style={{marginBottom:'30px'}}>
          <h1 style={{fontSize:'26px',fontWeight:800,letterSpacing:'-0.5px',marginBottom:'6px'}}>Welcome back</h1>
          <p style={{color:'var(--ink2)',fontSize:'14px'}}>Sign in to your creator workspace</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
          </div>
          <div className="form-group" style={{marginBottom:'24px'}}>
            <label className="form-label">Password</label>
            <input type="password" placeholder="Enter your password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{width:'100%',opacity:loading?0.7:1}}>
            {loading ? '⏳ Signing in...' : 'Sign in to AutoDM →'}
          </button>
        </form>

        <div style={{margin:'24px 0',display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{flex:1,height:'1px',background:'var(--border)'}}/>
          <span style={{fontSize:'12px',color:'var(--ink3)',fontWeight:500}}>New to AutoDM?</span>
          <div style={{flex:1,height:'1px',background:'var(--border)'}}/>
        </div>

        <Link to="/signup" className="btn btn-ghost" style={{width:'100%',justifyContent:'center'}}>
          Create a free account
        </Link>
      </div>
    </div>
  );
}
