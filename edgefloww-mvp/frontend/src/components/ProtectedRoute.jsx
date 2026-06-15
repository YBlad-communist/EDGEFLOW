import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-lg text-secondary">Загрузка...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

export function TeacherRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-lg text-secondary">Загрузка...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "teacher") return <Navigate to="/courses" />;
  return children;
}

export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-lg text-secondary">Загрузка...</div>;
  if (user) return <Navigate to="/courses" />;
  return children;
}
