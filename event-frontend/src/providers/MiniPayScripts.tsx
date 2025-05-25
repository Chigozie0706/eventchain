"use client";
import { useEffect } from "react";
import { useConnect, useAccount } from "wagmi";
import { injected } from "wagmi/connectors";

export default function MiniPayScripts() {
  const { connectAsync } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    const handleMiniPay = async () => {
      if (
        typeof window !== "undefined" &&
        window.ethereum?.isMiniPay &&
        !isConnected
      ) {
        try {
          await connectAsync({ connector: injected({ target: "metaMask" }) });

          // Setup MiniPay-specific listeners
          window.ethereum.on("accountsChanged", () => window.location.reload());
          window.ethereum.on("chainChanged", () => window.location.reload());

          return () => {
            window.ethereum?.removeListener("accountsChanged", () =>
              window.location.reload()
            );
            window.ethereum?.removeListener("chainChanged", () =>
              window.location.reload()
            );
          };
        } catch (error) {
          console.error("MiniPay connection failed:", error);
        }
      }
    };

    if (window.ethereum) {
      handleMiniPay();
    } else {
      window.addEventListener("ethereum#initialized", handleMiniPay, {
        once: true,
      });
    }
  }, [connectAsync, isConnected]);

  return null;
}
