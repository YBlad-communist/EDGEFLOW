import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';

export default function CreateBroadcast() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', price: '0', startTime: '', tags: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        startTime: form.startTime || undefined,
      };
      const res = await api.post('/broadcasts', payload);
      toast.success('Трансляция создана!');
      navigate(`/broadcasts/${res.data._id}`);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.response?.data?.errors?.[0]?.msg || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Новая трансляция</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Название *</label>
          <input name="title" className="input" value={form.title} onChange={handleChange} required />
        </div>
        <div>
          <label className="label">Описание</label>
          <textarea name="description" className="input resize-none" rows={3} value={form.description} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Цена (₽, 0 = бесплатно)</label>
          <input name="price" type="number" min="0" className="input" value={form.price} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Время начала</label>
          <input name="startTime" type="datetime-local" className="input" value={form.startTime} onChange={handleChange} />
        </div>
        <div>
          <label className="label">Теги (через запятую)</label>
          <input name="tags" className="input" value={form.tags} onChange={handleChange} placeholder="javascript, react, фронтенд" />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Создание...' : 'Создать трансляцию'}
        </button>
      </form>
    </div>
  );
}
