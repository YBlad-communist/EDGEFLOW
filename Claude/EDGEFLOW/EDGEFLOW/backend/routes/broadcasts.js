import { Router } from "express";
import Broadcast from "../models/Broadcast.js";
import ChatMessage from "../models/ChatMessage.js";
import Purchase from "../models/Purchase.js";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";
import { teacherProfileRequired } from "../middleware/teacherRequired.js";
import { generateStreamKey, buildHlsUrl, buildRtmpUrl, checkStreamActive } from "../services/srsService.js";
import config from "../config/index.js";

const router = Router();

router.post("/create", authMiddleware, teacherProfileRequired, async (req, res, next) => {
  try {
    const { title, description, price, category } = req.body;
    if (!title) return res.status(400).json({ error: "Название обязательно" });
    const streamKey = generateStreamKey();
    const broadcast = await Broadcast.create({
      title, description: description || "",
      price: price ?? (req.teacherProfile.hourlyRate || 0),
      category: category || "live",
      authorId: req.userId, streamKey,
      rtmpUrl: buildRtmpUrl(streamKey),
      hlsUrl: buildHlsUrl(streamKey),
    });
    res.status(201).json(broadcast.toJSON());
  } catch (err) { next(err); }
});

router.get("/active", async (req, res, next) => {
  try {
    const broadcasts = await Broadcast.find({ isLive: true })
      .populate("authorId", "username displayName avatar")
      .sort({ startTime: -1 }).lean();
    const enriched = await Promise.all(broadcasts.map(async (b) => {
      const purchaseCount = await Purchase.countDocuments({ itemId: b._id, itemType: "broadcast", status: "completed" });
      return { ...b, id: b._id.toString(), viewerCount: purchaseCount };
    }));
    res.json(enriched);
  } catch (err) { next(err); }
});

router.get("/my", authMiddleware, async (req, res, next) => {
  try {
    const broadcasts = await Broadcast.find({ authorId: req.userId }).sort({ createdAt: -1 }).lean();
    res.json(broadcasts.map((b) => ({ ...b, id: b._id.toString() })));
  } catch (err) { next(err); }
});

router.get("/purchased", authMiddleware, async (req, res, next) => {
  try {
    const purchases = await Purchase.find({ userId: req.userId, itemType: "broadcast", status: "completed" }).lean();
    const ids = purchases.map((p) => p.itemId);
    const broadcasts = await Broadcast.find({ _id: { $in: ids } })
      .populate("authorId", "username displayName")
      .sort({ createdAt: -1 }).lean();
    res.json(broadcasts.map((b) => ({ ...b, id: b._id.toString() })));
  } catch (err) { next(err); }
});

router.get("/:id", authMiddleware, async (req, res, next) => {
  try {
    const broadcast = await Broadcast.findById(req.params.id)
      .populate("authorId", "username displayName avatar bio")
      .lean();
    if (!broadcast) return res.status(404).json({ error: "Трансляция не найдена" });
    const isAuthor = broadcast.authorId._id.toString() === req.userId;
    const purchase = await Purchase.findOne({ itemId: broadcast._id, itemType: "broadcast", userId: req.userId, status: "completed" }).lean();
    const hasAccess = isAuthor || !!purchase || broadcast.price === 0;
    if (broadcast.isLive) {
      const active = await checkStreamActive(broadcast.streamKey);
      if (!active) {
        await Broadcast.updateOne({ _id: broadcast._id }, { $set: { isLive: false, endTime: new Date() } });
        broadcast.isLive = false;
        broadcast.endTime = new Date();
      }
    }
    res.json({ ...broadcast, id: broadcast._id.toString(), hasAccess, isAuthor });
  } catch (err) { next(err); }
});

router.post("/:id/start", authMiddleware, async (req, res, next) => {
  try {
    const broadcast = await Broadcast.findById(req.params.id);
    if (!broadcast) return res.status(404).json({ error: "Трансляция не найдена" });
    if (broadcast.authorId.toString() !== req.userId) return res.status(403).json({ error: "Нет доступа" });
    broadcast.isLive = true;
    broadcast.startTime = new Date();
    broadcast.endTime = null;
    broadcast.hlsUrl = buildHlsUrl(broadcast.streamKey);
    broadcast.rtmpUrl = buildRtmpUrl(broadcast.streamKey);
    await broadcast.save();
    res.json(broadcast.toJSON());
  } catch (err) { next(err); }
});

router.post("/:id/stop", authMiddleware, async (req, res, next) => {
  try {
    const broadcast = await Broadcast.findById(req.params.id);
    if (!broadcast) return res.status(404).json({ error: "Трансляция не найдена" });
    if (broadcast.authorId.toString() !== req.userId) return res.status(403).json({ error: "Нет доступа" });
    broadcast.isLive = false;
    broadcast.endTime = new Date();
    if (req.body.recordedVideoUrl) broadcast.recordedVideoUrl = req.body.recordedVideoUrl;
    await broadcast.save();
    res.json(broadcast.toJSON());
  } catch (err) { next(err); }
});

router.post("/:id/purchase", authMiddleware, async (req, res, next) => {
  try {
    const broadcast = await Broadcast.findById(req.params.id);
    if (!broadcast) return res.status(404).json({ error: "Трансляция не найдена" });
    if (broadcast.authorId.toString() === req.userId)
      return res.status(400).json({ error: "Нельзя купить свою трансляцию" });
    const existing = await Purchase.findOne({ itemId: broadcast._id, itemType: "broadcast", userId: req.userId });
    if (existing?.status === "completed") return res.status(400).json({ error: "Уже куплено" });
    if (broadcast.price > 0) {
      const user = await User.findById(req.userId);
      if (!user || user.balanceRub < broadcast.price) return res.status(400).json({ error: "Недостаточно средств" });
      user.balanceRub -= broadcast.price;
      await user.save();
      const commission = (broadcast.price * config.platformCommissionPercent) / 100;
      const authorAmount = broadcast.price - commission;
      await User.updateOne({ _id: broadcast.authorId }, { $inc: { balanceRub: authorAmount } });
      const adminUser = await User.findOne({ isAdmin: true });
      if (adminUser) await User.updateOne({ _id: adminUser._id }, { $inc: { balanceRub: commission } });
    }
    if (existing) {
      existing.status = "completed";
      await existing.save();
    } else {
      await Purchase.create({ userId: req.userId, itemId: broadcast._id, itemType: "broadcast", amount: broadcast.price, status: "completed", paymentId: "balance" });
    }
    const user = await User.findById(req.userId);
    res.json({ success: true, balanceRub: user?.balanceRub || 0, message: "Доступ открыт!" });
  } catch (err) { next(err); }
});

router.get("/:id/chat", authMiddleware, async (req, res, next) => {
  try {
    const msgs = await ChatMessage.find({ broadcastId: req.params.id })
      .populate("userId", "username displayName")
      .sort({ createdAt: -1 }).limit(50).lean();
    res.json(msgs.reverse().map((m) => ({
      ...m, id: m._id.toString(),
      username: m.userId?.displayName || m.userId?.username || "Unknown",
    })));
  } catch (err) { next(err); }
});

export default router;
