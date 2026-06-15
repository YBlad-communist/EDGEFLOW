import { Router } from "express";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import { authMiddleware } from "../middleware/auth.js";
import { createPayment, getPayment } from "../services/yookassaService.js";
import config from "../config/index.js";

const router = Router();

router.post("/topup", authMiddleware, async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: "Сумма должна быть положительной" });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });
    if (config.yookassaShopId && config.yookassaSecretKey) {
      const yooPayment = await createPayment(amount, req.userId, `Пополнение баланса на ${amount} ₽`);
      await Payment.create({
        userId: req.userId, itemType: "topup", amount,
        yookassaPaymentId: yooPayment.id, status: yooPayment.status,
      });
      const confirmationUrl = yooPayment.confirmation?.confirmationUrl;
      if (!confirmationUrl) return res.status(500).json({ error: "Не удалось получить ссылку на оплату" });
      return res.json({ paymentId: yooPayment.id, confirmationUrl, message: "Перенаправление на оплату..." });
    }
    user.balanceRub += amount;
    await user.save();
    res.json({ balanceRub: user.balanceRub, message: `Баланс пополнен на ${amount} ₽` });
  } catch (err) { next(err); }
});

router.get("/payment-status/:paymentId", authMiddleware, async (req, res, next) => {
  try {
    if (!config.yookassaShopId || !config.yookassaSecretKey) {
      return res.status(400).json({ error: "ЮKassa не настроен" });
    }
    const yooPayment = await getPayment(req.params.paymentId);
    const payment = await Payment.findOne({ yookassaPaymentId: req.params.paymentId });
    if (payment && yooPayment.status !== payment.status) {
      payment.status = yooPayment.status;
      await payment.save();
    }
    if (yooPayment.status === "succeeded") {
      const amount = parseFloat(yooPayment.amount.value);
      await User.updateOne({ _id: req.userId }, { $inc: { balanceRub: amount } });
      const user = await User.findById(req.userId);
      return res.json({ status: "succeeded", balanceRub: user.balanceRub, message: `Баланс пополнен на ${amount} ₽` });
    }
    res.json({ status: yooPayment.status });
  } catch (err) { next(err); }
});

router.post("/yookassa-webhook", async (req, res) => {
  try {
    const event = req.body;
    if (event.event === "payment.succeeded" || event.event === "payment.waiting_for_capture") {
      const yooPaymentId = event.object.id;
      const payment = await Payment.findOne({ yookassaPaymentId: yooPaymentId });
      if (payment) {
        payment.status = event.object.status;
        await payment.save();
      }
      if (event.event === "payment.succeeded" && event.object.metadata?.userId) {
        const amount = parseFloat(event.object.amount.value);
        await User.updateOne({ _id: event.object.metadata.userId }, { $inc: { balanceRub: amount } });
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("YooKassa webhook error:", err);
    res.sendStatus(200);
  }
});

export default router;
