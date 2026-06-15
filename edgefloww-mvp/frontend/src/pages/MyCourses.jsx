import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function MyCourses() {
  const [courses, setCourses] = useState([]);

  useEffect(() => { api("/api/courses/my").then(setCourses).catch(() => {}); }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Мои курсы</h1>
        <Link to="/create-course" className="bg-accent text-white font-semibold rounded-lg px-4 py-2 text-sm hover:bg-accent-hover transition no-underline">+ Новый курс</Link>
      </div>
      {courses.length === 0 && (
        <div className="text-center py-16 text-secondary">
          <div className="text-5xl mb-3 text-accent">COURSES</div>
          <p>Вы ещё не создали ни одного курса</p>
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
              <div className="text-lg font-extrabold text-accent">{c.price} ₽</div>
              <div className="text-sm font-semibold truncate">{c.title}</div>
              <div className="text-xs text-secondary mt-1">{c.lesson_count || 0} уроков {c.category && <span className="bg-blue-500/10 text-blue-400 ml-1 px-1.5 py-0.5 rounded">{c.category}</span>}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
