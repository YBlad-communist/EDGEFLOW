import { Router } from "express";
import crypto from "crypto";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;
const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

async function createYooKassaPayment(amount, userId, description) {
  const idempotenceKey = crypto.randomUUID();
  const auth = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64");
  const body = {
    amount: { value: amount.toFixed(2), currency: "RUB" },
    confirmation: { type: "redirect", return_url: `${BASE_URL}/profile` },
    capture: true,
    description: description || "Пополнение баланса EdgeFlow",
    metadata: { userId },
  };
  const res = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${auth}`,
      "Idempotence-Key": idempotenceKey,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.description || "Ошибка YooKassa");
  }
  return res.json();
}

async function getYooKassaPayment(paymentId) {
  const auth = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64");
  const res = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    headers: { "Authorization": `Basic ${auth}` },
  });
  if (!res.ok) throw new Error("Ошибка получения статуса платежа");
  return res.json();
}

async function confirmPayment(userId, amount) {
  const user = await User.findById(userId);
  if (!user) return;
  user.balanceRub += amount;
  await user.save();
}

router.post("/topup", authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: "Сумма должна быть положительной" });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });

    if (YOOKASSA_SHOP_ID && YOOKASSA_SECRET_KEY) {
      const payment = await createYooKassaPayment(amount, req.userId, `Пополнение баланса на ${amount} ₽`);
      const confirmationUrl = payment.confirmation?.confirmationUrl;
      if (!confirmationUrl) return res.status(500).json({ error: "Не удалось получить ссылку на оплату" });
      return res.json({ paymentId: payment.id, confirmationUrl, message: "Перенаправление на оплату..." });
    }

    user.balanceRub += amount;
    await user.save();
    res.json({ balanceRub: user.balanceRub, message: `Баланс пополнен на ${amount} ₽` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/payment-status/:paymentId", authMiddleware, async (req, res) => {
  try {
    if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY)
      return res.status(400).json({ error: "YooKassa не настроен" });
    const payment = await getYooKassaPayment(req.params.paymentId);
    if (payment.status === "succeeded" && payment.metadata?.userId === req.userId) {
      const amount = parseFloat(payment.amount.value);
      await confirmPayment(req.userId, amount);
      const user = await User.findById(req.userId);
      return res.json({ status: "succeeded", balanceRub: user.balanceRub });
    }
    res.json({ status: payment.status });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/yookassa-webhook", async (req, res) => {
  try {
    const event = req.body;
    if (event.event === "payment.waiting_for_capture") {
      const auth = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64");
      await fetch(`https://api.yookassa.ru/v3/payments/${event.object.id}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth}`,
          "Idempotence-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({}),
      });
    }
    if (event.event === "payment.succeeded" && event.object.metadata?.userId) {
      const amount = parseFloat(event.object.amount.value);
      await confirmPayment(event.object.metadata.userId, amount);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("YooKassa webhook error:", err);
    res.sendStatus(200);
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ balanceRub: user?.balanceRub || 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
