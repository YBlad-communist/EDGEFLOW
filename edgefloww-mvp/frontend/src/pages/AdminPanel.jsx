import { useState, useEffect } from "react";
import { api } from "../api.js";

export default function AdminPanel({ user }) {
  const [pending, setPending] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api("/api/payments/pending").then(data => {
      if (Array.isArray(data)) setPending(data);
      else if (data.error) setMessage(data.error);
    }).catch(err => setMessage(err.message));
  }, []);

  const handleConfirm = async (purchaseId) => {
    try {
      await api(`/api/payments/admin-confirm/${purchaseId}`, { method: "POST" });
      setPending(p => p.filter(x => x._id !== purchaseId));
      setMessage("Платёж подтверждён!");
    } catch (err) { setMessage(err.message); }
  };

  return (
    <div className="container animate-in">
      <h1 style={{ marginBottom: 20 }}>Админ-панель — подтверждение платежей</h1>

      {message && <div className="badge badge-yellow mb-4" style={{ padding: "8px 12px", display: "block" }}>{message}</div>}

      {pending.length === 0 && <div className="empty-state"><h2>✅</h2><p>Нет ожидающих платежей</p></div>}

      {pending.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="admin-table">
            <thead>
              <tr><th>Студент</th><th>Курс</th><th>Сумма</th><th>Дата</th><th>Действие</th></tr>
            </thead>
            <tbody>
              {pending.map(p => (
                <tr key={p._id}>
                  <td>{p.student_email} ({p.student_username})</td>
                  <td>{p.course_title}</td>
                  <td>{p.amount} ₽</td>
                  <td>{new Date(p.created_at).toLocaleString()}</td>
                  <td><button className="btn btn-primary btn-sm" onClick={() => handleConfirm(p._id)}>Подтвердить</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
