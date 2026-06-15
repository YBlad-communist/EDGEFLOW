import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function TeacherRoute() {
  const { user, loading, isTeacher } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-lg text-secondary">Загрузка...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isTeacher) return <Navigate to="/" replace />;
  return <Outlet />;
}
