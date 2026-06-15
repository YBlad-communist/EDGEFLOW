import { useState, useEffect, useRef } from "react";
import { api, getToken } from "../api.js";
import { io } from "socket.io-client";

export default function LiveChat({ broadcastId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!broadcastId) return;
    api(`/api/broadcasts/${broadcastId}/chat`).then(setMessages).catch(() => {});
    const token = getToken();
    if (!token) return;
    const socket = io("", {
      auth: { token, username: "" },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;
    socket.on("connect", () => { setConnected(true); socket.emit("join-broadcast", broadcastId); });
    socket.on("disconnect", () => setConnected(false));
    socket.on("chat-message", (msg) => setMessages((prev) => [...prev, msg]));
    return () => { socket.emit("leave-broadcast", broadcastId); socket.disconnect(); };
  }, [broadcastId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit("chat-message", { broadcastId, message: input.trim() });
    setInput("");
  };

  return (
    <div className="bg-card border border-edge rounded-xl p-3 flex flex-col h-[400px]">
      <div className="text-sm font-semibold mb-2 flex items-center justify-between">
        <span>
          Чат{" "}
          {connected ? (
            <span className="text-green-400 text-xs">●</span>
          ) : (
            <span className="text-red-400 text-xs">○</span>
          )}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto mb-2 flex flex-col gap-1">
        {messages.map((m, i) => (
          <div key={m._id || i} className="text-xs py-1 border-b border-[#1a1a2e]">
            <b className="text-accent">{m.username || m.userId?.username || "Unknown"}:</b> {m.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Сообщение..."
          className="flex-1 bg-surface border border-edge rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-accent"
        />
        <button type="submit" disabled={!connected} className="bg-accent text-white px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50">
          →
        </button>
      </form>
    </div>
  );
}
