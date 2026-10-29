import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminUserDetail from "./pages/admin/UserDetail";
import AdminCourses from "./pages/admin/Courses";
import AdminReports from "./pages/admin/Reports";
import AdminAudit from "./pages/admin/Audit";
import AdminSettings from "./pages/admin/Settings";

// Faculty Pages
import FacultyDashboard from "./pages/faculty/Dashboard";
import FacultyCourses from "./pages/faculty/Courses";
import FacultyCourseDetail from "./pages/faculty/CourseDetail";
import FacultySessionDetail from "./pages/faculty/SessionDetail";
import FacultyStartSession from "./pages/faculty/StartSession";
import FacultyReports from "./pages/faculty/Reports";
import FacultyProfile from "./pages/faculty/Profile";

// Student Pages
import StudentDashboard from "./pages/student/Dashboard";
import StudentMark from "./pages/student/Mark";
import StudentAttendance from "./pages/student/Attendance";
import StudentProfile from "./pages/student/Profile";
import StudentSubjectDetail from "./pages/student/SubjectDetail";

function RoleLanding() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<RoleLanding />} />

      {/* ADMIN ROUTES */}
      <Route element={<ProtectedRoute roles={["admin"]} />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/:id" element={<AdminUserDetail />} />
          <Route path="/admin/courses" element={<AdminCourses />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/audit" element={<AdminAudit />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>

      {/* FACULTY ROUTES */}
      <Route element={<ProtectedRoute roles={["faculty"]} />}>
        <Route element={<Layout />}>
          <Route path="/faculty" element={<FacultyDashboard />} />
          <Route path="/faculty/courses" element={<FacultyCourses />} />
          <Route path="/faculty/courses/:id" element={<FacultyCourseDetail />} />
          <Route path="/faculty/session/start" element={<FacultyStartSession />} />
          <Route path="/faculty/session/:id" element={<FacultySessionDetail />} />
          <Route path="/faculty/reports" element={<FacultyReports />} />
          <Route path="/faculty/profile" element={<FacultyProfile />} />
        </Route>
      </Route>

      {/* STUDENT ROUTES */}
      <Route element={<ProtectedRoute roles={["student"]} />}>
        <Route element={<Layout />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/mark" element={<StudentMark />} />
          <Route path="/student/attendance" element={<StudentAttendance />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/subject/:id" element={<StudentSubjectDetail />} />
        </Route>
      </Route>
    </Routes>
  );
}