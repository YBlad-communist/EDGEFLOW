import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../models/migrate.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post("/buy/:courseId", authMiddleware, (req, res) => {
  try {
    const course = db.prepare("SELECT * FROM courses WHERE id = ?").get(req.params.courseId);
    if (!course) return res.status(404).json({ error: "Курс не найден" });
    if (course.author_id === req.userId) return res.status(400).json({ error: "Нельзя купить свой курс" });
    const existing = db.prepare("SELECT id, status FROM purchases WHERE course_id = ? AND student_id = ?").get(req.params.courseId, req.userId);
    if (existing) {
      if (existing.status === "confirmed") return res.status(400).json({ error: "Курс уже куплен" });
      if (existing.status === "pending") return res.json({ purchase: existing, message: "Ожидает подтверждения оплаты" });
    }
    const id = uuidv4();
    db.prepare("INSERT INTO purchases (id, course_id, student_id, amount, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)").run(id, req.params.courseId, req.userId, course.price, new Date().toISOString());
    const purchase = db.prepare("SELECT * FROM purchases WHERE id = ?").get(id);
    res.status(201).json({ purchase, message: "Счёт создан. Переведите USDT и подтвердите оплату.", walletAddress: db.prepare("SELECT wallet_address FROM users WHERE id = ?").get(course.author_id)?.wallet_address || "TBA" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/confirm/:purchaseId", authMiddleware, (req, res) => {
  const purchase = db.prepare("SELECT * FROM purchases WHERE id = ?").get(req.params.purchaseId);
  if (!purchase) return res.status(404).json({ error: "Платёж не найден" });
  if (purchase.student_id !== req.userId) return res.status(403).json({ error: "Нет прав" });
  if (purchase.status !== "pending") return res.status(400).json({ error: "Платёж уже обработан" });
  const now = new Date().toISOString();
  const commission = purchase.amount * 0.05;
  const authorAmount = purchase.amount - commission;
  db.prepare("UPDATE purchases SET status = 'confirmed', confirmed_at = ?, tx_hash = ? WHERE id = ?").run(now, req.body.txHash || `emulated_${Date.now()}`, req.params.purchaseId);
  db.prepare("UPDATE users SET balance = balance + ? WHERE id = (SELECT author_id FROM courses WHERE id = ?)").run(authorAmount, purchase.course_id);
  db.prepare("UPDATE users SET balance = balance + ? WHERE id IN (SELECT user_id FROM admins)").run(commission);
  res.json({ success: true, message: "Платёж подтверждён. Курс доступен." });
});

router.get("/pending", authMiddleware, (req, res) => {
  const isAdmin = db.prepare("SELECT id FROM admins WHERE user_id = ?").get(req.userId);
  if (!isAdmin) return res.status(403).json({ error: "Только для администраторов" });
  const pending = db.prepare("SELECT p.*, c.title as course_title, u.email as student_email, u.username as student_username FROM purchases p JOIN courses c ON p.course_id = c.id JOIN users u ON p.student_id = u.id WHERE p.status = 'pending' ORDER BY p.created_at DESC").all();
  res.json(pending);
});

router.post("/admin-confirm/:purchaseId", authMiddleware, (req, res) => {
  const isAdmin = db.prepare("SELECT id FROM admins WHERE user_id = ?").get(req.userId);
  if (!isAdmin) return res.status(403).json({ error: "Только для администраторов" });
  const purchase = db.prepare("SELECT * FROM purchases WHERE id = ?").get(req.params.purchaseId);
  if (!purchase || purchase.status !== "pending") return res.status(400).json({ error: "Платёж не найден или уже обработан" });
  const now = new Date().toISOString();
  const commission = purchase.amount * 0.05;
  const authorAmount = purchase.amount - commission;
  db.prepare("UPDATE purchases SET status = 'confirmed', confirmed_at = ?, tx_hash = ? WHERE id = ?").run(now, `admin_${Date.now()}`, req.params.purchaseId);
  db.prepare("UPDATE users SET balance = balance + ? WHERE id = (SELECT author_id FROM courses WHERE id = ?)").run(authorAmount, purchase.course_id);
  db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(commission, req.userId);
  res.json({ success: true, message: "Платёж подтверждён администратором" });
});

router.get("/my", authMiddleware, (req, res) => {
  const purchases = db.prepare("SELECT p.*, c.title as course_title FROM purchases p JOIN courses c ON p.course_id = c.id WHERE p.student_id = ? ORDER BY p.created_at DESC").all(req.userId);
  res.json(purchases);
});

export default router;
