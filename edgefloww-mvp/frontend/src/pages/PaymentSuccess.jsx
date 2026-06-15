import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../api.js";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const paymentId = searchParams.get("paymentId");
    if (!paymentId) { setStatus("no_id"); return; }
    api(`/api/payments/payment-status/${paymentId}`)
      .then((data) => setStatus(data.status === "succeeded" ? "success" : data.status))
      .catch(() => setStatus("error"));
  }, [searchParams]);

  const messages = {
    checking: { title: "Проверка платежа...", desc: "Пожалуйста, подождите", icon: "..." },
    success: { title: "Оплата прошла успешно!", desc: "Баланс пополнен", icon: "OK" },
    pending: { title: "Платёж обрабатывается", desc: "Средства будут зачислены в течение нескольких минут", icon: "WAIT" },
    no_id: { title: "Нет данных платежа", desc: "Попробуйте ещё раз", icon: "?" },
    error: { title: "Ошибка проверки платежа", desc: "Обратитесь в поддержку", icon: "!" },
  };

  const m = messages[status] || messages.error;

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4 text-accent">{m.icon}</div>
      <h1 className="text-2xl font-bold mb-2">{m.title}</h1>
      <p className="text-sm text-secondary mb-6">{m.desc}</p>
      <Link to="/profile" className="inline-block bg-accent text-white font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-accent-hover transition no-underline">Вернуться в профиль</Link>
    </div>
  );
}
