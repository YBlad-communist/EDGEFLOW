import { useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [amount, setAmount] = useState(100);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTopup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const data = await api("/api/payments/topup", { method: "POST", body: JSON.stringify({ amount }) });
      if (data.confirmationUrl) {
        window.open(data.confirmationUrl, "_blank");
        setMsg("Перенаправление на страницу оплаты...");
      } else if (data.balanceRub !== undefined) {
        setMsg(data.message);
        updateUser({ balanceRub: data.balanceRub });
      } else {
        setMsg(data.message || "Готово");
      }
    } catch (err) { setMsg(err.message); }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Профиль</h1>
      <div className="bg-card border border-edge rounded-xl p-6 mb-6 space-y-3">
        <div>
          <div className="text-xs text-secondary font-semibold">Email</div>
          <div className="text-base font-semibold">{user?.email}</div>
        </div>
        <div>
          <div className="text-xs text-secondary font-semibold">Роль</div>
          <div className="text-base font-semibold">{user?.role === "teacher" ? "Учитель" : "Ученик"}</div>
        </div>
        <div>
          <div className="text-xs text-secondary font-semibold">Баланс</div>
          <div className="text-3xl font-extrabold text-accent">{user?.balanceRub?.toFixed(2) || "0.00"} ₽</div>
        </div>
      </div>
      <div className="bg-card border border-edge rounded-xl p-6">
        <h2 className="text-lg font-bold mb-4">Пополнить баланс</h2>
        <form onSubmit={handleTopup}>
          <div className="mb-4">
            <label className="text-xs font-semibold text-secondary block mb-1">Сумма (₽)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min={1} required className="w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent" />
          </div>
          <button type="submit" className="w-full bg-accent text-white font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-accent-hover transition disabled:opacity-50" disabled={loading}>
            {loading ? "Обработка..." : "Пополнить"}
          </button>
          {msg && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-2 mt-4 text-center">{msg}</div>}
        </form>
      </div>
    </div>
  );
}
