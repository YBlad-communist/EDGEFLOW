import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function CoursesList({ user }) {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    api(`/api/courses?${params}`).then(setCourses).catch(() => {});
  }, [search, category]);

  return (
    <div className="container animate-in">
      <h1 style={{ marginBottom: 20 }}>Курсы</h1>

      <div className="flex gap-4 mb-4" style={{ flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск курсов..." style={{ flex: 1, minWidth: 200 }} />
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: "auto", minWidth: 140 }}>
          <option value="">Все категории</option>
          <option value="blockchain">Blockchain</option>
          <option value="web3">Web3</option>
          <option value="defi">DeFi</option>
          <option value="trading">Trading</option>
          <option value="development">Development</option>
          <option value="design">Design</option>
          <option value="business">Business</option>
        </select>
      </div>

      {courses.length === 0 && <div className="empty-state"><h2>📚</h2><p>Курсов не найдено</p></div>}

      <div className="grid">
        {courses.map(c => (
          <Link key={c._id} to={`/course/${c._id}`} className="card course-card" style={{ textDecoration: "none", color: "inherit" }}>
            {c.cover && <img src={c.cover} alt={c.title} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 8, marginBottom: 12 }} />}
            {!c.cover && <div style={{ width: "100%", aspectRatio: "16/9", background: "#1a1a2e", borderRadius: 8, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>📹</div>}
            <div className="price">{c.priceUSDT} ₽</div>
            <div className="title">{c.title}</div>
            <div className="meta">{c.author_display_name || c.author_name} · ⭐ {Number(c.avg_rating || 0).toFixed(1)} ({c.review_count})</div>
            <div className="meta" style={{ marginTop: 4 }}>{c.category && <span className={`badge badge-${c.category === "blockchain" ? "blue" : "green"}`}>{c.category}</span>}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
