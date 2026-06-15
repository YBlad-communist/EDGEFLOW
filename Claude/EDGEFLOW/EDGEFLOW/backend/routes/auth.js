import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import { signAccessToken, signRefreshToken, authMiddleware } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import config from "../config/index.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(4, "Пароль минимум 4 символа"),
  role: z.enum(["student", "teacher"]).default("student"),
});

const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Пароль обязателен"),
});

function setTokenCookies(res, accessToken, refreshToken) {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
    path: "/",
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
}

router.post("/register", validate(registerSchema), async (req, res) => {
  try {
    const { email, password, role } = req.validatedBody;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email уже зарегистрирован" });
    const passwordHash = await bcrypt.hash(password, 10);
    const username = "User_" + Math.random().toString(36).slice(2, 6).toUpperCase();
    const mode = role === "teacher" ? "learn_and_teach" : "learn_only";
    const user = await User.create({ email, passwordHash, role, mode, username, displayName: username });
    const accessToken = signAccessToken(user._id.toString(), user.role);
    const refreshToken = signRefreshToken(user._id.toString());
    await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    setTokenCookies(res, accessToken, refreshToken);
    res.status(201).json({ user: user.toSafeJSON() });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Ошибка регистрации" });
  }
});

router.post("/login", validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.validatedBody;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Неверный email или пароль" });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: "Неверный email или пароль" });
    const accessToken = signAccessToken(user._id.toString(), user.role);
    const refreshToken = signRefreshToken(user._id.toString());
    await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    setTokenCookies(res, accessToken, refreshToken);
    res.json({ user: user.toSafeJSON() });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: "Refresh token не найден" });
    const stored = await RefreshToken.findOne({ token });
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await stored.deleteOne();
      return res.status(401).json({ error: "Refresh token истёк или отозван" });
    }
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: "Пользователь не найден" });
    await stored.deleteOne();
    const accessToken = signAccessToken(user._id.toString(), user.role);
    const newRefreshToken = signRefreshToken(user._id.toString());
    await RefreshToken.create({ userId: user._id, token: newRefreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    setTokenCookies(res, accessToken, newRefreshToken);
    res.json({ user: user.toSafeJSON() });
  } catch {
    res.status(401).json({ error: "Неверный refresh token" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) await RefreshToken.deleteOne({ token });
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/api/auth" });
    res.json({ message: "Выход выполнен" });
  } catch {
    res.json({ message: "Выход выполнен" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });
    res.json(user.toSafeJSON());
  } catch {
    res.status(401).json({ error: "Неверный токен" });
  }
});

export default router;
