import React from 'react';
import { useSwitchChain, useChainId } from 'wagmi';
import { avalancheFuji, avalanche } from 'wagmi/chains';
import { AlertTriangle, CheckCircle, Network, ExternalLink } from 'lucide-react';

const EnhancedChainChecker: React.FC = () => {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const isOnCorrectChain = chainId === avalancheFuji.id;
  const currentChain = chainId === avalanche.id ? avalanche : avalancheFuji;

  const handleSwitchChain = () => {
    if (switchChain) {
      switchChain({ chainId: avalancheFuji.id });
    }
  };

  const openChainExplorer = () => {
    window.open('https://testnet.snowtrace.io/', '_blank');
  };

  if (isOnCorrectChain) {
    return (
      <div className="chain-checker success">
        <div className="chain-status">
          <CheckCircle size={20} color="#10b981" />
          <div className="chain-info">
            <span className="chain-name">✅ Connected to Avalanche Fuji</span>
            <span className="chain-detail">Testnet • Ready for BNPL operations</span>
          </div>
        </div>
        
        <div className="chain-actions">
          <button 
            className="chain-action-btn secondary"
            onClick={openChainExplorer}
            title="View on Snowtrace"
          >
            <ExternalLink size={14} />
            Explorer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chain-checker warning">
      <div className="chain-status">
        <AlertTriangle size={20} color="#f59e0b" />
        <div className="chain-info">
          <span className="chain-name">⚠️ Wrong Network</span>
          <span className="chain-detail">
            Currently on: {currentChain.name || 'Unknown'} • Switch to Avalanche Fuji
          </span>
        </div>
      </div>
      
      <div className="chain-actions">
        <button 
          className="chain-action-btn primary"
          onClick={handleSwitchChain}
          disabled={isPending}
        >
          <Network size={14} />
          {isPending ? 'Switching...' : 'Switch to Fuji'}
        </button>
      </div>
    </div>
  );
};

export default EnhancedChainChecker;
