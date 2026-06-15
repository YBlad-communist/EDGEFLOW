import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import ChatMessage from "../models/ChatMessage.js";

export function setupChatSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Auth required"));
    try {
      const secret = process.env.JWT_SECRET || "dev-secret-change-in-prod";
      const decoded = jwt.verify(token, secret);
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join-broadcast", (broadcastId) => {
      socket.join(`broadcast:${broadcastId}`);
    });

    socket.on("leave-broadcast", (broadcastId) => {
      socket.leave(`broadcast:${broadcastId}`);
    });

    socket.on("chat-message", async (data) => {
      try {
        const { broadcastId, message } = data;
        if (!broadcastId || !message?.trim()) return;
        const msg = await ChatMessage.create({
          broadcastId,
          userId: socket.data.userId,
          message: message.trim(),
        });
        const populated = await ChatMessage.findById(msg._id)
          .populate("userId", "username displayName")
          .lean();
        io.to(`broadcast:${broadcastId}`).emit("chat-message", {
          ...populated,
          username: populated.userId?.displayName || populated.userId?.username || "Unknown",
        });
      } catch (err) {
        console.error("Chat error:", err);
      }
    });

    socket.on("disconnect", () => {});
  });

  return io;
}
