import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Navbar() {
  const { user, isAdmin, isTeacher, logout } = useAuth();
  const isTeachMode = user?.mode === "learn_and_teach";

  return (
    <nav className="bg-surface border-b border-edge sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-xl font-extrabold text-accent no-underline">
          EdgeFlow
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/courses" className="text-sm font-medium text-secondary hover:text-white px-2 py-1 rounded transition no-underline">
            Курсы
          </Link>
          {user ? (
            <>
              <Link to="/my-learning" className="text-sm font-medium text-secondary hover:text-white px-2 py-1 rounded transition no-underline">
                Моё обучение
              </Link>
              {isTeacher && isTeachMode && (
                <>
                  <Link to="/my-courses" className="text-sm font-medium text-secondary hover:text-white px-2 py-1 rounded transition no-underline">
                    Мои курсы
                  </Link>
                  <Link to="/teacher-profile" className="text-sm font-medium text-secondary hover:text-white px-2 py-1 rounded transition no-underline">
                    Анкета
                  </Link>
                  <Link to="/my-broadcasts" className="text-sm font-medium text-secondary hover:text-white px-2 py-1 rounded transition no-underline">
                    Трансляции
                  </Link>
                </>
              )}
              <Link to="/profile" className="text-sm font-medium text-secondary hover:text-white px-2 py-1 rounded transition no-underline">
                Профиль
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-sm font-medium text-secondary hover:text-white px-2 py-1 rounded transition no-underline">
                  Админ
                </Link>
              )}
              <Link to="/settings" className="text-sm font-medium text-secondary hover:text-white px-2 py-1 rounded transition no-underline">
                Настройки
              </Link>
              <span className="text-accent font-bold text-sm bg-accent/10 px-2.5 py-1 rounded">
                {user.balanceRub} ₽
              </span>
              <button onClick={logout} className="text-sm font-medium px-3 py-1.5 rounded border border-edge text-secondary hover:text-white transition">
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-secondary hover:text-white px-2 py-1 rounded transition no-underline">
                Войти
              </Link>
              <Link to="/register" className="text-sm font-medium px-3 py-1.5 rounded bg-accent text-white no-underline hover:bg-accent-hover transition">
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
