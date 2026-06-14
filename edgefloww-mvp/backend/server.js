import "dotenv/config";
import express from "express";
import cors from "cors";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";
import { migrate } from "./models/migrate.js";
import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courses.js";
import paymentRoutes from "./routes/payments.js";
import videoRoutes from "./routes/videos.js";

migrate();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use("/uploads", express.static(join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/video", videoRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

const distPath = join(__dirname, "..", "frontend", "dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) res.sendFile(join(distPath, "index.html"));
  });
}

app.listen(PORT, () => console.log(`EdgeFloww API on http://localhost:${PORT}`));
