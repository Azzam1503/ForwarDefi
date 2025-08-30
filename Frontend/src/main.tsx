import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "./utils/wagmiConfig";

// 1️⃣ Create a query client
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* 2️⃣ Wrap with QueryClientProvider */}
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
