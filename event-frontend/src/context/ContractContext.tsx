"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";
import contractABI from "../contract/abi.json";

const cUSD_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) public returns (bool)",
  "function balanceOf(address owner) public view returns (uint256)",
];

const mentoTokens = {
  cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
  cEUR: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F",
  cREAL: "0xE4D517785D091D3c54818832dB6094bcc2744545",
};

// Define context type
interface ContractContextType {
  contract: Contract | null;
  readOnlyContract: Contract | null;
  cUSDToken: Contract | null;
  address: string | null;
  connectWallet: () => Promise<Contract | null>;
  mentoTokenContracts: { [key: string]: Contract }; // Fixed type
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
  const [mentoTokenContracts, setMentoTokenContracts] = useState<{
    [key: string]: Contract;
  }>({});

  const contractAddress = "0x5D8628Ac24Df37257Ef1104965298FF07C354299";
  const cUSDTokenAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
  const CELO_RPC = "https://alfajores-forno.celo-testnet.org";

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
  const connectWallet = async (): Promise<Contract | null> => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();

        const userAddress = await signer.getAddress();
        setAddress(userAddress);

        // Initialize EventChain contract
        const contractInstance = new Contract(
          contractAddress,
          contractABI.abi,
          signer
        );
        setContract(contractInstance);

        // Initialize all Mento stablecoin contracts
        const tokenContracts: { [key: string]: Contract } = {};
        for (const [symbol, tokenAddress] of Object.entries(mentoTokens)) {
          tokenContracts[symbol] = new Contract(tokenAddress, cUSD_ABI, signer);
        }

        setMentoTokenContracts(tokenContracts);

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
      value={{
        contract,
        readOnlyContract,
        cUSDToken,
        address,
        connectWallet,
        mentoTokenContracts,
      }}
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
