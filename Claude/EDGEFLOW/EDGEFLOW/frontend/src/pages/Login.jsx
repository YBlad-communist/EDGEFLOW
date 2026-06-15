import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Вход в EdgeFlow</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              name="email"
              type="email"
              className="input"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              data-testid="email-input"
            />
          </div>
          <div>
            <label className="label">Пароль</label>
            <input
              name="password"
              type="password"
              className="input"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              data-testid="password-input"
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading} data-testid="submit-btn">
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-400">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
