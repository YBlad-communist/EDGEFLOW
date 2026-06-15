import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function MyLearning() {
  const [courses, setCourses] = useState([]);

  useEffect(() => { api("/api/courses/purchased").then(setCourses).catch(() => {}); }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-5">Моё обучение</h1>
      {courses.length === 0 && (
        <div className="text-center py-16 text-secondary">
          <div className="text-5xl mb-3 text-accent">LEARN</div>
          <p>Курсов пока нет. <Link to="/courses" className="text-accent">Смотреть курсы</Link></p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((c) => (
          <Link key={c._id} to={`/courses/${c._id}`} className="bg-card border border-edge rounded-xl overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/10 transition-all no-underline text-white">
            {c.cover ? (
              <img src={c.cover} alt="" className="w-full aspect-video object-cover" />
            ) : (
              <div className="w-full aspect-video bg-[#1a1a2e] flex items-center justify-center text-2xl text-secondary">COURSE</div>
            )}
            <div className="p-4">
              <div className="text-lg font-extrabold text-accent">{Number(c.avg_rating || 0).toFixed(1)}</div>
              <div className="text-sm font-semibold truncate">{c.title}</div>
              <div className="text-xs text-secondary mt-1">by {c.author_display_name || c.author_name} &middot; {c.lesson_count || 0} уроков</div>
              <div className="mt-2"><span className="bg-green-500/10 text-green-400 text-xs font-semibold px-2 py-0.5 rounded">Куплено</span></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
