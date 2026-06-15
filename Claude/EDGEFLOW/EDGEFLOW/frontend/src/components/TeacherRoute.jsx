import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TeacherRoute() {
  const { user, loading, isTeacher, hasTeacherProfile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isTeacher) return <Navigate to="/" replace />;
  if (!hasTeacherProfile) return <Navigate to="/teacher/profile" replace />;

  return <Outlet />;
}
