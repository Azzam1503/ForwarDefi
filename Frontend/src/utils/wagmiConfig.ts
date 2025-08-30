import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { avalanche, avalancheFuji } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "DeFi BNPL",
  projectId: "27a1164f0957b3e354ae770a993d2801", // Get from cloud.walletconnect.com
  chains: [avalancheFuji, avalanche], // Dev: Fuji, Prod: Mainnet
  ssr: false,
});
