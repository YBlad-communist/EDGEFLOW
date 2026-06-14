import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api.js";

export default function WatchLesson({ user }) {
  const { id, lessonId } = useParams();
  const [course, setCourse] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/api/courses/${id}`).then(setCourse).catch(() => {});
    api(`/api/video/token/${lessonId}`).then(data => setVideoUrl(data.url)).catch(err => setError(err.message));
  }, [id, lessonId]);

  if (error) return <div className="container text-center" style={{ paddingTop: 80 }}><h2>🔒</h2><p>{error}</p><Link to={`/course/${id}`} className="btn btn-primary mt-4">Back to Course</Link></div>;

  if (!course) return <div className="container text-center" style={{ paddingTop: 80 }}>Loading...</div>;

  const lesson = course.lessons?.find(l => l._id === lessonId);
  const lessonIndex = course.lessons?.findIndex(l => l._id === lessonId);
  const prevLesson = lessonIndex > 0 ? course.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < (course.lessons?.length || 0) - 1 ? course.lessons[lessonIndex + 1] : null;

  return (
    <div className="container animate-in">
      <div className="flex gap-2 mb-4" style={{ alignItems: "center" }}>
        <Link to={`/course/${id}`} className="btn btn-secondary btn-sm">← Back to Course</Link>
        <span style={{ fontSize: 18, fontWeight: 700 }}>{lesson?.title || "Lesson"}</span>
      </div>

      <div className="video-container">
        {videoUrl ? (
          <video
            controls
            autoPlay
            className="video-player"
            style={{ width: "100%", borderRadius: 12, background: "#000" }}
            onContextMenu={(e) => e.preventDefault()}
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : (
          <div style={{ width: "100%", aspectRatio: "16/9", background: "#1a1a2e", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p className="text-secondary">{videoUrl === null ? "Loading video..." : "Video placeholder — upload an mp4 to see it here"}</p>
          </div>
        )}
      </div>

      {lesson?.description && <p className="text-secondary mt-4" style={{ maxWidth: 600 }}>{lesson.description}</p>}

      <div className="flex gap-4 mt-4">
        {prevLesson && <Link to={`/course/${id}/lesson/${prevLesson._id}`} className="btn btn-secondary">← {prevLesson.title}</Link>}
        {nextLesson && <Link to={`/course/${id}/lesson/${nextLesson._id}`} className="btn btn-primary">{nextLesson.title} →</Link>}
      </div>
    </div>
  );
}
