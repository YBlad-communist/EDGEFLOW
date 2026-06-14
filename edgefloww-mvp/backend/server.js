import "dotenv/config";
import express from "express";
import cors from "cors";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";
import { connectDB } from "./models/index.js";
import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courses.js";
import paymentRoutes from "./routes/payments.js";
import videoRoutes from "./routes/videos.js";
import withdrawRoutes from "./routes/withdraw.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

["uploads/videos", "uploads/covers"].forEach(d => {
  const p = join(__dirname, d);
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/withdraw", withdrawRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

const distPath = join(__dirname, "..", "frontend", "dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) res.sendFile(join(distPath, "index.html"));
  });
}

connectDB().then(() => {
  app.listen(PORT, () => console.log(`EdgeFloww API on http://localhost:${PORT}`));
});
