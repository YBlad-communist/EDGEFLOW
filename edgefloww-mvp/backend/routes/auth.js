import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import db from "../models/migrate.js";
import { signToken } from "../middleware/auth.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "edgefloww_super_secret_change_in_prod";

router.post("/register", (req, res) => {
  try {
    const { email, password, role = "student" } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email и пароль обязательны" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Некорректный email" });
    if (password.length < 4) return res.status(400).json({ error: "Пароль минимум 4 символа" });
    if (!["student", "author"].includes(role)) return res.status(400).json({ error: "Роль должна быть student или author" });
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) return res.status(409).json({ error: "Email уже зарегистрирован" });
    const passwordHash = bcrypt.hashSync(password, 10);
    const id = uuidv4();
    const username = "User_" + Math.random().toString(36).slice(2, 6).toUpperCase();
    db.prepare("INSERT INTO users (id, email, password_hash, role, username, display_name, balance, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)").run(id, email, passwordHash, role, username, username, new Date().toISOString());
    const token = signToken(id, role);
    const user = db.prepare("SELECT id, email, role, username, display_name, avatar, bio, wallet_address, balance FROM users WHERE id = ?").get(id);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email и пароль обязательны" });
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: "Неверный email или пароль" });
    const token = signToken(user.id, user.role);
    delete user.password_hash;
    const isAdmin = db.prepare("SELECT id FROM admins WHERE user_id = ?").get(user.id);
    res.json({ user: { ...user, isAdmin: !!isAdmin }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Требуется авторизация" });
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    const user = db.prepare("SELECT id, email, role, username, display_name, avatar, bio, wallet_address, balance FROM users WHERE id = ?").get(decoded.userId);
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });
    const isAdmin = db.prepare("SELECT id FROM admins WHERE user_id = ?").get(user.id);
    res.json({ ...user, isAdmin: !!isAdmin });
  } catch {
    res.status(401).json({ error: "Неверный токен" });
  }
});

export default router;
