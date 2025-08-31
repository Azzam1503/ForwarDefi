import { useAccount, useBalance } from "wagmi";

export default function WalletInfo() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  if (!isConnected) return <p>❌ Wallet not connected</p>;

  return (
    <div>
      <p>✅ Connected: {address}</p>
      <p>
        Balance: {balance?.formatted} {balance?.symbol}
      </p>
    </div>
  );
}
