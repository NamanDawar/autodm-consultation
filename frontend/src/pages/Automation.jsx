import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import {
  getIGAccount, getIGStats, getIGAutomations,
  createAutomation, updateAutomation, toggleAutomation, deleteAutomation,
  getIGSubscribers, connectInstagram, disconnectInstagram,
} from '../api/index.js';

// ─── Constants ─────────────────────────────────────────────────
const TRIGGER_META = {
  dm_keyword:      { label: 'DM Keyword',      icon: '💬', color: 'var(--v)' },
  comment_keyword: { label: 'Comment Keyword',  icon: '💭', color: 'var(--teal)' },
  first_dm:        { label: 'First DM',         icon: '👋', color: 'var(--lime)' },
  story_reply:     { label: 'Story Reply',       icon: '📸', color: 'var(--rose)' },
};

const EMPTY_FORM = {
  name: '', trigger_type: 'dm_keyword', keywords: [],
  match_type: 'contains', response_message: '',
  include_booking_link: false, delay_seconds: 0,
};

// ─── KeywordTag ────────────────────────────────────────────────
function KwTag({ tag, onRemove }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:'5px',
      background:'rgba(124,106,247,0.15)', color:'var(--v2)',
      border:'1px solid rgba(124,106,247,0.25)', borderRadius:'20px',
      padding:'3px 10px', fontSize:'12px', fontWeight:600,
    }}>
      {tag}
      {onRemove && (
        <span onClick={onRemove} style={{cursor:'pointer',opacity:0.7,fontWeight:900,fontSize:'15px',lineHeight:1}}>×</span>
      )}
    </span>
  );
}

