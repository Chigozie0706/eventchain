"use client";
import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, base } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ContractProvider } from "@/context/ContractContext";
import { ThirdwebProvider } from "thirdweb/react";
// import { CeloAlfajores } from "thirdweb-dev/chains";
import { celoAlfajoresTestnet, ethereum, celo } from "thirdweb/chains";

// const config = getDefaultConfig({
//   appName: "EventChain",
//   projectId: "b2086c0b61d1965614aefb4fb914a316",
//   chains: [mainnet, polygon, optimism, arbitrum, base],
//   ssr: true,
// });

// const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // <WagmiProvider config={config}>
    //   <QueryClientProvider client={queryClient}>
    //     <RainbowKitProvider>
    //       <ContractProvider>{children}</ContractProvider>
    //     </RainbowKitProvider>
    //   </QueryClientProvider>
    // </WagmiProvider>

    <ThirdwebProvider>{children}</ThirdwebProvider>
  );
}
