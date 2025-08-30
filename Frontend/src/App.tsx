import { ConnectButton } from "@rainbow-me/rainbowkit";
import WalletInfo from "./Components/Wallet/WalletInfo";
import ChainChecker from "./Components/Wallet/ChainChecker";
import "@rainbow-me/rainbowkit/styles.css";

function App() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>DeFi BNPL on Avalanche</h1>
      <ConnectButton />

      <hr />
      <ChainChecker />
      <WalletInfo />
    </div>
  );
}

export default App;
