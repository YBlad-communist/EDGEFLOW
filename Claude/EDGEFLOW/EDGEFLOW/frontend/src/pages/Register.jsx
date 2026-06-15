import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', username: '', role: 'student' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      return toast.error('Пароль минимум 6 символов');
    }
    setLoading(true);
    try {
      const user = await register(form);
      if (user.role === 'teacher') {
        navigate('/teacher/profile');
      } else {
        navigate('/');
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data?.errors?.[0]?.msg || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Регистрация</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Имя пользователя</label>
            <input name="username" className="input" value={form.username} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" className="input" value={form.email} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Пароль</label>
            <input name="password" type="password" className="input" value={form.password} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Роль</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'student', label: '🎓 Студент', desc: 'Учусь у других' },
                { value: 'teacher', label: '🧑‍🏫 Учитель', desc: 'Веду трансляции' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`cursor-pointer border rounded-lg p-3 transition-colors ${
                    form.role === opt.value
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={opt.value}
                    checked={form.role === opt.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Создание...' : 'Создать аккаунт'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-400">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
