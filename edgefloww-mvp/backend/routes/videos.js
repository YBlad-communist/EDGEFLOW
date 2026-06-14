import { Router } from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, statSync, createReadStream } from "fs";
import db from "../models/migrate.js";
import { authMiddleware } from "../middleware/auth.js";
import { drmMiddleware, generateToken } from "../middleware/drm.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const router = Router();

router.get("/token/:lessonId", authMiddleware, (req, res) => {
  const lesson = db.prepare("SELECT l.*, c.author_id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE l.id = ?").get(req.params.lessonId);
  if (!lesson) return res.status(404).json({ error: "Урок не найден" });
  const isOwner = lesson.author_id === req.userId;
  const purchase = db.prepare("SELECT id FROM purchases WHERE course_id = ? AND student_id = ? AND status = 'confirmed'").get(lesson.course_id, req.userId);
  if (!isOwner && !purchase) return res.status(403).json({ error: "У вас нет доступа к этому уроку" });
  const token = generateToken(req.params.lessonId, req.userId);
  res.json({ token, url: `/api/video/stream/${req.params.lessonId}?token=${token}` });
});

router.get("/stream/:lessonId", drmMiddleware, (req, res) => {
  const lesson = db.prepare("SELECT * FROM lessons WHERE id = ?").get(req.params.lessonId);
  if (!lesson || !lesson.video_path) return res.status(404).json({ error: "Видео не найдено" });
  const videoPath = join(__dirname, "..", lesson.video_path);
  if (!existsSync(videoPath)) return res.status(404).json({ error: "Файл видео не найден на сервере" });
  const fileSize = statSync(videoPath).size;
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const stream = createReadStream(videoPath, { start, end });
    res.writeHead(206, { "Content-Range": `bytes ${start}-${end}/${fileSize}`, "Accept-Ranges": "bytes", "Content-Length": chunksize, "Content-Type": "video/mp4", "Content-Disposition": "inline" });
    stream.pipe(res);
  } else {
    res.writeHead(200, { "Content-Length": fileSize, "Content-Type": "video/mp4", "Content-Disposition": "inline", "Accept-Ranges": "bytes" });
    createReadStream(videoPath).pipe(res);
  }
});

export default router;
