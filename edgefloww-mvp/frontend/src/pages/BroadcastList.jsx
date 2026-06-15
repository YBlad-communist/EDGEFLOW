import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

export default function BroadcastList() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/api/broadcasts/active").then(setBroadcasts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-lg text-secondary">Загрузка...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-5">Трансляции</h1>
      {broadcasts.length === 0 && (
        <div className="text-center py-16 text-secondary">
          <div className="text-5xl mb-3 text-accent">LIVE</div>
          <p>Сейчас нет активных трансляций</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {broadcasts.map((b) => (
          <div key={b._id || b.id} className="bg-card border border-edge rounded-xl overflow-hidden">
            <div className="p-4">
              <div className="flex gap-2 items-center mb-2">
                <span className="bg-red-500/10 text-red-400 text-xs font-semibold px-2 py-0.5 rounded">LIVE</span>
                {b.category && <span className="bg-blue-500/10 text-blue-400 text-xs font-semibold px-2 py-0.5 rounded">{b.category}</span>}
              </div>
              <div className="text-sm font-semibold truncate mb-1">{b.title}</div>
              <div className="text-xs text-secondary mb-3">
                {b.price > 0 ? `${b.price} ₽` : "Бесплатно"}
                {b.authorId?.username && <> &middot; {b.authorId.username}</>}
                {b.viewerCount !== undefined && <> &middot; {b.viewerCount} зрителей</>}
              </div>
              <Link to={`/broadcasts/${b._id || b.id}`} className="inline-block bg-accent text-white font-semibold rounded-lg px-3 py-1.5 text-xs hover:bg-accent-hover transition no-underline">Смотреть</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
