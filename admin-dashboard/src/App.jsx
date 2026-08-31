import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import api from './services/api';

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
  const icons = {
    dashboard: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>,
    complaints: <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z"/>,
    drivers: <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>,
    routes: <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98z"/>,
    schedules: <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>,
    analytics: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>,
    logout: <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>,
    users: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>,
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
          No admin account? Register on the app with role &ldquo;admin&rdquo; via DB, then log in here.
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

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
      setStats(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="header">
        <div className="header-title">
          <h1>System Overview</h1>
          <p>Real-time metrics for CleanConnect+ waste collection network</p>
        </div>
        <button className="btn btn-outline" onClick={load}><Icon name="refresh" size={15} /> Refresh</button>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Complaints" value={stats?.totalComplaints} sub={`${stats?.openComplaints} open · ${stats?.inProgressComplaints} in progress`} color="var(--accent-amber)" />
        <StatCard label="Resolved" value={stats?.resolvedComplaints} sub={`${stats?.resolutionRate}% resolution rate`} color="var(--primary)" />
        <StatCard label="Registered Drivers" value={stats?.totalDrivers} sub={`${stats?.activeRoutes} routes active today`} color="var(--accent-blue)" />
        <StatCard label="Citizens" value={stats?.totalCitizens} sub="Registered users" color="var(--accent-purple)" />
      </div>

      {/* Category Breakdown */}
      <div className="two-col">
        <div className="card">
          <h3 className="card-title">Complaints by Category</h3>
          {stats?.byCategory?.length > 0 ? (
            <div className="bar-list">
              {stats.byCategory.map(c => {
                const pct = Math.round((c.count / stats.totalComplaints) * 100);
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
          {stats?.trend?.length > 0 ? (
            <div className="trend-chart">
              {stats.trend.map(t => {
                const maxVal = Math.max(...stats.trend.map(x => x.count));
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

// ─── Complaints ───────────────────────────────────────────────────────────────
function ComplaintsView({ token }) {
  const [complaints, setComplaints] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState(null);
  const [modal, setModal] = useState(null); // { complaint }

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
  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/drivers', { headers });
      setDrivers(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

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

      <div className="card">
        {loading ? <Spinner /> : (
          <table>
            <thead><tr>
              <th>Driver</th><th>Employee ID</th><th>Vehicle</th><th>Zone</th><th>Shift</th><th>Today's Route</th><th>Stops</th>
            </tr></thead>
            <tbody>
              {drivers.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 32 }}>No drivers registered yet</td></tr>
              ) : drivers.map(d => {
                const done = d.route?.stops?.filter(s => s.status === 'completed').length || 0;
                const total = d.route?.stops?.length || 0;
                return (
                  <tr key={d._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{d.email}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{d.employeeId || '—'}</td>
                    <td>{d.vehicleId || '—'}</td>
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

// ─── Routes ───────────────────────────────────────────────────────────────────
function RoutesView({ token }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    api.get('/admin/routes', { headers }).then(r => setRoutes(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="header">
        <div className="header-title"><h1>Today's Routes</h1><p>All active collection routes for {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
      </div>
      <div className="card">
        {loading ? <Spinner /> : routes.length === 0 ? (
          <p className="empty-msg">No routes created today. Routes are auto-generated when a driver logs in.</p>
        ) : (
          <table>
            <thead><tr><th>Driver</th><th>Vehicle</th><th>Status</th><th>Progress</th><th>Stops</th><th>Started</th></tr></thead>
            <tbody>
              {routes.map(r => {
                const done = r.stops?.filter(s => s.status === 'completed').length || 0;
                const total = r.stops?.length || 0;
                return (
                  <tr key={r._id}>
                    <td><div style={{ fontWeight: 600 }}>{r.driver?.name || 'Unknown'}</div><div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{r.driver?.phone}</div></td>
                    <td style={{ fontFamily: 'monospace' }}>{r.vehicleId}</td>
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

// ─── Schedules ────────────────────────────────────────────────────────────────
function SchedulesView({ token }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    api.get('/admin/schedules', { headers }).then(r => setSchedules(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  return (
    <div>
      <div className="header">
        <div className="header-title"><h1>Collection Schedules</h1><p>Weekly waste collection timetable by zone</p></div>
      </div>
      <div className="card">
        {loading ? <Spinner /> : schedules.length === 0 ? (
          <p className="empty-msg">No schedules configured yet. Schedules are created in the database by the admin.</p>
        ) : (
          <table>
            <thead><tr><th>Day</th><th>Zone</th><th>Type</th><th>Time Slot</th><th>Driver</th><th>Status</th></tr></thead>
            <tbody>
              {schedules.map(s => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 600 }}>{days[s.dayOfWeek] ?? s.dayOfWeek}</td>
                  <td>{s.zone || '—'}</td>
                  <td>{s.type || '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{s.timeSlot || '—'}</td>
                  <td>{s.driver?.name || 'Unassigned'}</td>
                  <td><Badge status={s.status || 'active'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────
function AnalyticsView({ token }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    api.get('/admin/stats', { headers }).then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const total = stats?.totalComplaints || 0;

  return (
    <div>
      <div className="header">
        <div className="header-title"><h1>Analytics</h1><p>System performance and complaint insights</p></div>
      </div>
      <div className="stats-grid">
        <StatCard label="Resolution Rate" value={`${stats?.resolutionRate || 0}%`} sub="Complaints resolved" color="var(--primary)" />
        <StatCard label="Open Complaints" value={stats?.openComplaints} sub="Awaiting action" color="var(--accent-amber)" />
        <StatCard label="In Progress" value={stats?.inProgressComplaints} sub="Being handled" color="var(--accent-blue)" />
        <StatCard label="Completed Routes" value={stats?.completedRoutes} sub="Today" color="var(--accent-purple)" />
      </div>
      <div className="two-col">
        <div className="card">
          <h3 className="card-title">Category Breakdown</h3>
          {stats?.byCategory?.length > 0 ? (
            <div className="bar-list">
              {stats.byCategory.map(c => {
                const pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
                return (
                  <div key={c._id} className="bar-item">
                    <div className="bar-label"><span>{c._id || 'Other'}</span><span style={{ color: 'var(--primary)' }}>{pct}%</span></div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{c.count} complaint{c.count !== 1 ? 's' : ''}</div>
                  </div>
                );
              })}
            </div>
          ) : <p className="empty-msg">No data yet</p>}
        </div>
        <div className="card">
          <h3 className="card-title">7-Day Trend</h3>
          {stats?.trend?.length > 0 ? (
            <div className="trend-chart">
              {stats.trend.map(t => {
                const maxVal = Math.max(...stats.trend.map(x => x.count), 1);
                const h = Math.max(6, Math.round((t.count / maxVal) * 100));
                return (
                  <div key={t._id} className="trend-bar-wrap">
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
          <SideLink to="/drivers" icon="drivers" label="Drivers" />
          <SideLink to="/citizens" icon="users" label="Citizens" />
          <SideLink to="/routes" icon="routes" label="Routes" />
          <SideLink to="/schedules" icon="schedules" label="Schedules" />
          <SideLink to="/analytics" icon="analytics" label="Analytics" />
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
          <Route path="/drivers" element={<DriversView token={token} />} />
          <Route path="/citizens" element={<CitizensView token={token} />} />
          <Route path="/routes" element={<RoutesView token={token} />} />
          <Route path="/schedules" element={<SchedulesView token={token} />} />
          <Route path="/analytics" element={<AnalyticsView token={token} />} />
        </Routes>
      </main>
    </div>
  );
}
