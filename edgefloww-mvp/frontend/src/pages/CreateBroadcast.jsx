import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function CreateBroadcast() {
  const nav = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", price: 0 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api("/api/broadcasts/create", { method: "POST", body: JSON.stringify(form) });
      setResult(data);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  if (result) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Трансляция создана!</h1>
        <div className="bg-card border border-edge rounded-xl p-6 space-y-4">
          <div>
            <div className="text-xs text-secondary mb-1">Stream Key</div>
            <div className="text-lg font-bold break-all">{result.streamKey}</div>
          </div>
          <div>
            <div className="text-xs text-secondary mb-1">RTMP URL</div>
            <div className="text-base font-semibold break-all">{result.rtmpUrl}</div>
          </div>
          <div className="bg-[#0d0d1a] border border-edge rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">Настройки OBS</h3>
            <ul className="text-xs text-secondary space-y-1 list-disc pl-4">
              <li><b>Сервер:</b> {result.rtmpUrl?.replace(/\/[^/]+$/, "")}</li>
              <li><b>Ключ потока:</b> {result.streamKey}</li>
            </ul>
          </div>
          <div className="flex gap-2">
            <button className="bg-accent text-white font-semibold rounded-lg px-4 py-2 text-sm hover:bg-accent-hover transition" onClick={() => nav(`/broadcasts/${result.id}`)}>Перейти к трансляции</button>
            <button className="bg-surface border border-edge text-secondary font-semibold rounded-lg px-4 py-2 text-sm hover:text-white transition" onClick={() => nav("/my-broadcasts")}>Мои трансляции</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Создать трансляцию</h1>
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-2 mb-4 text-center">{error}</div>}
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-secondary block mb-1">Название</label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Вебинар по React" required className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent" />
        </div>
        <div>
          <label className="text-xs font-semibold text-secondary block mb-1">Описание</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent resize-vertical" />
        </div>
        <div>
          <label className="text-xs font-semibold text-secondary block mb-1">Цена (₽) — 0 = бесплатно</label>
          <input type="number" value={form.price} onChange={(e) => set("price", Number(e.target.value))} min={0} className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent" />
        </div>
        <button type="submit" className="w-full bg-accent text-white font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-accent-hover transition disabled:opacity-50" disabled={loading}>
          {loading ? "Создание..." : "Создать трансляцию"}
        </button>
      </form>
    </div>
  );
}
