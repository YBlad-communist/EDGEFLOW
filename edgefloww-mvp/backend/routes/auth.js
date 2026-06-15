import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { signToken, AUTH_SECRET } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, role = "student" } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email и пароль обязательны" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Некорректный email" });
    if (password.length < 4) return res.status(400).json({ error: "Пароль минимум 4 символа" });
    if (!["student", "teacher"].includes(role)) return res.status(400).json({ error: "Роль должна быть student или teacher" });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email уже зарегистрирован" });
    const passwordHash = await bcrypt.hash(password, 10);
    const username = "User_" + Math.random().toString(36).slice(2, 6).toUpperCase();
    const mode = role === "teacher" ? "learn_and_teach" : "learn_only";
    const user = await User.create({ email, passwordHash, role, mode, username, displayName: username });
    const token = signToken(user._id.toString(), user.role);
    res.status(201).json({ user: user.toSafeJSON(), token });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Ошибка регистрации" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email и пароль обязательны" });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Неверный email или пароль" });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: "Неверный email или пароль" });
    const token = signToken(user._id.toString(), user.role);
    res.json({ user: user.toSafeJSON(), token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

router.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Требуется авторизация" });
  try {
    const decoded = jwt.verify(header.slice(7), AUTH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });
    res.json(user.toSafeJSON());
  } catch {
    res.status(401).json({ error: "Неверный токен" });
  }
});

export default router;
