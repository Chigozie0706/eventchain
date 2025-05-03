"use client";
import { useEffect } from "react";
import { useConnect } from "wagmi";
import { injected } from "wagmi/connectors";

export default function MiniPayScripts() {
  const { connect } = useConnect();

  useEffect(() => {
    // Check for MiniPay on initial load
    if (typeof window !== "undefined" && window.ethereum?.isMiniPay) {
      connect({ connector: injected({ target: "metaMask" }) });

      // Add MiniPay-specific event listeners
      window.ethereum.on("chainChanged", () => window.location.reload());
      window.ethereum.on("accountsChanged", () => window.location.reload());
    }
  }, [connect]);

  return null;
}
