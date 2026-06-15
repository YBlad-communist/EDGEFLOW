import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const FIELDS = [
  { name: 'fullName', label: 'ФИО', type: 'text', required: true },
  { name: 'education', label: 'Образование', type: 'text', required: true },
  { name: 'experience', label: 'Опыт работы', type: 'text', required: true },
  { name: 'specialization', label: 'Специализация', type: 'text', required: true },
  { name: 'hourlyRate', label: 'Ставка (₽/ч)', type: 'number', required: true },
];

export default function TeacherProfileForm() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', education: '', experience: '', specialization: '', hourlyRate: '', bio: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/profile/teacher', { ...form, hourlyRate: Number(form.hourlyRate) });
      await refreshUser();
      toast.success('Анкета сохранена!');
      navigate('/broadcasts/create');
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.errors?.[0]?.msg || 'Ошибка';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Анкета учителя</h1>
      <p className="text-gray-400 text-sm mb-6">Заполните анкету, чтобы начать вести трансляции на платформе.</p>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {FIELDS.map((f) => (
          <div key={f.name}>
            <label className="label">{f.label}</label>
            <input
              name={f.name}
              type={f.type}
              className="input"
              value={form[f.name]}
              onChange={handleChange}
              required={f.required}
              min={f.type === 'number' ? 0 : undefined}
            />
          </div>
        ))}
        <div>
          <label className="label">О себе (биография)</label>
          <textarea
            name="bio"
            className="input resize-none"
            rows={4}
            value={form.bio}
            onChange={handleChange}
            required
            placeholder="Расскажите о своём опыте, подходе к обучению..."
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Сохранение...' : 'Сохранить анкету'}
        </button>
      </form>
    </div>
  );
}
