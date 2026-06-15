import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function TeacherProfile() {
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
    setForm(prev => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
  };

  const addCert = () => {
    if (certInput.trim()) {
      setForm(prev => ({ ...prev, certificateUrls: [...prev.certificateUrls, certInput.trim()] }));
      setCertInput("");
    }
  };

  const removeCert = (idx) => {
    setForm(prev => ({ ...prev, certificateUrls: prev.certificateUrls.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await api("/api/profile/teacher", { method: "POST", body: JSON.stringify(form) });
      updateTeacherProfile(res.profile);
      setMessage("Анкета сохранена!");
    } catch (err) {
      setMessage(err.error || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="teacher-profile-page">
      <div className="container">
        <h1>Анкета учителя</h1>
        {message && <div className={message.includes("Ошибка") ? "error-message" : "success-message"}>{message}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ФИО *</label>
            <input type="text" name="fullName" value={form.fullName} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Образование *</label>
            <input type="text" name="education" value={form.education} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Опыт (лет)</label>
            <input type="number" name="experience" value={form.experience} onChange={handleChange} min={0} />
          </div>
          <div className="form-group">
            <label>Специализация *</label>
            <input type="text" name="specialization" value={form.specialization} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Часовая ставка (RUB)</label>
            <input type="number" name="hourlyRate" value={form.hourlyRate} onChange={handleChange} min={0} />
          </div>
          <div className="form-group">
            <label>О себе</label>
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={4} />
          </div>
          <div className="form-group">
            <label>Сертификаты (ссылки)</label>
            <div className="cert-input-group">
              <input type="url" value={certInput} onChange={e => setCertInput(e.target.value)}
                placeholder="https://..." />
              <button type="button" className="btn btn-sm" onClick={addCert}>+</button>
            </div>
            {form.certificateUrls.length > 0 && (
              <ul className="cert-list">
                {form.certificateUrls.map((url, i) => (
                  <li key={i}>
                    <a href={url} target="_blank" rel="noreferrer">{url}</a>
                    <button type="button" className="btn-link text-danger" onClick={() => removeCert(i)}>×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Сохранение..." : "Сохранить анкету"}
          </button>
        </form>
      </div>
    </div>
  );
}
