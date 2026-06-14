import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract, formatUnits, parseUnits } from "ethers";

const Web3Context = createContext(null);

const USDT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function approve(address spender, uint256 value) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState("");

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask не установлен. Установите MetaMask для оплаты в USDT.");
      return null;
    }
    try {
      const p = new BrowserProvider(window.ethereum);
      const accounts = await p.send("eth_requestAccounts", []);
      const s = await p.getSigner();
      const net = await p.getNetwork();
      setProvider(p);
      setSigner(s);
      setAccount(accounts[0]);
      setChainId(Number(net.chainId));
      setError("");
      return { provider: p, signer: s, account: accounts[0], chainId: Number(net.chainId) };
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const switchChain = useCallback(async (targetChainId) => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: `0x${targetChainId.toString(16)}`,
            chainName: "BSC Testnet",
            nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
            rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
            blockExplorerUrls: ["https://testnet.bscscan.com"],
          }],
        });
      }
    }
    const p = new BrowserProvider(window.ethereum);
    const net = await p.getNetwork();
    setChainId(Number(net.chainId));
  }, []);

  const sendUSDT = useCallback(async (to, amount, tokenAddress) => {
    if (!signer) return null;
    try {
      const contract = new Contract(tokenAddress, USDT_ABI, signer);
      const decimals = await contract.decimals();
      const value = parseUnits(amount.toString(), decimals);
      const tx = await contract.transfer(to, value);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [signer]);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) { setAccount(null); setSigner(null); }
      else { setAccount(accounts[0]); connectWallet(); }
    };
    const handleChainChanged = () => { connectWallet(); };
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [connectWallet]);

  return (
    <Web3Context.Provider value={{ account, provider, signer, chainId, error, connectWallet, switchChain, sendUSDT }}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error("useWeb3 must be used within Web3Provider");
  return ctx;
}
