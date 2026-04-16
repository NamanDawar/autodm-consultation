import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicPage, getSlots, createOrder, verifyPayment } from '../api/index.js';
import toast from 'react-hot-toast';

export default function PublicPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Booking flow state
  const [step, setStep] = useState('services'); // services → date → slot → details → payment → success
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientInfo, setClientInfo] = useState({ name: '', email: '', phone: '' });
  const [booking, setBooking] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    getPublicPage(slug)
      .then(res => setData(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const loadSlots = async (date) => {
    if (!selectedService || !date) return;
    setSlotsLoading(true);
    try {
      const res = await getSlots(data.creator.id, selectedService.id, date);
      setSlots(res.data.slots);
    } catch (err) {
      toast.error('Failed to load slots');
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    loadSlots(date);
  };

  const handlePay = async () => {
    if (!client.name || !client.email) { toast.error('Please fill name and email'); return; }
    setPaying(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { toast.error('Failed to load payment gateway'); setPaying(false); return; }

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
        modal: { ondismiss: () => { toast.error('Payment cancelled'); setPaying(false); } },
        prefill: { name: client.name, email: client.email, contact: client.phone },
        theme: { color: '#7c6af7' },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
      setPaying(false);
    }
  };

      const { order_id, amount, booking_id, key_id } = orderRes.data;

      // Open Razorpay checkout
      const options = {
        key: key_id,
        amount,
        currency: 'INR',
        name: data.creator.name,
        description: selectedService.title,
        order_id,
        handler: async (response) => {
          try {
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id,
            });
            setBooking(verifyRes.data.booking);
            setStep('success');
            toast.success('Booking confirmed! 🎉');
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: { name: clientInfo.name, email: clientInfo.email, contact: clientInfo.phone },
        theme: { color: '#8b5cf6' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  // Min date = today
  const today = new Date().toISOString().split('T')[0];

  const emojis = { 15: '⚡', 30: '💼', 45: '🎯', 60: '🚀', 90: '🌟' };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)', color: 'var(--ink)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
        <div>Loading...</div>
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)', color: 'var(--ink)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
        <h2 style={{ fontFamily: 'var(--font)', fontWeight: 900, fontSize: '24px', marginBottom: '8px' }}>Page not found</h2>
        <p style={{ color: 'var(--ink2)' }}>This creator page doesn't exist</p>
      </div>
    </div>
  );

  const { creator, services } = data;

  return (
    <>
      {/* Load Razorpay */}
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '40px 20px' }}>
        {/* Orbs */}
        <div style={{ position: 'fixed', top: '-100px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(139,92,246,0.07)', filter: 'blur(90px)', pointerEvents: 'none' }} />
        <div style={{ position: 'fixed', bottom: '0', right: '0', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(244,114,182,0.05)', filter: 'blur(90px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '480px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* Creator profile */}
          <div className="rise" style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--rose), var(--violet))', display: 'grid', placeItems: 'center', fontSize: '28px', fontWeight: 900, margin: '0 auto 14px', border: '3px solid rgba(255,255,255,0.1)' }}>
              {creator.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <h1 style={{ fontFamily: 'var(--font)', fontWeight: 900, fontSize: '24px', marginBottom: '6px' }}>{creator.name}</h1>
            {creator.bio && <p style={{ fontSize: '14px', color: 'var(--ink2)', lineHeight: 1.6, maxWidth: '360px', margin: '0 auto 12px' }}>{creator.bio}</p>}
            {creator.category && (
              <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '20px', background: 'rgba(139,92,246,0.1)', color: 'var(--violet-light)' }}>{creator.category}</span>
            )}
          </div>

          {/* STEP: Services */}
          {step === 'services' && (
            <div className="rise rise-1">
              <h2 style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '16px', marginBottom: '14px', color: 'var(--ink2)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px' }}>Choose a Session</h2>
              {services.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ink2)' }}>No services available yet</div>
              ) : (
                services.map(service => (
                  <div
                    key={service.id}
                    className="card"
                    style={{ marginBottom: '12px', cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.borderColor='rgba(139,92,246,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor='var(--border)'; }}
                    onClick={() => { setSelectedService(service); setStep('date'); }}
                  >
                    <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ fontSize: '28px', flexShrink: 0 }}>{emojis[service.duration_minutes] || '🎯'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '15px', marginBottom: '3px' }}>{service.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--ink2)', marginBottom: '6px' }}>{service.description}</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: 'rgba(139,92,246,0.1)', color: 'var(--violet-light)' }}>⏱ {service.duration_minutes} min</span>
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: 'rgba(0,212,255,0.08)', color: '#67e8f9' }}>🎥 {service.video_platform === 'google_meet' ? 'Google Meet' : service.video_platform}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--font)', fontWeight: 900, fontSize: '20px', color: 'var(--violet)' }}>₹{Number(service.price).toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '11px', color: 'var(--ink3)' }}>per session</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* STEP: Pick date */}
          {step === 'date' && (
            <div className="rise">
              <button onClick={() => setStep('services')} style={{ background: 'none', color: 'var(--ink2)', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>← Back</button>
              <div className="card" style={{ padding: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '18px', marginBottom: '6px' }}>{selectedService?.title}</h2>
                <p style={{ fontSize: '13px', color: 'var(--ink2)', marginBottom: '20px' }}>Pick a date to see available time slots</p>
                <div className="form-group">
                  <label className="form-label">Select Date</label>
                  <input type="date" min={today} value={selectedDate} onChange={e => handleDateChange(e.target.value)} />
                </div>

                {selectedDate && (
                  <div style={{ marginTop: '20px' }}>
                    <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>Available Slots</label>
                    {slotsLoading ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--ink2)' }}>Loading slots...</div>
                    ) : slots.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--ink2)', fontSize: '13px' }}>No slots available on this date. Try another day.</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {slots.map((slot, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedSlot(slot)}
                            style={{ padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: selectedSlot?.start === slot.start ? 'var(--violet)' : 'rgba(255,255,255,0.04)', border: `1px solid ${selectedSlot?.start === slot.start ? 'var(--violet)' : 'var(--border2)'}`, color: selectedSlot?.start === slot.start ? '#fff' : 'var(--ink)' }}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedSlot && (
                  <button className="btn btn-violet" onClick={() => setStep('details')} style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}>
                    Continue →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP: Client details */}
          {step === 'details' && (
            <div className="rise">
              <button onClick={() => setStep('date')} style={{ background: 'none', color: 'var(--ink2)', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>← Back</button>
              <div className="card" style={{ padding: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '18px', marginBottom: '6px' }}>Your Details</h2>
                <p style={{ fontSize: '13px', color: 'var(--ink2)', marginBottom: '20px' }}>We'll send your booking confirmation here</p>

                {/* Booking summary */}
                <div style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--violet-light)', marginBottom: '6px' }}>Booking Summary</div>
                  <div style={{ fontSize: '13px', color: 'var(--ink2)' }}>📅 {new Date(selectedSlot.start).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}</div>
                  <div style={{ fontSize: '13px', color: 'var(--ink2)', marginTop: '4px' }}>⏱ {selectedService.duration_minutes} min · {selectedService.title}</div>
                  <div style={{ fontSize: '15px', fontFamily: 'var(--font)', fontWeight: 900, color: 'var(--violet)', marginTop: '8px' }}>₹{Number(selectedService.price).toLocaleString('en-IN')}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input placeholder="Your name" value={clientInfo.name} onChange={e => setClientInfo({...clientInfo, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" placeholder="your@email.com" value={clientInfo.email} onChange={e => setClientInfo({...clientInfo, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone (optional)</label>
                  <input type="tel" placeholder="+91 98765 43210" value={clientInfo.phone} onChange={e => setClientInfo({...clientInfo, phone: e.target.value})} />
                </div>

                <button className="btn btn-violet" onClick={handlePayment} disabled={paying} style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '14px' }}>
                  {paying ? 'Processing...' : `Pay ₹${Number(selectedService.price).toLocaleString('en-IN')} →`}
                </button>
                <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--ink3)', marginTop: '10px' }}>🔒 Secured by Razorpay · UPI, Cards, NetBanking accepted</p>
              </div>
            </div>
          )}

          {/* STEP: Success */}
          {step === 'success' && (
            <div className="rise" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
              <h2 style={{ fontFamily: 'var(--font)', fontWeight: 900, fontSize: '28px', marginBottom: '8px' }}>Booking Confirmed!</h2>
              <p style={{ color: 'var(--ink2)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
                Your session has been booked and payment received. Check your email for confirmation.
              </p>
              <div className="card" style={{ padding: '20px', textAlign: 'left', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink2)', fontSize: '13px' }}>Session</span>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{selectedService?.title}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink2)', fontSize: '13px' }}>Date & Time</span>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{booking && new Date(booking.slot_start).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink2)', fontSize: '13px' }}>Amount Paid</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--lime)' }}>₹{booking && Number(booking.amount).toLocaleString('en-IN')}</span>
                  </div>
                  {booking?.meet_link && (
                    <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                      <a href={booking.meet_link} target="_blank" rel="noreferrer" className="btn btn-violet" style={{ width: '100%', justifyContent: 'center' }}>
                        🎥 Join Google Meet
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ink3)' }}>Powered by AutoDM · autodm.co</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}