import React, { useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAuth } from '../contexts/AuthContext';
import { useAccount, useDisconnect } from 'wagmi';
import { Lock } from 'lucide-react';

const ProtectedConnectButton: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Auto-disconnect if wallet is connected but user is not authenticated
  useEffect(() => {
    if (isConnected && !isAuthenticated) {
      disconnect();
    }
  }, [isConnected, isAuthenticated, disconnect]);

  // If user is not authenticated, show disabled state
  if (!isAuthenticated) {
    return (
      <div className="protected-connect-button">
        <button className="connect-btn-disabled" disabled>
          <Lock size={16} />
          Sign in to connect wallet
        </button>
        <p className="connect-hint">Please sign in first to connect your crypto wallet</p>
      </div>
    );
  }

  // If authenticated, show normal ConnectButton
  return <ConnectButton />;
};

export default ProtectedConnectButton;
