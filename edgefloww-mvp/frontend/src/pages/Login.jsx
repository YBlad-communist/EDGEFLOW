import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const nav = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      login(data.token, data.user);
      nav("/courses");
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-card border border-edge rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">EdgeFlow</h1>
        <p className="text-sm text-secondary text-center mb-6">Войдите в аккаунт</p>
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2 mb-4 text-center">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="text-xs font-semibold text-secondary block mb-1">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent" />
          </div>
          <div className="mb-6">
            <label className="text-xs font-semibold text-secondary block mb-1">Пароль</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent" />
          </div>
          <button type="submit" className="w-full bg-accent text-white font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-accent-hover transition">Войти</button>
        </form>
        <p className="text-center text-sm text-secondary mt-4">Нет аккаунта? <Link to="/register" className="text-accent">Регистрация</Link></p>
      </div>
    </div>
  );
}
