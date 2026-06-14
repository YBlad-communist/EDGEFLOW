import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function MyCourses({ user }) {
  const [courses, setCourses] = useState([]);

  useEffect(() => { api("/api/courses/my").then(setCourses).catch(() => {}); }, []);

  return (
    <div className="container animate-in">
      <div className="flex gap-4 mb-4" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h1>My Courses</h1>
        <Link to="/create" className="btn btn-primary">+ New Course</Link>
      </div>

      {courses.length === 0 && <div className="empty-state"><h2>🎓</h2><p>You haven't created any courses yet</p></div>}

      <div className="grid">
        {courses.map(c => (
          <Link key={c._id} to={`/course/${c._id}`} className="card course-card" style={{ textDecoration: "none", color: "inherit" }}>
            {c.cover && <img src={c.cover} alt="" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 8, marginBottom: 12 }} />}
            <div className="price">{c.priceUSDT} ₽</div>
            <div className="title">{c.title}</div>
            <div className="meta">{c.lesson_count || 0} lessons {c.category && <span className="badge badge-blue">{c.category}</span>}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
