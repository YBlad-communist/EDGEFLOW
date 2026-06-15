import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Tour from '../components/Tour';
import api from '../api';

function BroadcastCard({ broadcast }) {
  return (
    <Link
      to={`/broadcasts/${broadcast._id}`}
      className="card hover:border-gray-700 transition-colors block"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold leading-tight">{broadcast.title}</h3>
        {broadcast.isLive && (
          <span className="flex-shrink-0 flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
            LIVE
          </span>
        )}
      </div>
      {broadcast.description && (
        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{broadcast.description}</p>
      )}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {broadcast.authorId?.username || 'Учитель'}
        </span>
        <span className="font-medium text-brand-400">
          {broadcast.price > 0 ? `${broadcast.price} ₽` : 'Бесплатно'}
        </span>
      </div>
      {broadcast.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {broadcast.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

export default function CoursesList() {
  const { user } = useAuth();
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | live | free

  useEffect(() => {
    const endpoint = filter === 'live' ? '/broadcasts/active' : '/broadcasts';
    api.get(endpoint)
      .then((res) => {
        let data = res.data;
        if (filter === 'free') data = data.filter((b) => b.price === 0);
        setBroadcasts(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {user && <Tour role={user.role} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Трансляции</h1>
        <div className="flex gap-2" data-tour="broadcasts-list">
          {[
            { value: 'all', label: 'Все' },
            { value: 'live', label: '🔴 Live' },
            { value: 'free', label: 'Бесплатные' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => { setLoading(true); setFilter(f.value); }}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                filter === f.value ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <div className="text-4xl mb-3">📭</div>
          <p>Трансляций пока нет</p>
          {user?.role === 'teacher' && user?.teacherProfile?.isComplete && (
            <Link to="/broadcasts/create" className="btn-primary inline-block mt-4 text-sm">
              Создать первую
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {broadcasts.map((b) => (
            <BroadcastCard key={b._id} broadcast={b} />
          ))}
        </div>
      )}
    </div>
  );
}
