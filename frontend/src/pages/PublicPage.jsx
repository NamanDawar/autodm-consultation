import { loadRazorpay } from "../utils/razorpay.js";
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = 'https://autodm-backend-u93h.onrender.com/api';
const emojis = { 15:'⚡', 30:'💼', 45:'🎯', 60:'🚀', 90:'🌟' };
const colors = { 15:'var(--teal)', 30:'var(--v2)', 45:'var(--rose)', 60:'var(--amber)', 90:'var(--lime)' };

const steps = ['Choose Service','Pick a Slot','Your Details','Confirm & Pay'];

export default function PublicPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState(0);
  const [service, setService] = useState(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slot, setSlot] = useState(null);
  const [client, setClient] = useState({ name:'', email:'', phone:'' });
  const [booking, setBooking] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    axios.get(`${API}/public/${slug}`)
      .then(r => setData(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const loadSlots = async (d) => {
    if (!service || !d) return;
    setSlotsLoading(true);
    try {
      const r = await axios.get(`${API}/calendar/slots/${data.creator.id}/${service.id}/${d}`);
      setSlots(r.data.slots);
    } catch { toast.error('Failed to load slots'); }
    finally { setSlotsLoading(false); }
  };

  const handleDateChange = (d) => { setDate(d); setSlot(null); loadSlots(d); };

  const handlePay = async () => {
    if (!client.name || !client.email) { toast.error('Please fill name and email'); return; }
    setPaying(true);
    try {
      const orderRes = await axios.post(`${API}/payments/create-order`, {
        service_id: service.id, client_name: client.name,
        client_email: client.email, client_phone: client.phone,
        slot_start: slot.start, slot_end: slot.end,
      });
      const { order_id, amount, booking_id, key_id } = orderRes.data;
      const rzp = new window.Razorpay({
        key: key_id, amount, currency: 'INR',
        name: data.creator.name, description: service.title, order_id,
        handler: async (res) => {
          try {
            const vr = await axios.post(`${API}/payments/verify`, {
              razorpay_order_id: res.razorpay_order_id,
              razorpay_payment_id: res.razorpay_payment_id,
              razorpay_signature: res.razorpay_signature,
              booking_id,
            });
            setBooking(vr.data.booking);
            setStep(4);
            toast.success('Booking confirmed! 🎉');
          } catch { toast.error('Payment verification failed'); }
        },
        prefill: { name: client.name, email: client.email, contact: client.phone },
        theme: { color: '#7c6af7' },
      });
      rzp.open();
    } catch (err) { toast.error(err.response?.data?.error || 'Payment failed'); }
    finally { setPaying(false); }
  };

  const today = new Date().toISOString().split('T')[0];
  const fmt = (d) => new Date(d).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short', timeZone:'Asia/Kolkata' });

  if (loading) return (
    <div style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'var(--bg)'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'40px',marginBottom:'12px'}}>⚡</div>
        <div style={{color:'var(--ink2)',fontSize:'14px'}}>Loading page...</div>
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'var(--bg)'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'56px',marginBottom:'16px'}}>404</div>
        <div style={{fontWeight:800,fontSize:'22px',marginBottom:'8px'}}>Page not found</div>
        <div style={{color:'var(--ink2)',fontSize:'14px'}}>This creator page doesn't exist</div>
      </div>
    </div>
  );

  const { creator, services } = data;

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',position:'relative'}}>
      {/* Orbs */}
      <div style={{position:'fixed',top:'-150px',left:'-150px',width:'500px',height:'500px',borderRadius:'50%',background:'rgba(124,106,247,0.06)',filter:'blur(100px)',pointerEvents:'none',zIndex:0}}/>
      <div style={{position:'fixed',bottom:'-100px',right:'-100px',width:'400px',height:'400px',borderRadius:'50%',background:'rgba(240,98,146,0.05)',filter:'blur(100px)',pointerEvents:'none',zIndex:0}}/>

      <div className="pub-wrap" style={{position:'relative',zIndex:1}}>

        {/* Creator profile */}
        <div className="fade-up" style={{textAlign:'center',marginBottom:'36px'}}>
          <div className="pub-avatar">
            {creator.name?.split(' ').map(n=>n[0]).join('').toUpperCase()}
          </div>
          <h1 style={{fontWeight:800,fontSize:'26px',letterSpacing:'-0.5px',marginBottom:'8px'}}>{creator.name}</h1>
          {creator.bio && <p style={{fontSize:'14px',color:'var(--ink2)',lineHeight:1.65,maxWidth:'380px',margin:'0 auto 14px'}}>{creator.bio}</p>}
          {creator.category && (
            <span style={{fontSize:'12px',fontWeight:600,padding:'5px 14px',borderRadius:'20px',background:'rgba(124,106,247,0.1)',border:'1px solid rgba(124,106,247,0.2)',color:'var(--v3)'}}>
              {creator.category}
            </span>
          )}
        </div>

        {/* Step indicator (steps 0-3) */}
        {step < 4 && step > 0 && (
          <div className="fade-up" style={{display:'flex',alignItems:'center',marginBottom:'28px'}}>
            {steps.map((s,i) => (
              <div key={i} style={{display:'flex',alignItems:'center',flex:i<steps.length-1?1:'auto'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <div style={{width:'28px',height:'28px',borderRadius:'50%',display:'grid',placeItems:'center',fontSize:'12px',fontWeight:700,flexShrink:0,background:i<step?'var(--v)':i===step?'transparent':'var(--s2)',border:i===step?'2px solid var(--v)':'none',color:i<step?'#fff':i===step?'var(--v2)':'var(--ink3)',boxShadow:i<step?'0 0 12px rgba(124,106,247,0.4)':'none',transition:'all 0.3s'}}>
                    {i<step?'✓':i+1}
                  </div>
                  <span style={{fontSize:'12px',fontWeight:600,color:i===step?'var(--ink)':i<step?'var(--ink2)':'var(--ink3)',display:i===0||i===steps.length-1?'none':'block',whiteSpace:'nowrap'}}>{s}</span>
                </div>
                {i<steps.length-1 && <div style={{flex:1,height:'1px',background:'var(--border)',margin:'0 10px'}}/>}
              </div>
            ))}
          </div>
        )}

        {/* STEP 0: Services */}
        {step===0 && (
          <div className="fade-up d1">
            <div style={{fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'1.2px',color:'var(--ink3)',marginBottom:'16px'}}>Available Sessions</div>
            {services.length===0 ? (
              <div className="card"><div className="empty"><div className="empty-icon">🔧</div><div className="empty-title">No services yet</div><div className="empty-sub">This creator hasn't added any services yet</div></div></div>
            ) : services.map(s => (
              <div key={s.id} className="service-card-pub" onClick={()=>{setService(s);setStep(1);}}>
                <div style={{fontSize:'32px',flexShrink:0}}>{emojis[s.duration_minutes]||'🎯'}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:'16px',letterSpacing:'-0.2px',marginBottom:'4px'}}>{s.title}</div>
                  {s.description && <div style={{fontSize:'13px',color:'var(--ink2)',marginBottom:'10px',lineHeight:1.5}}>{s.description}</div>}
                  <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                    <span style={{fontSize:'11.5px',fontWeight:600,padding:'3px 10px',borderRadius:'20px',background:`${colors[s.duration_minutes]||'var(--v)'}18`,color:colors[s.duration_minutes]||'var(--v2)'}}>⏱ {s.duration_minutes} min</span>
                    <span style={{fontSize:'11.5px',fontWeight:600,padding:'3px 10px',borderRadius:'20px',background:'rgba(38,198,218,0.1)',color:'var(--teal)'}}>🎥 {s.video_platform==='google_meet'?'Google Meet':s.video_platform}</span>
                  </div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{fontWeight:800,fontSize:'22px',letterSpacing:'-0.5px',color:colors[s.duration_minutes]||'var(--v2)'}}>₹{Number(s.price).toLocaleString('en-IN')}</div>
                  <div style={{fontSize:'12px',color:'var(--ink3)',marginTop:'2px'}}>per session</div>
                  <div style={{fontSize:'12px',color:'var(--v2)',marginTop:'8px',fontWeight:600}}>Book now →</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 1: Pick date & slot */}
        {step===1 && (
          <div className="fade-up">
            <button onClick={()=>{setStep(0);setDate('');setSlots([]);setSlot(null);}} style={{background:'none',color:'var(--ink2)',fontSize:'13px',marginBottom:'20px',display:'flex',alignItems:'center',gap:'6px',padding:0}}>← Back to services</button>

            <div className="card" style={{padding:'26px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'22px',paddingBottom:'18px',borderBottom:'1px solid var(--border)'}}>
                <div style={{fontSize:'28px'}}>{emojis[service?.duration_minutes]||'🎯'}</div>
                <div>
                  <div style={{fontWeight:700,fontSize:'16px'}}>{service?.title}</div>
                  <div style={{fontSize:'13px',color:'var(--ink2)',marginTop:'2px'}}>₹{Number(service?.price).toLocaleString('en-IN')} · {service?.duration_minutes} min · Google Meet</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Select a date</label>
                <input type="date" min={today} value={date} onChange={e=>handleDateChange(e.target.value)} style={{fontSize:'14px'}}/>
              </div>

              {date && (
                <div style={{marginTop:'22px'}}>
                  <label className="form-label" style={{marginBottom:'12px',display:'block'}}>Available time slots</label>
                  {slotsLoading ? (
                    <div style={{textAlign:'center',padding:'24px',color:'var(--ink2)',fontSize:'13px'}}>⏳ Loading slots...</div>
                  ) : slots.length===0 ? (
                    <div style={{textAlign:'center',padding:'24px',background:'var(--s2)',borderRadius:'var(--r)',color:'var(--ink2)',fontSize:'13px'}}>
                      No slots available on this date. Please try a different day.
                    </div>
                  ) : (
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
                      {slots.map((s,i) => (
                        <button key={i} className={`slot-btn ${slot?.start===s.start?'selected':''}`} onClick={()=>setSlot(s)}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {slot && (
                <button className="btn btn-primary btn-lg" onClick={()=>setStep(2)} style={{width:'100%',marginTop:'24px'}}>
                  Continue with {slot.label} →
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Client details */}
        {step===2 && (
          <div className="fade-up">
            <button onClick={()=>setStep(1)} style={{background:'none',color:'var(--ink2)',fontSize:'13px',marginBottom:'20px',display:'flex',alignItems:'center',gap:'6px',padding:0}}>← Back</button>

            <div className="card" style={{padding:'26px'}}>
              <h2 style={{fontWeight:800,fontSize:'20px',letterSpacing:'-0.3px',marginBottom:'6px'}}>Your Details</h2>
              <p style={{fontSize:'13.5px',color:'var(--ink2)',marginBottom:'22px'}}>We'll send your booking confirmation and meeting link here</p>

              {/* Summary */}
              <div className="booking-summary">
                <div style={{fontSize:'12px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',color:'var(--v3)',marginBottom:'12px'}}>Booking Summary</div>
                <div className="bs-row"><span className="bs-label">Session</span><span className="bs-value">{service?.title}</span></div>
                <div className="bs-row"><span className="bs-label">Date & Time</span><span className="bs-value">{fmt(slot?.start)}</span></div>
                <div className="bs-row"><span className="bs-label">Duration</span><span className="bs-value">{service?.duration_minutes} minutes</span></div>
                <div style={{height:'1px',background:'rgba(124,106,247,0.2)',margin:'10px 0'}}/>
                <div className="bs-row"><span className="bs-label">Total</span><span className="bs-value" style={{fontSize:'18px',fontWeight:800,color:'var(--v2)'}}>₹{Number(service?.price).toLocaleString('en-IN')}</span></div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input placeholder="Your full name" value={client.name} onChange={e=>setClient({...client,name:e.target.value})}/>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input type="email" placeholder="your@email.com" value={client.email} onChange={e=>setClient({...client,email:e.target.value})}/>
              </div>
              <div className="form-group" style={{marginBottom:'24px'}}>
                <label className="form-label">Phone Number <span style={{fontWeight:400,textTransform:'none',letterSpacing:0}}>(optional)</span></label>
                <input type="tel" placeholder="+91 98765 43210" value={client.phone} onChange={e=>setClient({...client,phone:e.target.value})}/>
              </div>

              <button className="btn btn-primary btn-lg" onClick={handlePay} disabled={paying} style={{width:'100%',opacity:paying?0.7:1}}>
                {paying ? '⏳ Processing...' : `Pay ₹${Number(service?.price).toLocaleString('en-IN')} →`}
              </button>
              <div style={{textAlign:'center',marginTop:'12px',fontSize:'12px',color:'var(--ink3)'}}>
                🔒 Secured by Razorpay · UPI, Cards, Net Banking accepted
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Success */}
        {step===4 && (
          <div className="fade-up" style={{textAlign:'center'}}>
            <div style={{fontSize:'72px',marginBottom:'20px',animation:'bounceIn 0.6s cubic-bezier(.22,.68,0,1.5) both'}}>🎉</div>
            <h2 style={{fontWeight:800,fontSize:'28px',letterSpacing:'-0.5px',marginBottom:'8px'}}>Booking Confirmed!</h2>
            <p style={{color:'var(--ink2)',fontSize:'14px',marginBottom:'28px',lineHeight:1.7,maxWidth:'340px',margin:'0 auto 28px'}}>
              Your session is booked successfully. Check your email for the confirmation and meeting link.
            </p>

            <div className="card" style={{padding:'24px',textAlign:'left',marginBottom:'20px'}}>
              <div style={{fontSize:'12px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',color:'var(--v3)',marginBottom:'16px'}}>Booking Details</div>
              {[
                ['Session',service?.title],
                ['Date & Time',booking&&fmt(booking.slot_start)],
                ['Duration',`${service?.duration_minutes} minutes`],
                ['Amount Paid',`₹${booking&&Number(booking.amount).toLocaleString('en-IN')}`],
              ].map(([label,value])=>(
                <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                  <span style={{color:'var(--ink2)',fontSize:'13.5px'}}>{label}</span>
                  <span style={{fontWeight:600,fontSize:'13.5px'}}>{value}</span>
                </div>
              ))}
              {booking?.meet_link && (
                <a href={booking.meet_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-lg" style={{width:'100%',marginTop:'20px'}}>
                  🎥 Join Google Meet
                </a>
              )}
            </div>

            <div style={{fontSize:'12px',color:'var(--ink3)',marginTop:'16px'}}>
              Powered by <span style={{color:'var(--v2)',fontWeight:600}}>AutoDM</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
