"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";
import contractABI from "../contract/abi.json";
import toast from "react-hot-toast";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) public returns (bool)",
  "function balanceOf(address owner) public view returns (uint256)",
  "function decimals() public view returns (uint8)",
  "function symbol() public view returns (string)",
];

const mentoTokens = {
  "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1": "cUSD", // cUSD
  "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F": "cEUR", // cEUR
  "0xE4D517785D091D3c54818832dB6094bcc2744545": "cREAL", // cREAL
};

interface ContractContextType {
  contract: Contract | null;
  readOnlyContract: Contract | null;
  cUSDToken: Contract | null;
  address: string | null;
  connectWallet: () => Promise<Contract | null>;
  mentoTokenContracts: { [key: string]: Contract };
  mentoTokens: {};
  balances: Record<string, string>;
  setBalances: (balances: Record<string, string>) => void;
  disconnectWallet: () => void;
}

const ContractContext = createContext<ContractContextType | null>(null);

export const ContractProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [readOnlyContract, setReadOnlyContract] = useState<Contract | null>(
    null
  );
  const [cUSDToken, setCUSDToken] = useState<Contract | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [mentoTokenContracts, setMentoTokenContracts] = useState<{
    [key: string]: Contract;
  }>({});
  const [balances, setBalances] = useState<Record<string, string>>({});

  const contractAddress = "0xA108d65A028039a96d5Cda9f6663EFC5c601e911";

  const CELO_RPC = "https://alfajores-forno.celo-testnet.org";

  useEffect(() => {
    const provider = new ethers.JsonRpcProvider(CELO_RPC);
    const readContract = new Contract(
      contractAddress,
      contractABI.abi,
      provider
    );
    setReadOnlyContract(readContract);
  }, []);

  useEffect(() => {
    const restoreWallet = async () => {
      if (typeof window === "undefined") return;

      const storedAddress = localStorage.getItem("walletAddress");

      if (storedAddress && window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          await provider.send("eth_requestAccounts", []);
          const signer = await provider.getSigner();

          setAddress(storedAddress);

          const contractInstance = new Contract(
            contractAddress,
            contractABI.abi,
            signer
          );
          setContract(contractInstance);

          const tokenContracts: { [key: string]: Contract } = {};
          for (const [tokenAddress, symbol] of Object.entries(mentoTokens)) {
            tokenContracts[tokenAddress] = new Contract(
              tokenAddress,
              ERC20_ABI,
              signer
            );
          }
          setMentoTokenContracts(tokenContracts);
        } catch (error) {
          console.error("Error restoring wallet:", error);
          toast.error("Failed to restore wallet. Please reconnect.");
          localStorage.removeItem("walletAddress");
        }
      }
    };

    if (typeof window !== "undefined") {
      restoreWallet();
    }
  }, []);

  const connectWallet = async (): Promise<Contract | null> => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();

        // Get user address without ENS resolution
        let userAddress;
        try {
          userAddress = await signer.getAddress();
        } catch (err) {
          console.error("Error getting address:", err);
          toast.error("Failed to retrieve wallet address.");
          return null;
        }

        setAddress(userAddress);
        localStorage.setItem("walletAddress", userAddress); // Store in localStorage

        const contractInstance = new Contract(
          contractAddress,
          contractABI.abi,
          signer
        );
        setContract(contractInstance);

        const tokenContracts: { [key: string]: Contract } = {};
        for (const [tokenAddress, symbol] of Object.entries(mentoTokens)) {
          tokenContracts[tokenAddress] = new Contract(
            tokenAddress,
            ERC20_ABI,
            signer
          );
        }

        setMentoTokenContracts(tokenContracts);
        return contractInstance;
      } catch (error) {
        console.error("Wallet connection failed:", error);
        toast.error("Failed to connect wallet. Please try again.");
        return null;
      }
    } else {
      toast.error("Please install MetaMask or use a Web3-enabled browser.");
      return null;
    }
  };

  const disconnectWallet = () => {
    setContract(null);
    setAddress(null);
    setMentoTokenContracts({});
    localStorage.removeItem("walletAddress"); // Clear storage
    toast.success("Wallet disconnected successfully.");
  };

  return (
    <ContractContext.Provider
      value={{
        contract,
        readOnlyContract,
        cUSDToken,
        address,
        connectWallet,
        mentoTokens,
        mentoTokenContracts,
        balances,
        setBalances,
        disconnectWallet,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error("useContract must be used within a ContractProvider");
  }
  return context;
};
