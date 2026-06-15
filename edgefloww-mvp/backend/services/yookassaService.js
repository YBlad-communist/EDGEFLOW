import crypto from "crypto";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

function getAuthHeader() {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) return null;
  return "Basic " + Buffer.from(`${shopId}:${secretKey}`).toString("base64");
}

export async function createPayment(amount, userId, description) {
  const auth = getAuthHeader();
  if (!auth) throw new Error("YooKassa not configured");
  const idempotenceKey = crypto.randomUUID();
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
      Authorization: auth,
      "Idempotence-Key": idempotenceKey,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.description || "Ошибка ЮKassa");
  }
  return res.json();
}

export async function getPayment(paymentId) {
  const auth = getAuthHeader();
  if (!auth) throw new Error("YooKassa not configured");
  const res = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    headers: { Authorization: auth },
  });
  if (!res.ok) throw new Error("Ошибка получения статуса платежа");
  return res.json();
}
