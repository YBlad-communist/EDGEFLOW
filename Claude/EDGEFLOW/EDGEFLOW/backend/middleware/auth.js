import jwt from "jsonwebtoken";
import config from "../config/index.js";

export function signAccessToken(userId, role) {
  return jwt.sign({ userId, role }, config.jwtSecret, { expiresIn: config.jwtAccessExpires });
}

export function signRefreshToken(userId) {
  return jwt.sign({ userId, type: "refresh" }, config.jwtSecret, { expiresIn: config.jwtRefreshExpires });
}

export function authMiddleware(req, res, next) {
  const token = req.cookies?.accessToken || req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: "Неверный или просроченный токен" });
  }
}

export function optionalAuth(req, res, next) {
  const token = req.cookies?.accessToken || req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    req.userId = null;
    req.userRole = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
  } catch {
    req.userId = null;
    req.userRole = null;
  }
  next();
}
