import { Router } from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, statSync, createReadStream } from "fs";
import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";
import { authMiddleware } from "../middleware/auth.js";
import { drmMiddleware, generateToken } from "../middleware/drm.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

router.get("/token/:lessonId", authMiddleware, async (req, res) => {
  try {
    const course = await Course.findOne({ "lessons._id": req.params.lessonId });
    if (!course) return res.status(404).json({ error: "Урок не найден" });

    const lesson = course.lessons.id(req.params.lessonId);
    const isOwner = course.authorId.toString() === req.userId;
    const purchase = await Purchase.findOne({
      courseId: course._id, studentId: req.userId, status: "completed",
    });
    if (!isOwner && !purchase) return res.status(403).json({ error: "У вас нет доступа к этому уроку" });

    const { token, expiresAt } = await generateToken(req.params.lessonId, req.userId);
    res.json({
      token,
      url: `/api/video/stream/${req.params.lessonId}?token=${token}`,
      expiresAt,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/stream/:lessonId", drmMiddleware, async (req, res) => {
  try {
    const course = await Course.findOne({ "lessons._id": req.params.lessonId });
    if (!course) return res.status(404).json({ error: "Курс не найден" });

    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson || !lesson.videoPath) return res.status(404).json({ error: "Видео не найдено" });

    const videoPath = join(__dirname, "..", lesson.videoPath);
    if (!existsSync(videoPath)) return res.status(404).json({ error: "Файл видео не найден на сервере" });

    const fileSize = statSync(videoPath).size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const stream = createReadStream(videoPath, { start, end });
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
      });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
        "Content-Disposition": "inline",
        "Accept-Ranges": "bytes",
        "X-Content-Type-Options": "nosniff",
      });
      createReadStream(videoPath).pipe(res);
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
