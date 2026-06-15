import { Router } from "express";
import { z } from "zod";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

const teacherProfileSchema = z.object({
  fullName: z.string().min(1, "ФИО обязательно"),
  education: z.string().min(1, "Образование обязательно"),
  experience: z.number().min(0).default(0),
  specialization: z.string().min(1, "Специализация обязательна"),
  hourlyRate: z.number().min(0).default(0),
  bio: z.string().default(""),
  certificateUrls: z.array(z.string()).default([]),
});

router.get("/teacher", authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== "teacher") return res.status(403).json({ error: "Не учитель" });
    res.json(user.teacherProfile || {});
  } catch (err) { next(err); }
});

router.post("/teacher", authMiddleware, validate(teacherProfileSchema), async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== "teacher") return res.status(403).json({ error: "Не учитель" });
    const data = req.validatedBody;
    user.teacherProfile = { ...data, isComplete: true };
    await user.save();
    res.json({ message: "Анкета сохранена", profile: user.teacherProfile });
  } catch (err) { next(err); }
});

router.get("/mode", authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ mode: user.mode });
  } catch (err) { next(err); }
});

const modeSchema = z.object({
  mode: z.enum(["learn_only", "learn_and_teach"]),
});

router.post("/mode", authMiddleware, validate(modeSchema), async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    user.mode = req.validatedBody.mode;
    await user.save();
    res.json({ message: "Режим обновлён", mode: user.mode });
  } catch (err) { next(err); }
});

export default router;
