import { useSwitchChain, useChainId } from "wagmi";
import { avalancheFuji } from "wagmi/chains";

export default function ChainChecker() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  return chainId !== avalancheFuji.id ? (
    <button onClick={() => switchChain({ chainId: avalancheFuji.id })}>
      Switch to Avalanche Fuji
    </button>
  ) : (
    <p>✅ On Avalanche Fuji</p>
  );
}
