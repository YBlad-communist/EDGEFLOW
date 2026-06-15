import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleModeChange = async (mode) => {
    try {
      await api.put('/profile/mode', { mode });
      await refreshUser();
      toast.success('Режим изменён');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Ошибка');
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) return toast.error('Введите сумму');
    setLoading(true);
    try {
      const res = await api.post('/user/withdraw', { amount, requisites: 'bank' });
      toast.success(res.data.message);
      await refreshUser();
      setWithdrawAmount('');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Настройки</h1>

      {/* Режим */}
      {user.role === 'teacher' && (
        <div className="card">
          <h2 className="font-semibold mb-3">Режим участия</h2>
          <div className="space-y-2">
            {[
              { value: 'learn_only', label: 'Только учиться', desc: 'Просмотр трансляций других' },
              { value: 'learn_and_teach', label: 'Учиться и преподавать', desc: 'Создавать трансляции и учиться' },
            ].map((m) => (
              <label
                key={m.value}
                className={`flex items-start gap-3 cursor-pointer border rounded-lg p-3 transition-colors ${
                  user.mode === m.value ? 'border-brand-500 bg-brand-500/10' : 'border-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value={m.value}
                  checked={user.mode === m.value}
                  onChange={() => handleModeChange(m.value)}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium">{m.label}</div>
                  <div className="text-xs text-gray-400">{m.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Вывод средств */}
      <div className="card">
        <h2 className="font-semibold mb-1">Вывод средств</h2>
        <p className="text-sm text-gray-400 mb-3">Доступно: {user.balanceRub?.toFixed(2) || '0.00'} ₽</p>
        <div className="flex gap-3">
          <input
            type="number"
            className="input flex-1"
            placeholder="Сумма в ₽"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            min="1"
          />
          <button onClick={handleWithdraw} className="btn-primary" disabled={loading}>
            {loading ? '...' : 'Вывести'}
          </button>
        </div>
      </div>
    </div>
  );
}
