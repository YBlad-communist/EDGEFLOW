import config from "../config/index.js";

export function errorHandler(err, req, res, next) {
  console.error("Unhandled error:", err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Внутренняя ошибка сервера",
    ...(config.nodeEnv === "development" && { stack: err.stack }),
  });
}
