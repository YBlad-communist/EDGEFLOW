import db from "../models/migrate.js";
import { v4 as uuidv4 } from "uuid";

const TOKEN_LIFETIME_MS = 15 * 60 * 1000; // 15 minutes

export function drmMiddleware(req, res, next) {
  const token = req.query.token;
  if (!token) return res.status(401).json({ error: "Требуется токен доступа" });
  const row = db.prepare("SELECT * FROM drm_tokens WHERE token = ? AND used = 0 AND expires_at > datetime('now')").get(token);
  if (!row) return res.status(403).json({ error: "Недействительный или просроченный токен" });
  db.prepare("UPDATE drm_tokens SET used = 1 WHERE id = ?").run(row.id);
  req.lessonId = row.lesson_id;
  req.userId = row.user_id;
  next();
}

export function generateToken(lessonId, userId) {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_MS).toISOString();
  db.prepare("INSERT INTO drm_tokens (id, lesson_id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(uuidv4(), lessonId, userId, token, expiresAt, new Date().toISOString());
  return token;
}
