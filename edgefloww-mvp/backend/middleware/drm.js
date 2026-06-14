import crypto from "crypto";
import DrmToken from "../models/DrmToken.js";

const DRM_SECRET = process.env.DRM_SECRET || "edgefloww_drm_secret_change_in_prod_max32chars!!";
const TOKEN_TTL_MINUTES = parseInt(process.env.DRM_TOKEN_TTL_MINUTES || "15", 10);

export function signDRM(lessonId, userId, expiresAt) {
  const data = `${lessonId}:${userId}:${expiresAt.getTime()}`;
  return crypto.createHmac("sha256", DRM_SECRET).update(data).digest("hex");
}

export function verifyDRM(lessonId, userId, expiresAt, signature) {
  const expected = signDRM(lessonId, userId, expiresAt);
  if (expected !== signature) return false;
  if (Date.now() > expiresAt.getTime()) return false;
  return true;
}

export async function drmMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.query.token;

  if (!token) return res.status(401).json({ error: "Требуется токен доступа" });

  const record = await DrmToken.findOne({ token, used: false });
  if (!record) return res.status(403).json({ error: "Недействительный или просроченный токен" });
  if (Date.now() > new Date(record.expiresAt).getTime()) {
    await DrmToken.deleteOne({ _id: record._id });
    return res.status(403).json({ error: "Токен истёк" });
  }

  const domain = process.env.CORS_ORIGIN || "http://localhost:5173";
  const referer = req.headers.referer || req.headers.origin || "";
  if (!referer.startsWith(domain.replace(/\/$/, ""))) {
    return res.status(403).json({ error: "Доступ запрещён: неверный источник запроса" });
  }

  if (!verifyDRM(record.lessonId.toString(), record.userId.toString(), record.expiresAt, record.signature)) {
    await DrmToken.deleteOne({ _id: record._id });
    return res.status(403).json({ error: "Недействительная подпись токена" });
  }

  record.used = true;
  await record.save();

  req.lessonId = record.lessonId.toString();
  req.userId = record.userId.toString();
  next();
}

export async function generateToken(lessonId, userId) {
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);
  const rawToken = crypto.randomBytes(24).toString("hex");
  const signature = signDRM(lessonId, userId, expiresAt);
  const doc = await DrmToken.create({
    lessonId,
    userId,
    token: rawToken,
    signature,
    expiresAt,
  });
  return { token: doc.token, expiresAt };
}
