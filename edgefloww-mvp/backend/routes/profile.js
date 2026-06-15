import { Router } from "express";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.get("/teacher", authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== "teacher") return res.status(403).json({ error: "Не учитель" });
    res.json(user.teacherProfile || {});
  } catch (err) {
    next(err);
  }
});

router.post("/teacher", authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== "teacher") return res.status(403).json({ error: "Не учитель" });
    const { fullName, education, experience, specialization, hourlyRate, bio, certificateUrls } = req.body;
    if (!fullName || !education || !specialization) {
      return res.status(400).json({ error: "fullName, education и specialization обязательны" });
    }
    user.teacherProfile = {
      fullName: fullName || "",
      education: education || "",
      experience: experience || 0,
      specialization: specialization || "",
      hourlyRate: hourlyRate || 0,
      bio: bio || "",
      certificateUrls: certificateUrls || [],
      isComplete: true,
    };
    await user.save();
    res.json({ message: "Анкета сохранена", profile: user.teacherProfile });
  } catch (err) {
    next(err);
  }
});

router.get("/mode", authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ mode: user.mode });
  } catch (err) {
    next(err);
  }
});

router.post("/mode", authMiddleware, async (req, res, next) => {
  try {
    const { mode } = req.body;
    if (!["learn_only", "learn_and_teach"].includes(mode))
      return res.status(400).json({ error: "mode должен быть learn_only или learn_and_teach" });
    const user = await User.findById(req.userId);
    user.mode = mode;
    await user.save();
    res.json({ message: "Режим обновлён", mode: user.mode });
  } catch (err) {
    next(err);
  }
});

export default router;
