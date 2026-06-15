import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";
import { connectDB } from "./models/index.js";
import User from "./models/User.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import courseRoutes from "./routes/courses.js";
import broadcastRoutes from "./routes/broadcasts.js";
import paymentRoutes from "./routes/payments.js";
import userRoutes from "./routes/user.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { setupChatSocket } from "./websocket/chatServer.js";
import config from "./config/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

["uploads/videos", "uploads/covers", "uploads/recordings"].forEach((d) => {
  const p = join(__dirname, d);
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
});

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(compression());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Слишком много запросов, попробуйте позже" },
  })
);
app.use("/uploads", express.static(join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/broadcasts", broadcastRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/user", userRoutes);

app.get("/api/health", (_req, res) => res.json({ status: "ok", uptime: process.uptime() }));

setupChatSocket(server);

const distPath = join(__dirname, "..", "frontend", "dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) res.sendFile(join(distPath, "index.html"));
  });
}

app.use(errorHandler);

const migrate = async () => {
  const r = await User.updateMany(
    { balanceRub: { $exists: false } },
    { $set: { balanceRub: 0, role: "student", mode: "learn_only" } }
  );
  if (r.modifiedCount > 0) console.log(`Migrated ${r.modifiedCount} users`);
};

const start = (port) => {
  server.listen(port, () => console.log(`Server running on port ${port}`));
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`Port ${port} busy, trying ${port + 1}...`);
      start(port + 1);
    } else {
      console.error(err);
      process.exit(1);
    }
  });
};

connectDB()
  .then(async () => {
    await migrate();
    start(config.port);
  })
  .catch((err) => {
    console.error("Failed to connect to DB:", err);
    process.exit(1);
  });
