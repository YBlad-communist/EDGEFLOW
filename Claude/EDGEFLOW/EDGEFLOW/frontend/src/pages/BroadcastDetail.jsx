import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import HlsPlayer from '../components/HlsPlayer';
import LiveChat from '../components/LiveChat';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function BroadcastDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [broadcast, setBroadcast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    api.get(`/broadcasts/${id}`)
      .then((res) => {
        setBroadcast(res.data);
        // Проверяем доступ: бесплатная или куплена
        if (res.data.price === 0) {
          setHasAccess(true);
        } else if (user) {
          api.get('/user/purchases')
            .then((r) => {
              const bought = r.data.some((p) => p.itemId === id && p.status === 'completed');
              setHasAccess(bought);
            })
            .catch(() => {});
        }
      })
      .catch(() => toast.error('Трансляция не найдена'))
      .finally(() => setLoading(false));
  }, [id, user]);

  const handleStart = async () => {
    try {
      const res = await api.post(`/broadcasts/${id}/start`);
      setBroadcast(res.data);
      toast.success('Трансляция запущена!');
    } catch {
      toast.error('Ошибка запуска');
    }
  };

  const handleStop = async () => {
    try {
      const res = await api.post(`/broadcasts/${id}/stop`);
      setBroadcast(res.data);
      toast.success('Трансляция остановлена');
    } catch {
      toast.error('Ошибка');
    }
  };

  const handlePay = async () => {
    if (!user) return navigate('/login');
    setPaying(true);
    try {
      const res = await api.post('/payments/create', { itemId: id, itemType: 'broadcast' });
      if (res.data.free) {
        setHasAccess(true);
        toast.success('Доступ открыт!');
      } else {
        window.location.href = res.data.confirmationUrl;
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Ошибка оплаты');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!broadcast) return <div className="p-8 text-center text-gray-400">Трансляция не найдена</div>;

  const isOwner = user && broadcast.authorId?._id === user._id;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Плеер */}
        <div className="lg:col-span-2 space-y-4">
          {broadcast.isLive && hasAccess ? (
            <HlsPlayer src={broadcast.hlsUrl} />
          ) : broadcast.isLive && !hasAccess ? (
            <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center border border-gray-800">
              <div className="text-center space-y-3">
                <div className="text-4xl">🔒</div>
                <p className="text-gray-300">Трансляция идёт прямо сейчас</p>
                <p className="text-sm text-gray-500">Купите доступ, чтобы смотреть</p>
                <button onClick={handlePay} disabled={paying} className="btn-primary">
                  {paying ? 'Переход...' : `Купить доступ — ${broadcast.price} ₽`}
                </button>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center border border-gray-800">
              <div className="text-center">
                <div className="text-5xl mb-3">📅</div>
                <p className="text-gray-400">Трансляция ещё не началась</p>
                {broadcast.startTime && (
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(broadcast.startTime).toLocaleString('ru-RU')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Инфо */}
          <div className="card space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold">{broadcast.title}</h1>
                <p className="text-gray-400 text-sm mt-1">
                  {broadcast.authorId?.username || 'Учитель'}
                  {broadcast.authorId?.teacherProfile?.specialization &&
                    ` · ${broadcast.authorId.teacherProfile.specialization}`}
                </p>
              </div>
              <div className="text-right">
                {broadcast.isLive && (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full mb-1">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                    LIVE
                  </span>
                )}
                <div className="text-lg font-bold">
                  {broadcast.price > 0 ? `${broadcast.price} ₽` : 'Бесплатно'}
                </div>
              </div>
            </div>

            {broadcast.description && (
              <p className="text-gray-300 text-sm">{broadcast.description}</p>
            )}

            {broadcast.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {broadcast.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Управление (для владельца) */}
            {isOwner && (
              <div className="flex gap-3 pt-2 border-t border-gray-800 mt-2">
                <div className="text-xs text-gray-500">
                  Stream key: <code className="bg-gray-800 px-1 rounded">{broadcast.streamKey}</code>
                </div>
                {!broadcast.isLive ? (
                  <button onClick={handleStart} className="btn-primary text-sm py-1 px-3 ml-auto">
                    ▶ Начать
                  </button>
                ) : (
                  <button onClick={handleStop} className="bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-3 rounded-lg ml-auto">
                    ■ Остановить
                  </button>
                )}
              </div>
            )}

            {/* Кнопка покупки (не владелец, нет доступа, есть цена) */}
            {!isOwner && !hasAccess && broadcast.price > 0 && (
              <button onClick={handlePay} disabled={paying} className="btn-primary w-full mt-2">
                {paying ? 'Переход к оплате...' : `Купить доступ — ${broadcast.price} ₽`}
              </button>
            )}
          </div>
        </div>

        {/* Чат */}
        <div className="h-[600px] lg:h-auto">
          <LiveChat broadcastId={id} />
        </div>
      </div>
    </div>
  );
}
