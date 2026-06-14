import { Router } from "express";
import Web3 from "web3";
import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

const COMMISSION_PERCENT = parseFloat(process.env.PLATFORM_COMMISSION_PERCENT || "5");
const web3 = process.env.BSC_RPC_URL ? new Web3(new Web3.providers.HttpProvider(process.env.BSC_RPC_URL)) : null;

const USDT_ABI = [
  { constant: true, inputs: [{ name: "_owner", type: "address" }], name: "balanceOf", outputs: [{ name: "balance", type: "uint256" }], type: "function" },
  { constant: false, inputs: [{ name: "_to", type: "address" }, { name: "_value", type: "uint256" }], name: "transfer", outputs: [{ name: "", type: "bool" }], type: "function" },
  { constant: true, inputs: [{ name: "_owner", type: "address" }, { name: "_spender", type: "address" }], name: "allowance", outputs: [{ name: "", type: "uint256" }], type: "function" },
  { constant: false, inputs: [{ name: "_spender", type: "address" }, { name: "_value", type: "uint256" }], name: "approve", outputs: [{ name: "", type: "bool" }], type: "function" },
  { constant: true, inputs: [], name: "decimals", outputs: [{ name: "", type: "uint8" }], type: "function" },
];

router.post("/buy/:courseId", authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ error: "Курс не найден" });
    if (course.authorId.toString() === req.userId)
      return res.status(400).json({ error: "Нельзя купить свой курс" });
    const existing = await Purchase.findOne({ courseId: req.params.courseId, studentId: req.userId });
    if (existing) {
      if (existing.status === "completed") return res.status(400).json({ error: "Курс уже куплен" });
      if (existing.status === "pending") return res.json({ purchase: existing, message: "Ожидает подтверждения оплаты" });
    }
    const purchase = await Purchase.create({
      courseId: req.params.courseId,
      studentId: req.userId,
      amount: course.priceUSDT,
      status: "pending",
      buyerAddress: req.body.buyerAddress || "",
    });
    const platformWallet = process.env.PLATFORM_WALLET_ADDRESS || "0x0000000000000000000000000000000000000000";
    res.status(201).json({
      purchase,
      message: `Отправьте ${course.priceUSDT} USDT на кошелёк платформы`,
      walletAddress: platformWallet,
      amount: course.priceUSDT,
      tokenAddress: process.env.USDT_CONTRACT_ADDRESS,
      chainId: 97,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

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
      buyerAddress: req.body.buyerAddress || "",
    });

    const usdtContract = web3 ? new web3.eth.Contract(USDT_ABI, process.env.USDT_CONTRACT_ADDRESS) : null;
    let decimals = 18;
    if (usdtContract) {
      try { decimals = await usdtContract.methods.decimals().call(); } catch {}
    }

    res.status(201).json({
      purchaseId: purchase._id,
      amount: course.priceUSDT,
      decimals,
      tokenAddress: process.env.USDT_CONTRACT_ADDRESS,
      recipientAddress: process.env.PLATFORM_WALLET_ADDRESS,
      chainId: 97,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/verify", authMiddleware, async (req, res) => {
  try {
    const { txHash, purchaseId } = req.body;
    if (!txHash || !purchaseId) return res.status(400).json({ error: "txHash и purchaseId обязательны" });

    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) return res.status(404).json({ error: "Платёж не найден" });
    if (purchase.studentId.toString() !== req.userId) return res.status(403).json({ error: "Нет прав" });
    if (purchase.status !== "pending") return res.status(400).json({ error: "Платёж уже обработан" });

    if (!web3) return res.status(400).json({ error: "Web3 не настроен. Используйте эмуляцию." });

    const tx = await web3.eth.getTransaction(txHash);
    if (!tx) return res.status(400).json({ error: "Транзакция не найдена в сети" });

    const USDT_ADDRESS = process.env.USDT_CONTRACT_ADDRESS?.toLowerCase();
    if (!tx.to || tx.to.toLowerCase() !== USDT_ADDRESS)
      return res.status(400).json({ error: "Транзакция не на адрес контракта USDT" });

    const usdtContract = new web3.eth.Contract(USDT_ABI, USDT_ADDRESS);

    const receipt = await web3.eth.getTransactionReceipt(txHash);
    if (!receipt || !receipt.status) return res.status(400).json({ error: "Транзакция не подтверждена" });

    const platformAddress = process.env.PLATFORM_WALLET_ADDRESS?.toLowerCase();
    const transferLog = receipt.logs.find(log =>
      log.address?.toLowerCase() === USDT_ADDRESS &&
      log.topics[0] === web3.utils.sha3("Transfer(address,address,uint256)")
    );
    if (!transferLog) return res.status(400).json({ error: "Событие Transfer не найдено" });

    const decoded = web3.eth.abi.decodeLog([
      { type: "address", name: "from", indexed: true },
      { type: "address", name: "to", indexed: true },
      { type: "uint256", name: "value" },
    ], transferLog.data, transferLog.topics.slice(1));

    if (decoded.to.toLowerCase() !== platformAddress)
      return res.status(400).json({ error: "Средства отправлены не на адрес платформы" });

    const decimals = await usdtContract.methods.decimals().call();
    const receivedAmount = Number(web3.utils.fromWei(decoded.value, "ether")) * (10 ** (18 - Number(decimals)));
    const expectedAmount = purchase.amount;

    if (receivedAmount < expectedAmount * 0.99)
      return res.status(400).json({ error: `Получено ${receivedAmount} USDT, ожидалось ${expectedAmount} USDT` });

    const commission = purchase.amount * (COMMISSION_PERCENT / 100);
    const authorAmount = purchase.amount - commission;
    const course = await Course.findById(purchase.courseId);

    await Promise.all([
      Purchase.updateOne({ _id: purchaseId }, { $set: { status: "completed", txHash, confirmedAt: new Date() } }),
      User.updateOne({ _id: course.authorId }, { $inc: { balance: authorAmount } }),
      User.updateOne({ _id: req.userId }, { $inc: { balance: -purchase.amount } }),
    ]);

    const adminWallet = await User.findOne({ isAdmin: true });
    if (adminWallet) await User.updateOne({ _id: adminWallet._id }, { $inc: { balance: commission } });

    res.json({ success: true, message: "Платёж подтверждён. Курс доступен." });
  } catch (err) { res.status(500).json({ error: err.message }); }
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
    purchase.txHash = req.body.txHash || `emulated_${Date.now()}`;
    purchase.confirmedAt = new Date();
    await purchase.save();

    await Promise.all([
      User.updateOne({ _id: course.authorId }, { $inc: { balance: authorAmount } }),
      User.updateOne({ _id: req.userId }, { $inc: { balance: -purchase.amount } }),
    ]);
    const adminUser = await User.findOne({ isAdmin: true });
    if (adminUser) await User.updateOne({ _id: adminUser._id }, { $inc: { balance: commission } });

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
    purchase.txHash = `admin_${Date.now()}`;
    purchase.confirmedAt = new Date();
    await purchase.save();

    await Promise.all([
      User.updateOne({ _id: course.authorId }, { $inc: { balance: authorAmount } }),
      User.updateOne({ _id: req.userId }, { $inc: { balance: commission } }),
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
