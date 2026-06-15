import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function CoursesList() {
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-5">Курсы</h1>
      <div className="flex gap-4 mb-6 flex-wrap">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск курсов..." className="flex-1 min-w-[200px] bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent min-w-[140px]">
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
      {courses.length === 0 && (
        <div className="text-center py-16 text-secondary">
          <div className="text-5xl mb-3 text-accent">COURSES</div>
          <p>Курсов не найдено</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((c) => (
          <Link key={c._id} to={`/courses/${c._id}`} className="bg-card border border-edge rounded-xl overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/10 transition-all no-underline text-white">
            {c.cover ? (
              <img src={c.cover} alt={c.title} className="w-full aspect-video object-cover" />
            ) : (
              <div className="w-full aspect-video bg-[#1a1a2e] flex items-center justify-center text-2xl text-secondary">COURSE</div>
            )}
            <div className="p-4">
              <div className="text-lg font-extrabold text-accent mb-1">{c.price} ₽</div>
              <div className="text-sm font-semibold truncate mb-1">{c.title}</div>
              <div className="text-xs text-secondary">{c.author_display_name || c.author_name} &middot; {c.avg_rating ? Number(c.avg_rating).toFixed(1) : "0.0"} ({c.review_count || 0})</div>
              {c.category && <span className="inline-block bg-blue-500/10 text-blue-400 text-xs font-semibold px-2 py-0.5 rounded mt-2">{c.category}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
