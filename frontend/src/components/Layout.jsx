import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, Users, BookOpen, FileText, Settings, LogOut, 
  Home, ScanLine, ClipboardList, User 
} from "lucide-react";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  // NAVIGATION ITEMS
  const navItems = {
    admin: [
      { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/admin/users", icon: Users, label: "Users" },
      { to: "/admin/courses", icon: BookOpen, label: "Courses" },
      { to: "/admin/reports", icon: FileText, label: "Reports" },
      { to: "/admin/settings", icon: Settings, label: "Settings" }
    ],
    faculty: [
      { to: "/faculty", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/faculty/courses", icon: BookOpen, label: "Courses" },
      { to: "/faculty/sessions", icon: ClipboardList, label: "Sessions" },
      { to: "/faculty/reports", icon: FileText, label: "Reports" }
      // 🔥 Faculty side bar se Profile hata diya hai
    ],
    student: [
      { to: "/student", icon: Home, label: "Home" },
      { to: "/student/mark", icon: ScanLine, label: "Mark" },
      { to: "/student/attendance", icon: ClipboardList, label: "Attendance" },
      { to: "/student/profile", icon: User, label: "Profile" }
    ]
  };

  const items = navItems[user.role] || [];

  // Profile route logic based on role
  const profilePath = user.role === "admin" ? "/admin/settings" : `/${user.role}/profile`;

  return (
    <div className="app-shell">
      {/* SIDEBAR (Desktop) */}
      <aside className="sidebar">
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
        <button className="nav-item logout" onClick={() => { logout(); navigate("/login"); }}>
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
             {/* 🔥 Avatar clickable ho gaya hai */}
             <div 
               className="avatar cursor-pointer hover:scale-105 transition-transform" 
               onClick={() => navigate(profilePath)}
               title="View Profile"
             >
               {user.firstName[0]}{user.lastName[0]}
             </div>
          </div>
        </header>

        <main className="content pb-20">
          <Outlet />
        </main>

        {/* BOTTOM TABS (Mobile) */}
        <div className="bottom-tabs">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end className={({ isActive }) => `bottom-tab ${isActive ? "active" : ""}`}>
              <item.icon size={22} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          
          {/* Mobile Bottom tab mein Profile add karein taaki mobile pe bhi access ho sake */}
          <NavLink to={profilePath} className={({ isActive }) => `bottom-tab ${isActive ? "active" : ""}`}>
            <User size={22} />
            <span>Profile</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
}