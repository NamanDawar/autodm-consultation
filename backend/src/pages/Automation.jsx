import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import {
  getIGAccount,
  getIGStats,
  getIGAutomations,
  createAutomation,
  updateAutomation,
  toggleAutomation,
  deleteAutomation,
  getIGSubscribers,
  connectInstagram,
  disconnectInstagram,
} from '../api/index.js';

// ─── Helpers ──────────────────────────────────────────────────
const TRIGGER_LABELS = {
  dm_keyword: 'DM Keyword',
  comment_keyword: 'Comment Keyword',
  first_dm: 'First DM',
  story_reply: 'Story Reply',
};

const TRIGGER_ICONS = {
  dm_keyword: '💬',
  comment_keyword: '💭',
  first_dm: '👋',
  story_reply: '📸',
};

const TRIGGER_COLORS = {
  dm_keyword: 'var(--violet)',
  comment_keyword: 'var(--electric)',
  first_dm: 'var(--lime)',
  story_reply: 'var(--rose)',
};

const EMPTY_FORM = {
  name: '',
  trigger_type: 'dm_keyword',
  keywords: [],
  match_type: 'contains',
  response_message: '',
  include_booking_link: false,
  delay_seconds: 0,
};

// ─── Sub-components ───────────────────────────────────────────

function StatCard({ label, value, color, icon, sub }) {
  return (
    <div className="stat">
      <div className="stat-glow" style={{ background: color }} />
      <div className="stat-label">{label}</div>
      <div className="stat-number" style={{ color }}>{value}</div>
      {sub && <div className="stat-delta muted">{sub}</div>}
    </div>
  );
}

function KeywordTag({ tag, onRemove }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: 'rgba(139,92,246,0.18)', color: 'var(--violet-light)',
      border: '1px solid rgba(139,92,246,0.3)', borderRadius: '20px',
      padding: '3px 10px', fontSize: '12px', fontWeight: 600,
    }}>
      {tag}
      {onRemove && (
        <span
          onClick={onRemove}
          style={{ cursor: 'pointer', opacity: 0.6, fontWeight: 900, fontSize: '14px', lineHeight: 1 }}
        >×</span>
      )}
    </span>
  );
}

