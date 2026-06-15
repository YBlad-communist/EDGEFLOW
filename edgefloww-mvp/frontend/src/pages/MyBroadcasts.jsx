import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function MyBroadcasts() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      api("/api/broadcasts/my").catch(() => []),
      api("/api/broadcasts/purchased").catch(() => []),
    ])
      .then(([mine, purchased]) => {
        const map = new Map();
        mine.forEach((b) => map.set(b._id || b.id, { ...b, relation: "author" }));
        purchased.forEach((b) => {
          const id = b._id || b.id;
          if (!map.has(id)) map.set(id, { ...b, relation: "purchased" });
        });
        setBroadcasts(Array.from(map.values()));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const handleStart = async (id) => {
    try { await api(`/api/broadcasts/${id}/start`, { method: "POST" }); loadAll(); }
    catch (err) { setMsg(err.message); }
  };

  const handleStop = async (id) => {
    try { await api(`/api/broadcasts/${id}/stop`, { method: "POST" }); loadAll(); }
    catch (err) { setMsg(err.message); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-lg text-secondary">Загрузка...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Мои трансляции</h1>
        <Link to="/create-broadcast" className="bg-accent text-white font-semibold rounded-lg px-4 py-2 text-sm hover:bg-accent-hover transition no-underline">+ Новая трансляция</Link>
      </div>
      {msg && <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm rounded-lg px-4 py-2 mb-4">{msg}</div>}
      {broadcasts.length === 0 && (
        <div className="text-center py-16 text-secondary">
          <div className="text-5xl mb-3 text-accent">LIVE</div>
          <p>Трансляций пока нет</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {broadcasts.map((b) => (
          <div key={b._id || b.id} className="bg-card border border-edge rounded-xl p-4">
            <div className="flex gap-2 items-center mb-2">
              {b.isLive ? <span className="bg-red-500/10 text-red-400 text-xs font-semibold px-2 py-0.5 rounded">LIVE</span> : <span className="bg-blue-500/10 text-blue-400 text-xs font-semibold px-2 py-0.5 rounded">Запись</span>}
              {b.relation === "author" && <span className="bg-green-500/10 text-green-400 text-xs font-semibold px-2 py-0.5 rounded">Автор</span>}
            </div>
            <div className="text-sm font-semibold truncate mb-1">{b.title}</div>
            <div className="text-xs text-secondary mb-3">
              {b.price > 0 ? `${b.price} ₽` : "Бесплатно"}
              {b.authorId?.username && <> &middot; {b.authorId.username}</>}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link to={`/broadcasts/${b._id || b.id}`} className="bg-accent text-white font-semibold rounded-lg px-3 py-1.5 text-xs hover:bg-accent-hover transition no-underline">Смотреть</Link>
              {b.relation === "author" && !b.isLive && (
                <button className="bg-accent text-white font-semibold rounded-lg px-3 py-1.5 text-xs hover:bg-accent-hover transition" onClick={() => handleStart(b._id || b.id)}>Начать</button>
              )}
              {b.relation === "author" && b.isLive && (
                <button className="bg-surface border border-edge text-secondary font-semibold rounded-lg px-3 py-1.5 text-xs hover:text-white transition" onClick={() => handleStop(b._id || b.id)}>Стоп</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
