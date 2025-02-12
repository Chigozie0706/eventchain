import { useEffect, useState, useCallback } from "react";
import { BrowserProvider, Contract } from "ethers";
import contractABI from "../contract/abi.json";
import { useContract } from "../context/ContractContext";

// const contractAddress = "0xedAef3f9695797feA319008107C55864bD357C65";

export default function HeroSection() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  // const [contract, setContract] = useState<Contract | null>(null);
  const [account, setAccount] = useState(null);
  const { contract } = useContract();

  // useEffect(() => {
  //   if (typeof window !== "undefined" && window.ethereum) {
  //     const web3Provider = new BrowserProvider(window.ethereum);
  //     setProvider(web3Provider);
  //   }
  // }, []);

  // const connectWallet = useCallback(async () => {
  //   if (!window.ethereum) {
  //     console.error("MetaMask is not installed.");
  //     return;
  //   }

  //   const provider = new BrowserProvider(window.ethereum);

  //   try {
  //     // Request to switch to the correct network
  //     await window.ethereum.request({
  //       method: "wallet_switchEthereumChain",
  //       params: [{ chainId: "0xAEF3" }], // Celo Mainnet: 0xa4ec, Celo Testnet: 0xaef3
  //     });

  //     // Request account access
  //     const accounts = await provider.send("eth_requestAccounts", []);
  //     setAccount(accounts[0]);

  //     // Get signer and set contract
  //     const signer = await provider.getSigner();
  //     const contractInstance = new Contract(
  //       contractAddress,
  //       contractABI.abi,
  //       signer
  //     );
  //     setContract(contractInstance);

  //     console.log("Connected to:", accounts[0]);
  //   } catch (error: any) {
  //     if (error.code === 4902) {
  //       // If the network is not added, add it
  //       try {
  //         await window.ethereum.request({
  //           method: "wallet_addEthereumChain",
  //           params: [
  //             {
  //               chainId: "0xAEF3", // Celo Testnet (Alfajores) chain ID
  //               chainName: "Celo Testnet (Alfajores)",
  //               rpcUrls: ["https://alfajores-forno.celo-testnet.org"],
  //               nativeCurrency: {
  //                 name: "CELO",
  //                 symbol: "CELO",
  //                 decimals: 18,
  //               },
  //               blockExplorerUrls: ["https://alfajores.celoscan.io"],
  //             },
  //           ],
  //         });
  //       } catch (addError) {
  //         console.error("Failed to add network:", addError);
  //       }
  //     } else {
  //       console.error("Network switch error:", error);
  //     }
  //   }
  // }, []);

  // const interactWithContract = async () => {
  //   if (!contract) return;
  //   const result = await contract.getEventLength(); // Replace with your function name
  //   console.log(result);
  // };

  const getEventLength = async () => {
    if (!contract) {
      console.error("Contract is not loaded");
      return;
    }

    try {
      const length = await contract.getEventLength(); // Replace with actual contract method
      // setEventLength(length);
      console.log(length);
    } catch (error) {
      console.error("Error fetching event length:", error);
    }
  };

  return (
    <section className="relative w-full max-w-6xl mx-auto mt-20 rounded-lg overflow-hidden">
      {/* Background Image */}
      <div
        className="relative h-[400px] md:h-[450px] bg-cover bg-center"
        style={{ backgroundImage: "url('/images/image1.jpg')" }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50"></div>

        {/* Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="text-white px-8 md:px-16 max-w-lg">
            <h2 className="text-xl md:text-2xl font-semibold">
              Best events in
            </h2>
            <h1 className="text-4xl md:text-5xl font-bold">Lagos</h1>
            <p className="mt-3 text-sm md:text-base">
              Looking for something to do in Lagos? Whether you're a local, new
              in town or just cruising through, we've got great tips and events.
            </p>

            {/* Button */}
            <button
              className="mt-5 flex items-center bg-blue-600 text-white px-5 py-2 rounded-full shadow-md hover:bg-blue-700"
              onClick={getEventLength}
            >
              <span className="mr-2">📍</span> Lagos ⌄
            </button>

            <button
              className="mt-5 flex items-center bg-blue-600 text-white px-5 py-2 rounded-full shadow-md hover:bg-blue-700"
              // onClick={connectWallet}
            >
              <span className="mr-2">📍</span> connect wallet ⌄
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
