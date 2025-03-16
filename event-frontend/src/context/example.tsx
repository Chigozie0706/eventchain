"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";
import contractABI from "../contract/abi.json";

const cUSD_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) public returns (bool)",
  "function balanceOf(address owner) public view returns (uint256)",
];

// Define context type
interface ContractContextType {
  contract: Contract | null; // Read & write contract
  readOnlyContract: Contract | null; // Read-only contract
  cUSDToken: Contract | null;
  address: string | null;
  // connectWallet: () => Promise<void>;
  connectWallet: () => Promise<Contract | null>; // 🔥 Change this
}

// Create context with proper type
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

  const contractAddress = "0xBa26366767eA843A656853d348c763c41f9D67Ca";
  const cUSDTokenAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
  const CELO_RPC = "https://alfajores-forno.celo-testnet.org"; // Read-only RPC

  // Initialize read-only contract on load
  useEffect(() => {
    const provider = new ethers.JsonRpcProvider(CELO_RPC);
    const readContract = new Contract(
      contractAddress,
      contractABI.abi,
      provider
    );
    setReadOnlyContract(readContract);
  }, []);

  // Function to connect wallet

  // const connectWallet = async () => {
  //   if (typeof window !== "undefined" && window.ethereum) {
  //     try {
  //       const provider = new BrowserProvider(window.ethereum);
  //       await provider.send("eth_requestAccounts", []); // Request wallet connection
  //       const signer = await provider.getSigner();

  //       const userAddress = await signer.getAddress();
  //       setAddress(userAddress);

  //       const contractInstance = new Contract(
  //         contractAddress,
  //         contractABI.abi,
  //         signer
  //       );
  //       setContract(contractInstance);

  //       const cUSDContract = new Contract(cUSDTokenAddress, cUSD_ABI, signer);
  //       setCUSDToken(cUSDContract);
  //     } catch (error) {
  //       console.error("Wallet connection failed:", error);
  //     }
  //   } else {
  //     alert("Please install MetaMask or use a Web3-enabled browser.");
  //   }
  // };

  const connectWallet = async (): Promise<Contract | null> => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();

        const userAddress = await signer.getAddress();
        setAddress(userAddress);

        const contractInstance = new Contract(
          contractAddress,
          contractABI.abi,
          signer
        );
        setContract(contractInstance);

        const cUSDContract = new Contract(cUSDTokenAddress, cUSD_ABI, signer);
        setCUSDToken(cUSDContract);

        return contractInstance;
      } catch (error) {
        console.error("Wallet connection failed:", error);
        return null;
      }
    } else {
      alert("Please install MetaMask or use a Web3-enabled browser.");
      return null;
    }
  };

  return (
    <ContractContext.Provider
      value={{ contract, readOnlyContract, cUSDToken, address, connectWallet }}
    >
      {children}
    </ContractContext.Provider>
  );
};

// Custom hook with proper type checking
export const useContract = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error("useContract must be used within a ContractProvider");
  }
  return context;
};
