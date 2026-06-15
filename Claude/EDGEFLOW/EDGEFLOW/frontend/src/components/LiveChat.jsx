import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function LiveChat({ broadcastId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Загрузка истории
    api.get(`/broadcasts/${broadcastId}/chat`)
      .then((res) => setMessages(res.data))
      .catch(() => {});

    // Socket.IO
    const socket = io({ path: '/socket.io', transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_broadcast', broadcastId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.emit('leave_broadcast', broadcastId);
      socket.disconnect();
    };
  }, [broadcastId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !user) return;
    setInput('');
    try {
      await api.post(`/broadcasts/${broadcastId}/chat`, { message: text });
    } catch {
      // сообщение всё равно придёт через socket
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border border-gray-800 rounded-xl">
      {/* Заголовок */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <span className="font-medium text-sm">Чат</span>
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className="text-sm">
            <span className="font-medium text-brand-400">{msg.username}: </span>
            <span className="text-gray-300">{msg.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Ввод */}
      {user ? (
        <div className="p-3 border-t border-gray-800 flex gap-2">
          <input
            className="input flex-1 text-sm py-1.5"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Сообщение..."
            maxLength={500}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="btn-primary text-sm py-1.5 px-3"
          >
            →
          </button>
        </div>
      ) : (
        <div className="p-3 text-center text-sm text-gray-500 border-t border-gray-800">
          Войдите, чтобы писать в чат
        </div>
      )}
    </div>
  );
}
