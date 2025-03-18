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

// const mentoTokens = {
//   cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
//   cEUR: "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F",
//   cCOP: "0xE4D517785D091D3c54818832dB6094bcc2744545",
// };

const mentoTokens = {
  "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1": "cUSD", // cUSD
  "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F": "cEUR", // cEUR
  "0xE4D517785D091D3c54818832dB6094bcc2744545": "cCOP", // cCOP
};

interface ContractContextType {
  contract: Contract | null;
  readOnlyContract: Contract | null;
  cUSDToken: Contract | null;
  address: string | null;
  connectWallet: () => Promise<Contract | null>;
  mentoTokenContracts: { [key: string]: Contract };
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

  const contractAddress = "0xC152EF3B6Ac036F312bfFC1881CF23e496884e16";
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

  // const connectWallet = async (): Promise<Contract | null> => {
  //   if (typeof window !== "undefined" && window.ethereum) {
  //     try {
  //       const provider = new BrowserProvider(window.ethereum);
  //       await provider.send("eth_requestAccounts", []);
  //       const signer = await provider.getSigner();

  //       const userAddress = await signer.getAddress();
  //       setAddress(userAddress);

  //       const contractInstance = new Contract(
  //         contractAddress,
  //         contractABI.abi,
  //         signer
  //       );
  //       setContract(contractInstance);

  //       const tokenContracts: { [key: string]: Contract } = {};
  //       for (const [symbol, tokenAddress] of Object.entries(mentoTokens)) {
  //         tokenContracts[symbol] = new Contract(
  //           tokenAddress,
  //           ERC20_ABI,
  //           signer
  //         );
  //       }

  //       setMentoTokenContracts(tokenContracts);
  //       return contractInstance;
  //     } catch (error) {
  //       console.error("Wallet connection failed:", error);
  //       toast.error("Failed to connect wallet. Please try again.");
  //       return null;
  //     }
  //   } else {
  //     toast.error("Please install MetaMask or use a Web3-enabled browser.");
  //     return null;
  //   }
  // };

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

export const useContract = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error("useContract must be used within a ContractProvider");
  }
  return context;
};
