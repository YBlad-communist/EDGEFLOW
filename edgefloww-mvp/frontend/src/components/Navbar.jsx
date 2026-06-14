import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ user, onLogout }) {
  const nav = useNavigate();

  return (
    <nav className="navbar">
      <Link to="/" className="logo">⚡ EdgeFloww</Link>
      <div className="nav-links">
        <Link to="/" className="btn btn-secondary btn-sm">Курсы</Link>
        <Link to="/my-learning" className="btn btn-secondary btn-sm">Моё обучение</Link>
        {user?.role === "author" && <Link to="/create" className="btn btn-primary btn-sm">+ Создать</Link>}
        {user?.role === "author" && <Link to="/my-courses" className="btn btn-secondary btn-sm">Мои курсы</Link>}
        {user?.isAdmin && <Link to="/admin" className="btn btn-secondary btn-sm">Админ</Link>}
        <span className="badge badge-green">{user?.balanceRub?.toFixed(2) || "0.00"} ₽</span>
        <span style={{ fontSize: 13, color: "#888" }}>{user?.displayName || user?.username}</span>
        <button className="btn btn-secondary btn-sm" onClick={() => { onLogout(); nav("/login"); }}>Выйти</button>
      </div>
    </nav>
  );
}
