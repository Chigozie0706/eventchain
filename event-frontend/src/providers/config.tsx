import { http } from "wagmi";
import { createConfig } from "@privy-io/wagmi";
import { celo, celoSepolia } from "wagmi/chains";

export const config = createConfig({
  chains: [celo],
  transports: {
    [celo.id]: http(),
  },
  ssr: true,
});
