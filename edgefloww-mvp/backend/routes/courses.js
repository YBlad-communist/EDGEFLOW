import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import db from "../models/migrate.js";
import { authMiddleware, optionalAuth } from "../middleware/auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = file.fieldname === "video" ? "uploads/videos" : "uploads/covers";
    cb(null, join(__dirname, "..", dir));
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(null, `${uuidv4()}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "video" && !file.mimetype.startsWith("video/")) return cb(new Error("Только видеофайлы"));
    if (file.fieldname === "cover" && !file.mimetype.startsWith("image/")) return cb(new Error("Только изображения"));
    cb(null, true);
  },
});

const router = Router();

router.get("/", optionalAuth, (req, res) => {
  const { category, search } = req.query;
  let sql = `SELECT c.*, u.username as author_name, u.display_name as author_display_name,
    COALESCE((SELECT AVG(rating) FROM reviews WHERE course_id = c.id), 0) as avg_rating,
    COALESCE((SELECT COUNT(*) FROM reviews WHERE course_id = c.id), 0) as review_count
    FROM courses c JOIN users u ON c.author_id = u.id WHERE 1=1`;
  const params = [];
  if (category) { sql += " AND c.category = ?"; params.push(category); }
  if (search) { sql += " AND (c.title LIKE ? OR c.description LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
  sql += " ORDER BY c.created_at DESC";
  const courses = db.prepare(sql).all(...params);
  res.json(courses);
});

router.get("/my", authMiddleware, (req, res) => {
  const courses = db.prepare("SELECT * FROM courses WHERE author_id = ? ORDER BY created_at DESC").all(req.userId);
  res.json(courses.map(c => ({ ...c, lesson_count: db.prepare("SELECT COUNT(*) as c FROM lessons WHERE course_id = ?").get(c.id).c })));
});

router.get("/purchased", authMiddleware, (req, res) => {
  const courses = db.prepare(`SELECT c.*, u.username as author_name, u.display_name as author_display_name,
    COALESCE((SELECT AVG(rating) FROM reviews WHERE course_id = c.id), 0) as avg_rating,
    (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as lesson_count
    FROM courses c JOIN purchases p ON c.id = p.course_id JOIN users u ON c.author_id = u.id
    WHERE p.student_id = ? AND p.status = 'confirmed' ORDER BY p.created_at DESC`).all(req.userId);
  res.json(courses);
});

router.get("/:id", optionalAuth, (req, res) => {
  const course = db.prepare(`SELECT c.*, u.username as author_name, u.display_name as author_display_name, u.avatar as author_avatar, u.bio as author_bio,
    COALESCE((SELECT AVG(rating) FROM reviews WHERE course_id = c.id), 0) as avg_rating,
    COALESCE((SELECT COUNT(*) FROM reviews WHERE course_id = c.id), 0) as review_count
    FROM courses c JOIN users u ON c.author_id = u.id WHERE c.id = ?`).get(req.params.id);
  if (!course) return res.status(404).json({ error: "Курс не найден" });
  const lessons = db.prepare("SELECT id, title, description, sort_order FROM lessons WHERE course_id = ? ORDER BY sort_order ASC").all(req.params.id);
  const reviews = db.prepare("SELECT r.*, u.username, u.display_name, u.avatar FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.course_id = ? ORDER BY r.created_at DESC").all(req.params.id);
  let purchased = false;
  if (req.userId) {
    const p = db.prepare("SELECT id FROM purchases WHERE course_id = ? AND student_id = ? AND status = 'confirmed'").get(req.params.id, req.userId);
    purchased = !!p;
  }
  res.json({ ...course, lessons, reviews, purchased });
});

router.post("/", authMiddleware, (req, res) => {
  if (req.userRole !== "author") return res.status(403).json({ error: "Только автор может создавать курсы" });
  const { title, description, price, category } = req.body;
  if (!title || !price) return res.status(400).json({ error: "Название и цена обязательны" });
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare("INSERT INTO courses (id, author_id, title, description, price, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(id, req.userId, title, description || "", price, category || "", now, now);
  const course = db.prepare("SELECT * FROM courses WHERE id = ?").get(id);
  res.status(201).json(course);
});

router.put("/:id", authMiddleware, (req, res) => {
  const course = db.prepare("SELECT * FROM courses WHERE id = ?").get(req.params.id);
  if (!course) return res.status(404).json({ error: "Курс не найден" });
  if (course.author_id !== req.userId) return res.status(403).json({ error: "Нет прав" });
  const { title, description, price, category } = req.body;
  const now = new Date().toISOString();
  db.prepare("UPDATE courses SET title = COALESCE(?, title), description = COALESCE(?, description), price = COALESCE(?, price), category = COALESCE(?, category), updated_at = ? WHERE id = ?").run(title || null, description !== undefined ? description : null, price || null, category !== undefined ? category : null, now, req.params.id);
  res.json(db.prepare("SELECT * FROM courses WHERE id = ?").get(req.params.id));
});

router.delete("/:id", authMiddleware, (req, res) => {
  const course = db.prepare("SELECT * FROM courses WHERE id = ?").get(req.params.id);
  if (!course) return res.status(404).json({ error: "Курс не найден" });
  if (course.author_id !== req.userId) return res.status(403).json({ error: "Нет прав" });
  db.prepare("DELETE FROM courses WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

router.post("/:id/cover", authMiddleware, upload.single("cover"), (req, res) => {
  const course = db.prepare("SELECT * FROM courses WHERE id = ?").get(req.params.id);
  if (!course || course.author_id !== req.userId) return res.status(404).json({ error: "Курс не найден" });
  const coverPath = `/uploads/covers/${req.file.filename}`;
  db.prepare("UPDATE courses SET cover = ? WHERE id = ?").run(coverPath, req.params.id);
  res.json({ cover: coverPath });
});

router.post("/:id/lessons", authMiddleware, upload.single("video"), (req, res) => {
  const course = db.prepare("SELECT * FROM courses WHERE id = ?").get(req.params.id);
  if (!course || course.author_id !== req.userId) return res.status(404).json({ error: "Курс не найден" });
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: "Название урока обязательно" });
  const id = uuidv4();
  const maxSort = db.prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM lessons WHERE course_id = ?").get(req.params.id);
  const videoPath = req.file ? `/uploads/videos/${req.file.filename}` : null;
  db.prepare("INSERT INTO lessons (id, course_id, title, description, video_path, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, req.params.id, title, description || "", videoPath, maxSort.next, new Date().toISOString());
  res.status(201).json(db.prepare("SELECT * FROM lessons WHERE id = ?").get(id));
});

router.delete("/:courseId/lessons/:lessonId", authMiddleware, (req, res) => {
  const course = db.prepare("SELECT * FROM courses WHERE id = ?").get(req.params.courseId);
  if (!course || course.author_id !== req.userId) return res.status(404).json({ error: "Курс не найден" });
  db.prepare("DELETE FROM lessons WHERE id = ? AND course_id = ?").run(req.params.lessonId, req.params.courseId);
  res.json({ success: true });
});

router.post("/:id/review", authMiddleware, (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Рейтинг от 1 до 5" });
  const purchase = db.prepare("SELECT id FROM purchases WHERE course_id = ? AND student_id = ? AND status = 'confirmed'").get(req.params.id, req.userId);
  if (!purchase) return res.status(403).json({ error: "Только купившие курс могут оставить отзыв" });
  const existing = db.prepare("SELECT id FROM reviews WHERE course_id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (existing) return res.status(409).json({ error: "Вы уже оставили отзыв" });
  const id = uuidv4();
  db.prepare("INSERT INTO reviews (id, course_id, user_id, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(id, req.params.id, req.userId, rating, comment || "", new Date().toISOString());
  res.status(201).json({ success: true });
});

export default router;
