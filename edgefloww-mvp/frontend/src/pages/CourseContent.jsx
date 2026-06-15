import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api.js";

export default function CourseContent() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api(`/api/courses/${id}`).then(setCourse).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-lg text-secondary">Загрузка...</div>;
  if (!course) return <div className="flex items-center justify-center min-h-[60vh] text-lg text-secondary">Курс не найден</div>;

  const lessons = course.lessons || [];
  const lesson = lessons[currentLesson];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Link to={`/courses/${id}`} className="inline-block bg-surface border border-edge text-secondary px-3 py-1.5 rounded-lg text-sm mb-4 hover:text-white transition no-underline">&larr; Назад к курсу</Link>
      <h1 className="text-xl font-bold mb-1">{course.title}</h1>
      <p className="text-sm text-secondary mb-4">{course.description}</p>
      <div className="flex gap-4 flex-wrap">
        <div className="flex-[2] min-w-[300px]">
          {lesson ? (
            <>
              <h2 className="text-lg font-semibold mb-3">{lesson.title}</h2>
              {lesson.videoUrl && (
                <div className="bg-black rounded-xl overflow-hidden mb-4">
                  <video controls className="w-full" src={lesson.videoUrl} />
                </div>
              )}
              {lesson.content && <div className="text-sm leading-relaxed">{lesson.content}</div>}
            </>
          ) : (
            <div className="py-10 text-center text-secondary">В этом курсе пока нет уроков</div>
          )}
        </div>
        <div className="flex-1 min-w-[250px]">
          <div className="bg-card border border-edge rounded-xl p-4">
            <h3 className="text-xs font-semibold text-secondary mb-3">Уроки курса</h3>
            {lessons.map((l, i) => (
              <div
                key={l._id || i}
                onClick={() => setCurrentLesson(i)}
                className={`px-3 py-2.5 rounded-lg cursor-pointer mb-1 text-sm transition ${i === currentLesson ? "bg-accent/15 border border-accent font-semibold" : "border border-transparent hover:bg-surface"}`}
              >
                <div>{i + 1}. {l.title}</div>
                {l.duration && <div className="text-xs text-secondary">{l.duration}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
