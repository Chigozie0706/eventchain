"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { celo } from "wagmi/chains";
import { http } from "wagmi";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { useEffect } from "react";
import type { PrivyClientConfig } from "@privy-io/react-auth";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";

const config = createConfig({
  chains: [celo],
  transports: {
    [celo.id]: http(),
  },
  ssr: true,
});

const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
    // requireUserPasswordOnCreate: true,
    // noPromptOnSignature: false,
  },
  loginMethods: ["wallet", "email", "sms"],
  appearance: {
    showWalletLoginFirst: true,
  },
  defaultChain: celo,
};
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // apiUrl={process.env.NEXT_PUBLIC_PRIVY_AUTH_URL as string}
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
        config={privyConfig}
      >
        <PrivyInitializationTracker>
          <WagmiProvider config={config}>{children}</WagmiProvider>
        </PrivyInitializationTracker>
      </PrivyProvider>
    </QueryClientProvider>
  );
}

function PrivyInitializationTracker({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, authenticated } = usePrivy();

  useEffect(() => {
    console.log("Privy State Changed:", { ready, authenticated });
  }, [ready, authenticated]);

  return <>{children}</>;
}