// ─── AutomationModal ───────────────────────────────────────────
function AutomationModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [kwInput, setKwInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial ? { ...EMPTY_FORM, ...initial } : { ...EMPTY_FORM });
  }, [open, initial]);

  const addKw = () => {
    const kw = kwInput.trim().toLowerCase();
    if (!kw || form.keywords.includes(kw)) return setKwInput('');
    setForm(f => ({ ...f, keywords: [...f.keywords, kw] }));
    setKwInput('');
  };

  const handleKeyDown = e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addKw(); } };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Enter a name');
    if (!form.response_message.trim()) return toast.error('Enter a response message');
    if ((form.trigger_type === 'dm_keyword' || form.trigger_type === 'comment_keyword') && form.keywords.length === 0)
      return toast.error('Add at least one keyword');
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{maxWidth:'580px'}}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-title">{initial ? '✏️ Edit Automation' : '⚡ New Automation'}</div>
        <div className="modal-sub">Auto-reply when someone DMs or comments a keyword</div>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="form-group">
            <label className="form-label">Automation Name</label>
            <input placeholder='"Book Consultation", "Free Guide", …' value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          {/* Trigger type grid */}
          <div className="form-group">
            <label className="form-label">Trigger Type</label>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
              {Object.entries(TRIGGER_META).map(([key, { label, icon, color }]) => (
                <div key={key} onClick={() => setForm(f => ({ ...f, trigger_type: key }))}
                  style={{
                    padding:'12px 14px', borderRadius:'10px', cursor:'pointer',
                    border:`1.5px solid ${form.trigger_type === key ? color : 'var(--border2)'}`,
                    background: form.trigger_type === key ? `color-mix(in srgb, ${color} 10%, transparent)` : 'rgba(255,255,255,0.02)',
                    transition:'all 0.15s',
                  }}>
                  <div style={{fontSize:'20px', marginBottom:'4px'}}>{icon}</div>
                  <div style={{fontSize:'12.5px', fontWeight:700, color: form.trigger_type === key ? color : 'var(--ink2)'}}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Keywords */}
          {(form.trigger_type === 'dm_keyword' || form.trigger_type === 'comment_keyword') && (
            <>
              <div className="form-group">
                <label className="form-label">Keywords <span style={{color:'var(--ink3)', fontWeight:400, textTransform:'none', letterSpacing:0}}>(Enter or comma to add)</span></label>
                <div style={{display:'flex', gap:'8px'}}>
                  <input placeholder='book, consult, price, …' value={kwInput}
                    onChange={e => setKwInput(e.target.value)} onKeyDown={handleKeyDown} />
                  <button type="button" className="btn btn-ghost" style={{flexShrink:0}} onClick={addKw}>Add</button>
                </div>
                {form.keywords.length > 0 && (
                  <div style={{display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'10px'}}>
                    {form.keywords.map(kw => <KwTag key={kw} tag={kw} onRemove={() => setForm(f => ({ ...f, keywords: f.keywords.filter(k => k !== kw) }))} />)}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Match Type</label>
                <select value={form.match_type} onChange={e => setForm(f => ({ ...f, match_type: e.target.value }))}>
                  <option value="contains">Contains — keyword anywhere in the message</option>
                  <option value="exact">Exact — full message equals keyword</option>
                  <option value="starts_with">Starts with — message begins with keyword</option>
                </select>
              </div>
            </>
          )}

          {/* Response */}
          <div className="form-group">
            <label className="form-label">
              Response Message
              <span style={{color:'var(--ink3)', fontWeight:400, textTransform:'none', letterSpacing:0, marginLeft:'8px'}}>
                {'{{first_name}}'} · {'{{booking_link}}'}
              </span>
            </label>
            <textarea rows={5} value={form.response_message}
              placeholder={`Hey {{first_name}}! 👋\n\nThanks for reaching out! Book a session:\n{{booking_link}}`}
              onChange={e => setForm(f => ({ ...f, response_message: e.target.value }))}
              style={{resize:'vertical', lineHeight:'1.6'}} />
          </div>

          {/* Booking link toggle */}
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'14px 16px', background:'var(--s2)', borderRadius:'10px',
            marginBottom:'18px', border:'1px solid var(--border)',
          }}>
            <div>
              <div style={{fontSize:'13.5px', fontWeight:600}}>🔗 Auto-append Booking Link</div>
              <div style={{fontSize:'12px', color:'var(--ink2)', marginTop:'2px'}}>Adds your consultation URL at the end of the reply</div>
            </div>
            <button type="button" className={`tog ${form.include_booking_link ? 'on' : 'off'}`}
              onClick={() => setForm(f => ({ ...f, include_booking_link: !f.include_booking_link }))} />
          </div>

          {/* Delay */}
          <div className="form-group">
            <label className="form-label">Send Delay (seconds) <span style={{color:'var(--ink3)', fontWeight:400, textTransform:'none', letterSpacing:0}}>— 0 = instant</span></label>
            <input type="number" min={0} max={300} value={form.delay_seconds}
              onChange={e => setForm(f => ({ ...f, delay_seconds: parseInt(e.target.value) || 0 }))} />
          </div>

          <div style={{display:'flex', gap:'10px', justifyContent:'flex-end', paddingTop:'4px'}}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : initial ? 'Save Changes' : '⚡ Create Automation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── AutomationCard ────────────────────────────────────────────
function AutomationCard({ automation: a, onToggle, onEdit, onDelete }) {
  const meta = TRIGGER_META[a.trigger_type] || TRIGGER_META.dm_keyword;
  return (
    <div style={{
      background:'var(--s1)', border:'1px solid var(--border)', borderRadius:'14px',
      padding:'18px 20px', transition:'border-color 0.2s',
      borderLeft:`3px solid ${a.is_active ? meta.color : 'var(--border2)'}`,
      opacity: a.is_active ? 1 : 0.55,
    }}>
      <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px'}}>
        {/* Content */}
        <div style={{flex:1, minWidth:0}}>
          <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px', flexWrap:'wrap'}}>
            <span className="badge" style={{
              background:`color-mix(in srgb, ${meta.color} 12%, transparent)`,
              color:meta.color, border:`1px solid color-mix(in srgb, ${meta.color} 30%, transparent)`,
            }}>
              {meta.icon} {meta.label}
            </span>
            {a.include_booking_link && (
              <span style={{fontSize:'11px', color:'var(--lime)', fontWeight:600}}>🔗 booking link</span>
            )}
          </div>
          <div style={{fontWeight:800, fontSize:'15px', letterSpacing:'-0.2px', marginBottom:'7px'}}>{a.name}</div>
          {a.keywords?.length > 0 && (
            <div style={{display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'9px'}}>
              {a.keywords.map(kw => <KwTag key={kw} tag={kw} />)}
            </div>
          )}
          <div style={{
            fontSize:'12.5px', color:'var(--ink2)', lineHeight:'1.55',
            background:'var(--s2)', borderRadius:'8px', padding:'9px 13px',
            border:'1px solid var(--border)', fontStyle:'italic',
            overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
          }}>
            "{a.response_message.slice(0, 130)}{a.response_message.length > 130 ? '…' : ''}"
          </div>
        </div>

        {/* Toggle + counter */}
        <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px', flexShrink:0}}>
          <button className={`tog ${a.is_active ? 'on' : 'off'}`} onClick={() => onToggle(a.id)}
            title={a.is_active ? 'Active — click to pause' : 'Paused — click to activate'} />
          <span style={{fontSize:'11px', color:'var(--ink3)', fontWeight:700}}>{a.total_triggered} fired</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{display:'flex', gap:'8px', marginTop:'14px', paddingTop:'12px', borderTop:'1px solid var(--border)'}}>
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(a)}>✏️ Edit</button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(a.id)}>🗑 Delete</button>
        <span style={{marginLeft:'auto', fontSize:'11px', color:'var(--ink3)', alignSelf:'center'}}>
          {a.match_type} match
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
export default function Automation() {
  const [account, setAccount]       = useState(null);
  const [stats, setStats]           = useState(null);
  const [automations, setAutomations] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('automations');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editingAuto, setEditingAuto] = useState(null);
  const [connecting, setConnecting] = useState(false);

  // Handle OAuth callback query params
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('connected') === 'true') {
      toast.success('🎉 Instagram connected!');
      window.history.replaceState({}, '', '/automations');
    }
    if (p.get('error')) {
      const msgs = {
        instagram_denied: 'Instagram authorization was denied.',
        no_ig_business: 'No Instagram Business account found. Make sure your IG is linked to a Facebook Page.',
        connect_failed: 'Connection failed. Please try again.',
      };
      toast.error(msgs[p.get('error')] || 'Something went wrong.');
      window.history.replaceState({}, '', '/automations');
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [acctR, statsR, autosR, subsR] = await Promise.allSettled([
      getIGAccount(), getIGStats(), getIGAutomations(), getIGSubscribers(),
    ]);
    if (acctR.status === 'fulfilled') setAccount(acctR.value.data);
    if (statsR.status === 'fulfilled') setStats(statsR.value.data);
    if (autosR.status === 'fulfilled') setAutomations(autosR.value.data);
    if (subsR.status === 'fulfilled') setSubscribers(subsR.value.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleConnect = async () => {
    setConnecting(true);
    try { const r = await connectInstagram(); window.location.href = r.data.url; }
    catch { toast.error('Failed to start connection'); setConnecting(false); }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Instagram? Automations will pause.')) return;
    await disconnectInstagram();
    setAccount(null);
    toast.success('Disconnected');
    loadAll();
  };

  const handleSave = async (form) => {
    if (editingAuto) {
      const r = await updateAutomation(editingAuto.id, form);
      setAutomations(p => p.map(a => a.id === editingAuto.id ? r.data : a));
      toast.success('Updated ✅');
    } else {
      const r = await createAutomation(form);
      setAutomations(p => [r.data, ...p]);
      toast.success('Automation created ⚡');
    }
    setEditingAuto(null);
  };

  const handleToggle = async (id) => {
    const r = await toggleAutomation(id);
    setAutomations(p => p.map(a => a.id === id ? r.data : a));
  };

  const handleEdit = (a) => { setEditingAuto(a); setModalOpen(true); };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this automation?')) return;
    await deleteAutomation(id);
    setAutomations(p => p.filter(a => a.id !== id));
    toast.success('Deleted');
  };

  return (
    <Layout>
      {/* Header */}
      <div className="page-header fade-up">
        <div>
          <h1 className="page-title">
            Instagram <span className="page-title-accent">DM Automation</span>
          </h1>
          <p className="page-sub">Keyword triggers, auto-replies &amp; booking links — like ManyChat, inside AutoDM</p>
        </div>
        {account && (
          <button className="btn btn-primary" onClick={() => { setEditingAuto(null); setModalOpen(true); }}>
            ⚡ New Automation
          </button>
        )}
      </div>

      {/* ── Connect Banner ── */}
      {!loading && !account && (
        <div className="fade-up d1" style={{
          background:'linear-gradient(135deg, rgba(240,98,146,0.07) 0%, rgba(124,106,247,0.07) 100%)',
          border:'1px solid rgba(240,98,146,0.18)', borderRadius:'20px',
          padding:'48px 40px', textAlign:'center', marginBottom:'28px',
        }}>
          <div style={{fontSize:'56px', marginBottom:'18px'}}>📸</div>
          <h2 style={{fontWeight:800, fontSize:'22px', letterSpacing:'-0.4px', marginBottom:'10px'}}>
            Connect Your Instagram Account
          </h2>
          <p style={{color:'var(--ink2)', fontSize:'14px', maxWidth:'440px', margin:'0 auto 26px', lineHeight:'1.65'}}>
            Connect your Instagram Business account to automatically reply to DMs and comments.
            Keyword triggers, booking links, subscriber tracking — all included.
          </p>
          <button className="btn btn-rose btn-lg" onClick={handleConnect} disabled={connecting}>
            {connecting ? 'Redirecting to Instagram…' : '🔗 Connect Instagram'}
          </button>

          {/* Requirements */}
          <div style={{marginTop:'26px', display:'inline-flex', gap:'10px', flexWrap:'wrap', justifyContent:'center'}}>
            {['Instagram Business / Creator account', 'Facebook Page linked to Instagram', 'Meta Developer App'].map(r => (
              <span key={r} style={{fontSize:'12px', color:'var(--ink2)', background:'var(--s2)', border:'1px solid var(--border)', borderRadius:'20px', padding:'5px 14px'}}>
                ✓ {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Connected Account Bar ── */}
      {!loading && account && (
        <div className="fade-up d1" style={{
          background:'linear-gradient(135deg, rgba(240,98,146,0.05), rgba(124,106,247,0.05))',
          border:'1px solid rgba(240,98,146,0.15)', borderRadius:'14px',
          padding:'16px 20px', marginBottom:'22px',
          display:'flex', alignItems:'center', gap:'14px',
        }}>
          {account.ig_profile_pic
            ? <img src={account.ig_profile_pic} alt="" style={{width:'46px', height:'46px', borderRadius:'50%', border:'2px solid var(--rose)'}} />
            : <div style={{width:'46px', height:'46px', borderRadius:'50%', background:'linear-gradient(135deg,var(--rose),var(--v))', display:'grid', placeItems:'center', fontSize:'20px'}}>📸</div>
          }
          <div style={{flex:1}}>
            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
              <span style={{fontWeight:800, fontSize:'15px'}}>@{account.ig_username}</span>
              <span className="badge badge-live">Connected</span>
            </div>
            <div style={{fontSize:'12px', color:'var(--ink2)', marginTop:'2px'}}>
              {account.ig_name} · {Number(account.ig_followers).toLocaleString('en-IN')} followers · via {account.page_name}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleDisconnect} style={{color:'var(--red)'}}>Disconnect</button>
        </div>
      )}

      {/* ── Stats ── */}
      {account && stats && (
        <div className="stats-grid sg-4 fade-up d2">
          {[
            { label:'Subscribers',        value:stats.subscribers,         color:'var(--rose)',  sub:'Unique DM senders' },
            { label:'Active Automations', value:`${stats.automations_active}/${stats.automations_total}`, color:'var(--v)', sub:'Running now' },
            { label:'DMs Sent',           value:stats.messages_sent,       color:'var(--teal)', sub:'Auto-replies fired' },
            { label:'Total Triggered',    value:stats.total_triggered,     color:'var(--lime)', sub:'All automation fires' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-glow" style={{background:s.color}} />
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{color:s.color}}>{s.value}</div>
              <div className="stat-delta delta-neutral">{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      {account && (
        <>
          <div className="fade-up d3" style={{marginBottom:'18px'}}>
            <div className="pill-tabs">
              <div className={`pt ${tab==='automations'?'active':''}`} onClick={() => setTab('automations')}>⚡ Automations ({automations.length})</div>
              <div className={`pt ${tab==='subscribers'?'active':''}`} onClick={() => setTab('subscribers')}>👥 Subscribers ({subscribers.length})</div>
            </div>
          </div>

          {/* Automations Tab */}
          {tab === 'automations' && (
            loading
              ? <div style={{padding:'60px', textAlign:'center', color:'var(--ink2)'}}>Loading…</div>
              : automations.length === 0
                ? (
                  <div className="card">
                    <div className="empty">
                      <div className="empty-icon">⚡</div>
                      <div className="empty-title">No automations yet</div>
                      <div className="empty-sub">Create your first automation to auto-reply to DMs and comments instantly</div>
                      <button className="btn btn-primary" style={{marginTop:'8px'}}
                        onClick={() => { setEditingAuto(null); setModalOpen(true); }}>
                        ⚡ Create First Automation
                      </button>
                    </div>
                  </div>
                )
                : (
                  <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                    {automations.map(a => (
                      <AutomationCard key={a.id} automation={a}
                        onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} />
                    ))}
                  </div>
                )
          )}

          {/* Subscribers Tab */}
          {tab === 'subscribers' && (
            <div className="card">
              <div className="card-head">
                <div className="card-title">👥 Subscribers</div>
                <span style={{fontSize:'12px', color:'var(--ink2)'}}>{subscribers.length} total</span>
              </div>
              {loading
                ? <div style={{padding:'40px', textAlign:'center', color:'var(--ink2)'}}>Loading…</div>
                : subscribers.length === 0
                  ? (
                    <div className="empty">
                      <div className="empty-icon">👥</div>
                      <div className="empty-title">No subscribers yet</div>
                      <div className="empty-sub">People who DM you will appear here automatically</div>
                    </div>
                  )
                  : subscribers.map(s => (
                    <div key={s.id} className="list-row">
                      {s.profile_pic
                        ? <img src={s.profile_pic} alt="" style={{width:'38px', height:'38px', borderRadius:'50%', flexShrink:0}} />
                        : <div className="av" style={{flexShrink:0}}>{(s.username||s.ig_user_id)[0]?.toUpperCase()}</div>
                      }
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700, fontSize:'14px'}}>{s.name || s.username || s.ig_user_id}</div>
                        {s.username && <div style={{fontSize:'12px', color:'var(--ink2)'}}>@{s.username}</div>}
                      </div>
                      <div style={{textAlign:'right', fontSize:'12px', color:'var(--ink2)'}}>
                        <div>📩 {s.messages_received || 0} in · {s.messages_sent || 0} out</div>
                        <div style={{marginTop:'2px'}}>
                          {new Date(s.last_interaction).toLocaleDateString('en-IN', {dateStyle:'medium'})}
                        </div>
                      </div>
                    </div>
                  ))
              }
            </div>
          )}
        </>
      )}

      {/* ── Setup Guide (when not connected) ── */}
      {!account && !loading && (
        <div className="card fade-up d2" style={{marginTop:'8px'}}>
          <div className="card-head">
            <div className="card-title">📋 Setup Guide — Meta Developer Account</div>
          </div>
          <div style={{padding:'26px'}}>
            {[
              { n:'1', title:'Create Meta Developer Account', desc:'Go to developers.facebook.com → Log in with Facebook → Get Started', href:'https://developers.facebook.com', linkText:'Open Meta Developers →' },
              { n:'2', title:'Create a Facebook App', desc:'My Apps → Create App → Choose "Business" → fill in name & email' },
              { n:'3', title:'Add Instagram + Messenger Products', desc:'App Dashboard → Add Product → Add both "Instagram" and "Messenger"' },
              { n:'4', title:'Convert Instagram to Business Account', desc:'Instagram → Settings → Account → Switch to Professional Account → Business or Creator' },
              { n:'5', title:'Link Instagram to your Facebook Page', desc:'Facebook → Settings → Linked Accounts → Connect your Instagram account' },
              { n:'6', title:'Add credentials to .env', desc:'Copy App ID & App Secret from Meta → add as META_APP_ID and META_APP_SECRET in your .env' },
              { n:'7', title:'Register your Webhook', desc:'Meta App → Webhooks → Instagram → Subscribe to "messages" → URL: https://your-api.com/api/instagram/webhook, Verify Token: from .env (META_WEBHOOK_VERIFY_TOKEN)' },
            ].map(({ n, title, desc, href, linkText }) => (
              <div key={n} style={{display:'flex', gap:'16px', marginBottom:'20px'}}>
                <div style={{width:'28px', height:'28px', borderRadius:'50%', background:'linear-gradient(135deg,var(--v),var(--rose))', display:'grid', placeItems:'center', fontWeight:800, fontSize:'12px', flexShrink:0, marginTop:'1px'}}>
                  {n}
                </div>
                <div>
                  <div style={{fontWeight:700, fontSize:'14px', marginBottom:'4px'}}>{title}</div>
                  <div style={{fontSize:'13px', color:'var(--ink2)', lineHeight:'1.55'}}>{desc}</div>
                  {href && <a href={href} target="_blank" rel="noreferrer" style={{fontSize:'12px', color:'var(--v2)', fontWeight:600, display:'inline-block', marginTop:'5px'}}>{linkText}</a>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AutomationModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingAuto(null); }}
        onSave={handleSave}
        initial={editingAuto}
      />
    </Layout>
  );
}
