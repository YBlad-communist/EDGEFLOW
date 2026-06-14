import { Router } from "express";
import Web3 from "web3";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

const web3 = process.env.BSC_RPC_URL ? new Web3(new Web3.providers.HttpProvider(process.env.BSC_RPC_URL)) : null;

const USDT_ABI = [
  { constant: false, inputs: [{ name: "_to", type: "address" }, { name: "_value", type: "uint256" }], name: "transfer", outputs: [{ name: "", type: "bool" }], type: "function" },
  { constant: true, inputs: [], name: "decimals", outputs: [{ name: "", type: "uint8" }], type: "function" },
];

router.post("/request", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== "author") return res.status(403).json({ error: "Только автор может выводить средства" });
    const { amount, walletAddress } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: "Некорректная сумма" });
    if (!walletAddress) return res.status(400).json({ error: "Укажите адрес кошелька для вывода" });
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress))
      return res.status(400).json({ error: "Некорректный адрес кошелька" });
    if (amount > user.balance) return res.status(400).json({ error: "Недостаточно средств" });

    res.json({
      success: true,
      message: "Запрос на вывод отправлен. Ожидает подтверждения администратора.",
      requestedAmount: amount,
      walletAddress,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/admin-execute", authMiddleware, async (req, res) => {
  try {
    const admin = await User.findById(req.userId);
    if (!admin?.isAdmin) return res.status(403).json({ error: "Только для администраторов" });

    const { userId, amount, walletAddress } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });
    if (amount > user.balance) return res.status(400).json({ error: "Недостаточно средств" });

    if (!web3 || !process.env.PLATFORM_WALLET_PRIVATE_KEY) {
      user.balance -= amount;
      await user.save();
      return res.json({
        success: true,
        message: `Вывод ${amount} USDT на ${walletAddress} выполнен (эмуляция).`,
      });
    }

    const account = web3.eth.accounts.privateKeyToAccount(process.env.PLATFORM_WALLET_PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);
    const usdtContract = new web3.eth.Contract(USDT_ABI, process.env.USDT_CONTRACT_ADDRESS);
    const decimals = await usdtContract.methods.decimals().call();
    const value = BigInt(amount * (10 ** Number(decimals))).toString();

    const tx = await usdtContract.methods.transfer(walletAddress, value).send({ from: account.address });
    user.balance -= amount;
    await user.save();

    res.json({
      success: true,
      message: `Вывод ${amount} USDT на ${walletAddress} выполнен. TX: ${tx.transactionHash}`,
      txHash: tx.transactionHash,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
