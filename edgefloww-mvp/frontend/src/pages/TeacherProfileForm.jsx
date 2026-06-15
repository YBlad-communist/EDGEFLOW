import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function TeacherProfileForm() {
  const { user, updateTeacherProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "", education: "", experience: 0,
    specialization: "", hourlyRate: 0, bio: "", certificateUrls: [],
  });
  const [certInput, setCertInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    if (user.role !== "teacher") { navigate("/courses"); return; }
    const p = user.teacherProfile;
    if (p) {
      setForm({
        fullName: p.fullName || "",
        education: p.education || "",
        experience: p.experience || 0,
        specialization: p.specialization || "",
        hourlyRate: p.hourlyRate || 0,
        bio: p.bio || "",
        certificateUrls: p.certificateUrls || [],
      });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
  };

  const addCert = () => {
    if (certInput.trim()) {
      setForm((prev) => ({ ...prev, certificateUrls: [...prev.certificateUrls, certInput.trim()] }));
      setCertInput("");
    }
  };

  const removeCert = (idx) => {
    setForm((prev) => ({ ...prev, certificateUrls: prev.certificateUrls.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await api("/api/profile/teacher", { method: "POST", body: JSON.stringify(form) });
      updateTeacherProfile(res.profile);
      setMessage("Анкета сохранена!");
    } catch (err) { setMessage(err.error || "Ошибка сохранения"); }
    setSaving(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Анкета учителя</h1>
      {message && (
        <div className={`text-sm rounded-lg px-4 py-2 mb-4 text-center ${message.includes("Ошибка") ? "bg-red-500/10 border border-red-500/30 text-red-400" : "bg-green-500/10 border border-green-500/30 text-green-400"}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-secondary block mb-1">ФИО *</label>
          <input type="text" name="fullName" value={form.fullName} onChange={handleChange} required className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent" />
        </div>
        <div>
          <label className="text-xs font-semibold text-secondary block mb-1">Образование *</label>
          <input type="text" name="education" value={form.education} onChange={handleChange} required className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent" />
        </div>
        <div>
          <label className="text-xs font-semibold text-secondary block mb-1">Опыт (лет)</label>
          <input type="number" name="experience" value={form.experience} onChange={handleChange} min={0} className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent" />
        </div>
        <div>
          <label className="text-xs font-semibold text-secondary block mb-1">Специализация *</label>
          <input type="text" name="specialization" value={form.specialization} onChange={handleChange} required className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent" />
        </div>
        <div>
          <label className="text-xs font-semibold text-secondary block mb-1">Часовая ставка (₽)</label>
          <input type="number" name="hourlyRate" value={form.hourlyRate} onChange={handleChange} min={0} className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent" />
        </div>
        <div>
          <label className="text-xs font-semibold text-secondary block mb-1">О себе</label>
          <textarea name="bio" value={form.bio} onChange={handleChange} rows={4} className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent resize-vertical" />
        </div>
        <div>
          <label className="text-xs font-semibold text-secondary block mb-1">Сертификаты (ссылки)</label>
          <div className="flex gap-2">
            <input type="url" value={certInput} onChange={(e) => setCertInput(e.target.value)} placeholder="https://..." className="flex-1 bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent" />
            <button type="button" onClick={addCert} className="bg-accent text-white px-3 rounded-lg text-sm font-semibold hover:bg-accent-hover transition">+</button>
          </div>
          {form.certificateUrls.length > 0 && (
            <ul className="mt-2 space-y-1">
              {form.certificateUrls.map((url, i) => (
                <li key={i} className="flex items-center gap-2 text-xs">
                  <a href={url} target="_blank" rel="noreferrer" className="flex-1 truncate text-accent">{url}</a>
                  <button type="button" onClick={() => removeCert(i)} className="text-red-400 hover:text-red-300">&times;</button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" className="w-full bg-accent text-white font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-accent-hover transition disabled:opacity-50" disabled={saving}>
          {saving ? "Сохранение..." : "Сохранить анкету"}
        </button>
      </form>
    </div>
  );
}
