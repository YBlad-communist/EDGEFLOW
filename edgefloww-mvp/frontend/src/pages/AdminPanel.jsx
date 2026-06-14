import { useState, useEffect } from "react";
import { api } from "../api.js";

export default function AdminPanel({ user }) {
  const [pending, setPending] = useState([]);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("payments");
  const [withdrawUserId, setWithdrawUserId] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");

  useEffect(() => {
    if (tab === "payments") {
      api("/api/payments/pending").then(data => {
        if (Array.isArray(data)) setPending(data);
        else if (data.error) setMessage(data.error);
      }).catch(err => setMessage(err.message));
    }
  }, [tab]);

  const handleConfirm = async (purchaseId) => {
    try {
      await api(`/api/payments/admin-confirm/${purchaseId}`, { method: "POST" });
      setPending(p => p.filter(x => x._id !== purchaseId));
      setMessage("Payment confirmed!");
    } catch (err) { setMessage(err.message); }
  };

  const handleWithdraw = async () => {
    try {
      const res = await api("/api/withdraw/admin-execute", {
        method: "POST",
        body: JSON.stringify({ userId: withdrawUserId, amount: parseFloat(withdrawAmount), walletAddress: withdrawAddress }),
      });
      setMessage(res.message);
      setWithdrawUserId(""); setWithdrawAmount(""); setWithdrawAddress("");
    } catch (err) { setMessage(err.message); }
  };

  return (
    <div className="container animate-in">
      <h1 style={{ marginBottom: 20 }}>Admin Panel</h1>

      <div className="flex gap-2 mb-4">
        <button className={`btn ${tab === "payments" ? "btn-primary" : "btn-secondary"} btn-sm`} onClick={() => setTab("payments")}>Payments</button>
        <button className={`btn ${tab === "withdraw" ? "btn-primary" : "btn-secondary"} btn-sm`} onClick={() => setTab("withdraw")}>Withdrawals</button>
      </div>

      {message && <div className="badge badge-yellow mb-4" style={{ padding: "8px 12px", display: "block" }}>{message}</div>}

      {tab === "payments" && (
        <>
          {pending.length === 0 && <div className="empty-state"><h2>✅</h2><p>No pending payments</p></div>}
          {pending.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="admin-table">
                <thead>
                  <tr><th>Student</th><th>Course</th><th>Amount</th><th>Date</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {pending.map(p => (
                    <tr key={p._id}>
                      <td>{p.student_email} ({p.student_username})</td>
                      <td>{p.course_title}</td>
                      <td>${p.amount} USDT</td>
                      <td>{new Date(p.created_at).toLocaleString()}</td>
                      <td><button className="btn btn-primary btn-sm" onClick={() => handleConfirm(p._id)}>Confirm</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "withdraw" && (
        <div className="card" style={{ maxWidth: 500 }}>
          <h3 style={{ marginBottom: 16 }}>Execute Withdrawal (for author)</h3>
          <div className="form-group"><label className="form-label">User ID</label><input value={withdrawUserId} onChange={e => setWithdrawUserId(e.target.value)} placeholder="MongoDB User _id" /></div>
          <div className="form-group"><label className="form-label">Amount (USDT)</label><input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Recipient BSC Address</label><input value={withdrawAddress} onChange={e => setWithdrawAddress(e.target.value)} placeholder="0x..." /></div>
          <button className="btn btn-primary" onClick={handleWithdraw}>Execute Withdrawal</button>
        </div>
      )}
    </div>
  );
}
