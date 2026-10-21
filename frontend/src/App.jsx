import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Recover from "./pages/Recover";
import NotFound from "./pages/NotFound";

// Admin
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminUserDetail from "./pages/admin/UserDetail";
import AdminSubjects from "./pages/admin/Subjects";
import AdminSubjectDetail from "./pages/admin/SubjectDetail";
import AdminAttendance from "./pages/admin/Attendance";
import AdminAttendanceDetail from "./pages/admin/AttendanceDetail";
import AdminReports from "./pages/admin/Reports";
import AdminNotifications from "./pages/admin/Notifications";
import AdminProfile from "./pages/admin/Profile";

// Faculty
import FacultyDashboard from "./pages/faculty/Dashboard";
import FacultySubjects from "./pages/faculty/Subjects";
import FacultySubjectForm from "./pages/faculty/SubjectForm";
import FacultySessions from "./pages/faculty/Sessions";
import FacultyActiveSession from "./pages/faculty/ActiveSession";
import FacultyReports from "./pages/faculty/Reports";
import FacultyProfile from "./pages/faculty/Profile";

// Student
import StudentDashboard from "./pages/student/Dashboard";
import StudentAttendance from "./pages/student/Attendance";
import StudentSubjects from "./pages/student/Subjects";
import StudentSubjectDetail from "./pages/student/SubjectDetail";
import StudentScan from "./pages/student/Scan";
import StudentNotifications from "./pages/student/Notifications";
import StudentProfile from "./pages/student/Profile";
import FacultyWarnings from "./pages/faculty/Warnings";

function RoleLanding() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} /> 
      <Route path="/recover" element={<Recover />} />
      <Route path="/" element={<RoleLanding />} />
      <Route path="/faculty/warnings" element={<FacultyWarnings />} />

      <Route element={<ProtectedRoute roles={["admin"]} />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/:id" element={<AdminUserDetail />} />
          <Route path="/admin/subjects" element={<AdminSubjects />} />
          <Route path="/admin/subjects/:id" element={<AdminSubjectDetail />} />
          <Route path="/admin/attendance" element={<AdminAttendance />} />
          <Route path="/admin/attendance/:id" element={<AdminAttendanceDetail />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["faculty"]} />}>
        <Route element={<Layout />}>
          <Route path="/faculty" element={<FacultyDashboard />} />
          <Route path="/faculty/subjects" element={<FacultySubjects />} />
          <Route path="/faculty/subjects/new" element={<FacultySubjectForm />} />
          <Route path="/faculty/sessions" element={<FacultySessions />} />
          <Route path="/faculty/sessions/:id" element={<FacultyActiveSession />} />
          <Route path="/faculty/reports" element={<FacultyReports />} />
          <Route path="/faculty/profile" element={<FacultyProfile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["student"]} />}>
        <Route element={<Layout />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/attendance" element={<StudentAttendance />} />
          <Route path="/student/subjects" element={<StudentSubjects />} />
          <Route path="/student/subjects/:id" element={<StudentSubjectDetail />} />
          <Route path="/student/scan" element={<StudentScan />} />
          <Route path="/student/notifications" element={<StudentNotifications />} />
          <Route path="/student/profile" element={<StudentProfile />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}