// ─── AutomationModal ──────────────────────────────────────────
function AutomationModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [kwInput, setKwInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial ? { ...EMPTY_FORM, ...initial } : { ...EMPTY_FORM });
  }, [open, initial]);

  const addKeyword = () => {
    const kw = kwInput.trim().toLowerCase();
    if (!kw) return;
    if (!form.keywords.includes(kw)) {
      setForm(f => ({ ...f, keywords: [...f.keywords, kw] }));
    }
    setKwInput('');
  };

  const removeKeyword = (kw) =>
    setForm(f => ({ ...f, keywords: f.keywords.filter(k => k !== kw) }));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addKeyword(); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Enter a name');
    if (!form.response_message.trim()) return toast.error('Enter a response message');
    if (form.trigger_type === 'dm_keyword' && form.keywords.length === 0) {
      return toast.error('Add at least one keyword');
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(8,8,16,0.85)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: '20px',
    }}>
      <div style={{
        background: 'var(--panel)', border: '1px solid var(--border2)',
        borderRadius: '20px', width: '100%', maxWidth: '560px',
        maxHeight: '90vh', overflow: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font)', fontWeight: 900, fontSize: '20px', letterSpacing: '-0.5px' }}>
              {initial ? '✏️ Edit Automation' : '⚡ New Automation'}
            </h2>
            <p style={{ color: 'var(--ink2)', fontSize: '13px', marginTop: '3px' }}>
              Auto-reply when someone DMs or comments a keyword
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border2)', borderRadius: '50%', width: '32px', height: '32px', color: 'var(--ink2)', fontSize: '18px', display: 'grid', placeItems: 'center' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '22px 26px' }}>

          {/* Name */}
          <div className="form-group">
            <label className="form-label">Automation Name</label>
            <input
              placeholder='e.g. "Book Consultation", "Free Guide"'
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Trigger Type */}
          <div className="form-group">
            <label className="form-label">Trigger Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                <div
                  key={key}
                  onClick={() => setForm(f => ({ ...f, trigger_type: key }))}
                  style={{
                    padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                    border: `1.5px solid ${form.trigger_type === key ? TRIGGER_COLORS[key] : 'var(--border2)'}`,
                    background: form.trigger_type === key ? `${TRIGGER_COLORS[key]}18` : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>{TRIGGER_ICONS[key]}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: form.trigger_type === key ? TRIGGER_COLORS[key] : 'var(--ink2)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Keywords (only for keyword-based triggers) */}
          {(form.trigger_type === 'dm_keyword' || form.trigger_type === 'comment_keyword') && (
            <>
              <div className="form-group">
                <label className="form-label">Keywords <span style={{ color: 'var(--ink3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(press Enter or comma to add)</span></label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    placeholder='e.g. book, consult, BOOK'
                    value={kwInput}
                    onChange={e => setKwInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button type="button" className="btn btn-ghost" onClick={addKeyword} style={{ flexShrink: 0 }}>Add</button>
                </div>
                {form.keywords.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                    {form.keywords.map(kw => (
                      <KeywordTag key={kw} tag={kw} onRemove={() => removeKeyword(kw)} />
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Match Type</label>
                <select value={form.match_type} onChange={e => setForm(f => ({ ...f, match_type: e.target.value }))}>
                  <option value="contains">Contains keyword anywhere in the message</option>
                  <option value="exact">Exact match (full message = keyword)</option>
                  <option value="starts_with">Starts with keyword</option>
                </select>
              </div>
            </>
          )}

          {/* Response Message */}
          <div className="form-group">
            <label className="form-label">
              Response Message
              <span style={{ color: 'var(--ink3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: '8px' }}>
                Use {'{{first_name}}'}, {'{{booking_link}}'}
              </span>
            </label>
            <textarea
              rows={5}
              placeholder={`Hey {{first_name}}! 👋\n\nThanks for reaching out! Click the link below to book a consultation with me:\n\n{{booking_link}}`}
              value={form.response_message}
              onChange={e => setForm(f => ({ ...f, response_message: e.target.value }))}
              style={{ resize: 'vertical', lineHeight: '1.6' }}
            />
          </div>

          {/* Include booking link toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', marginBottom: '16px', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>🔗 Auto-append Booking Link</div>
              <div style={{ fontSize: '12px', color: 'var(--ink2)', marginTop: '2px' }}>Adds your consultation booking URL at the end</div>
            </div>
            <div
              className={`tog ${form.include_booking_link ? 'on' : 'off'}`}
              onClick={() => setForm(f => ({ ...f, include_booking_link: !f.include_booking_link }))}
            />
          </div>

          {/* Delay */}
          <div className="form-group">
            <label className="form-label">Send Delay (seconds) <span style={{ color: 'var(--ink3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— 0 = instant</span></label>
            <input
              type="number" min={0} max={300}
              value={form.delay_seconds}
              onChange={e => setForm(f => ({ ...f, delay_seconds: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-violet" disabled={saving}>
              {saving ? 'Saving…' : initial ? 'Save Changes' : '⚡ Create Automation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── AutomationCard ───────────────────────────────────────────
function AutomationCard({ automation, onToggle, onEdit, onDelete }) {
  const color = TRIGGER_COLORS[automation.trigger_type] || 'var(--violet)';

  return (
    <div style={{
      background: 'var(--panel)', border: '1px solid var(--border)',
      borderRadius: '14px', padding: '18px 20px',
      transition: 'border-color 0.2s',
      borderLeft: `3px solid ${automation.is_active ? color : 'rgba(255,255,255,0.1)'}`,
      opacity: automation.is_active ? 1 : 0.6,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        {/* Left */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: `${color}1a`, color, border: `1px solid ${color}40`,
              borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: 700,
            }}>
              {TRIGGER_ICONS[automation.trigger_type]} {TRIGGER_LABELS[automation.trigger_type]}
            </span>
            {automation.include_booking_link && (
              <span style={{ fontSize: '11px', color: 'var(--lime)', fontWeight: 600 }}>🔗 Booking link</span>
            )}
          </div>
          <div style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '15px', marginBottom: '6px' }}>
            {automation.name}
          </div>
          {automation.keywords?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
              {automation.keywords.map(kw => <KeywordTag key={kw} tag={kw} />)}
            </div>
          )}
          <div style={{
            fontSize: '12px', color: 'var(--ink2)', lineHeight: '1.5',
            background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
            padding: '8px 12px', border: '1px solid var(--border)',
            fontStyle: 'italic', maxHeight: '48px', overflow: 'hidden',
          }}>
            "{automation.response_message.slice(0, 120)}{automation.response_message.length > 120 ? '…' : ''}"
          </div>
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 }}>
          <div
            className={`tog ${automation.is_active ? 'on' : 'off'}`}
            onClick={() => onToggle(automation.id)}
            title={automation.is_active ? 'Active — click to pause' : 'Paused — click to activate'}
          />
          <div style={{ fontSize: '11px', color: 'var(--ink3)', fontWeight: 700, textAlign: 'right' }}>
            {automation.total_triggered} fired
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(automation)}>✏️ Edit</button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onDelete(automation.id)}
          style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
        >🗑 Delete</button>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--ink3)', alignSelf: 'center' }}>
          {automation.match_type} match
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
export default function Automation() {
  const [account, setAccount] = useState(null);
  const [stats, setStats] = useState(null);
  const [automations, setAutomations] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('automations'); // 'automations' | 'subscribers'
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAuto, setEditingAuto] = useState(null);
  const [connecting, setConnecting] = useState(false);

  // Check URL params for callback messages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      toast.success('🎉 Instagram connected successfully!');
      window.history.replaceState({}, '', '/automations');
    }
    if (params.get('error')) {
      const errMap = {
        instagram_denied: 'Instagram authorization was denied.',
        no_ig_business: 'No Instagram Business account found. Make sure your IG is a Business/Creator account linked to a Facebook Page.',
        connect_failed: 'Connection failed. Please try again.',
      };
      toast.error(errMap[params.get('error')] || 'Something went wrong.');
      window.history.replaceState({}, '', '/automations');
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [acctRes, statsRes, autosRes, subsRes] = await Promise.allSettled([
        getIGAccount(),
        getIGStats(),
        getIGAutomations(),
        getIGSubscribers(),
      ]);
      if (acctRes.status === 'fulfilled') setAccount(acctRes.value.data);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (autosRes.status === 'fulfilled') setAutomations(autosRes.value.data);
      if (subsRes.status === 'fulfilled') setSubscribers(subsRes.value.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Connect Instagram ──
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await connectInstagram();
      window.location.href = res.data.url;
    } catch (err) {
      toast.error('Failed to start Instagram connection');
      setConnecting(false);
    }
  };

  // ── Disconnect ──
  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Instagram? Your automations will be paused.')) return;
    await disconnectInstagram();
    setAccount(null);
    toast.success('Instagram disconnected');
    loadData();
  };

  // ── Automation CRUD ──
  const handleSave = async (form) => {
    if (editingAuto) {
      const res = await updateAutomation(editingAuto.id, form);
      setAutomations(prev => prev.map(a => a.id === editingAuto.id ? res.data : a));
      toast.success('Automation updated ✅');
    } else {
      const res = await createAutomation(form);
      setAutomations(prev => [res.data, ...prev]);
      toast.success('Automation created ⚡');
    }
    setEditingAuto(null);
  };

  const handleToggle = async (id) => {
    const res = await toggleAutomation(id);
    setAutomations(prev => prev.map(a => a.id === id ? res.data : a));
  };

  const handleEdit = (auto) => {
    setEditingAuto(auto);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this automation?')) return;
    await deleteAutomation(id);
    setAutomations(prev => prev.filter(a => a.id !== id));
    toast.success('Deleted');
  };

  const openCreateModal = () => {
    setEditingAuto(null);
    setModalOpen(true);
  };

  // ── Render ──
  return (
    <Layout>
      {/* Header */}
      <div className="rise" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font)', fontWeight: 900, fontSize: '28px', letterSpacing: '-0.8px', background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.7))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Instagram <span style={{ background: 'linear-gradient(135deg, var(--rose), var(--violet))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DM Automation</span>
          </h1>
          <p style={{ color: 'var(--ink2)', fontSize: '13.5px', marginTop: '4px' }}>
            Auto-reply to DMs & comments — like ManyChat, built into AutoDM
          </p>
        </div>
        {account && (
          <button className="btn btn-violet" onClick={openCreateModal}>
            ⚡ New Automation
          </button>
        )}
      </div>

      {/* ── Connect Instagram Banner (if not connected) ── */}
      {!loading && !account && (
        <div className="rise rise-1" style={{
          background: 'linear-gradient(135deg, rgba(244,114,182,0.08) 0%, rgba(139,92,246,0.08) 100%)',
          border: '1px solid rgba(244,114,182,0.2)', borderRadius: '20px',
          padding: '40px', textAlign: 'center', marginBottom: '24px',
        }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>
            <span style={{ background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>📸</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font)', fontWeight: 900, fontSize: '24px', letterSpacing: '-0.5px', marginBottom: '10px' }}>
            Connect Your Instagram Account
          </h2>
          <p style={{ color: 'var(--ink2)', fontSize: '14px', maxWidth: '460px', margin: '0 auto 24px', lineHeight: '1.6' }}>
            Connect your Instagram Business account to start auto-replying to DMs and comments.
            Works just like ManyChat — keyword triggers, booking links, and more.
          </p>
          <button
            className="btn btn-rose"
            onClick={handleConnect}
            disabled={connecting}
            style={{ fontSize: '14px', padding: '12px 28px' }}
          >
            {connecting ? 'Redirecting to Instagram…' : '🔗 Connect Instagram'}
          </button>
          <div style={{ marginTop: '20px', padding: '14px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)', display: 'inline-block', textAlign: 'left' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--ink3)', marginBottom: '8px' }}>Requirements</div>
            {[
              'Instagram Business or Creator account',
              'Facebook Page linked to your Instagram',
              'Meta Developer App with messaging permissions',
            ].map(req => (
              <div key={req} style={{ fontSize: '12px', color: 'var(--ink2)', marginBottom: '4px' }}>
                ✓ {req}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Connected Account Info ── */}
      {!loading && account && (
        <div className="rise rise-1" style={{
          background: 'linear-gradient(135deg, rgba(244,114,182,0.06) 0%, rgba(139,92,246,0.06) 100%)',
          border: '1px solid rgba(244,114,182,0.15)', borderRadius: '16px',
          padding: '18px 22px', marginBottom: '22px',
          display: 'flex', alignItems: 'center', gap: '16px',
        }}>
          {account.ig_profile_pic ? (
            <img src={account.ig_profile_pic} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--rose)' }} />
          ) : (
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--rose), var(--violet))', display: 'grid', placeItems: 'center', fontSize: '20px' }}>📸</div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '16px' }}>@{account.ig_username}</span>
              <span style={{ fontSize: '11px', background: 'rgba(163,230,53,0.15)', color: 'var(--lime)', border: '1px solid rgba(163,230,53,0.3)', borderRadius: '20px', padding: '2px 8px', fontWeight: 700 }}>● Connected</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ink2)', marginTop: '3px' }}>
              {account.ig_name} · {Number(account.ig_followers).toLocaleString()} followers · via {account.page_name}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleDisconnect} style={{ color: '#f87171' }}>Disconnect</button>
        </div>
      )}

      {/* ── Stats ── */}
      {account && stats && (
        <div className="stats-grid sg-4 rise rise-2">
          <StatCard label="Total Subscribers" value={stats.subscribers} color="var(--rose)" sub="People who DM'd you" />
          <StatCard label="Active Automations" value={`${stats.automations_active}/${stats.automations_total}`} color="var(--violet)" sub="Running now" />
          <StatCard label="DMs Sent" value={stats.messages_sent} color="var(--electric)" sub="Auto-replies fired" />
          <StatCard label="Total Triggered" value={stats.total_triggered} color="var(--lime)" sub="All automation fires" />
        </div>
      )}

      {/* ── Tabs ── */}
      {account && (
        <>
          <div className="rise rise-3" style={{ display: 'flex', gap: '4px', marginBottom: '18px', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
            {[['automations', '⚡ Automations'], ['subscribers', '👥 Subscribers']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  padding: '8px 18px', borderRadius: '9px', fontSize: '13px', fontWeight: 600,
                  background: tab === key ? 'rgba(139,92,246,0.2)' : 'transparent',
                  color: tab === key ? 'var(--ink)' : 'var(--ink2)',
                  border: tab === key ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                  transition: 'all 0.15s',
                }}
              >{label}</button>
            ))}
          </div>

          {/* ── Automations Tab ── */}
          {tab === 'automations' && (
            <div>
              {loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--ink2)' }}>Loading…</div>
              ) : automations.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '16px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '14px' }}>⚡</div>
                  <div style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '18px', marginBottom: '8px' }}>No automations yet</div>
                  <div style={{ color: 'var(--ink2)', fontSize: '13px', marginBottom: '20px' }}>
                    Create your first automation to auto-reply to DMs and comments
                  </div>
                  <button className="btn btn-violet" onClick={openCreateModal}>⚡ Create First Automation</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {automations.map(auto => (
                    <AutomationCard
                      key={auto.id}
                      automation={auto}
                      onToggle={handleToggle}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Subscribers Tab ── */}
          {tab === 'subscribers' && (
            <div className="card">
              <div className="card-head">
                <div className="card-title">👥 Subscribers ({subscribers.length})</div>
              </div>
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink2)' }}>Loading…</div>
              ) : subscribers.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--ink2)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
                  <div style={{ fontWeight: 700, marginBottom: '6px' }}>No subscribers yet</div>
                  <div style={{ fontSize: '13px' }}>People who DM you will appear here automatically</div>
                </div>
              ) : (
                subscribers.map(sub => (
                  <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                    {sub.profile_pic ? (
                      <img src={sub.profile_pic} alt="" style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
                    ) : (
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--rose), var(--violet))', display: 'grid', placeItems: 'center', fontSize: '14px', fontWeight: 700 }}>
                        {(sub.username || sub.ig_user_id)[0]?.toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>
                        {sub.name || sub.username || sub.ig_user_id}
                      </div>
                      {sub.username && (
                        <div style={{ fontSize: '12px', color: 'var(--ink2)' }}>@{sub.username}</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--ink2)' }}>
                      <div>📩 {sub.messages_received} in · {sub.messages_sent} out</div>
                      <div style={{ marginTop: '2px' }}>
                        Last: {new Date(sub.last_interaction).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* ── Setup Guide (always visible when not connected) ── */}
      {!account && !loading && (
        <div className="card rise rise-3" style={{ marginTop: '24px' }}>
          <div className="card-head">
            <div className="card-title">📋 Setup Guide — Meta Developer Account</div>
          </div>
          <div style={{ padding: '24px' }}>
            {[
              {
                step: '1',
                title: 'Create a Meta Developer Account',
                desc: 'Go to developers.facebook.com → Log in with your Facebook account → Click "Get Started"',
                link: 'https://developers.facebook.com',
                linkText: 'Open Meta Developers →',
              },
              {
                step: '2',
                title: 'Create a Facebook App',
                desc: 'Click "My Apps" → "Create App" → Choose "Business" type → Fill in app name and contact email',
              },
              {
                step: '3',
                title: 'Add Instagram & Messenger Products',
                desc: 'In your app dashboard → "Add Product" → Add both "Instagram" and "Messenger" → Set up each',
              },
              {
                step: '4',
                title: 'Convert Instagram to Business Account',
                desc: 'In Instagram app → Settings → Account → Switch to Professional Account → Choose Business or Creator',
              },
              {
                step: '5',
                title: 'Link Instagram to a Facebook Page',
                desc: 'Facebook → Settings → Linked Accounts → Connect your Instagram business account',
              },
              {
                step: '6',
                title: 'Add App Credentials to .env',
                desc: 'Copy your App ID and App Secret from Meta Developer dashboard → Add to your .env file as META_APP_ID and META_APP_SECRET',
              },
              {
                step: '7',
                title: 'Set up Webhook',
                desc: 'In your Meta App → Webhooks → Subscribe to "messages" events → Use your backend URL: https://your-domain.com/api/instagram/webhook with verify token from .env',
              },
            ].map(({ step, title, desc, link, linkText }) => (
              <div key={step} style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--violet), var(--rose))', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '12px', flexShrink: 0 }}>
                  {step}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--ink2)', lineHeight: '1.5' }}>{desc}</div>
                  {link && (
                    <a href={link} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--violet)', display: 'inline-block', marginTop: '6px', fontWeight: 600 }}>
                      {linkText}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Automation Modal */}
      <AutomationModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingAuto(null); }}
        onSave={handleSave}
        initial={editingAuto}
      />
    </Layout>
  );
}
