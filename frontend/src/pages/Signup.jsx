import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Signup() {
  const [form, setForm] = useState({ name:'', email:'', password:'', page_slug:'' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await axios.post('https://autodm-backend-u93h.onrender.com/api/auth/signup', form);
      loginUser(res.data.token, res.data.creator);
      toast.success('Account created! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed');
    } finally { setLoading(false); }
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9]/g,'');
    setForm({...form, name, page_slug: slug});
  };

  return (
    <div className="auth-wrap">
      <div style={{position:'fixed',top:'-150px',left:'-150px',width:'600px',height:'600px',borderRadius:'50%',background:'rgba(124,106,247,0.06)',filter:'blur(100px)',pointerEvents:'none',zIndex:0}}/>
      <div style={{position:'fixed',bottom:'-100px',right:'-100px',width:'400px',height:'400px',borderRadius:'50%',background:'rgba(240,98,146,0.05)',filter:'blur(100px)',pointerEvents:'none',zIndex:0}}/>

      <div className="auth-card">
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'36px'}}>
          <div className="brand-gem">⚡</div>
          <div style={{fontWeight:800,fontSize:'20px',letterSpacing:'-0.5px'}}>Auto<span style={{color:'var(--v2)'}}>DM</span></div>
        </div>

        <div style={{marginBottom:'30px'}}>
          <h1 style={{fontSize:'26px',fontWeight:800,letterSpacing:'-0.5px',marginBottom:'6px'}}>Create your account</h1>
          <p style={{color:'var(--ink2)',fontSize:'14px'}}>Start accepting paid consultations in minutes</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" placeholder="Naman Dawar" value={form.name} onChange={handleNameChange} required/>
          </div>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" placeholder="Min 8 characters" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required minLength={8}/>
          </div>
          <div className="form-group" style={{marginBottom:'24px'}}>
            <label className="form-label">Your booking page URL</label>
            <div style={{display:'flex',alignItems:'center',gap:'0'}}>
              <span style={{background:'var(--s3)',border:'1px solid var(--border2)',borderRight:'none',borderRadius:'var(--r) 0 0 var(--r)',padding:'11px 14px',fontSize:'13.5px',color:'var(--ink3)',whiteSpace:'nowrap',flexShrink:0}}>autodm.co/</span>
              <input placeholder="yourname" value={form.page_slug} onChange={e=>setForm({...form,page_slug:e.target.value.toLowerCase().replace(/[^a-z0-9]/g,'')})} required style={{borderRadius:'0 var(--r) var(--r) 0',borderLeft:'none'}}/>
            </div>
            {form.page_slug && <div style={{fontSize:'12px',color:'var(--v2)',marginTop:'6px',fontWeight:500}}>✓ Your page: autodm.co/{form.page_slug}</div>}
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{width:'100%',opacity:loading?0.7:1}}>
            {loading ? '⏳ Creating account...' : 'Create Account →'}
          </button>
        </form>

        <div style={{margin:'24px 0',display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{flex:1,height:'1px',background:'var(--border)'}}/>
          <span style={{fontSize:'12px',color:'var(--ink3)',fontWeight:500}}>Already have an account?</span>
          <div style={{flex:1,height:'1px',background:'var(--border)'}}/>
        </div>

        <Link to="/login" className="btn btn-ghost" style={{width:'100%',justifyContent:'center'}}>Sign in instead</Link>
      </div>
    </div>
  );
}
