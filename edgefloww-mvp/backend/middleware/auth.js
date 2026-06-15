import jwt from "jsonwebtoken";

const AUTH_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-prod";

export function signToken(userId, role) {
  return jwt.sign({ userId, role }, AUTH_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

export function authMiddleware(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return _res.status(401).json({ error: "Требуется авторизация" });
  }
  try {
    const decoded = jwt.verify(header.slice(7), AUTH_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    return _res.status(401).json({ error: "Неверный или просроченный токен" });
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) { req.userId = null; req.userRole = null; return next(); }
  try {
    const decoded = jwt.verify(header.slice(7), AUTH_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
  } catch { req.userId = null; req.userRole = null; }
  next();
}

export { AUTH_SECRET };
