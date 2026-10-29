import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, Users, BookOpen, FileText, Settings, LogOut, 
  Home, ScanLine, ClipboardList, User 
} from "lucide-react";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  if (!user) return null;

  // EXACT NAVIGATION FROM YOUR DOCUMENTS
  const navItems = {
    admin: [
      { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/admin/users", icon: Users, label: "Users" },
      { to: "/admin/courses", icon: BookOpen, label: "Courses" },
      { to: "/admin/reports", icon: FileText, label: "Reports" },
      { to: "/admin/audit", icon: ClipboardList, label: "Audit Logs" },
      { to: "/admin/settings", icon: Settings, label: "Settings" }
    ],
    faculty: [
      { to: "/faculty", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/faculty/courses", icon: BookOpen, label: "Courses" },
      { to: "/faculty/reports", icon: FileText, label: "Reports" }
    ],
    student: [
      { to: "/student", icon: Home, label: "Home" },
      { to: "/student/mark", icon: ScanLine, label: "Mark" },
      { to: "/student/attendance", icon: ClipboardList, label: "Attendance" },
      { to: "/student/profile", icon: User, label: "Profile" }
    ]
  };

  const items = navItems[user.role] || [];

  // Logout Handler with Confirmation
  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await logout(); // Backend se cookie clear karne ka wait karega
      navigate("/login");
    }
  };

  return (
    <div className="app-shell">
      {/* SIDEBAR (Hides on Mobile for Student) */}
      <aside className={`sidebar ${user.role === 'student' ? 'desktop-only' : ''}`}>
        <div className="brand">
          <BookOpen size={24} />
          <span>AttendX</span>
        </div>
        <nav className="nav">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        {/* LOGOUT BUTTON */}
        <button className="nav-item logout" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-title">
            {user.role === "admin" && "Admin Panel"}
            {user.role === "faculty" && `Welcome back, ${user.firstName}`}
            {user.role === "student" && `Hello ${user.firstName} 👋`}
          </div>
          <div className="topbar-right">
             <div className="avatar">{user.firstName[0]}{user.lastName[0]}</div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>

        {/* BOTTOM TABS (Only for Student, Exact from Document) */}
        {user.role === "student" && (
          <div className="bottom-tabs">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} end className={({ isActive }) => `bottom-tab ${isActive ? "active" : ""}`}>
                <item.icon size={22} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}