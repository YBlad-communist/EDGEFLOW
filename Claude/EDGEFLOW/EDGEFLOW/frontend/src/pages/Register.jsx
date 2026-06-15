import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password, role }) });
      login(data.user);
      navigate("/courses");
    } catch (err) { setError(err.message || "Ошибка регистрации"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-card border border-edge rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">Регистрация</h1>
        <p className="text-sm text-secondary text-center mb-6">Создайте аккаунт</p>
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2 mb-4 text-center">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="text-xs font-semibold text-secondary block mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent" />
          </div>
          <div className="mb-4">
            <label className="text-xs font-semibold text-secondary block mb-1">Пароль</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={4} required className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent" />
          </div>
          <div className="mb-6">
            <label className="text-xs font-semibold text-secondary block mb-3">Роль</label>
            <div className="flex gap-3">
              <label className={`flex-1 flex flex-col gap-1 p-3 border-2 rounded-lg cursor-pointer transition ${role === "student" ? "border-accent bg-accent/10" : "border-edge"}`}>
                <input type="radio" name="role" value="student" checked={role === "student"} onChange={(e) => setRole(e.target.value)} className="hidden" />
                <span className="font-bold text-sm">Ученик</span>
                <span className="text-xs text-secondary">Смотреть курсы</span>
              </label>
              <label className={`flex-1 flex flex-col gap-1 p-3 border-2 rounded-lg cursor-pointer transition ${role === "teacher" ? "border-accent bg-accent/10" : "border-edge"}`}>
                <input type="radio" name="role" value="teacher" checked={role === "teacher"} onChange={(e) => setRole(e.target.value)} className="hidden" />
                <span className="font-bold text-sm">Учитель</span>
                <span className="text-xs text-secondary">Создавать курсы</span>
              </label>
            </div>
          </div>
          <button type="submit" className="w-full bg-accent text-white font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-accent-hover transition disabled:opacity-50" disabled={loading}>
            {loading ? "Загрузка..." : "Зарегистрироваться"}
          </button>
        </form>
        <p className="text-center text-sm text-secondary mt-4">Уже есть аккаунт? <Link to="/login" className="text-accent">Войти</Link></p>
      </div>
    </div>
  );
}
