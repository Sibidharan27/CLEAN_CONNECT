import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import api from './services/api';
import logoImg from './assets/adaptive-icon.png';

// ─── Icons (inline SVG) ───────────────────────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
  const icons = {
    dashboard: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>,
    hotspot: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z M12 4c4.41 0 8 3.59 8 8s-3.59 8-8 8-8-3.59-8-8 3.59-8 8-8z"/>,
    zones: <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>,
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
    alert: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>,
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
          <img src={logoImg} alt="CleanConnect Logo" className="brand-icon" style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover', margin: '0 auto 12px', display: 'block' }} />
          <h1 className="login-title">CleanConnect+</h1>
          <p className="login-subtitle">Admin Control Panel • Peelamedu Zone Management</p>
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
        {/* <p className="login-hint">
          Default credentials: <strong>admin@cleanconnect.gov.in</strong> &bull; password: <strong>admin123</strong>
        </p> */}
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
    'no route': ['badge-dim', 'no route'],
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
        <div className="header-title"><h1>Peelamedu System Overview</h1><p>Real-time metrics</p></div>
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
          <h1>Peelamedu System Overview</h1>
          <p>Real-time metrics for CleanConnect+ Peelamedu Zone-Based Waste Collection Network</p>
        </div>
        <button className="btn btn-outline" onClick={load}><Icon name="refresh" size={15} /> Refresh</button>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Complaints" value={s.totalComplaints ?? 0} sub={`${s.openComplaints ?? 0} open · ${s.inProgressComplaints ?? 0} in progress`} color="var(--accent-amber)" />
        <StatCard label="Resolved Complaints" value={s.resolvedComplaints ?? 0} sub={`${s.resolutionRate ?? 0}% resolution rate`} color="var(--primary)" />
        <StatCard label="Peelamedu Drivers" value={s.totalDrivers ?? 0} sub={`${s.activeRoutes ?? 0} zone routes active today`} color="var(--accent-blue)" />
        <StatCard label="Fleet Vehicles" value={s.totalVehicles ?? 0} sub={`${s.activeVehicles ?? 0} active · ${s.maintenanceVehicles ?? 0} in maintenance`} color="var(--accent-purple)" />
      </div>

      {/* Category Breakdown & Trend */}
      <div className="two-col">
        <div className="card">
          <h3 className="card-title">Complaints by Category (Peelamedu)</h3>
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

// ─── Hotspot Analysis & Zone Prioritization View ──────────────────────────────
function HotspotAnalysisView({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState('all');
  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/hotspots', { headers });
      setData(res.data);
    } catch (e) {
      console.error('Hotspot analytics error:', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;

  const zones = data?.zones || [];
  const filteredZones = selectedZone === 'all' ? zones : zones.filter(z => z.zoneId === selectedZone);

  return (
    <div>
      <div className="header">
        <div className="header-title">
          <h1>Garbage Hotspot Analysis &amp; Zone Prioritization</h1>
          <p>Peelamedu Street-by-Street Hotspot Detection, Risk Scoring &amp; Municipal Clearance Prioritization</p>
        </div>
        <button className="btn btn-outline" onClick={load}><Icon name="refresh" size={15} /> Refresh Data</button>
      </div>

      {/* Summary KPI Cards */}
      <div className="stats-grid">
        <StatCard
          label="Highest Priority Zone"
          value={data?.highestPriorityZone?.replace('Peelamedu – ', '') || 'PSG Zone'}
          sub="Requires immediate vehicle dispatch"
          color="var(--accent-red)"
        />
        <StatCard
          label="Top Critical Hotspot Street"
          value={data?.topCriticalStreet?.streetName || 'Peelamedu Colony 3rd St'}
          sub={`${data?.topCriticalStreet?.totalComplaints || 4} reported complaints`}
          color="var(--accent-amber)"
        />
        <StatCard
          label="Open Hotspot Complaints"
          value={data?.totalOpenComplaints || 0}
          sub="Across all Peelamedu Zones"
          color="var(--accent-blue)"
        />
        <StatCard
          label="Monitored Zones"
          value={data?.totalZones || 3}
          sub="18 compact residential streets"
          color="var(--primary)"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="toolbar" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)' }}>
          🔍 Filter by Peelamedu Zone:
        </div>
        <select
          className="filter-select"
          value={selectedZone}
          onChange={e => setSelectedZone(e.target.value)}
        >
          <option value="all">All Peelamedu Zones ({zones.length})</option>
          {zones.map(z => (
            <option key={z.zoneId} value={z.zoneId}>{z.zoneName}</option>
          ))}
        </select>
      </div>

      {/* Zone Prioritization Cards Grid */}
      <div className="hotspot-grid">
        {filteredZones.map(z => (
          <div key={z.zoneId} className="hotspot-card">
            <div className="hotspot-card-header">
              <div>
                <div className="hotspot-zone-title">{z.zoneName}</div>
                <div className="hotspot-zone-meta">
                  Driver: <strong>{z.driverName}</strong> • Vehicle: <strong>{z.vehicleId}</strong>
                </div>
              </div>
              <span className={`priority-pill priority-${z.priorityLevel.toLowerCase()}`}>
                {z.priorityLevel} PRIORITY
              </span>
            </div>

            {/* Metrics */}
            <div className="hotspot-metrics-row">
              <div className="metric-cell">
                <div className="metric-val" style={{ color: 'var(--accent-red)' }}>{z.openComplaints}</div>
                <div className="metric-lbl">Open</div>
              </div>
              <div className="metric-cell">
                <div className="metric-val" style={{ color: 'var(--accent-amber)' }}>{z.overflowingBins}</div>
                <div className="metric-lbl">Overflowing</div>
              </div>
              <div className="metric-cell">
                <div className="metric-val" style={{ color: 'var(--primary)' }}>{z.resolvedComplaints}</div>
                <div className="metric-lbl">Resolved</div>
              </div>
            </div>

            {/* Street Hotspot List */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                Street-by-Street Hotspots &amp; Risk:
              </div>
              <div className="street-hotspot-list">
                {z.streets.map(st => {
                  const riskClass = st.riskLevel === 'Critical Hotspot' ? 'risk-critical' : st.riskLevel === 'Moderate Risk' ? 'risk-moderate' : 'risk-normal';
                  const badgeClass = st.riskLevel === 'Critical Hotspot' ? 'critical' : st.riskLevel === 'Moderate Risk' ? 'moderate' : 'normal';
                  return (
                    <div key={st.streetName} className={`street-hotspot-item ${riskClass}`}>
                      <div>
                        <div className="street-item-name">{st.streetName}</div>
                        <div className="street-item-sub">
                          {st.totalComplaints} complaints · {st.housesCount} houses · {st.binType}
                        </div>
                      </div>
                      <span className={`risk-badge ${badgeClass}`}>
                        {st.riskLevel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Route Status footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-color)', fontSize: 12 }}>
              <span style={{ color: 'var(--text-dim)' }}>
                Collection: <strong>{z.scheduleDay}</strong> ({z.timeSlot})
              </span>
              <span style={{ fontWeight: 700, color: z.routeStatus === 'active' ? 'var(--primary)' : 'var(--accent-amber)' }}>
                {z.routeStatus === 'active' ? '🚚 Route In Progress' : '⏳ Route Pending'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Street Hotspot Frequency Table */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 16 }}>
          Peelamedu Street Hotspot Ranking &amp; Clearance Breakdown
        </h3>
        <table>
          <thead>
            <tr>
              <th>Street Name</th>
              <th>Zone</th>
              <th>Total Complaints</th>
              <th>Open Issues</th>
              <th>High Priority</th>
              <th>Risk Level</th>
              <th>Assigned Vehicle</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredZones.flatMap(z => z.streets.map(s => ({ ...s, zoneName: z.zoneName, vehicleId: z.vehicleId }))).map((st, idx) => (
              <tr key={st.streetName + idx}>
                <td style={{ fontWeight: 700 }}>{st.streetName}</td>
                <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{st.zoneName}</td>
                <td>
                  <span style={{ fontWeight: 800, color: st.totalComplaints > 0 ? 'var(--accent-amber)' : 'var(--text-dim)' }}>
                    {st.totalComplaints}
                  </span>
                </td>
                <td>
                  <span style={{ color: st.openComplaints > 0 ? 'var(--accent-red)' : 'var(--text-dim)', fontWeight: 600 }}>
                    {st.openComplaints}
                  </span>
                </td>
                <td>
                  <span style={{ color: st.highPriorityComplaints > 0 ? 'var(--accent-red)' : 'var(--text-dim)' }}>
                    {st.highPriorityComplaints}
                  </span>
                </td>
                <td>
                  <span className={`risk-badge ${st.riskLevel === 'Critical Hotspot' ? 'critical' : st.riskLevel === 'Moderate Risk' ? 'moderate' : 'normal'}`}>
                    {st.riskLevel}
                  </span>
                </td>
                <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>{st.vehicleId}</td>
                <td>
                  <span className={`badge ${st.openComplaints > 0 ? 'badge-pending' : 'badge-resolved'}`}>
                    {st.openComplaints > 0 ? 'Action Needed' : 'Cleared'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Zones & Streets Management View ──────────────────────────────────────────
function ZonesView({ token }) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/hotspots', { headers });
      setZones(res.data.zones || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="header">
        <div className="header-title">
          <h1>Peelamedu Zones &amp; Streets Management</h1>
          <p>Single source of truth for Area → Zone → 5–6 Streets → Driver → Vehicle → Schedule</p>
        </div>
        <button className="btn btn-outline" onClick={load}><Icon name="refresh" size={15} /> Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {zones.map(z => (
          <div key={z.zoneId} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 className="card-title" style={{ fontSize: 17, marginBottom: 2 }}>{z.zoneName}</h3>
                <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>Area: Peelamedu</span>
              </div>
              <span className="badge badge-resolved">{z.streets.length} Streets</span>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 'var(--radius-sm)', marginBottom: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', display: 'block' }}>Assigned Driver</span>
                  <strong>{z.driverName}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', display: 'block' }}>Assigned Vehicle</span>
                  <strong style={{ color: 'var(--primary)' }}>{z.vehicleId}</strong> ({z.vehiclePlate})
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', display: 'block' }}>Collection Day</span>
                  <span>{z.scheduleDay}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: 11, textTransform: 'uppercase', display: 'block' }}>Time Slot</span>
                  <span>{z.timeSlot}</span>
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                Streets inside this Zone ({z.streets.length}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {z.streets.map((st, i) => (
                  <div key={st.streetName} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--bg-surface)', borderRadius: 6, fontSize: 13 }}>
                    <span style={{ width: 20, height: 20, borderRadius: 10, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>
                      {i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{st.streetName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{st.landmark} · {st.housesCount} homes · {st.binType}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Complaint Detail Modal ───────────────────────────────────────────────────
function ComplaintDetailModal({ complaint, onClose, apiBase }) {
  if (!complaint) return null;
  const { title, category, description, location, priority, status, images,
          citizen, assignedDriver, timeline, createdAt, zone, street, area } = complaint;
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
              {images.map((img, i) => {
                const backendBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
                const imgSrc = img.startsWith('http') ? img : `${backendBase}${img.startsWith('/') ? '' : '/'}${img}`;
                return (
                  <a key={i} href={imgSrc} target="_blank" rel="noopener noreferrer">
                    <img
                      src={imgSrc}
                      alt={`Evidence ${i + 1}`}
                      style={{ width: 140, height: 100, objectFit: 'cover', borderRadius: 10, border: '2px solid var(--border-color)', cursor: 'pointer', transition: 'opacity .2s' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          {[
            ['Zone', zone || 'Peelamedu – PSG Zone'],
            ['Street', street || location?.address || '—'],
            ['Category', category || '—'],
            ['Priority', priority || '—'],
            ['Status', status || '—'],
            ['Submitted', createdAt ? new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'],
          ].map(([label, val]) => (
            <div key={label} style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, color: 'var(--text-main)', fontWeight: 500 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16, background: 'var(--bg-surface)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Description</div>
          <p style={{ fontSize: 14, color: 'var(--text-main)', lineHeight: 1.6, margin: 0 }}>{description || '—'}</p>
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
  const [modal, setModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);

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
        <div className="header-title"><h1>Complaints Management</h1><p>Monitor, prioritize and resolve reported waste issues across Peelamedu zones</p></div>
        <button className="btn btn-outline" onClick={load}><Icon name="refresh" size={15} /> Refresh</button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Icon name="search" size={16} />
          <input placeholder="Search complaints by street, citizen or keyword..." value={search} onChange={e => setSearch(e.target.value)} />
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
              <th>ID</th><th>Citizen</th><th>Zone &amp; Street</th><th>Category</th>
              <th>Priority</th><th>Status</th><th>Assigned Driver</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {complaints.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 32 }}>No complaints found</td></tr>
              ) : complaints.map(c => (
                <tr key={c._id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{c._id.slice(-6).toUpperCase()}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.citizen?.name || 'Citizen'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{c.citizen?.email}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{c.street || c.location?.address || 'Peelamedu'}</div>
                    <div style={{ fontSize: 12, color: 'var(--primary)' }}>{c.zone || 'Peelamedu – PSG Zone'}</div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.category}</td>
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
        />
      )}

      {/* Assign Driver Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="card-title">Assign Driver to Complaint</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
              Complaint: <strong>{modal.title}</strong>
            </p>
            <div className="driver-list">
              {drivers.map(d => (
                <button key={d._id} className="driver-select-btn" onClick={() => assignDriver(modal._id, d._id)}>
                  <Icon name="truck" size={16} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{d.vehicleId || 'No vehicle'} · {d.zone || 'Peelamedu Zone'}</div>
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

const COMPLAINT_PERIOD_OPTIONS = [
  { value: '1-months', period: 1, unit: 'months', label: 'Last 1 Month', text: '1 Month' },
  { value: '3-months', period: 3, unit: 'months', label: 'Last 3 Months', text: '3 Months' },
  { value: '6-months', period: 6, unit: 'months', label: 'Last 6 Months', text: '6 Months' },
  { value: '1-years',  period: 1, unit: 'years',  label: 'Last 1 Year',   text: '1 Year' },
  { value: '2-years',  period: 2, unit: 'years',  label: 'Last 2 Years',  text: '2 Years' },
];

// ─── Drivers View ─────────────────────────────────────────────────────────────
function DriversView({ token }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', vehicleId: '', employeeId: '', zone: 'Peelamedu – PSG Zone', shift: '6:00 AM - 2:00 PM' });
  const [adding, setAdding] = useState(false);

  // Complaint completion time filter state
  const [selectedPeriod, setSelectedPeriod] = useState('1-months');
  const [filterPeriod, setFilterPeriod] = useState(1);
  const [filterUnit, setFilterUnit] = useState('months');
  const [filterLabel, setFilterLabel] = useState('Last 1 Month');
  const [complaintStatsMap, setComplaintStatsMap] = useState({});
  const [statsLoading, setStatsLoading] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const loadComplaintStats = useCallback(async (period, unit) => {
    setStatsLoading(true);
    try {
      const res = await api.get(`/admin/drivers/complaint-stats?period=${period}&unit=${unit}`, { headers });
      setComplaintStatsMap(res.data?.countMap || {});
    } catch (e) {
      console.error('Failed to load driver complaint stats:', e);
    } finally {
      setStatsLoading(false);
    }
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/drivers', { headers });
      setDrivers(res.data);
      await loadComplaintStats(filterPeriod, filterUnit);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [token, filterPeriod, filterUnit, loadComplaintStats]);

  useEffect(() => { load(); }, [load]);

  const handlePeriodDropdownChange = (e) => {
    const val = e.target.value;
    setSelectedPeriod(val);
    const opt = COMPLAINT_PERIOD_OPTIONS.find(o => o.value === val);
    if (opt) {
      setFilterPeriod(opt.period);
      setFilterUnit(opt.unit);
      setFilterLabel(opt.label);
      loadComplaintStats(opt.period, opt.unit);
    }
  };

  const addDriver = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post('/admin/drivers', form, { headers });
      setShowAdd(false);
      setForm({ name: '', email: '', password: '', phone: '', vehicleId: '', employeeId: '', zone: 'Peelamedu – PSG Zone', shift: '6:00 AM - 2:00 PM' });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add driver');
    } finally { setAdding(false); }
  };

  const totalResolvedInPeriod = Object.values(complaintStatsMap).reduce((a, b) => a + b, 0);
  const avgPerDriver = drivers.length > 0 ? (totalResolvedInPeriod / drivers.length).toFixed(1) : '0';
  const maxDriverCount = Math.max(1, ...Object.values(complaintStatsMap));

  const driverStatsList = drivers.map(d => {
    const count = complaintStatsMap[d._id] ?? 0;
    const share = totalResolvedInPeriod > 0 ? ((count / totalResolvedInPeriod) * 100).toFixed(1) : 0;
    let status = 'balanced';
    let statusLabel = 'Balanced Workload';
    let recommendation = 'Even workload';
    const fleetAvg = drivers.length > 0 ? (totalResolvedInPeriod / drivers.length) : 0;
    if (count > fleetAvg * 1.25 && count > 0) {
      status = 'heavy';
      statusLabel = 'Heavy Workload ⚠️';
      recommendation = 'Reduce new assignments';
    } else if (count < fleetAvg * 0.75) {
      status = 'light';
      statusLabel = 'Light Workload ℹ️';
      recommendation = 'Assign upcoming complaints';
    }
    return { ...d, count, share, status, statusLabel, recommendation };
  });

  const heavyDriver = driverStatsList.find(d => d.status === 'heavy');
  const lightDriver = driverStatsList.find(d => d.status === 'light');


  return (
    <div>
      <div className="header">
        <div className="header-title">
          <h1>Driver Fleet</h1>
          <p>Manage drivers and vehicle assignments</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={load}><Icon name="refresh" size={15} /> Refresh</button>
          <button className="btn" onClick={() => setShowAdd(!showAdd)}><Icon name="plus" size={15} /> Add Driver</button>
        </div>
      </div>

      {/* Workload Balancing & Distribution KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: 16 }}>
        <StatCard
          label={`Resolved Complaints (${filterLabel})`}
          value={totalResolvedInPeriod}
          sub={`${drivers.length} active Peelamedu drivers`}
          color="var(--primary)"
        />
        <StatCard
          label="Fleet Average Per Driver"
          value={avgPerDriver}
          sub="Target average per driver"
          color="var(--accent-blue)"
        />
        <StatCard
          label="Workload Distribution"
          value={heavyDriver ? 'Imbalance Detected' : 'Workload Balanced'}
          sub={heavyDriver ? `Overload on ${heavyDriver.name}` : 'Evenly distributed across fleet'}
          color={heavyDriver ? 'var(--accent-amber)' : 'var(--primary)'}
        />
        <StatCard
          label="Task Allocation Advice"
          value={heavyDriver ? (lightDriver ? `Assign to ${lightDriver.name}` : 'Reduce new assignments') : 'Optimal Balance'}
          sub={heavyDriver ? `Distribute tasks to avoid driver fatigue` : 'All drivers within optimal capacity'}
          color={heavyDriver ? 'var(--accent-red)' : 'var(--primary)'}
        />
      </div>

      {/* Compact filter bar with Workload Balancing Banner */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>📋 Complaints Attended In:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                className="filter-select"
                value={selectedPeriod}
                onChange={handlePeriodDropdownChange}
                style={{ minWidth: 140, padding: '6px 12px', fontSize: 13, fontWeight: 600 }}
              >
                {COMPLAINT_PERIOD_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.text}
                  </option>
                ))}
              </select>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Resolved / closed complaints per driver · {filterLabel}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Workload Status:</span>
            <span className={`badge ${heavyDriver ? 'badge-pending' : 'badge-resolved'}`}>
              {heavyDriver ? '⚠️ Workload Imbalance' : '✅ Balanced Fleet'}
            </span>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 className="card-title">Add New Driver to Zone</h3>
          <form onSubmit={addDriver} className="add-form">
            {[['name','Full Name'],['email','Email'],['password','Password'],['phone','Phone'],['vehicleId','Vehicle ID'],['employeeId','Employee ID'],['zone','Peelamedu Zone'],['shift','Shift']].map(([k,l]) => (
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

      {/* Driver Fleet Table */}
      <div className="card">
        {loading ? <Spinner /> : (
          <table>
            <thead><tr>
              <th>Driver</th>
              <th>Employee ID</th>
              <th>Assigned Vehicle</th>
              <th>Zone</th>
              <th>Shift</th>
              <th>Today&apos;s Route</th>
              <th>Stops</th>
              <th>Complaints Attended<br /><span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-dim)', textTransform: 'none' }}>{filterLabel}</span></th>
              <th>Workload &amp; Allocation Advice</th>
            </tr></thead>
            <tbody>
              {driverStatsList.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 32 }}>No drivers registered yet</td></tr>
              ) : driverStatsList.map(d => {
                const done  = d.route?.stops?.filter(s => s.status === 'completed').length || 0;
                const total = d.route?.stops?.length || 0;
                const veh   = d.assignedVehicle;
                const barWidth = maxDriverCount > 0 ? Math.round((d.count / maxDriverCount) * 100) : 0;
                const barColor = d.status === 'heavy' ? 'var(--accent-amber)' : d.status === 'light' ? 'var(--accent-blue)' : 'var(--primary)';
                return (
                  <tr key={d._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{d.email}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{d.employeeId || '—'}</td>
                    <td>
                      {veh ? (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{VEHICLE_TYPES[veh.type]?.emoji} {veh.vehicleId}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{veh.plateNumber}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>{d.vehicleId || '—'}</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-main)', fontSize: 13 }}>{d.zone || 'Peelamedu – PSG Zone'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{d.shift || '—'}</td>
                    <td><Badge status={d.route?.status || 'no route'} /></td>
                    <td>
                      {total > 0 ? (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{done}/{total}</div>
                          <div className="mini-bar" style={{ marginTop: 4 }}><div className="mini-fill" style={{ width: `${total > 0 ? (done/total)*100 : 0}%` }} /></div>
                        </div>
                      ) : <span style={{ color: 'var(--text-dim)' }}>—</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 18, fontWeight: 800, color: barColor }}>{statsLoading ? '…' : d.count}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>resolved ({d.share}%)</span>
                          </div>
                          <div style={{ width: 80, height: 4, borderRadius: 2, background: 'var(--border-color)', marginTop: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${barWidth}%`, height: '100%', background: barColor, borderRadius: 2 }} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span className={`badge ${d.status === 'heavy' ? 'badge-pending' : d.status === 'light' ? 'badge-blue' : 'badge-resolved'}`} style={{ fontSize: 11 }}>
                          {d.statusLabel}
                        </span>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                          👉 {d.recommendation}
                        </div>
                      </div>
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

// ─── Vehicles View ────────────────────────────────────────────────────────────
function VehiclesView({ token }) {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [assignModal, setAssignModal] = useState(null);
  const [form, setForm] = useState({ vehicleId: '', type: 'garbage_truck', plateNumber: '', capacity: '', currentArea: 'Peelamedu – PSG Zone', notes: '' });
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

  return (
    <div>
      <div className="header">
        <div className="header-title">
          <h1>Vehicle &amp; Machinery Fleet</h1>
          <p>{vehicles.length} vehicles assigned across Peelamedu zones</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={load}><Icon name="refresh" size={15} /> Refresh</button>
          <button className="btn" onClick={() => setShowAdd(!showAdd)}><Icon name="plus" size={15} /> Add Vehicle</button>
        </div>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 className="card-title">Add New Vehicle</h3>
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
              <label>Deployed Zone (Peelamedu)</label>
              <input value={form.currentArea} onChange={e => setForm(p => ({...p, currentArea: e.target.value}))} placeholder="Peelamedu – PSG Zone" />
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
              <th>Vehicle</th><th>Type</th><th>Plate</th><th>Capacity</th><th>Deployed Zone</th><th>Status</th><th>Assigned Driver</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 32 }}>No vehicles registered yet</td></tr>
              ) : vehicles.map(v => {
                const vt = VEHICLE_TYPES[v.type] || VEHICLE_TYPES.garbage_truck;
                const vs = VEHICLE_STATUS[v.status] || VEHICLE_STATUS.inactive;
                return (
                  <tr key={v._id}>
                    <td><div style={{ fontWeight: 700, fontSize: 14 }}>{v.vehicleId}</div></td>
                    <td>
                      <div className="vehicle-type-chip" style={{ '--vt-color': vt.color }}>
                        <span style={{ fontSize: 16 }}>{vt.emoji}</span>
                        <span>{vt.label}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{v.plateNumber}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{v.capacity || '—'}</td>
                    <td style={{ fontSize: 13 }}>{v.currentArea || 'Peelamedu'}</td>
                    <td><span className={`badge ${vs.cls}`}>{vs.label}</span></td>
                    <td>
                      {v.assignedDriver ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                            {v.assignedDriver.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{v.assignedDriver.name}</div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      <div className="action-btns">
                        {v.assignedDriver ? (
                          <button className="btn btn-sm btn-outline" onClick={() => unassignDriver(v._id)} disabled={updating === v._id}>Unassign</button>
                        ) : (
                          <button className="btn btn-sm btn-blue" onClick={() => setAssignModal(v)} disabled={updating === v._id}>Assign</button>
                        )}
                        {v.status === 'active' && (
                          <button className="btn btn-sm btn-amber" onClick={() => updateStatus(v._id, 'maintenance')}>🔧</button>
                        )}
                        {v.status === 'maintenance' && (
                          <button className="btn btn-sm" onClick={() => updateStatus(v._id, 'active')}>✅</button>
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
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{assignModal.plateNumber}</div>
              </div>
            </div>
            <div className="driver-list">
              {drivers.map(d => (
                <button key={d._id} className="driver-select-btn" onClick={() => assignDriver(assignModal._id, d._id)}>
                  <Icon name="drivers" size={16} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{d.zone || 'Peelamedu'}</div>
                  </div>
                </button>
              ))}
            </div>
            <button className="btn btn-outline" style={{ width: '100%', marginTop: 12 }} onClick={() => setAssignModal(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Citizens View ────────────────────────────────────────────────────────────
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
        <div className="header-title"><h1>Registered Citizens</h1><p>Citizen distribution across Peelamedu zones and streets</p></div>
      </div>
      <div className="card">
        {loading ? <Spinner /> : (
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Street</th><th>Zone</th><th>Area</th><th>Joined</th></tr></thead>
            <tbody>
              {citizens.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 32 }}>No citizens registered yet</td></tr>
              ) : citizens.map(c => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.email}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.phone || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{c.street || 'PSG Tech College Road'}</td>
                  <td style={{ color: 'var(--primary)' }}>{c.zone || 'Peelamedu – PSG Zone'}</td>
                  <td>{c.area || 'Peelamedu'}</td>
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

// ─── Routes View ──────────────────────────────────────────────────────────────
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
    if (!window.confirm('Delete all of today\'s routes? Each driver will get a fresh zone route on next login.')) return;
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
          <h1>Today&apos;s Street-by-Street Routes</h1>
          <p>Active garbage collection routes across Peelamedu zones for {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
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
      <div className="card">
        {loading ? <Spinner /> : routes.length === 0 ? (
          <p className="empty-msg">No active routes yet today. Routes generate when drivers log in.</p>
        ) : (
          <table>
            <thead><tr><th>Zone</th><th>Driver</th><th>Vehicle</th><th>Status</th><th>Street Progress</th><th>Total Streets</th><th>Started</th></tr></thead>
            <tbody>
              {routes.map(r => {
                const done = r.stops?.filter(s => s.status === 'completed').length || 0;
                const total = r.stops?.length || 0;
                return (
                  <tr key={r._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{r.zoneName || 'Peelamedu – PSG Zone'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Area: Peelamedu</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.driver?.name || 'Driver'}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>{r.vehicleId}</td>
                    <td><Badge status={r.status} /></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{done}/{total} streets</div>
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

// ─── Missed Collection Alerts View ───────────────────────────────────────────
const PRIORITY_STYLES = {
  medium:   { cls: 'badge-in_progress', label: 'Medium',   emoji: '🟡' },
  high:     { cls: 'badge-pending',     label: 'High',     emoji: '🟠' },
  critical: { cls: 'badge-dim',         label: 'Critical', emoji: '🔴' },
};
const ALERT_STATUS_MAP = {
  new:                   ['badge-pending',     'New'],
  under_review:          ['badge-in_progress', 'Under Review'],
  driver_contacted:      ['badge-blue',        'Driver Contacted'],
  recollection_required: ['badge-pending',     'Recollection Required'],
  resolved:              ['badge-resolved',    'Resolved'],
  dismissed:             ['badge-dim',         'Dismissed'],
};
function AlertBadge({ status }) {
  const [cls, label] = ALERT_STATUS_MAP[status] || ['badge-dim', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}
function PriorityBadge({ priority }) {
  const s = PRIORITY_STYLES[priority] || { cls: 'badge-dim', label: priority, emoji: '⚪' };
  return <span className={`badge ${s.cls}`}>{s.emoji} {s.label}</span>;
}

function MissedCollectionAlertsView({ token }) {
  const headers = { Authorization: `Bearer ${token}` };
  const [alerts, setAlerts]           = useState([]);
  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [selectedAlert, setSelected]  = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [noteText, setNoteText]       = useState('');
  const [dismissReason, setDismissReason] = useState('');
  const [resolveNote, setResolveNote] = useState('');
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);

  // Filters
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterZone,     setFilterZone]     = useState('all');
  const [filterDate,     setFilterDate]     = useState('');

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: pg, limit: 15 });
      if (filterStatus   !== 'all') params.append('status',   filterStatus);
      if (filterPriority !== 'all') params.append('priority', filterPriority);
      if (filterZone     !== 'all') params.append('zone',     filterZone);
      if (filterDate)               params.append('date',     filterDate);

      const [alertsRes, statsRes] = await Promise.all([
        api.get(`/alerts?${params}`,  { headers }),
        api.get('/alerts/stats',       { headers }),
      ]);
      setAlerts(alertsRes.data.alerts || []);
      setTotal(alertsRes.data.total   || 0);
      setTotalPages(alertsRes.data.totalPages || 1);
      setStats(statsRes.data);
      setPage(pg);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [token, filterStatus, filterPriority, filterZone, filterDate]);

  useEffect(() => { load(1); }, [load]);

  const openDetail = async (alertId) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/alerts/${alertId}`, { headers });
      setSelected(res.data);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to load alert detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const doAction = async (action, body = {}) => {
    if (!selectedAlert) return;
    setActionLoading(true);
    try {
      let res;
      if (action === 'note') {
        res = await api.post(`/alerts/${selectedAlert._id}/notes`, { note: noteText }, { headers });
        setNoteText('');
      } else if (action === 'recollection') {
        res = await api.post(`/alerts/${selectedAlert._id}/recollection`, body, { headers });
      } else {
        res = await api.patch(`/alerts/${selectedAlert._id}/status`, body, { headers });
      }
      setSelected(res.data);
      load(page);
    } catch (e) {
      alert(e.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const fmtTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';

  return (
    <div>
      {/* Header */}
      <div className="header">
        <div className="header-title">
          <h1>⚠️ Missed Collection Alerts</h1>
          <p>Smart detection of potential missed garbage collections — Peelamedu zones. Review evidence before taking action.</p>
        </div>
        <button className="btn btn-outline" onClick={() => load(page)}><Icon name="refresh" size={15} /> Refresh</button>
      </div>

      {/* KPI Stats */}
      {stats && (
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <StatCard label="Total Alerts"    value={stats.totalAlerts}   sub="All time"            color="var(--text-main)" />
          <StatCard label="Needs Review"    value={stats.newAlerts}     sub="Awaiting admin action" color="var(--accent-amber)" />
          <StatCard label="Under Review"    value={stats.underReview}   sub="Being investigated"  color="var(--accent-blue)" />
          <StatCard label="High / Critical" value={stats.highPriority}  sub="Elevated priority active" color="var(--accent-red)" />
        </div>
      )}

      {/* Filters */}
      <div className="toolbar" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <select id="alert-filter-status" className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="under_review">Under Review</option>
          <option value="driver_contacted">Driver Contacted</option>
          <option value="recollection_required">Recollection Required</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select id="alert-filter-priority" className="filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="all">All Priorities</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <select id="alert-filter-zone" className="filter-select" value={filterZone} onChange={e => setFilterZone(e.target.value)}>
          <option value="all">All Zones</option>
          <option value="PSG">PSG Zone</option>
          <option value="Hope">Hope College Zone</option>
          <option value="Avinashi">Avinashi Road Zone</option>
        </select>
        <input
          id="alert-filter-date"
          type="date"
          className="filter-select"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          style={{ background: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', fontFamily: 'inherit' }}
        />
        {(filterStatus !== 'all' || filterPriority !== 'all' || filterZone !== 'all' || filterDate) && (
          <button className="btn btn-outline" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => { setFilterStatus('all'); setFilterPriority('all'); setFilterZone('all'); setFilterDate(''); }}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Alert List */}
      <div className="card" style={{ marginBottom: 20 }}>
        {error && <div style={{ color: 'var(--accent-red)', padding: 16 }}>⚠️ {error}</div>}
        {loading ? <Spinner /> : alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, color: 'var(--primary)' }}>No alerts matching the current filters</div>
            <div style={{ color: 'var(--text-dim)', marginTop: 6, fontSize: 13 }}>The system will automatically create alerts when independent missed-collection reports meet the detection threshold.</div>
          </div>
        ) : (
          <table id="missed-collection-alert-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Status</th>
                <th>Street</th>
                <th>Zone</th>
                <th>Driver</th>
                <th>Reports</th>
                <th>First Report</th>
                <th>Last Report</th>
                <th>Collection Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(a => (
                <tr key={a._id} style={{ cursor: 'pointer' }} onClick={() => openDetail(a._id)}>
                  <td><PriorityBadge priority={a.priority} /></td>
                  <td><AlertBadge status={a.status} /></td>
                  <td style={{ fontWeight: 700, maxWidth: 160, wordBreak: 'break-word' }}>{a.street}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.zone?.replace('Peelamedu – ', '')}</td>
                  <td style={{ fontSize: 13 }}>{a.driver?.name || '—'}</td>
                  <td style={{ fontWeight: 700, color: a.independentReportCount >= 3 ? 'var(--accent-red)' : 'var(--accent-amber)' }}>
                    {a.independentReportCount} independent
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtTime(a.firstReportAt)}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmtTime(a.lastReportAt)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{a.collectionDate}</td>
                  <td>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={e => { e.stopPropagation(); openDetail(a._id); }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '0 4px' }}>
            <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{total} alerts total</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" style={{ padding: '4px 12px' }} disabled={page <= 1} onClick={() => load(page - 1)}>← Prev</button>
              <span style={{ alignSelf: 'center', fontSize: 13 }}>Page {page} / {totalPages}</span>
              <button className="btn btn-outline" style={{ padding: '4px 12px' }} disabled={page >= totalPages} onClick={() => load(page + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      {(selectedAlert || detailLoading) && (
        <div
          id="alert-detail-modal"
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            overflowY: 'auto', padding: '24px 16px',
          }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          {detailLoading ? <div style={{ alignSelf: 'center' }}><Spinner /></div> : selectedAlert && (
            <div style={{
              background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border-color)',
              width: '100%', maxWidth: 860, padding: 32, position: 'relative',
            }}>
              <button
                onClick={() => setSelected(null)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 22 }}
              >✕</button>

              {/* Title */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                  <PriorityBadge priority={selectedAlert.priority} />
                  <AlertBadge status={selectedAlert.status} />
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-dim)' }}>#{selectedAlert._id?.slice(-8)}</span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>
                  Missed Collection: {selectedAlert.street}
                </h2>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {selectedAlert.zone} · Collection Date: <strong>{selectedAlert.collectionDate}</strong>
                </div>
              </div>

              {/* Detection Reason Banner */}
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--accent-amber)' }}>
                <strong>⚠️ Why this alert was raised:</strong><br/>{selectedAlert.detectionReason || 'Detection rule triggered.'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {/* Driver & Vehicle */}
                <div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8, fontWeight: 700 }}>Assigned Driver</div>
                  {selectedAlert.driver ? (
                    <>
                      <div style={{ fontWeight: 700 }}>{selectedAlert.driver.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedAlert.driver.email}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedAlert.driver.phone || '—'}</div>
                      <div style={{ fontFamily: 'monospace', color: 'var(--primary)', marginTop: 4 }}>{selectedAlert.vehicleId || selectedAlert.driver.vehicleId}</div>
                    </>
                  ) : <div style={{ color: 'var(--text-dim)' }}>Not determined</div>}
                </div>

                {/* GPS / Route Evidence */}
                <div style={{ background: 'var(--bg-surface)', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8, fontWeight: 700 }}>Collection Evidence</div>
                  {selectedAlert.evidence ? (
                    <>
                      <div style={{ fontSize: 12, marginBottom: 4 }}>Route: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{selectedAlert.evidence.routeStatus || '—'}</span></div>
                      <div style={{ fontSize: 12, marginBottom: 4 }}>Stop status: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{selectedAlert.evidence.stopStatus || '—'}</span></div>
                      {selectedAlert.evidence.stopCompletedAt && <div style={{ fontSize: 12, marginBottom: 4 }}>Completed at: {fmtTime(selectedAlert.evidence.stopCompletedAt)}</div>}
                      {selectedAlert.evidence.shortDurationFlag && <div style={{ color: 'var(--accent-amber)', fontSize: 12, marginBottom: 4 }}>⚡ Short collection duration detected</div>}
                      {selectedAlert.evidence.driverNearStreet === true && <div style={{ color: 'var(--primary)', fontSize: 12 }}>✅ GPS: Vehicle near street during collection window</div>}
                      {selectedAlert.evidence.driverNearStreet === false && <div style={{ color: 'var(--accent-red)', fontSize: 12 }}>⚠️ GPS: No vehicle samples near this street</div>}
                      {selectedAlert.evidence.driverNearStreet === null && <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>GPS data unavailable for this period</div>}
                      {selectedAlert.evidence.exceptionReason && <div style={{ color: 'var(--accent-amber)', fontSize: 12, marginTop: 4 }}>Exception: {selectedAlert.evidence.exceptionReason}</div>}
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, fontStyle: 'italic' }}>{selectedAlert.evidence.summary}</div>
                    </>
                  ) : <div style={{ color: 'var(--text-dim)' }}>No evidence collected yet</div>}
                </div>
              </div>

              {/* Reports */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>Citizen Reports ({selectedAlert.reports?.length || 0} total, {selectedAlert.independentReportCount} independent)</div>
                {selectedAlert.reports?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedAlert.reports.map((r, i) => (
                      <div key={r._id || i} style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: 12, fontSize: 13 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600 }}>{r.citizen?.name || 'Citizen'} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>({r.citizen?.phone || r.citizen?.email || ''})</span></span>
                          <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{fmtTime(r.createdAt)}</span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{r.description}</div>
                        {r.images?.length > 0 && <div style={{ color: 'var(--accent-blue)', fontSize: 11 }}>📷 {r.images.length} photo(s) attached</div>}
                      </div>
                    ))}
                  </div>
                ) : <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>No reports loaded</div>}
              </div>

              {/* Recollection Status */}
              {selectedAlert.recollection && (
                <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13 }}>
                  <strong style={{ color: 'var(--accent-blue)' }}>🚛 Recollection Request</strong><br />
                  Status: <strong>{selectedAlert.recollection.status}</strong> · Requested: {fmtTime(selectedAlert.recollection.requestedAt)}
                  {selectedAlert.recollection.completedAt && <> · Completed: {fmtTime(selectedAlert.recollection.completedAt)}</>}
                  {selectedAlert.recollection.note && <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>{selectedAlert.recollection.note}</div>}
                </div>
              )}

              {/* Investigation Notes */}
              {selectedAlert.investigationNotes?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Investigation Notes</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedAlert.investigationNotes.map((n, i) => (
                      <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--text-muted)' }}>📝 {n}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Trail */}
              {selectedAlert.auditTrail?.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Audit Timeline</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[...selectedAlert.auditTrail].reverse().map((e, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--text-dim)', minWidth: 120 }}>{fmtTime(e.time)}</span>
                        <span><strong style={{ color: 'var(--text-main)' }}>{e.adminName || 'System'}</strong>: {e.action.replace(/_/g,' ')} — {e.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              {!['resolved', 'dismissed'].includes(selectedAlert.status) && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
                  <div style={{ fontWeight: 700, marginBottom: 12 }}>Admin Actions</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                    {selectedAlert.status === 'new' && (
                      <button id="alert-action-review" className="btn" disabled={actionLoading} onClick={() => doAction('status', { status: 'under_review', note: 'Admin started investigation' })}>Mark Under Review</button>
                    )}
                    {['under_review', 'new'].includes(selectedAlert.status) && (
                      <button id="alert-action-contact" className="btn btn-outline" disabled={actionLoading} onClick={() => doAction('status', { status: 'driver_contacted', note: 'Driver has been contacted for explanation' })}>Driver Contacted</button>
                    )}
                    {!['recollection_required'].includes(selectedAlert.status) && (
                      <button id="alert-action-recollection" className="btn btn-outline" style={{ borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }} disabled={actionLoading} onClick={() => doAction('recollection', { note: `Recollection requested for ${selectedAlert.street}` })}>🚛 Request Recollection</button>
                    )}
                  </div>

                  {/* Add Note */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>Add Investigation Note</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        id="alert-note-input"
                        type="text"
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Type a note..."
                        style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-main)', fontFamily: 'inherit', fontSize: 13 }}
                      />
                      <button id="alert-note-submit" className="btn" disabled={actionLoading || !noteText.trim()} onClick={() => doAction('note')}>Add Note</button>
                    </div>
                  </div>

                  {/* Resolve */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      id="alert-resolve-input"
                      type="text"
                      value={resolveNote}
                      onChange={e => setResolveNote(e.target.value)}
                      placeholder="Resolution summary (required)"
                      style={{ flex: 1, minWidth: 200, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-main)', fontFamily: 'inherit', fontSize: 13 }}
                    />
                    <button id="alert-resolve-btn" className="btn" style={{ background: 'var(--primary)', borderColor: 'var(--primary)' }} disabled={actionLoading || !resolveNote.trim()} onClick={() => { doAction('status', { status: 'resolved', note: resolveNote }); setResolveNote(''); }}>✅ Resolve</button>
                    <input
                      id="alert-dismiss-input"
                      type="text"
                      value={dismissReason}
                      onChange={e => setDismissReason(e.target.value)}
                      placeholder="Dismiss reason (required)"
                      style={{ flex: 1, minWidth: 200, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-main)', fontFamily: 'inherit', fontSize: 13 }}
                    />
                    <button id="alert-dismiss-btn" className="btn btn-outline" style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }} disabled={actionLoading || !dismissReason.trim()} onClick={() => { doAction('status', { status: 'dismissed', reason: dismissReason }); setDismissReason(''); }}>🗑 Dismiss</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
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
          <img src={logoImg} alt="CleanConnect Logo" className="brand-icon" style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'cover' }} />
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
          <SideLink to="/hotspots" icon="hotspot" label="Hotspot Analysis" />
          <SideLink to="/zones" icon="zones" label="Zones & Streets" />
          <SideLink to="/complaints" icon="complaints" label="Complaints" />
          <SideLink to="/alerts" icon="alert" label="Missed Collection Alerts" />
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
          <Route path="/hotspots" element={<HotspotAnalysisView token={token} />} />
          <Route path="/zones" element={<ZonesView token={token} />} />
          <Route path="/complaints" element={<ComplaintsView token={token} />} />
          <Route path="/alerts" element={<MissedCollectionAlertsView token={token} />} />
          <Route path="/vehicles" element={<VehiclesView token={token} />} />
          <Route path="/drivers" element={<DriversView token={token} />} />
          <Route path="/citizens" element={<CitizensView token={token} />} />
          <Route path="/routes" element={<RoutesView token={token} />} />
        </Routes>
      </main>
    </div>
  );
}
