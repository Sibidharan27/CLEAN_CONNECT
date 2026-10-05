import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import api from './services/api';

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
  const icons = {
    dashboard: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>,
    complaints: <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z"/>,
    drivers: <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>,
    vehicles: <path d="M17 8H3v9h1.56c.35 1.17 1.43 2 2.44 2s2.09-.83 2.44-2h5.12c.35 1.17 1.43 2 2.44 2s2.09-.83 2.44-2H21v-5l-4-4zM3 11V9h4v2H3zm4 6.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm7-6.5H9V9h5v2zm3 6.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm1-6.5h-3V9h2l1 1v1z"/>,
    routes: <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98z"/>,
    schedules: <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>,
    analytics: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>,
    users: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>,
    logout: <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>,
    search: <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>,
    check: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>,
    trash: <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>,
    edit: <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>,
    plus: <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>,
    refresh: <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>,
    truck: <path d="M17 8H3v9h1.56c.35 1.17 1.43 2 2.44 2s2.09-.83 2.44-2h5.12c.35 1.17 1.43 2 2.44 2s2.09-.83 2.44-2H21v-5l-4-4zM3 11V9h4v2H3zm4 6.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm7-6.5H9V9h5v2zm3 6.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm1-6.5h-3V9h2l1 1v1z"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      {icons[name] || null}
    </svg>
  );
};

// ─── Vehicle type display helpers ─────────────────────────────────────────────
const VEHICLE_TYPES = {
  garbage_truck: { label: 'Garbage Truck', emoji: '🚛', color: '#10b981' },
  jcb:           { label: 'JCB / Excavator', emoji: '🏗️', color: '#f59e0b' },
  mini_loader:   { label: 'Mini Loader', emoji: '🚜', color: '#3b82f6' },
  road_sweeper:  { label: 'Road Sweeper', emoji: '🧹', color: '#8b5cf6' },
};

const VEHICLE_STATUS = {
  active:      { cls: 'badge-resolved', label: 'Active' },
  maintenance: { cls: 'badge-pending', label: 'Maintenance' },
  inactive:    { cls: 'badge-dim', label: 'Inactive' },
};

