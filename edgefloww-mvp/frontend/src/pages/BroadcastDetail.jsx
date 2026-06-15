import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import HlsPlayer from "../components/HlsPlayer.jsx";
import LiveChat from "../components/LiveChat.jsx";

export default function BroadcastDetail() {
  const { id } = useParams();
  const { updateUser } = useAuth();
  const [broadcast, setBroadcast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = () => {
    api(`/api/broadcasts/${id}`).then(setBroadcast).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [id]);

  const handlePurchase = async () => {
    try {
      const data = await api(`/api/broadcasts/${id}/purchase`, { method: "POST" });
      setMsg(data.message);
      if (data.balanceRub !== undefined) updateUser({ balanceRub: data.balanceRub });
      load();
    } catch (err) { setMsg(err.message); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-lg text-secondary">Загрузка...</div>;
  if (!broadcast) return <div className="flex items-center justify-center min-h-[60vh] text-lg text-secondary">Трансляция не найдена</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Link to="/broadcasts" className="inline-block bg-surface border border-edge text-secondary px-3 py-1.5 rounded-lg text-sm mb-4 hover:text-white transition no-underline">&larr; Назад</Link>
      <div className="flex gap-4 flex-wrap">
        <div className="flex-[2] min-w-[300px]">
          {broadcast.isLive ? (
            <div className="relative bg-black rounded-xl overflow-hidden">
              <HlsPlayer src={broadcast.hlsUrl} />
              <span className="absolute top-3 left-3 bg-red-500 text-white px-2.5 py-0.5 rounded text-xs font-bold">LIVE</span>
            </div>
          ) : broadcast.recordedVideoUrl ? (
            <div className="bg-black rounded-xl overflow-hidden">
              <video controls className="w-full" src={broadcast.recordedVideoUrl} />
            </div>
          ) : (
            <div className="w-full aspect-video bg-[#1a1a2e] rounded-xl flex items-center justify-center text-4xl text-secondary">
              {broadcast.isLive ? "LIVE" : "VIDEO"}
            </div>
          )}
          <h1 className="text-xl font-bold mt-4 mb-1">{broadcast.title}</h1>
          <p className="text-sm text-secondary mb-3">{broadcast.description}</p>
          <div className="flex gap-3 flex-wrap items-center mb-3">
            {broadcast.isLive ? <span className="bg-red-500/10 text-red-400 text-xs font-semibold px-2 py-0.5 rounded">Live</span> : <span className="bg-blue-500/10 text-blue-400 text-xs font-semibold px-2 py-0.5 rounded">Запись</span>}
            <span className="text-xs text-secondary">by {broadcast.authorId?.displayName || broadcast.authorId?.username}</span>
            {broadcast.price > 0 && <span className="text-xl font-extrabold text-accent">{broadcast.price} ₽</span>}
            {broadcast.price === 0 && <span className="bg-green-500/10 text-green-400 text-xs font-semibold px-2 py-0.5 rounded">Бесплатно</span>}
          </div>
          {!broadcast.hasAccess && broadcast.price > 0 && (
            <button className="bg-accent text-white font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-accent-hover transition" onClick={handlePurchase}>
              Купить доступ за {broadcast.price} ₽
            </button>
          )}
          {broadcast.hasAccess && <span className="bg-green-500/10 text-green-400 text-sm font-semibold px-3 py-1.5 rounded">Доступ есть</span>}
          {msg && <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm rounded-lg px-4 py-2 mt-3">{msg}</div>}
        </div>
        <div className="flex-1 min-w-[280px]">
          {broadcast.hasAccess && <LiveChat broadcastId={broadcast.id || broadcast._id} />}
        </div>
      </div>
    </div>
  );
}
