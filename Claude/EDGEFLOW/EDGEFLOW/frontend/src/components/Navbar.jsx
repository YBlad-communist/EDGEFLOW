import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isTeacher, hasTeacherProfile } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-brand-500 tracking-tight">
          EdgeFlow
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-300 hover:text-white text-sm transition-colors">
            Трансляции
          </Link>

          {user ? (
            <>
              {isTeacher && !hasTeacherProfile && (
                <Link
                  to="/teacher/profile"
                  className="text-yellow-400 hover:text-yellow-300 text-sm font-medium"
                >
                  Заполнить анкету
                </Link>
              )}

              {hasTeacherProfile && (
                <Link
                  to="/broadcasts/create"
                  className="btn-primary text-sm py-1.5 px-3"
                >
                  + Трансляция
                </Link>
              )}

              <Link to="/profile" className="text-gray-300 hover:text-white text-sm">
                {user.username}
              </Link>

              <button
                onClick={logout}
                className="text-gray-500 hover:text-red-400 text-sm transition-colors"
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-300 hover:text-white text-sm">
                Войти
              </Link>
              <Link to="/register" className="btn-primary text-sm py-1.5 px-3">
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
