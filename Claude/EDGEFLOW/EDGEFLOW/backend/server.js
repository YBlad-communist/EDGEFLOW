require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

// ─── Logger ───────────────────────────────────────────────────────────────────
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});
global.logger = logger;

// ─── App & HTTP server ────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  socket.on('join_broadcast', (broadcastId) => {
    socket.join(`broadcast_${broadcastId}`);
  });

  socket.on('leave_broadcast', (broadcastId) => {
    socket.leave(`broadcast_${broadcastId}`);
  });

  socket.on('chat_message', (data) => {
    // data: { broadcastId, message, userId, username }
    io.to(`broadcast_${data.broadcastId}`).emit('new_message', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  });
});

global.io = io;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много запросов, попробуйте позже' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Слишком много попыток входа' },
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/broadcasts', require('./routes/broadcasts'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/user', require('./routes/user'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(require('./middleware/errorHandler'));

// ─── MongoDB connect & migrate ────────────────────────────────────────────────
async function migrate() {
  const User = require('./models/User');
  // Добавляем поля balanceRub и role всем пользователям у которых их нет
  await User.updateMany(
    { balanceRub: { $exists: false } },
    { $set: { balanceRub: 0 } }
  );
  await User.updateMany(
    { role: { $exists: false } },
    { $set: { role: 'student' } }
  );
  logger.info('Migration completed');
}

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/edgeflow');
    logger.info('MongoDB connected');
    await migrate();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
  } catch (err) {
    logger.error('Startup error', { err });
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, server };
