import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function MyLearning({ user }) {
  const [courses, setCourses] = useState([]);

  useEffect(() => { api("/api/courses/purchased").then(setCourses).catch(() => {}); }, []);

  return (
    <div className="container animate-in">
      <h1 style={{ marginBottom: 20 }}>My Learning</h1>

      {courses.length === 0 && <div className="empty-state"><h2>📚</h2><p>You haven't purchased any courses yet. <Link to="/">Browse courses</Link></p></div>}

      <div className="grid">
        {courses.map(c => (
          <Link key={c.id} to={`/course/${c.id}`} className="card course-card" style={{ textDecoration: "none", color: "inherit" }}>
            {c.cover && <img src={c.cover} alt="" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 8, marginBottom: 12 }} />}
            <div className="price">⭐ {Number(c.avg_rating || 0).toFixed(1)}</div>
            <div className="title">{c.title}</div>
            <div className="meta">by {c.author_display_name || c.author_name} · {c.lesson_count || 0} lessons</div>
            <div className="meta"><span className="badge badge-green">✅ Purchased</span></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
