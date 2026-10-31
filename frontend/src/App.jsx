import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Loader from "./components/Loader"; // Apna loader component

// Auth Pages (Direct Import)
import Login from "./pages/Login";
import Register from "./pages/Register";

// 🔥 LAZY LOADING: Ye pages tabhi load honge jab jarurat hogi
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminUserDetail = lazy(() => import("./pages/admin/UserDetail"));
const AdminCourses = lazy(() => import("./pages/admin/Courses"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminAudit = lazy(() => import("./pages/admin/Audit"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));

const FacultyDashboard = lazy(() => import("./pages/faculty/Dashboard"));
const FacultyCourses = lazy(() => import("./pages/faculty/Courses"));
const FacultyCourseDetail = lazy(() => import("./pages/faculty/CourseDetail"));
const FacultySessions = lazy(() => import("./pages/faculty/Sessions"));
const FacultySessionDetail = lazy(() => import("./pages/faculty/SessionDetail"));
const FacultyReports = lazy(() => import("./pages/faculty/Reports"));
const FacultyProfile = lazy(() => import("./pages/faculty/Profile"));

const StudentDashboard = lazy(() => import("./pages/student/Dashboard"));
const StudentMark = lazy(() => import("./pages/student/Mark"));
const StudentAttendance = lazy(() => import("./pages/student/Attendance"));
const StudentProfile = lazy(() => import("./pages/student/Profile"));
const StudentSubjectDetail = lazy(() => import("./pages/student/SubjectDetail"));

function RoleLanding() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
}

export default function App() {
  return (
    // 🔥 Suspense fallback tab dikhega jab naya page load ho raha hoga
    <Suspense fallback={<div className="loader-full"><Loader /></div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<RoleLanding />} />

        {/* ADMIN */}
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

        {/* FACULTY */}
        <Route element={<ProtectedRoute roles={["faculty"]} />}>
          <Route element={<Layout />}>
            <Route path="/faculty" element={<FacultyDashboard />} />
            <Route path="/faculty/courses" element={<FacultyCourses />} />
            <Route path="/faculty/courses/:id" element={<FacultyCourseDetail />} />
            <Route path="/faculty/sessions" element={<FacultySessions />} />
            <Route path="/faculty/session/:id" element={<FacultySessionDetail />} />
            <Route path="/faculty/reports" element={<FacultyReports />} />
            <Route path="/faculty/profile" element={<FacultyProfile />} />
          </Route>
        </Route>

        {/* STUDENT */}
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
    </Suspense>
  );
}