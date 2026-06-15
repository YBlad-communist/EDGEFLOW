const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');

// GET /api/profile/me
router.get('/me', auth, async (req, res) => {
  res.json(req.user.toPublic());
});

// PUT /api/profile/teacher
router.put(
  '/teacher',
  auth,
  [
    body('fullName').trim().notEmpty().withMessage('ФИО обязательно'),
    body('education').trim().notEmpty().withMessage('Образование обязательно'),
    body('experience').trim().notEmpty().withMessage('Опыт обязателен'),
    body('specialization').trim().notEmpty().withMessage('Специализация обязательна'),
    body('hourlyRate').isFloat({ min: 0 }).withMessage('Ставка должна быть >= 0'),
    body('bio').trim().notEmpty().withMessage('Биография обязательна'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const { fullName, education, experience, specialization, hourlyRate, bio, certificateUrls } = req.body;

      if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Анкета только для учителей' });
      }

      const profile = {
        fullName,
        education,
        experience,
        specialization,
        hourlyRate: Number(hourlyRate),
        bio,
        certificateUrls: certificateUrls || [],
        isComplete: true,
      };

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { teacherProfile: profile, mode: 'learn_and_teach' },
        { new: true }
      ).select('-password');

      res.json(user.toPublic());
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/profile/mode
router.put('/mode', auth, async (req, res, next) => {
  try {
    const { mode } = req.body;
    if (!['learn_only', 'learn_and_teach'].includes(mode)) {
      return res.status(400).json({ error: 'Неверный режим' });
    }
    if (mode === 'learn_and_teach' && req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Режим "учить" доступен только учителям' });
    }
    const user = await User.findByIdAndUpdate(req.user._id, { mode }, { new: true }).select('-password');
    res.json(user.toPublic());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
