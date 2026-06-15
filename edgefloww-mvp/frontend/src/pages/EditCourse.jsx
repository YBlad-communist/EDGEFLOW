import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function EditCourse() {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", price: 0, category: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api(`/api/courses/${id}`)
      .then((c) => {
        setForm({ title: c.title, description: c.description || "", price: c.price || 0, category: c.category || "" });
        setLoading(false);
      })
      .catch(() => nav("/my-courses"));
  }, [id, nav]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/courses/${id}`, { method: "PUT", body: JSON.stringify(form) });
      nav("/my-courses");
    } catch (err) { alert(err.message); }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-lg text-secondary">Загрузка...</div>;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Редактировать курс</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-secondary block mb-1">Название</label>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent" />
        </div>
        <div>
          <label className="text-xs font-semibold text-secondary block mb-1">Описание</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent resize-vertical" />
        </div>
        <div>
          <label className="text-xs font-semibold text-secondary block mb-1">Цена (₽)</label>
          <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} min={0} className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent" />
        </div>
        <div>
          <label className="text-xs font-semibold text-secondary block mb-1">Категория</label>
          <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent" />
        </div>
        <button type="submit" className="w-full bg-accent text-white font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-accent-hover transition disabled:opacity-50" disabled={saving}>
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </form>
    </div>
  );
}
