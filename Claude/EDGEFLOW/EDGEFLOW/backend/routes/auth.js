const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Некорректный email'),
    body('password').isLength({ min: 6 }).withMessage('Пароль минимум 6 символов'),
    body('username').trim().notEmpty().withMessage('Имя пользователя обязательно'),
    body('role').isIn(['student', 'teacher']).withMessage('Роль: student или teacher'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email, password, username, role } = req.body;
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ error: 'Email уже занят' });

      const mode = role === 'teacher' ? 'learn_and_teach' : 'learn_only';
      const user = await User.create({ email, password, username, role, mode });
      const token = signToken(user._id);
      res.status(201).json({ token, user: user.toPublic() });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Некорректный email'),
    body('password').notEmpty().withMessage('Пароль обязателен'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Неверный email или пароль' });
      }
      const token = signToken(user._id);
      res.json({ token, user: user.toPublic() });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/logout (статeless JWT — просто для единообразия)
router.post('/logout', (req, res) => {
  res.json({ message: 'Выход выполнен' });
});

module.exports = router;
