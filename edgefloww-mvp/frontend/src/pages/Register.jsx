import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, setToken } from "../api.js";

export default function Register({ onRegister }) {
  const [form, setForm] = useState({ email: "", password: "", role: "student" });
  const [error, setError] = useState("");
  const nav = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    try {
      const { user, token } = await api("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
      setToken(token); onRegister(user); nav("/");
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="card" style={{ width: "100%", maxWidth: 400, padding: 32 }}>
        <h1 style={{ textAlign: "center", marginBottom: 24, fontSize: 24 }}>⚡ EdgeFloww</h1>
        <p className="text-secondary text-center mb-4">Create your account</p>
        {error && <div className="badge badge-red mb-4" style={{ padding: "8px 12px", display: "block", textAlign: "center" }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="form-label">Email</label><input value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" required /></div>
          <div className="form-group"><label className="form-label">Password (min 4 chars)</label><input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" required /></div>
          <div className="form-group">
            <label className="form-label">I want to</label>
            <select value={form.role} onChange={e => set("role", e.target.value)}>
              <option value="student">Learn & buy courses</option>
              <option value="author">Create & sell courses</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-block">Register</button>
        </form>
        <p className="text-center mt-4 text-secondary">Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}
