import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader full />;

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <Outlet />;
}