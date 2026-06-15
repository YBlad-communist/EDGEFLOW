const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Purchase = require('../models/Purchase');

// GET /api/user/balance — получить баланс
router.get('/balance', auth, async (req, res) => {
  res.json({ balanceRub: req.user.balanceRub });
});

// GET /api/user/purchases — купленные курсы/трансляции
router.get('/purchases', auth, async (req, res, next) => {
  try {
    const purchases = await Purchase.find({ userId: req.user._id, status: 'completed' })
      .sort({ createdAt: -1 });
    res.json(purchases);
  } catch (err) {
    next(err);
  }
});

// POST /api/user/withdraw — запрос на вывод средств
router.post('/withdraw', auth, async (req, res, next) => {
  try {
    const { amount, requisites } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Некорректная сумма' });
    }
    const user = await User.findById(req.user._id);
    if (user.balanceRub < amount) {
      return res.status(400).json({ error: 'Недостаточно средств' });
    }
    // В реальном приложении здесь создаётся заявка на вывод
    user.balanceRub -= amount;
    await user.save();
    res.json({ message: 'Заявка на вывод принята', remaining: user.balanceRub });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
