import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function CourseDetail({ user }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [purchaseMsg, setPurchaseMsg] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const load = () => api(`/api/courses/${id}`).then(setCourse).catch(() => nav("/")).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const handleBuy = async () => {
    setBuying(true);
    try {
      const result = await api(`/api/payments/buy/${id}`, { method: "POST" });
      setPurchaseMsg(`Send ${course.price} USDT to wallet: ${result.walletAddress || "TBA"}. Then click "I Paid" to confirm.`);
    } catch (err) { setPurchaseMsg(err.message); }
    setBuying(false);
  };

  const handleConfirmPayment = async () => {
    try {
      const purchases = await api(`/api/payments/my`);
      const pending = purchases.find(p => p.course_id === id && p.status === "pending");
      if (!pending) return setPurchaseMsg("No pending payment found");
      await api(`/api/payments/confirm/${pending.id}`, { method: "POST", body: JSON.stringify({ txHash: `tx_${Date.now()}` }) });
      setPurchaseMsg("Payment confirmed! Course is now available.");
      load();
    } catch (err) { setPurchaseMsg(err.message); }
  };

  const handleReview = async () => {
    try { await api(`/api/courses/${id}/review`, { method: "POST", body: JSON.stringify({ rating: reviewRating, comment: reviewComment }) }); load(); setReviewComment(""); } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="container text-center" style={{ paddingTop: 80 }}>Loading...</div>;
  if (!course) return null;

  return (
    <div className="container animate-in">
      <div className="course-header">
        {course.cover && <img src={`http://localhost:3001${course.cover}`} alt="" className="cover" />}
        {!course.cover && <div style={{ width: "100%", maxWidth: 400, aspectRatio: "16/9", background: "#1a1a2e", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>📹</div>}
        <div className="info">
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>{course.title}</h1>
          <p className="text-secondary mb-4">{course.description}</p>
          <div className="flex gap-4" style={{ flexWrap: "wrap", marginBottom: 16 }}>
            <span className="badge badge-green">{course.category}</span>
            <span className="text-secondary">by {course.author_display_name || course.author_name}</span>
            <span className="text-secondary">⭐ {Number(course.avg_rating || 0).toFixed(1)} ({course.review_count} reviews)</span>
            <span className="text-secondary">{course.lessons?.length || 0} lessons</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#7c5cfc", marginBottom: 16 }}>${course.price} USDT</div>

          {course.purchased && <div className="badge badge-green" style={{ padding: "8px 16px", fontSize: 14 }}>✅ Purchased</div>}
          {!course.purchased && user.role !== "author" && !purchaseMsg && <button className="btn btn-primary" onClick={handleBuy} disabled={buying}>{buying ? "Processing..." : `Buy for $${course.price} USDT`}</button>}
          {user.role === "author" && <span className="text-secondary">You are the author of this course</span>}

          {purchaseMsg && (
            <div className="card mt-4">
              <p style={{ fontSize: 13, marginBottom: 12 }}>{purchaseMsg}</p>
              {purchaseMsg.includes("Send") && <button className="btn btn-primary btn-sm" onClick={handleConfirmPayment}>✅ I Paid — Confirm</button>}
            </div>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Lesson List</h2>
      {course.lessons?.length === 0 && <p className="text-secondary">No lessons yet</p>}
      <div className="card lesson-list" style={{ marginBottom: 24 }}>
        {course.lessons?.map((l, i) => (
          <div key={l.id} className="lesson-item">
            <div className="flex gap-2" style={{ alignItems: "center" }}>
              <div className="lesson-num">{i + 1}</div>
              <div><b>{l.title}</b><div className="text-secondary">{l.description}</div></div>
            </div>
            {(course.purchased || course.author_id === user?.id) && <Link to={`/course/${id}/lesson/${l.id}`} className="btn btn-primary btn-sm">Watch</Link>}
            {!course.purchased && course.author_id !== user?.id && <span className="text-secondary">🔒</span>}
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Reviews</h2>
      {course.reviews?.length === 0 && <p className="text-secondary mb-4">No reviews yet</p>}
      <div className="card" style={{ marginBottom: 24 }}>
        {course.reviews?.map(r => (
          <div key={r.id} className="review-card">
            <div className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
            <div style={{ fontSize: 13, marginTop: 4 }}><b>{r.display_name || r.username}</b> <span className="text-secondary">{new Date(r.created_at).toLocaleDateString()}</span></div>
            {r.comment && <p style={{ fontSize: 13, marginTop: 4, color: "#bbb" }}>{r.comment}</p>}
          </div>
        ))}
      </div>

      {course.purchased && (
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Leave a Review</h3>
          <div className="flex gap-2 mb-4">
            {[1,2,3,4,5].map(n => <button key={n} className={`btn ${reviewRating === n ? "btn-primary" : "btn-secondary"} btn-sm`} onClick={() => setReviewRating(n)}>{n}★</button>)}
          </div>
          <div className="form-group"><textarea className="form-input" value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Your thoughts..." rows={3} /></div>
          <button className="btn btn-primary btn-sm" onClick={handleReview}>Submit Review</button>
        </div>
      )}
    </div>
  );
}
