const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const teacherRequired = require('../middleware/teacherRequired');
const Broadcast = require('../models/Broadcast');
const ChatMessage = require('../models/ChatMessage');
const srsService = require('../services/srsService');

// GET /api/broadcasts — список всех трансляций
router.get('/', async (req, res, next) => {
  try {
    const broadcasts = await Broadcast.find()
      .populate('authorId', 'username teacherProfile.fullName')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(broadcasts);
  } catch (err) {
    next(err);
  }
});

// GET /api/broadcasts/active — только живые
router.get('/active', async (req, res, next) => {
  try {
    const broadcasts = await Broadcast.find({ isLive: true })
      .populate('authorId', 'username teacherProfile.fullName')
      .sort({ startTime: -1 });
    res.json(broadcasts);
  } catch (err) {
    next(err);
  }
});

// GET /api/broadcasts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const broadcast = await Broadcast.findById(req.params.id)
      .populate('authorId', 'username teacherProfile');
    if (!broadcast) return res.status(404).json({ error: 'Трансляция не найдена' });
    res.json(broadcast);
  } catch (err) {
    next(err);
  }
});

// POST /api/broadcasts — создание (только учитель с анкетой)
router.post(
  '/',
  auth,
  teacherRequired,
  [
    body('title').trim().notEmpty().withMessage('Заголовок обязателен'),
    body('price').isFloat({ min: 0 }).withMessage('Цена должна быть >= 0'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { title, description, price, startTime, tags } = req.body;
      const streamKey = uuidv4();
      const srsBase = process.env.SRS_API_URL?.replace(':1985', ':8080') || 'http://localhost:8080';
      const hlsUrl = `${srsBase}/live/${streamKey}.m3u8`;

      const broadcast = await Broadcast.create({
        title,
        description,
        price: Number(price) || 0,
        authorId: req.user._id,
        streamKey,
        hlsUrl,
        startTime: startTime ? new Date(startTime) : undefined,
        tags: tags || [],
      });

      res.status(201).json(broadcast);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/broadcasts/:id — редактирование
router.put('/:id', auth, teacherRequired, async (req, res, next) => {
  try {
    const broadcast = await Broadcast.findById(req.params.id);
    if (!broadcast) return res.status(404).json({ error: 'Не найдено' });
    if (broadcast.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Нет прав' });
    }
    const { title, description, price, startTime, tags } = req.body;
    Object.assign(broadcast, {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: Number(price) }),
      ...(startTime && { startTime: new Date(startTime) }),
      ...(tags && { tags }),
    });
    await broadcast.save();
    res.json(broadcast);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/broadcasts/:id
router.delete('/:id', auth, teacherRequired, async (req, res, next) => {
  try {
    const broadcast = await Broadcast.findById(req.params.id);
    if (!broadcast) return res.status(404).json({ error: 'Не найдено' });
    if (broadcast.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Нет прав' });
    }
    await broadcast.deleteOne();
    res.json({ message: 'Удалено' });
  } catch (err) {
    next(err);
  }
});

// POST /api/broadcasts/:id/start — начать трансляцию
router.post('/:id/start', auth, teacherRequired, async (req, res, next) => {
  try {
    const broadcast = await Broadcast.findById(req.params.id);
    if (!broadcast) return res.status(404).json({ error: 'Не найдено' });
    if (broadcast.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Нет прав' });
    }
    broadcast.isLive = true;
    broadcast.startTime = new Date();
    await broadcast.save();

    // Проверяем статус SRS (не блокируем, если SRS недоступен)
    try {
      const isActive = await srsService.isStreamActive(broadcast.streamKey);
      if (!isActive) {
        logger.warn(`Stream key ${broadcast.streamKey} not active in SRS yet`);
      }
    } catch (e) {
      // SRS может быть временно недоступен
    }

    res.json(broadcast);
  } catch (err) {
    next(err);
  }
});

// POST /api/broadcasts/:id/stop — остановить трансляцию
router.post('/:id/stop', auth, teacherRequired, async (req, res, next) => {
  try {
    const broadcast = await Broadcast.findById(req.params.id);
    if (!broadcast) return res.status(404).json({ error: 'Не найдено' });
    if (broadcast.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Нет прав' });
    }
    broadcast.isLive = false;
    broadcast.endTime = new Date();
    await broadcast.save();
    res.json(broadcast);
  } catch (err) {
    next(err);
  }
});

// POST /api/broadcasts/:id/chat — отправить сообщение (сохранить в БД)
router.post('/:id/chat', auth, async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Сообщение не может быть пустым' });
    }
    const broadcast = await Broadcast.findById(req.params.id);
    if (!broadcast) return res.status(404).json({ error: 'Трансляция не найдена' });

    const chatMsg = await ChatMessage.create({
      broadcastId: broadcast._id,
      userId: req.user._id,
      username: req.user.username,
      message: message.trim(),
    });

    // Рассылка через Socket.IO
    if (global.io) {
      global.io.to(`broadcast_${broadcast._id}`).emit('new_message', {
        broadcastId: broadcast._id,
        userId: req.user._id,
        username: req.user.username,
        message: message.trim(),
        timestamp: chatMsg.timestamp,
      });
    }

    res.status(201).json(chatMsg);
  } catch (err) {
    next(err);
  }
});

// GET /api/broadcasts/:id/chat — история чата
router.get('/:id/chat', async (req, res, next) => {
  try {
    const messages = await ChatMessage.find({ broadcastId: req.params.id })
      .sort({ timestamp: 1 })
      .limit(200);
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
