import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { signToken } from "../middleware/auth.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "edgefloww_super_secret_change_in_prod";

router.post("/register", async (req, res) => {
  try {
    const { email, password, role = "student" } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email и пароль обязательны" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Некорректный email" });
    if (password.length < 4) return res.status(400).json({ error: "Пароль минимум 4 символа" });
    if (!["student", "author"].includes(role)) return res.status(400).json({ error: "Роль должна быть student или author" });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email уже зарегистрирован" });
    const passwordHash = await bcrypt.hash(password, 10);
    const username = "User_" + Math.random().toString(36).slice(2, 6).toUpperCase();
    const user = await User.create({ email, passwordHash, role, username, displayName: username });
    const token = signToken(user._id.toString(), user.role);
    res.status(201).json({ user: user.toSafeJSON(), token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email и пароль обязательны" });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ error: "Неверный email или пароль" });
    const token = signToken(user._id.toString(), user.role);
    res.json({ user: user.toSafeJSON(), token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Требуется авторизация" });
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });
    res.json(user.toSafeJSON());
  } catch {
    res.status(401).json({ error: "Неверный токен" });
  }
});

export default router;
