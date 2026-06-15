import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Profile() {
  const { user, isTeacher } = useAuth();
  const [balance, setBalance] = useState(null);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    api.get('/user/balance').then((r) => setBalance(r.data.balanceRub)).catch(() => {});
    api.get('/user/purchases').then((r) => setPurchases(r.data)).catch(() => {});
  }, []);

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Личный кабинет</h1>

      {/* Основная информация */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-600 flex items-center justify-center text-xl font-bold">
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-lg">{user.username}</div>
            <div className="text-gray-400 text-sm">{user.email}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {user.role === 'teacher' ? '🧑‍🏫 Учитель' : '🎓 Студент'}
            </div>
          </div>
        </div>
      </div>

      {/* Баланс */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400 mb-1">Баланс</div>
            <div className="text-2xl font-bold">
              {balance !== null ? `${balance.toFixed(2)} ₽` : '—'}
            </div>
          </div>
          <Link to="/settings" className="btn-secondary text-sm">
            Настройки
          </Link>
        </div>
      </div>

      {/* Анкета учителя */}
      {isTeacher && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Анкета учителя</h2>
            <Link to="/teacher/profile" className="text-brand-400 text-sm hover:text-brand-300">
              {user.teacherProfile?.isComplete ? 'Редактировать' : 'Заполнить →'}
            </Link>
          </div>
          {user.teacherProfile?.isComplete ? (
            <div className="space-y-1 text-sm text-gray-300">
              <div><span className="text-gray-500">ФИО:</span> {user.teacherProfile.fullName}</div>
              <div><span className="text-gray-500">Специализация:</span> {user.teacherProfile.specialization}</div>
              <div><span className="text-gray-500">Ставка:</span> {user.teacherProfile.hourlyRate} ₽/ч</div>
            </div>
          ) : (
            <p className="text-sm text-yellow-400">⚠ Анкета не заполнена. Заполните её, чтобы создавать трансляции.</p>
          )}
        </div>
      )}

      {/* Покупки */}
      <div className="card">
        <h2 className="font-semibold mb-3">Мои покупки</h2>
        {purchases.length === 0 ? (
          <p className="text-gray-500 text-sm">Пока ничего не куплено</p>
        ) : (
          <ul className="space-y-2">
            {purchases.map((p) => (
              <li key={p._id} className="text-sm flex justify-between">
                <span className="text-gray-300">{p.itemType}: {p.itemId}</span>
                <span className="text-gray-500">{p.amount} ₽</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
