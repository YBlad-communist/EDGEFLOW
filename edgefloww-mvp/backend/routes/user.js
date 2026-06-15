import { Router } from "express";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.get("/balance", authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ balanceRub: user?.balanceRub || 0 });
  } catch (err) {
    next(err);
  }
});

router.post("/withdraw", authMiddleware, async (req, res, next) => {
  try {
    const { amount, cardNumber } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: "Сумма должна быть положительной" });
    if (!cardNumber) return res.status(400).json({ error: "Номер карты обязателен" });
    const user = await User.findById(req.userId);
    if (!user || user.balanceRub < amount) return res.status(400).json({ error: "Недостаточно средств" });
    user.balanceRub -= amount;
    await user.save();
    res.json({ balanceRub: user.balanceRub, message: `Заявка на вывод ${amount} ₽ создана` });
  } catch (err) {
    next(err);
  }
});

export default router;
