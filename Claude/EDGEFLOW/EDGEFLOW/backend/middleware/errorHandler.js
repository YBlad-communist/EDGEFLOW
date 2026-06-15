module.exports = (err, req, res, next) => {
  const logger = global.logger;
  if (logger) {
    logger.error('Unhandled error', {
      message: err.message,
      stack: err.stack,
      method: req.method,
      url: req.url,
    });
  } else {
    console.error(err);
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 11000) {
    return res.status(400).json({ error: 'Такой email уже зарегистрирован' });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Неверный формат ID' });
  }

  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Внутренняя ошибка сервера' : err.message,
  });
};
