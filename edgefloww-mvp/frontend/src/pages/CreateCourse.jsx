import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function CreateCourse({ user }) {
  const nav = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", price: 10, category: "" });
  const [cover, setCover] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [lessonForm, setLessonForm] = useState({ title: "", description: "" });
  const [video, setVideo] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async (e) => {
    e.preventDefault();
    const course = await api("/api/courses", { method: "POST", body: JSON.stringify(form) });
    if (cover) {
      const fd = new FormData(); fd.append("cover", cover);
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
      <div className="container animate-in" style={{ maxWidth: 600 }}>
        <h1 style={{ marginBottom: 20 }}>Add Lessons</h1>
        <p className="text-secondary mb-4">Course created! Now add your lessons.</p>

        <form onSubmit={handleAddLesson}>
          <div className="form-group"><label className="form-label">Lesson Title</label><input value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))} required /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea value={lessonForm.description} onChange={e => setLessonForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
          <div className="form-group"><label className="form-label">Video (mp4)</label><input type="file" accept="video/*" onChange={e => setVideo(e.target.files[0])} /></div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">Add Lesson</button>
            <button type="button" className="btn btn-secondary" onClick={() => nav(`/course/${courseId}`)}>Finish → View Course</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="container animate-in" style={{ maxWidth: 600 }}>
      <h1 style={{ marginBottom: 20 }}>Create Course</h1>
      <form onSubmit={handleCreate}>
        <div className="form-group"><label className="form-label">Title</label><input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Web3 for Beginners" required /></div>
        <div className="form-group"><label className="form-label">Description</label><textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4} placeholder="Describe your course..." /></div>
        <div className="form-group"><label className="form-label">Price (RUB)</label><input type="number" value={form.price} onChange={e => set("price", Number(e.target.value))} min={1} /></div>
        <div className="form-group"><label className="form-label">Category</label>
          <select value={form.category} onChange={e => set("category", e.target.value)}>
            <option value="">Select category</option>
            <option value="blockchain">Blockchain</option>
            <option value="web3">Web3</option>
            <option value="defi">DeFi</option>
            <option value="trading">Trading</option>
            <option value="development">Development</option>
            <option value="design">Design</option>
            <option value="business">Business</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">Cover Image</label><input type="file" accept="image/*" onChange={e => setCover(e.target.files[0])} /></div>
        <button type="submit" className="btn btn-primary btn-block">Create Course</button>
      </form>
    </div>
  );
}
