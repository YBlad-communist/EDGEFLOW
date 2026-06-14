import { Router } from "express";
import crypto from "crypto";
import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

const COMMISSION_PERCENT = parseFloat(process.env.PLATFORM_COMMISSION_PERCENT || "5");

const CLOUDPAYMENTS_PUBLIC_ID = process.env.CLOUDPAYMENTS_PUBLIC_ID || "";
const CLOUDPAYMENTS_API_SECRET = process.env.CLOUDPAYMENTS_API_SECRET || "";

function signWebhook(body, signatureHeader) {
  if (!CLOUDPAYMENTS_API_SECRET) return true;
  const expected = crypto.createHmac("sha256", CLOUDPAYMENTS_API_SECRET).update(JSON.stringify(body)).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader || ""));
}

router.post("/create", authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.body.courseId);
    if (!course) return res.status(404).json({ error: "Курс не найден" });
    if (course.authorId.toString() === req.userId)
      return res.status(400).json({ error: "Нельзя купить свой курс" });

    const existing = await Purchase.findOne({ courseId: req.body.courseId, studentId: req.userId });
    if (existing && existing.status !== "refunded")
      return res.status(400).json({ error: "Запрос уже существует" });

    const purchase = await Purchase.create({
      courseId: req.body.courseId,
      studentId: req.userId,
      amount: course.priceUSDT,
      status: "pending",
      paymentSystem: "cloudpayments",
    });

    res.json({
      publicId: CLOUDPAYMENTS_PUBLIC_ID,
      amount: purchase.amount,
      currency: "RUB",
      description: course.title,
      invoiceId: purchase._id.toString(),
      accountId: req.userId,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/cloudpayments-webhook", async (req, res) => {
  try {
    const webhookData = req.body;
    if (!signWebhook(webhookData, req.headers["content-hmac"])) {
      return res.status(403).json({ code: 13 });
    }

    const purchase = await Purchase.findById(webhookData.InvoiceId);
    if (!purchase) return res.status(404).json({ code: 13 });

    if (webhookData.Status === "Completed" || webhookData.Status === "Authorized") {
      if (purchase.status === "completed") return res.json({ code: 0 });

      const course = await Course.findById(purchase.courseId);
      if (!course) return res.status(404).json({ code: 13 });

      const commission = purchase.amount * (COMMISSION_PERCENT / 100);
      const authorAmount = purchase.amount - commission;

      purchase.status = "completed";
      purchase.paymentId = webhookData.TransactionId?.toString() || "";
      purchase.confirmedAt = new Date();
      await purchase.save();

      await Promise.all([
        User.updateOne({ _id: course.authorId }, { $inc: { balanceRub: authorAmount } }),
      ]);
      const adminUser = await User.findOne({ isAdmin: true });
      if (adminUser) await User.updateOne({ _id: adminUser._id }, { $inc: { balanceRub: commission } });
    }

    res.json({ code: 0 });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ code: 13 });
  }
});

router.post("/confirm/:purchaseId", authMiddleware, async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.purchaseId);
    if (!purchase) return res.status(404).json({ error: "Платёж не найден" });
    if (purchase.studentId.toString() !== req.userId) return res.status(403).json({ error: "Нет прав" });
    if (purchase.status !== "pending") return res.status(400).json({ error: "Платёж уже обработан" });

    const commission = purchase.amount * (COMMISSION_PERCENT / 100);
    const authorAmount = purchase.amount - commission;
    const course = await Course.findById(purchase.courseId);

    purchase.status = "completed";
    purchase.paymentId = `emulated_${Date.now()}`;
    purchase.confirmedAt = new Date();
    await purchase.save();

    await Promise.all([
      User.updateOne({ _id: course.authorId }, { $inc: { balanceRub: authorAmount } }),
    ]);
    const adminUser = await User.findOne({ isAdmin: true });
    if (adminUser) await User.updateOne({ _id: adminUser._id }, { $inc: { balanceRub: commission } });

    res.json({ success: true, message: "Платёж подтверждён. Курс доступен." });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/pending", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user?.isAdmin) return res.status(403).json({ error: "Только для администраторов" });
    const pending = await Purchase.find({ status: "pending" })
      .populate("courseId", "title")
      .populate("studentId", "email username")
      .sort({ createdAt: -1 }).lean();
    res.json(pending.map(p => ({
      _id: p._id, id: p._id,
      course_title: p.courseId?.title,
      student_email: p.studentId?.email,
      student_username: p.studentId?.username,
      amount: p.amount,
      created_at: p.createdAt,
      status: p.status,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/admin-confirm/:purchaseId", authMiddleware, async (req, res) => {
  try {
    const admin = await User.findById(req.userId);
    if (!admin?.isAdmin) return res.status(403).json({ error: "Только для администраторов" });
    const purchase = await Purchase.findById(req.params.purchaseId);
    if (!purchase || purchase.status !== "pending")
      return res.status(400).json({ error: "Платёж не найден или уже обработан" });

    const commission = purchase.amount * (COMMISSION_PERCENT / 100);
    const authorAmount = purchase.amount - commission;
    const course = await Course.findById(purchase.courseId);

    purchase.status = "completed";
    purchase.paymentId = `admin_${Date.now()}`;
    purchase.confirmedAt = new Date();
    await purchase.save();

    await Promise.all([
      User.updateOne({ _id: course.authorId }, { $inc: { balanceRub: authorAmount } }),
      User.updateOne({ _id: req.userId }, { $inc: { balanceRub: commission } }),
    ]);
    res.json({ success: true, message: "Платёж подтверждён администратором" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const purchases = await Purchase.find({ studentId: req.userId })
      .populate("courseId", "title")
      .sort({ createdAt: -1 }).lean();
    res.json(purchases.map(p => ({
      ...p,
      course_title: p.courseId?.title,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
