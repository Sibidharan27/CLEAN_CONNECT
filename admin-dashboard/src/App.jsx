import React, { useState, useEffect } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api';

function DashboardView() {
  const [stats, setStats] = useState({ complaints: 14, drivers: 5, activeRoutes: 3, efficiency: '94%' });
  return (
    <div>
      <div className="header">
        <div className="header-title">
          <h1>System Overview</h1>
          <p>Real-time metrics for CleanConnect+ waste collection network</p>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">Total Complaints</div>
          <div className="stat-value">{stats.complaints}</div>
          <div className="stat-sub">↑ 12% from yesterday</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">Active Drivers</div>
          <div className="stat-value">{stats.drivers}</div>
          <div className="stat-sub">On duty</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">Active Routes</div>
          <div className="stat-value">{stats.activeRoutes}</div>
          <div className="stat-sub">In progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">Collection Rate</div>
          <div className="stat-value">{stats.efficiency}</div>
          <div className="stat-sub">Target met</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Recent Waste Complaints</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Location</th>
              <th>Category</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>#CMP-104</td>
              <td>Main Street, Sector 4</td>
              <td>Overflowing Bin</td>
              <td><span className="badge badge-pending">Pending</span></td>
              <td>Today, 10:15 AM</td>
            </tr>
            <tr>
              <td>#CMP-103</td>
              <td>Market Square, Block B</td>
              <td>Illegal Dumping</td>
              <td><span className="badge badge-in_progress">In Progress</span></td>
              <td>Today, 09:30 AM</td>
            </tr>
            <tr>
              <td>#CMP-102</td>
              <td>Park Avenue #12</td>
              <td>Missed Collection</td>
              <td><span className="badge badge-resolved">Resolved</span></td>
              <td>Yesterday</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComplaintsView() {
  return (
    <div>
      <div className="header">
        <div className="header-title">
          <h1>Complaints Management</h1>
          <p>Monitor and update reported waste collection issues</p>
        </div>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Complaint ID</th>
              <th>Citizen Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>#CMP-104</td>
              <td>Jane Doe</td>
              <td>Bin overflowing near community park entrance</td>
              <td><span className="badge badge-pending">Pending</span></td>
              <td><button className="btn">Assign Driver</button></td>
            </tr>
            <tr>
              <td>#CMP-103</td>
              <td>Alex Smith</td>
              <td>Construction debris left on road side</td>
              <td><span className="badge badge-in_progress">In Progress</span></td>
              <td><button className="btn">Mark Resolved</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DriversView() {
  return (
    <div>
      <div className="header">
        <div className="header-title">
          <h1>Driver Fleet</h1>
          <p>Active collection drivers and vehicle assignment</p>
        </div>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Driver Name</th>
              <th>Vehicle ID</th>
              <th>Assigned Route</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>John Driver</td>
              <td>TRUCK-01</td>
              <td>Route A - Sector 4 & 5</td>
              <td><span className="badge badge-resolved">On Route</span></td>
            </tr>
            <tr>
              <td>David Miller</td>
              <td>TRUCK-03</td>
              <td>Route B - Market Zone</td>
              <td><span className="badge badge-resolved">On Route</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GenericView({ title }) {
  return (
    <div>
      <div className="header">
        <div className="header-title">
          <h1>{title}</h1>
          <p>Manage {title.toLowerCase()} from this section</p>
        </div>
      </div>
      <div className="card">
        <p style={{ color: 'var(--text-muted)' }}>Workspace control active for {title}.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <div className="brand-icon">+</div>
          <span className="brand-title">CleanConnect</span>
          <span className="brand-badge">ADMIN</span>
        </div>
        <nav>
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
          <NavLink to="/complaints" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Complaints</NavLink>
          <NavLink to="/drivers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Drivers</NavLink>
          <NavLink to="/routes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Routes</NavLink>
          <NavLink to="/schedules" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Schedules</NavLink>
          <NavLink to="/analytics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Analytics</NavLink>
        </nav>
      </aside>
      <main>
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/complaints" element={<ComplaintsView />} />
          <Route path="/drivers" element={<DriversView />} />
          <Route path="/routes" element={<GenericView title="Routes" />} />
          <Route path="/schedules" element={<GenericView title="Schedules" />} />
          <Route path="/analytics" element={<GenericView title="Analytics" />} />
        </Routes>
      </main>
    </div>
  );
}
