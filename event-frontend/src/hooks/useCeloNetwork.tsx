"use client";
import { useEffect, useState } from "react";
import { useChainId, useSwitchChain, useAccount } from "wagmi";
import { celo } from "wagmi/chains";
import { toast } from "react-hot-toast";
import { usePrivy } from "@privy-io/react-auth";

export const useCeloNetwork = () => {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { isConnected } = useAccount();
  const { authenticated } = usePrivy();
  const [isSwitching, setIsSwitching] = useState(false);

  const isOnCelo = chainId === celo.id;

  const switchToCelo = async (): Promise<boolean> => {
    if (isOnCelo) return true;

    try {
      setIsSwitching(true);
      console.log("🔄 Attempting to switch to Celo network...");

      await switchChain({ chainId: celo.id });

      console.log("✅ Successfully switched to Celo");
      toast.success("Connected to Celo network");
      return true;
    } catch (error: any) {
      console.error("❌ Failed to switch to Celo:", error);

      let errorMessage = "Please switch to Celo network manually";

      if (error?.message?.includes("rejected") || error?.code === 4001) {
        errorMessage = "Please approve the network switch in your wallet";
      } else if (error?.message?.includes("Unrecognized chain")) {
        errorMessage = "Celo network not found. Please add it to your wallet.";
      }

      toast.error(errorMessage, { duration: 6000 });
      return false;
    } finally {
      setIsSwitching(false);
    }
  };

  // Auto-switch when connected but not on Celo
  useEffect(() => {
    if (isConnected && authenticated && !isOnCelo && !isSwitching) {
      switchToCelo();
    }
  }, [isConnected, authenticated, isOnCelo]);

  return {
    isOnCelo,
    isSwitching,
    switchToCelo,
    currentChainId: chainId,
    targetChain: celo,
  };
};
