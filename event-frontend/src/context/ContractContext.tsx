"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import contractABI from "../contract/abi.json"; // Ensure ABI path is correct

// Define context type
interface ContractContextType {
  contract: Contract | null;
}

// Create context with proper type
const ContractContext = createContext<ContractContextType | null>(null);

export const ContractProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const contractAddress = "0xa7aA17B0fe25C2085deDA9441DE3FfD713EA4589"; // Replace with actual contract address

  // 0xedAef3f9695797feA319008107C55864bD357C65
  // 0x2BAAB5E93f8b20A5a4cdB7938d75fdB0FB50C2e4

  useEffect(() => {
    const loadContract = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractInstance = new Contract(
          contractAddress,
          contractABI.abi,
          signer
        );
        setContract(contractInstance);
      }
    };

    loadContract();
  }, []);

  return (
    <ContractContext.Provider value={{ contract }}>
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
