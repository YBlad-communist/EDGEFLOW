const router = require('express').Router();
const auth = require('../middleware/auth');
const Broadcast = require('../models/Broadcast');
const Payment = require('../models/Payment');
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const yookassaService = require('../services/yookassaService');

// POST /api/payments/create — создать платёж через ЮKassa
router.post('/create', auth, async (req, res, next) => {
  try {
    const { itemId, itemType } = req.body;
    if (!['course', 'broadcast'].includes(itemType)) {
      return res.status(400).json({ error: 'Неверный тип товара' });
    }

    let amount = 0;
    if (itemType === 'broadcast') {
      const broadcast = await Broadcast.findById(itemId);
      if (!broadcast) return res.status(404).json({ error: 'Трансляция не найдена' });
      amount = broadcast.price;
    }

    if (amount <= 0) {
      // Бесплатный — сразу создаём Purchase
      const purchase = await Purchase.create({
        userId: req.user._id,
        itemId,
        itemType,
        amount: 0,
        status: 'completed',
      });
      return res.json({ free: true, purchase });
    }

    // Платный — через ЮKassa
    const payment = await Payment.create({
      userId: req.user._id,
      itemId,
      itemType,
      amount,
    });

    const ykPayment = await yookassaService.createPayment({
      amount,
      description: `Доступ к ${itemType}: ${itemId}`,
      returnUrl: process.env.YOOKASSA_RETURN_URL || 'http://localhost/payment/success',
      metadata: { paymentDbId: payment._id.toString(), userId: req.user._id.toString() },
    });

    payment.yookassaPaymentId = ykPayment.id;
    payment.status = ykPayment.status;
    payment.confirmationUrl = ykPayment.confirmation?.confirmation_url || '';
    await payment.save();

    res.json({ confirmationUrl: payment.confirmationUrl, paymentId: payment._id });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/webhook — вебхук от ЮKassa
router.post('/webhook', async (req, res, next) => {
  try {
    const event = req.body;
    if (!event || !event.object) return res.sendStatus(200);

    const ykPaymentId = event.object.id;
    const newStatus = event.object.status;

    const payment = await Payment.findOne({ yookassaPaymentId: ykPaymentId });
    if (!payment) return res.sendStatus(200);

    payment.status = newStatus;
    await payment.save();

    if (newStatus === 'succeeded') {
      // Создаём Purchase
      const existing = await Purchase.findOne({ userId: payment.userId, itemId: payment.itemId });
      if (!existing) {
        await Purchase.create({
          userId: payment.userId,
          itemId: payment.itemId,
          itemType: payment.itemType,
          amount: payment.amount,
          status: 'completed',
          paymentId: payment.yookassaPaymentId,
        });
      }
      // Зачисляем баланс автору (если трансляция)
      if (payment.itemType === 'broadcast') {
        const broadcast = await Broadcast.findById(payment.itemId);
        if (broadcast) {
          await User.findByIdAndUpdate(broadcast.authorId, {
            $inc: { balanceRub: payment.amount * 0.85 }, // 15% комиссия платформы
          });
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
});

// GET /api/payments/:id/status
router.get('/:id/status', auth, async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Платёж не найден' });
    if (payment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Нет доступа' });
    }

    // Синхронизируем статус с ЮKassa
    if (payment.yookassaPaymentId && payment.status === 'pending') {
      try {
        const ykPayment = await yookassaService.getPayment(payment.yookassaPaymentId);
        payment.status = ykPayment.status;
        await payment.save();
      } catch (e) {
        // Игнорируем ошибки внешнего API
      }
    }

    res.json({ status: payment.status, amount: payment.amount });
  } catch (err) {
    next(err);
  }
});

// POST /api/payments/balance — списание с внутреннего баланса
router.post('/balance', auth, async (req, res, next) => {
  try {
    const { itemId, itemType } = req.body;
    if (!['course', 'broadcast'].includes(itemType)) {
      return res.status(400).json({ error: 'Неверный тип товара' });
    }

    let amount = 0;
    if (itemType === 'broadcast') {
      const broadcast = await Broadcast.findById(itemId);
      if (!broadcast) return res.status(404).json({ error: 'Не найдено' });
      amount = broadcast.price;
    }

    const user = await User.findById(req.user._id);
    if (user.balanceRub < amount) {
      return res.status(400).json({ error: 'Недостаточно средств на балансе' });
    }

    user.balanceRub -= amount;
    await user.save();

    const purchase = await Purchase.create({
      userId: user._id,
      itemId,
      itemType,
      amount,
      status: 'completed',
    });

    res.json({ purchase, newBalance: user.balanceRub });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
