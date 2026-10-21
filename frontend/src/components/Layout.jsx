import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, BookOpen, FileText, Bell, LogOut,
  User, CalendarCheck, ScanLine, ClipboardList, Settings,
  GraduationCap, Menu, X
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const NAV = {
  admin: [
    { to: "/admin", end: true, label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/subjects", label: "Subjects", icon: BookOpen },
    { to: "/admin/attendance", label: "Attendance", icon: CalendarCheck },
    { to: "/admin/reports", label: "Reports", icon: FileText },
    { to: "/admin/notifications", label: "Notifications", icon: Bell },
    { to: "/admin/profile", label: "Profile", icon: User }
  ],
  faculty: [
    { to: "/faculty", end: true, label: "Dashboard", icon: LayoutDashboard },
    { to: "/faculty/subjects", label: "Subjects", icon: BookOpen },
    { to: "/faculty/sessions", label: "Sessions", icon: CalendarCheck },
    { to: "/faculty/reports", label: "Reports", icon: FileText },
    { to: "/faculty/profile", label: "Profile", icon: User }
  ],
  student: [
    { to: "/student", end: true, label: "Home", icon: LayoutDashboard },
    { to: "/student/scan", label: "Mark", icon: ScanLine },
    { to: "/student/attendance", label: "Attendance", icon: ClipboardList },
    { to: "/student/subjects", label: "Subjects", icon: BookOpen },
    { to: "/student/notifications", label: "Alerts", icon: Bell },
    { to: "/student/profile", label: "Profile", icon: User }
  ]
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;
  const items = NAV[user.role] || [];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <GraduationCap size={26} />
          <span>AttendX</span>
        </div>
        <nav className="nav">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <it.icon size={18} />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>
        <button
          className="nav-item logout"
          onClick={async () => {
            await logout();
            navigate("/login");
          }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button
            className="icon-btn mobile-only"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="topbar-title">
            {user.role === "admin" && "Admin Panel"}
            {user.role === "faculty" && `Welcome, ${user.firstName}`}
            {user.role === "student" && `Hello, ${user.firstName} 👋`}
          </div>
          <div className="topbar-right">
            <span className={`role-badge role-${user.role}`}>
              {user.role.toUpperCase()}
            </span>
            <div className="avatar">
              {(user.firstName?.[0] || "?") + (user.lastName?.[0] || "")}
            </div>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}