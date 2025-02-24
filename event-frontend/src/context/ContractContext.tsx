"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import contractABI from "../contract/abi.json";

const cUSD_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) public returns (bool)",
  "function balanceOf(address owner) public view returns (uint256)",
];

// Define context type
interface ContractContextType {
  contract: Contract | null;
  cUSDToken: Contract | null;
  address: string | null;
}

// Create context with proper type
const ContractContext = createContext<ContractContextType | null>(null);

export const ContractProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [cUSDToken, setCUSDToken] = useState<Contract | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  const contractAddress = "0xBa26366767eA843A656853d348c763c41f9D67Ca";
  const cUSDTokenAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

  // 0x3F1e2BBD47e3305FC0e4c13c108764578ff74a97
  useEffect(() => {
    const loadContract = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const userAddress = await signer.getAddress(); // Get user address
        setAddress(userAddress); // Store in state

        const contractInstance = new Contract(
          contractAddress,
          contractABI.abi,
          signer
        );
        setContract(contractInstance);

        const cUSDContract = new Contract(cUSDTokenAddress, cUSD_ABI, signer);
        setCUSDToken(cUSDContract);
      }
    };

    loadContract();
  }, []);

  return (
    <ContractContext.Provider value={{ contract, cUSDToken, address }}>
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
