import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function CourseDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, updateUser } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [purchaseMsg, setPurchaseMsg] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const load = () => {
    if (!id) { nav("/"); return; }
    api(`/api/courses/${id}`).then(setCourse).catch(() => nav("/")).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [id]);

  const handleBuy = async () => {
    setBuying(true);
    try {
      const data = await api(`/api/courses/${id}/buy`, { method: "POST" });
      setPurchaseMsg(data.message);
      if (data.balanceRub !== undefined) updateUser({ balanceRub: data.balanceRub });
      load();
    } catch (err) { setPurchaseMsg(err.message); }
    setBuying(false);
  };

  const handleReview = async () => {
    try {
      await api(`/api/courses/${id}/review`, { method: "POST", body: JSON.stringify({ rating: reviewRating, comment: reviewComment }) });
      load(); setReviewComment("");
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-lg text-secondary">Загрузка...</div>;
  if (!course) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex gap-6 flex-wrap mb-8">
        {course.cover ? (
          <img src={course.cover} alt="" className="w-full max-w-[400px] aspect-video object-cover rounded-xl" />
        ) : (
          <div className="w-full max-w-[400px] aspect-video bg-[#1a1a2e] rounded-xl flex items-center justify-center text-4xl text-secondary">COURSE</div>
        )}
        <div className="flex-1 min-w-[280px]">
          <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
          <p className="text-sm text-secondary mb-3">{course.description}</p>
          <div className="flex gap-3 flex-wrap items-center mb-4 text-xs text-secondary">
            {course.category && <span className="bg-green-500/10 text-green-400 font-semibold px-2 py-0.5 rounded">{course.category}</span>}
            <span>by {course.author_display_name || course.author_name}</span>
            <span>{Number(course.avg_rating || 0).toFixed(1)} ({course.review_count || 0} отзывов)</span>
            <span>{course.lessons?.length || 0} уроков</span>
          </div>
          <div className="text-3xl font-extrabold text-accent mb-4">{course.price} ₽</div>
          {course.purchased && <span className="bg-green-500/10 text-green-400 font-semibold px-3 py-1.5 rounded-lg">Куплено</span>}
          {!course.purchased && user?.role !== "teacher" && (
            <div className="flex gap-2 items-center">
              <button className="bg-accent text-white font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-accent-hover transition disabled:opacity-50" onClick={handleBuy} disabled={buying}>
                {buying ? "Обработка..." : `Купить за ${course.price} ₽`}
              </button>
              <span className="text-xs text-secondary">Баланс: {user?.balanceRub?.toFixed(2) || "0.00"} ₽</span>
            </div>
          )}
          {user?.id === course.authorId?._id && <span className="text-xs text-secondary">Вы автор этого курса</span>}
          {purchaseMsg && <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm rounded-lg px-4 py-2 mt-3">{purchaseMsg}</div>}
        </div>
      </div>

      <h2 className="text-lg font-bold mb-4">Уроки</h2>
      {course.lessons?.length === 0 && <p className="text-sm text-secondary mb-4">Уроков пока нет</p>}
      <div className="bg-card border border-edge rounded-xl mb-6 divide-y divide-edge">
        {course.lessons?.map((l, i) => (
          <div key={l._id} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-accent rounded-full text-xs font-bold text-white flex-shrink-0">{i + 1}</div>
              <div>
                <div className="text-sm font-semibold">{l.title}</div>
                {l.description && <div className="text-xs text-secondary">{l.description}</div>}
              </div>
            </div>
            {(course.purchased || course.authorId?._id === user?.id) ? (
              <Link to={`/courses/${id}/learn`} className="bg-accent text-white font-semibold rounded-lg px-3 py-1.5 text-xs hover:bg-accent-hover transition no-underline">Смотреть</Link>
            ) : (
              <span className="text-xs text-secondary">LOCKED</span>
            )}
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold mb-4">Отзывы</h2>
      {(!course.reviews || course.reviews.length === 0) && <p className="text-sm text-secondary mb-4">Отзывов пока нет</p>}
      <div className="bg-card border border-edge rounded-xl mb-6 divide-y divide-edge">
        {course.reviews?.map((r) => (
          <div key={r._id} className="px-5 py-3">
            <div className="text-yellow-400 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
            <div className="text-xs mt-1"><b>{r.display_name || r.username}</b> <span className="text-secondary">{new Date(r.createdAt).toLocaleDateString()}</span></div>
            {r.comment && <p className="text-xs text-secondary mt-1">{r.comment}</p>}
          </div>
        ))}
      </div>

      {course.purchased && (
        <div className="bg-card border border-edge rounded-xl p-5">
          <h3 className="text-sm font-bold mb-3">Оставить отзыв</h3>
          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${reviewRating === n ? "bg-accent text-white" : "bg-surface border border-edge text-secondary hover:text-white"}`} onClick={() => setReviewRating(n)}>
                {n}★
              </button>
            ))}
          </div>
          <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Ваше мнение..." rows={3} className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent resize-vertical mb-3" />
          <button className="bg-accent text-white font-semibold rounded-lg px-4 py-2 text-sm hover:bg-accent-hover transition" onClick={handleReview}>Отправить</button>
        </div>
      )}
    </div>
  );
}
