import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div className="stack">
      <div className="card">
        <h3 className="card-title">SYSTEM OVERVIEW</h3>
        <div className="stat-row">
          <div className="stat-box"><h2>245</h2><p>Students</p></div>
          <div className="stat-box"><h2>32</h2><p>Teachers</p></div>
          <div className="stat-box"><h2>48</h2><p>Courses</p></div>
          <div className="stat-box"><h2>127</h2><p>Sessions</p></div>
          <div className="stat-box live"><h2>3</h2><p>Live</p></div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">RECENT ACTIVITY</h3>
        <ul className="activity-list">
          <li><span className="dot"></span> Dr. Priya created session · 2m ago</li>
          <li><span className="dot"></span> 45 students marked · 5m ago</li>
          <li><span className="dot"></span> New user registered · 12m ago</li>
        </ul>
      </div>

      <div className="card">
        <h3 className="card-title">QUICK ACTIONS</h3>
        <div className="row-gap">
          <Link to="/admin/users" className="btn btn-ghost">👥 Manage Users</Link>
          <Link to="/admin/courses" className="btn btn-ghost">📚 Courses</Link>
          <Link to="/admin/reports" className="btn btn-ghost">📊 Reports</Link>
        </div>
      </div>
    </div>
  );
}