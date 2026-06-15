import { useState, useEffect } from "react";
import { api } from "../api.js";

export default function AdminPanel() {
  const [pending, setPending] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api("/api/payments/pending")
      .then((data) => { if (Array.isArray(data)) setPending(data); else if (data.error) setMessage(data.error); })
      .catch((err) => setMessage(err.message));
  }, []);

  const handleConfirm = async (purchaseId) => {
    try {
      await api(`/api/payments/admin-confirm/${purchaseId}`, { method: "POST" });
      setPending((p) => p.filter((x) => x._id !== purchaseId));
      setMessage("Платёж подтверждён!");
    } catch (err) { setMessage(err.message); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Админ-панель</h1>
      {message && <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm rounded-lg px-4 py-2 mb-4">{message}</div>}
      {pending.length === 0 ? (
        <div className="text-center py-16 text-secondary">
          <div className="text-5xl mb-3 text-accent">OK</div>
          <p>Нет ожидающих платежей</p>
        </div>
      ) : (
        <div className="bg-card border border-edge rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface text-secondary text-xs font-semibold">
                <th className="text-left px-4 py-3">Студент</th>
                <th className="text-left px-4 py-3">Курс</th>
                <th className="text-left px-4 py-3">Сумма</th>
                <th className="text-left px-4 py-3">Дата</th>
                <th className="text-left px-4 py-3">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {pending.map((p) => (
                <tr key={p._id} className="hover:bg-accent/5">
                  <td className="px-4 py-3">{p.student_email} ({p.student_username})</td>
                  <td className="px-4 py-3">{p.course_title}</td>
                  <td className="px-4 py-3">{p.amount} ₽</td>
                  <td className="px-4 py-3">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button className="bg-accent text-white font-semibold rounded-lg px-3 py-1.5 text-xs hover:bg-accent-hover transition" onClick={() => handleConfirm(p._id)}>Подтвердить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