// ─── Admin Login ──────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.user.role !== 'admin') {
        setError('Access denied. Admin account required.');
        return;
      }
      localStorage.setItem('adminToken', res.data.token);
      localStorage.setItem('adminUser', JSON.stringify(res.data.user));
      onLogin(res.data.user, res.data.token);
    } catch (e) {
      setError(e.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon" style={{ width: 56, height: 56, fontSize: 28, borderRadius: 14 }}>+</div>
          <h1 className="login-title">CleanConnect+</h1>
          <p className="login-subtitle">Admin Control Panel</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@cleanconnect.gov.in" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In to Dashboard'}
          </button>
        </form>
        <p className="login-hint">
          Default credentials: <strong>admin@cleanconnect.gov.in</strong> &bull; password: <strong>admin123</strong>
        </p>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function Badge({ status }) {
  const map = {
    open: ['badge-pending', 'Open'],
    pending: ['badge-pending', 'Pending'],
    assigned: ['badge-blue', 'Assigned'],
    in_progress: ['badge-in_progress', 'In Progress'],
    resolved: ['badge-resolved', 'Resolved'],
    closed: ['badge-dim', 'Closed'],
    active: ['badge-in_progress', 'Active'],
    completed: ['badge-resolved', 'Completed'],
  };
  const [cls, label] = map[status] || ['badge-dim', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-header">{label}</div>
      <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
function Spinner() {
  return <div className="spinner-wrap"><div className="spinner" /></div>;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardView({ token }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
      setStats(res.data);
    } catch (e) {
      console.error('Dashboard stats error:', e);
      setError(e.response?.data?.message || e.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;

  if (error) return (
    <div>
      <div className="header">
        <div className="header-title"><h1>System Overview</h1><p>Real-time metrics</p></div>
        <button className="btn btn-outline" onClick={load}><Icon name="refresh" size={15} /> Retry</button>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent-red)', marginBottom: 8 }}>Failed to load dashboard</div>
        <div style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 20 }}>{error}</div>
        <button className="btn" onClick={load}><Icon name="refresh" size={15} /> Try Again</button>
      </div>
    </div>
  );

  const s = stats || {};

  return (
    <div>
      <div className="header">
        <div className="header-title">
          <h1>System Overview</h1>
          <p>Real-time metrics for CleanConnect+ Peelamedu waste collection network</p>
        </div>
        <button className="btn btn-outline" onClick={load}><Icon name="refresh" size={15} /> Refresh</button>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Complaints" value={s.totalComplaints ?? 0} sub={`${s.openComplaints ?? 0} open · ${s.inProgressComplaints ?? 0} in progress`} color="var(--accent-amber)" />
        <StatCard label="Resolved" value={s.resolvedComplaints ?? 0} sub={`${s.resolutionRate ?? 0}% resolution rate`} color="var(--primary)" />
        <StatCard label="Registered Drivers" value={s.totalDrivers ?? 0} sub={`${s.activeRoutes ?? 0} routes active today`} color="var(--accent-blue)" />
        <StatCard label="Fleet Vehicles" value={s.totalVehicles ?? 0} sub={`${s.activeVehicles ?? 0} active · ${s.maintenanceVehicles ?? 0} in maintenance`} color="var(--accent-purple)" />
      </div>

      {/* Category Breakdown */}
      <div className="two-col">
        <div className="card">
          <h3 className="card-title">Complaints by Category</h3>
          {s.byCategory?.length > 0 ? (
            <div className="bar-list">
              {s.byCategory.map(c => {
                const pct = s.totalComplaints > 0 ? Math.round((c.count / s.totalComplaints) * 100) : 0;
                return (
                  <div key={c._id} className="bar-item">
                    <div className="bar-label"><span>{c._id || 'Uncategorised'}</span><span>{c.count}</span></div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          ) : <p className="empty-msg">No complaints yet</p>}
        </div>

        {/* Trend */}
        <div className="card">
          <h3 className="card-title">7-Day Complaint Trend</h3>
          {s.trend?.length > 0 ? (
            <div className="trend-chart">
              {s.trend.map(t => {
                const maxVal = Math.max(...s.trend.map(x => x.count), 1);
                const h = Math.max(6, Math.round((t.count / maxVal) * 100));
                return (
                  <div key={t._id} className="trend-bar-wrap" title={`${t._id}: ${t.count}`}>
                    <div className="trend-count">{t.count}</div>
                    <div className="trend-bar" style={{ height: `${h}%` }} />
                    <div className="trend-day">{new Date(t._id).toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                  </div>
                );
              })}
            </div>
          ) : <p className="empty-msg">No trend data yet</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Complaint Detail Modal ───────────────────────────────────────────────────
function ComplaintDetailModal({ complaint, onClose, apiBase }) {
  if (!complaint) return null;
  const { title, category, description, location, priority, status, images,
          citizen, assignedDriver, timeline, createdAt } = complaint;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: 4 }}>{title}</h3>
            <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-dim)' }}>#{complaint._id?.slice(-8).toUpperCase()}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>

        {/* Uploaded Images */}
        {images && images.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Photo Evidence</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {images.map((img, i) => (
                <a key={i} href={`${apiBase}${img}`} target="_blank" rel="noopener noreferrer">
                  <img
                    src={`${apiBase}${img}`}
                    alt={`Evidence ${i + 1}`}
                    style={{ width: 140, height: 100, objectFit: 'cover', borderRadius: 10, border: '2px solid var(--border-color)', cursor: 'pointer', transition: 'opacity .2s' }}
                    onError={e => { e.target.style.display = 'none'; }}
                    onMouseEnter={e => { e.target.style.opacity = 0.8; }}
                    onMouseLeave={e => { e.target.style.opacity = 1; }}
                  />
                </a>
              ))}
            </div>
          </div>
        )}
        {(!images || images.length === 0) && (
          <div style={{ marginBottom: 20, padding: 16, background: 'var(--bg-surface)', borderRadius: 10, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
            📷 No photo evidence uploaded
          </div>
        )}

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          {[
            ['Category', category || '—'],
            ['Priority', priority || '—'],
            ['Status', status || '—'],
            ['Submitted', createdAt ? new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'],
          ].map(([label, val]) => (
            <div key={label} style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, color: 'var(--text-main)', fontWeight: 500, textTransform: label === 'Category' || label === 'Priority' || label === 'Status' ? 'capitalize' : 'none' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16, background: 'var(--bg-surface)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Description</div>
          <p style={{ fontSize: 14, color: 'var(--text-main)', lineHeight: 1.6, margin: 0 }}>{description || '—'}</p>
        </div>

        {/* Location */}
        <div style={{ marginBottom: 16, background: 'var(--bg-surface)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>📍 Location</div>
          <div style={{ fontSize: 14, color: 'var(--text-main)', marginBottom: 4 }}>{location?.address || '—'}</div>
          {location?.latitude && location?.longitude && (
            <div style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'monospace' }}>
              {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </div>
          )}
        </div>

        {/* Citizen Info */}
        {citizen && (
          <div style={{ marginBottom: 16, background: 'var(--bg-surface)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>👤 Reported By</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {citizen.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{citizen.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{citizen.email}{citizen.phone ? ` · ${citizen.phone}` : ''}</div>
              </div>
            </div>
          </div>
        )}

        {/* Assigned Driver */}
        {assignedDriver && (
          <div style={{ marginBottom: 16, background: 'var(--bg-surface)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>🚛 Assigned Driver</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {assignedDriver.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{assignedDriver.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{assignedDriver.phone || 'No phone'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        {timeline && timeline.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>📋 Timeline</div>
            <div style={{ position: 'relative', paddingLeft: 20 }}>
              {timeline.map((t, i) => (
                <div key={i} style={{ position: 'relative', paddingBottom: i < timeline.length - 1 ? 16 : 0 }}>
                  {i < timeline.length - 1 && <div style={{ position: 'absolute', left: -13, top: 16, width: 2, bottom: 0, background: 'var(--border-color)' }} />}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === timeline.length - 1 ? 'var(--primary)' : 'var(--border-color)', marginTop: 5, flexShrink: 0, marginLeft: -16 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize' }}>{t.status?.replace('_', ' ')}</div>
                      {t.note && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{t.note}</div>}
                      {t.time && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{new Date(t.time).toLocaleString('en-IN')}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="btn btn-outline" style={{ width: '100%', marginTop: 20 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// ─── Complaints ───────────────────────────────────────────────────────────────
function ComplaintsView({ token }) {
  const [complaints, setComplaints] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState(null);
  const [modal, setModal] = useState(null); // assign driver modal
  const [detailModal, setDetailModal] = useState(null); // complaint detail modal

  const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: statusFilter, search };
      const [cRes, dRes] = await Promise.all([
        api.get('/admin/complaints', { headers, params }),
        api.get('/admin/drivers', { headers }),
      ]);
      setComplaints(cRes.data.complaints || []);
      setDrivers(dRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token, statusFilter, search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.patch(`/admin/complaints/${id}`, { status }, { headers });
      setComplaints(prev => prev.map(c => c._id === id ? { ...c, status } : c));
    } catch (e) { alert(e.response?.data?.message || 'Update failed'); }
    finally { setUpdating(null); }
  };

  const assignDriver = async (complaintId, driverId) => {
    setUpdating(complaintId);
    try {
      await api.patch(`/admin/complaints/${complaintId}`, { assignedDriver: driverId, status: 'assigned' }, { headers });
      load();
    } catch (e) { alert(e.response?.data?.message || 'Assign failed'); }
    finally { setUpdating(null); setModal(null); }
  };

  const deleteComplaint = async (id) => {
    if (!confirm('Delete this complaint permanently?')) return;
    try {
      await api.delete(`/admin/complaints/${id}`, { headers });
      setComplaints(prev => prev.filter(c => c._id !== id));
    } catch (e) { alert('Delete failed'); }
  };

  return (
    <div>
      <div className="header">
        <div className="header-title"><h1>Complaints Management</h1><p>Monitor and update reported waste issues</p></div>
        <button className="btn btn-outline" onClick={load}><Icon name="refresh" size={15} /> Refresh</button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Icon name="search" size={16} />
          <input placeholder="Search complaints..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {['all','open','assigned','in_progress','resolved','closed'].map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? <Spinner /> : (
          <table>
            <thead><tr>
              <th>ID</th><th>Citizen</th><th>Title</th><th>Location</th>
              <th>Priority</th><th>Status</th><th>Assigned Driver</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {complaints.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 32 }}>No complaints found</td></tr>
              ) : complaints.map(c => (
                <tr key={c._id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{c._id.slice(-6).toUpperCase()}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.citizen?.name || 'Unknown'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{c.citizen?.email}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, maxWidth: 180 }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{c.category}</div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.location?.address || '—'}</td>
                  <td><span className={`badge ${c.priority === 'high' ? 'badge-red' : c.priority === 'medium' ? 'badge-pending' : 'badge-dim'}`}>{c.priority}</span></td>
                  <td><Badge status={c.status} /></td>
                  <td style={{ fontSize: 13 }}>{c.assignedDriver?.name || <span style={{ color: 'var(--text-dim)' }}>Unassigned</span>}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn btn-sm btn-outline" onClick={() => setDetailModal(c)} title="View full details"><Icon name="search" size={13} /> View</button>
                      {c.status === 'open' && (
                        <button className="btn btn-sm btn-blue" onClick={() => setModal(c)} disabled={updating === c._id}>Assign</button>
                      )}
                      {c.status === 'in_progress' && (
                        <button className="btn btn-sm" onClick={() => updateStatus(c._id, 'resolved')} disabled={updating === c._id}>Resolve</button>
                      )}
                      {c.status === 'assigned' && (
                        <button className="btn btn-sm btn-amber" onClick={() => updateStatus(c._id, 'in_progress')} disabled={updating === c._id}>Start</button>
                      )}
                      <button className="btn btn-sm btn-red" onClick={() => deleteComplaint(c._id)}><Icon name="trash" size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Complaint Detail Modal */}
      {detailModal && (
        <ComplaintDetailModal
          complaint={detailModal}
          onClose={() => setDetailModal(null)}
          apiBase={API_BASE}
        />
      )}

      {/* Assign Driver Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="card-title">Assign Driver</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
              Complaint: <strong>{modal.title}</strong>
            </p>
            <div className="driver-list">
              {drivers.map(d => (
                <button key={d._id} className="driver-select-btn" onClick={() => assignDriver(modal._id, d._id)}>
                  <Icon name="truck" size={16} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{d.vehicleId || 'No vehicle'} · {d.zone || 'No zone'}</div>
                  </div>
                </button>
              ))}
              {drivers.length === 0 && <p style={{ color: 'var(--text-dim)' }}>No drivers registered yet</p>}
            </div>
            <button className="btn btn-outline" style={{ width: '100%', marginTop: 12 }} onClick={() => setModal(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Drivers ──────────────────────────────────────────────────────────────────
function DriversView({ token }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', vehicleId: '', employeeId: '', zone: '', shift: '' });
  const [adding, setAdding] = useState(false);

  // — Complaint attendance stats —
  const [statPeriod, setStatPeriod] = useState(3);
  const [statUnit, setStatUnit]     = useState('months');
  const [countMap, setCountMap]     = useState({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [maxCount, setMaxCount]     = useState(1);

  const headers = { Authorization: `Bearer ${token}` };

  const loadStats = useCallback(async (period, unit) => {
    setStatsLoading(true);
    try {
      const res = await api.get('/admin/drivers/complaint-stats', {
        headers,
        params: { period, unit },
      });
      const map = res.data.countMap || {};
      setCountMap(map);
      const vals = Object.values(map);
      setMaxCount(vals.length > 0 ? Math.max(...vals) : 1);
    } catch (e) { console.error('Stats load failed', e); }
    finally { setStatsLoading(false); }
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/drivers', { headers });
      setDrivers(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadStats(statPeriod, statUnit); }, [loadStats, statPeriod, statUnit]);

  const addDriver = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post('/admin/drivers', form, { headers });
      setShowAdd(false);
      setForm({ name: '', email: '', password: '', phone: '', vehicleId: '', employeeId: '', zone: '', shift: '' });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add driver');
    } finally { setAdding(false); }
  };

  const periodOptions = statUnit === 'months' ? [1, 2, 3, 6, 9, 12, 18, 24] : [1, 2, 3, 5];

  return (
    <div>
      <div className="header">
        <div className="header-title"><h1>Driver Fleet</h1><p>Manage drivers and vehicle assignments</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={load}><Icon name="refresh" size={15} /> Refresh</button>
          <button className="btn" onClick={() => setShowAdd(!showAdd)}><Icon name="plus" size={15} /> Add Driver</button>
        </div>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 className="card-title">Add New Driver</h3>
          <form onSubmit={addDriver} className="add-form">
            {[['name','Full Name'],['email','Email'],['password','Password'],['phone','Phone'],['vehicleId','Vehicle ID'],['employeeId','Employee ID'],['zone','Zone'],['shift','Shift']].map(([k,l]) => (
              <div key={k} className="form-group">
                <label>{l}</label>
                <input type={k==='password'?'password':'text'} value={form[k]} onChange={e => setForm(p => ({...p,[k]:e.target.value}))} placeholder={l} required={['name','email','password'].includes(k)} />
              </div>
            ))}
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 10 }}>
              <button type="submit" className="btn" disabled={adding}>{adding ? 'Adding...' : 'Add Driver'}</button>
              <button type="button" className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* — Complaints Attended Period Selector — */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
            📋 Complaints Attended In:
          </div>

          <select
            className="filter-select"
            style={{ minWidth: 80 }}
            value={statPeriod}
            onChange={e => setStatPeriod(parseInt(e.target.value))}
          >
            {periodOptions.map(n => <option key={n} value={n}>{n}</option>)}
          </select>

          <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            {['months', 'years'].map(u => (
              <button
                key={u}
                onClick={() => { setStatUnit(u); setStatPeriod(u === 'months' ? 3 : 1); }}
                style={{
                  padding: '6px 14px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: statUnit === u ? 'var(--primary)' : 'transparent',
                  color: statUnit === u ? '#fff' : 'var(--text-dim)',
                  transition: 'all .2s',
                }}
              >
                {u.charAt(0).toUpperCase() + u.slice(1)}
              </button>
            ))}
          </div>

          {statsLoading && <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Updating…</span>}
          {!statsLoading && (
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Resolved / closed complaints per driver · last {statPeriod} {statUnit}
            </span>
          )}
        </div>
      </div>

      <div className="card">
        {loading ? <Spinner /> : (
          <table>
            <thead><tr>
              <th>Driver</th><th>Employee ID</th><th>Assigned Vehicle</th><th>Zone</th><th>Shift</th><th>Today&apos;s Route</th><th>Stops</th>
              <th style={{ whiteSpace: 'nowrap' }}>
                Complaints Attended
                <span style={{ display: 'block', fontSize: 10, fontWeight: 400, color: 'var(--text-dim)', marginTop: 2 }}>
                  Last {statPeriod} {statUnit}
                </span>
              </th>
            </tr></thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 32 }}>No drivers registered yet</td></tr>
              ) : drivers.map(d => {
                const done  = d.route?.stops?.filter(s => s.status === 'completed').length || 0;
                const total = d.route?.stops?.length || 0;
                const veh   = d.assignedVehicle;
                const attended = countMap[d._id.toString()] || 0;
                const barPct   = maxCount > 0 ? Math.round((attended / maxCount) * 100) : 0;
                const badgeCls = attended >= 10 ? 'badge-resolved'
                               : attended >= 5  ? 'badge-in_progress'
                               : attended >= 1  ? 'badge-blue'
                               : 'badge-dim';
                return (
                  <tr key={d._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{d.email}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{d.employeeId || '—'}</td>
                    <td>
                      {veh ? (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{VEHICLE_TYPES[veh.type]?.emoji} {veh.vehicleId}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{VEHICLE_TYPES[veh.type]?.label} · {veh.plateNumber}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>{d.vehicleId || 'Unassigned'}</span>
                      )}
                    </td>
                    <td>{d.zone || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{d.shift || '—'}</td>
                    <td><Badge status={d.route?.status || 'no route'} /></td>
                    <td>
                      {total > 0 ? (
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{done}/{total}</div>
                          <div className="mini-bar"><div className="mini-fill" style={{ width: `${total > 0 ? (done/total)*100 : 0}%` }} /></div>
                        </div>
                      ) : '—'}
                    </td>

                    {/* — Complaints Attended column — */}
                    <td>
                      {statsLoading ? (
                        <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>…</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 90 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={`badge ${badgeCls}`} style={{ fontSize: 13, fontWeight: 700, minWidth: 32, textAlign: 'center' }}>
                              {attended}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{attended === 1 ? 'resolved' : 'resolved'}</span>
                          </div>
                          <div className="mini-bar" style={{ width: 80 }}>
                            <div
                              className="mini-fill"
                              style={{
                                width: `${barPct}%`,
                                background: attended >= 10 ? 'var(--primary)'
                                          : attended >= 5  ? 'var(--accent-amber)'
                                          : 'var(--accent-blue)',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Vehicles ─────────────────────────────────────────────────────────────────
function VehiclesView({ token }) {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [assignModal, setAssignModal] = useState(null);
  const [form, setForm] = useState({ vehicleId: '', type: 'garbage_truck', plateNumber: '', capacity: '', currentArea: 'Peelamedu', notes: '' });
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState(null);
  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, dRes] = await Promise.all([
        api.get('/admin/vehicles', { headers }),
        api.get('/admin/drivers', { headers }),
      ]);
      setVehicles(vRes.data);
      setDrivers(dRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const addVehicle = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post('/admin/vehicles', form, { headers });
      setShowAdd(false);
      setForm({ vehicleId: '', type: 'garbage_truck', plateNumber: '', capacity: '', currentArea: 'Peelamedu', notes: '' });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add vehicle');
    } finally { setAdding(false); }
  };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.patch(`/admin/vehicles/${id}`, { status }, { headers });
      setVehicles(prev => prev.map(v => v._id === id ? { ...v, status } : v));
    } catch (e) { alert('Update failed'); }
    finally { setUpdating(null); }
  };

  const assignDriver = async (vehicleId, driverId) => {
    setUpdating(vehicleId);
    try {
      await api.patch(`/admin/vehicles/${vehicleId}`, { assignedDriver: driverId }, { headers });
      load();
    } catch (e) { alert(e.response?.data?.message || 'Assign failed'); }
    finally { setUpdating(null); setAssignModal(null); }
  };

  const unassignDriver = async (vehicleId) => {
    setUpdating(vehicleId);
    try {
      await api.patch(`/admin/vehicles/${vehicleId}`, { assignedDriver: null }, { headers });
      load();
    } catch (e) { alert('Unassign failed'); }
    finally { setUpdating(null); }
  };

  const deleteVehicle = async (id) => {
    if (!confirm('Delete this vehicle permanently?')) return;
    try {
      await api.delete(`/admin/vehicles/${id}`, { headers });
      setVehicles(prev => prev.filter(v => v._id !== id));
    } catch (e) { alert('Delete failed'); }
  };

  const activeCount = vehicles.filter(v => v.status === 'active').length;
  const maintCount = vehicles.filter(v => v.status === 'maintenance').length;

  return (
    <div>
      <div className="header">
        <div className="header-title">
          <h1>Vehicle & Machinery Fleet</h1>
          <p>{vehicles.length} vehicles · {activeCount} active · {maintCount} in maintenance</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={load}><Icon name="refresh" size={15} /> Refresh</button>
          <button className="btn" onClick={() => setShowAdd(!showAdd)}><Icon name="plus" size={15} /> Add Vehicle</button>
        </div>
      </div>

      {/* Vehicle Type Legend */}
      <div className="vehicle-legend">
        {Object.entries(VEHICLE_TYPES).map(([key, { label, emoji, color }]) => (
          <div key={key} className="vehicle-legend-item">
            <span className="vehicle-legend-emoji">{emoji}</span>
            <span style={{ color }}>{label}</span>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 className="card-title">Add New Vehicle / Machinery</h3>
          <form onSubmit={addVehicle} className="add-form">
            <div className="form-group">
              <label>Vehicle ID</label>
              <input value={form.vehicleId} onChange={e => setForm(p => ({...p, vehicleId: e.target.value}))} placeholder="GCT-007" required />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}>
                {Object.entries(VEHICLE_TYPES).map(([key, { label, emoji }]) => (
                  <option key={key} value={key}>{emoji} {label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Plate Number</label>
              <input value={form.plateNumber} onChange={e => setForm(p => ({...p, plateNumber: e.target.value}))} placeholder="TN-38-XX-0000" required />
            </div>
            <div className="form-group">
              <label>Capacity</label>
              <input value={form.capacity} onChange={e => setForm(p => ({...p, capacity: e.target.value}))} placeholder="5 Tonnes" />
            </div>
            <div className="form-group">
              <label>Deployed Area</label>
              <input value={form.currentArea} onChange={e => setForm(p => ({...p, currentArea: e.target.value}))} placeholder="Peelamedu" />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} placeholder="Optional notes" />
            </div>
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 10 }}>
              <button type="submit" className="btn" disabled={adding}>{adding ? 'Adding...' : 'Add Vehicle'}</button>
              <button type="button" className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? <Spinner /> : (
          <table>
            <thead><tr>
              <th>Vehicle</th><th>Type</th><th>Plate</th><th>Capacity</th><th>Area</th><th>Status</th><th>Assigned Driver</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 32 }}>No vehicles registered yet</td></tr>
              ) : vehicles.map(v => {
                const vt = VEHICLE_TYPES[v.type] || VEHICLE_TYPES.garbage_truck;
                const vs = VEHICLE_STATUS[v.status] || VEHICLE_STATUS.inactive;
                return (
                  <tr key={v._id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{v.vehicleId}</div>
                    </td>
                    <td>
                      <div className="vehicle-type-chip" style={{ '--vt-color': vt.color }}>
                        <span style={{ fontSize: 16 }}>{vt.emoji}</span>
                        <span>{vt.label}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{v.plateNumber}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{v.capacity || '—'}</td>
                    <td style={{ fontSize: 13, maxWidth: 160 }}>{v.currentArea || '—'}</td>
                    <td><span className={`badge ${vs.cls}`}>{vs.label}</span></td>
                    <td>
                      {v.assignedDriver ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                            {v.assignedDriver.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{v.assignedDriver.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{v.assignedDriver.phone || v.assignedDriver.email}</div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      <div className="action-btns">
                        {v.assignedDriver ? (
                          <button className="btn btn-sm btn-outline" onClick={() => unassignDriver(v._id)} disabled={updating === v._id} title="Unassign driver">Unassign</button>
                        ) : (
                          <button className="btn btn-sm btn-blue" onClick={() => setAssignModal(v)} disabled={updating === v._id}>Assign</button>
                        )}
                        {v.status === 'active' && (
                          <button className="btn btn-sm btn-amber" onClick={() => updateStatus(v._id, 'maintenance')} disabled={updating === v._id}>🔧</button>
                        )}
                        {v.status === 'maintenance' && (
                          <button className="btn btn-sm" onClick={() => updateStatus(v._id, 'active')} disabled={updating === v._id}>✅</button>
                        )}
                        {v.status === 'inactive' && (
                          <button className="btn btn-sm" onClick={() => updateStatus(v._id, 'active')} disabled={updating === v._id}>Activate</button>
                        )}
                        <button className="btn btn-sm btn-red" onClick={() => deleteVehicle(v._id)}><Icon name="trash" size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Assign Driver Modal */}
      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="card-title">Assign Driver to Vehicle</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', marginBottom: 16, border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 24 }}>{VEHICLE_TYPES[assignModal.type]?.emoji}</span>
              <div>
                <div style={{ fontWeight: 700, color: '#fff' }}>{assignModal.vehicleId}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{VEHICLE_TYPES[assignModal.type]?.label} · {assignModal.plateNumber}</div>
              </div>
            </div>
            <div className="driver-list">
              {drivers.map(d => (
                <button key={d._id} className="driver-select-btn" onClick={() => assignDriver(assignModal._id, d._id)}>
                  <Icon name="drivers" size={16} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{d.employeeId || d.email} · {d.zone || 'No zone'}</div>
                  </div>
                </button>
              ))}
              {drivers.length === 0 && <p style={{ color: 'var(--text-dim)' }}>No drivers registered yet</p>}
            </div>
            <button className="btn btn-outline" style={{ width: '100%', marginTop: 12 }} onClick={() => setAssignModal(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Citizens ─────────────────────────────────────────────────────────────────
function CitizensView({ token }) {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    api.get('/admin/citizens', { headers }).then(r => setCitizens(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="header">
        <div className="header-title"><h1>Citizens</h1><p>All registered citizen accounts</p></div>
      </div>
      <div className="card">
        {loading ? <Spinner /> : (
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Area</th><th>Joined</th></tr></thead>
            <tbody>
              {citizens.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 32 }}>No citizens registered yet</td></tr>
              ) : citizens.map(c => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.email}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.phone || '—'}</td>
                  <td>{c.area || '—'}</td>
                  <td style={{ color: 'var(--text-dim)', fontSize: 13 }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Routes ───────────────────────────────────────────────────────────────────
function RoutesView({ token }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/routes', { headers });
      setRoutes(r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const resetRoutes = async () => {
    if (!window.confirm('Delete all of today\'s routes? Each driver will get a fresh route automatically when they next open the app.')) return;
    setResetting(true);
    try {
      const res = await api.delete('/admin/routes/today', { headers });
      alert(res.data.message);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Reset failed');
    } finally { setResetting(false); }
  };

  return (
    <div>
      <div className="header">
        <div className="header-title">
          <h1>Today&apos;s Routes</h1>
          <p>All active collection routes for {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={load}><Icon name="refresh" size={15} /> Refresh</button>
          <button
            className="btn"
            onClick={resetRoutes}
            disabled={resetting}
            style={{ background: 'var(--accent-red, #ef4444)', borderColor: 'var(--accent-red, #ef4444)' }}
          >
            {resetting ? 'Resetting…' : '🔄 Reset All Routes'}
          </button>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 12, padding: '10px 16px', fontSize: 13, color: 'var(--text-dim)', background: 'var(--bg-surface)', borderLeft: '3px solid var(--primary)' }}>
        ℹ️ Each driver automatically gets their own zone-specific route when they open the app. Use <strong>Reset All Routes</strong> to regenerate fresh routes for all drivers.
      </div>
      <div className="card">
        {loading ? <Spinner /> : routes.length === 0 ? (
          <p className="empty-msg">No routes created today yet. Routes auto-generate when a driver logs in.</p>
        ) : (
          <table>
            <thead><tr><th>Driver</th><th>Vehicle ID</th><th>Zone</th><th>Status</th><th>Progress</th><th>Total Stops</th><th>Started</th></tr></thead>
            <tbody>
              {routes.map(r => {
                const done = r.stops?.filter(s => s.status === 'completed').length || 0;
                const total = r.stops?.length || 0;
                return (
                  <tr key={r._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.driver?.name || 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{r.driver?.vehicleId || r.vehicleId}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>{r.vehicleId}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.stops?.[0]?.area || '—'}</td>
                    <td><Badge status={r.status} /></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{done}/{total}</div>
                      <div className="mini-bar"><div className="mini-fill" style={{ width: `${total > 0 ? (done/total)*100 : 0}%` }} /></div>
                    </td>
                    <td>{total}</td>
                    <td style={{ color: 'var(--text-dim)', fontSize: 13 }}>
                      {r.startedAt ? new Date(r.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar Nav Link ─────────────────────────────────────────────────────────
function SideLink({ to, icon, label, end }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
      <Icon name={icon} size={18} />
      {label}
    </NavLink>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('adminUser')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('adminToken') || '');
  const navigate = useNavigate();

  const handleLogin = (u, t) => { setUser(u); setToken(t); navigate('/'); };
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setUser(null); setToken('');
  };

  if (!user || !token) return <AdminLogin onLogin={handleLogin} />;

  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <div className="brand-icon">+</div>
          <span className="brand-title">CleanConnect</span>
          <span className="brand-badge">ADMIN</span>
        </div>
        <div className="admin-info">
          <div className="admin-avatar">{user.name?.[0]?.toUpperCase() || 'A'}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{user.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{user.email}</div>
          </div>
        </div>
        <nav>
          <SideLink to="/" icon="dashboard" label="Dashboard" end />
          <SideLink to="/complaints" icon="complaints" label="Complaints" />
          <SideLink to="/vehicles" icon="vehicles" label="Vehicles" />
          <SideLink to="/drivers" icon="drivers" label="Drivers" />
          <SideLink to="/citizens" icon="users" label="Citizens" />
          <SideLink to="/routes" icon="routes" label="Routes" />
        </nav>
        <button className="nav-link logout-btn" onClick={handleLogout} style={{ marginTop: 'auto', cursor: 'pointer', border: 'none', background: 'none', textAlign: 'left', width: '100%' }}>
          <Icon name="logout" size={18} />
          Sign Out
        </button>
      </aside>
      <main>
        <Routes>
          <Route path="/" element={<DashboardView token={token} />} />
          <Route path="/complaints" element={<ComplaintsView token={token} />} />
          <Route path="/vehicles" element={<VehiclesView token={token} />} />
          <Route path="/drivers" element={<DriversView token={token} />} />
          <Route path="/citizens" element={<CitizensView token={token} />} />
          <Route path="/routes" element={<RoutesView token={token} />} />
        </Routes>
      </main>
    </div>
  );
}
