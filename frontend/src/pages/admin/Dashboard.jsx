import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // 🔥 Import AuthContext
import client from "../../api/client";
import { Users, BookOpen, Activity, LogOut } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth(); // 🔥 Logout function
  const [data, setData] = useState(null);

  useEffect(() => {
    client.get("/admin/dashboard")
      .then((res) => setData(res.data.data))
      .catch((err) => console.error(err));
  }, []);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await logout();
      navigate("/login");
    }
  };

  if (!data) return <div className="loader-full">Loading Dashboard...</div>;

  return (
    <div className="stack pb-20">
      {/* Welcome Banner with Logout Button */}
      <div className="welcome-banner flex justify-between items-center" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: '1.5rem', borderRadius: '16px' }}>
        <div>
          <h2 className="m-0 text-white">Admin Panel</h2>
          <p className="text-indigo-100 mt-1">System Overview & Analytics</p>
        </div>
        
        <button 
          onClick={handleLogout} 
          className="btn btn-danger sm shadow-md hover:scale-105 transition-transform flex items-center gap-2"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-4">
        <div className="card stat-modern">
          <div className="stat-icon bg-indigo"><Users size={24} /></div>
          <div><h3 className="m-0">{data.overview.students}</h3><p className="muted small">Students</p></div>
        </div>
        <div className="card stat-modern">
          <div className="stat-icon bg-green"><Users size={24} /></div>
          <div><h3 className="m-0">{data.overview.teachers}</h3><p className="muted small">Teachers</p></div>
        </div>
        <div className="card stat-modern">
          <div className="stat-icon bg-purple"><BookOpen size={24} /></div>
          <div><h3 className="m-0">{data.overview.courses}</h3><p className="muted small">Courses</p></div>
        </div>
        <div className="card stat-modern">
          <div className="stat-icon bg-red"><Activity size={24} /></div>
          <div><h3 className="m-0">{data.overview.live}</h3><p className="muted small">Live Sessions</p></div>
        </div>
      </div>

      {/* Recent Activity / Quick Actions */}
      <div className="grid grid-2 mt-4">
        <div className="card">
          <h3 className="card-title">Recent Activity</h3>
          <ul className="list">
            {data.recentActivity?.map((act, i) => (
              <li key={i} className="list-row">
                <span className="dot" style={{ width: 8, height: 8, background: '#4f46e5', borderRadius: '50%' }}></span>
                <div>
                  <strong>{act.message}</strong>
                  <p className="small muted m-0">{act.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="card center-text flex flex-col justify-center">
           <h3>Quick Actions</h3>
           <div className="flex gap-2 justify-center mt-4">
             <button onClick={() => navigate("/admin/users")} className="btn btn-ghost">Manage Users</button>
             <button onClick={() => navigate("/admin/reports")} className="btn btn-primary">Reports</button>
           </div>
        </div>
      </div>
    </div>
  );
}