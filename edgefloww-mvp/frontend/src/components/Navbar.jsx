import { Link, useNavigate } from "react-router-dom";
import { api, getToken } from "../api.js";

export default function Navbar({ user, onLogout }) {
  const nav = useNavigate();
  const isAdmin = !!getToken();

  return (
    <nav className="navbar">
      <Link to="/" className="logo">⚡ EdgeFloww</Link>
      <div className="nav-links">
        <Link to="/" className="btn btn-secondary btn-sm">Courses</Link>
        <Link to="/my-learning" className="btn btn-secondary btn-sm">My Learning</Link>
        {user?.role === "author" && <Link to="/create" className="btn btn-primary btn-sm">+ Create</Link>}
        {user?.role === "author" && <Link to="/my-courses" className="btn btn-secondary btn-sm">My Courses</Link>}
        <span className="badge badge-green">${(user?.balance || 0).toFixed(2)}</span>
        <span style={{ fontSize: 13, color: "#888" }}>{user?.display_name || user?.username}</span>
        <button className="btn btn-secondary btn-sm" onClick={() => { onLogout(); nav("/login"); }}>Logout</button>
      </div>
    </nav>
  );
}
