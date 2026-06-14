import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setToken } from "../api.js";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    try {
      const { user, token } = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      setToken(token); onLogin(user); nav("/");
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="card" style={{ width: "100%", maxWidth: 400, padding: 32 }}>
        <h1 style={{ textAlign: "center", marginBottom: 24, fontSize: 24 }}>⚡ EdgeFloww</h1>
        <p className="text-secondary text-center mb-4">Crypto Course Marketplace</p>
        {error && <div className="badge badge-red mb-4" style={{ padding: "8px 12px", display: "block", textAlign: "center" }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="form-label">Email</label><input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></div>
          <div className="form-group"><label className="form-label">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required /></div>
          <button type="submit" className="btn btn-primary btn-block">Login</button>
        </form>
        <p className="text-center mt-4 text-secondary">Don't have an account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  );
}
