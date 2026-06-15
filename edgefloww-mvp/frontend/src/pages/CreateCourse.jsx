import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function CreateCourse() {
  const nav = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", price: 10, category: "" });
  const [cover, setCover] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [lessonForm, setLessonForm] = useState({ title: "", description: "" });
  const [video, setVideo] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreate = async (e) => {
    e.preventDefault();
    const course = await api("/api/courses", { method: "POST", body: JSON.stringify(form) });
    if (cover) {
      const fd = new FormData();
      fd.append("cover", cover);
      await api(`/api/courses/${course.id}/cover`, { method: "POST", body: fd });
    }
    setCourseId(course.id);
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("title", lessonForm.title);
    fd.append("description", lessonForm.description);
    if (video) fd.append("video", video);
    await api(`/api/courses/${courseId}/lessons`, { method: "POST", body: fd });
    setLessonForm({ title: "", description: "" });
    setVideo(null);
  };

  if (courseId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Добавить уроки</h1>
        <p className="text-sm text-secondary mb-4">Курс создан! Теперь добавьте уроки.</p>
        <form onSubmit={handleAddLesson} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-secondary block mb-1">Название урока</label>
            <input value={lessonForm.title} onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))} required className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-xs font-semibold text-secondary block mb-1">Описание</label>
            <textarea value={lessonForm.description} onChange={(e) => setLessonForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent resize-vertical" />
          </div>
          <div>
            <label className="text-xs font-semibold text-secondary block mb-1">Видео (mp4)</label>
            <input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files[0])} className="w-full text-sm text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent-hover" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-accent text-white font-semibold rounded-lg px-4 py-2 text-sm hover:bg-accent-hover transition">Добавить урок</button>
            <button type="button" className="bg-surface border border-edge text-secondary font-semibold rounded-lg px-4 py-2 text-sm hover:text-white transition" onClick={() => nav(`/courses/${courseId}`)}>Готово</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Создать курс</h1>
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-secondary block mb-1">Название</label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Web3 для начинающих" required className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent" />
        </div>
        <div>
          <label className="text-xs font-semibold text-secondary block mb-1">Описание</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} placeholder="Опишите курс..." className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent resize-vertical" />
        </div>
        <div>
          <label className="text-xs font-semibold text-secondary block mb-1">Цена (₽)</label>
          <input type="number" value={form.price} onChange={(e) => set("price", Number(e.target.value))} min={1} className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent" />
        </div>
        <div>
          <label className="text-xs font-semibold text-secondary block mb-1">Категория</label>
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent">
            <option value="">Выберите категорию</option>
            <option value="blockchain">Blockchain</option>
            <option value="web3">Web3</option>
            <option value="defi">DeFi</option>
            <option value="trading">Trading</option>
            <option value="development">Development</option>
            <option value="design">Design</option>
            <option value="business">Business</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-secondary block mb-1">Обложка</label>
          <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files[0])} className="w-full text-sm text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent-hover" />
        </div>
        <button type="submit" className="w-full bg-accent text-white font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-accent-hover transition">Создать курс</button>
      </form>
    </div>
  );
}
