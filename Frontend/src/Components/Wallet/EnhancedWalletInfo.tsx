import React, { useState, useEffect } from 'react';
import { useAccount, useBalance, useEnsName, useBlockNumber } from 'wagmi';
import { avalancheFuji, avalanche } from 'wagmi/chains';
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Clock,
  Shield,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const EnhancedWalletInfo: React.FC = () => {
  const { user } = useAuth();
  const { address, isConnected, connector } = useAccount();
  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useBalance({ address });
  const { data: ensName } = useEnsName({ address });
  const { data: blockNumber } = useBlockNumber();
  
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchBalance();
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchBalance]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatAddress = (addr: string) => {
    if (showFullAddress) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const openInExplorer = (addr: string) => {
    const explorerUrl = 'https://testnet.snowtrace.io/address/';
    window.open(`${explorerUrl}${addr}`, '_blank');
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0.0000';
    if (num < 0.0001) return '< 0.0001';
    return num.toFixed(4);
  };

  const getWalletStatus = () => {
    if (!isConnected) return { status: 'disconnected', color: '#ef4444', icon: AlertCircle };
    if (balance && parseFloat(balance.formatted) === 0) return { status: 'empty', color: '#f59e0b', icon: AlertCircle };
    if (balance && parseFloat(balance.formatted) < 0.01) return { status: 'low', color: '#f59e0b', icon: AlertCircle };
    return { status: 'ready', color: '#10b981', icon: CheckCircle };
  };

  const walletStatus = getWalletStatus();
  const StatusIcon = walletStatus.icon;

  if (!isConnected) {
    return (
      <div className="enhanced-wallet-info">
        <div className="wallet-status-header">
          <div className="wallet-status-indicator">
            <AlertCircle size={20} color="#ef4444" />
            <span className="status-text">Wallet Disconnected</span>
          </div>
        </div>
        <div className="wallet-connect-prompt">
          <Wallet size={32} color="#6b7280" />
          <p>Connect your wallet to access BNPL features</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-wallet-info">
      <div className="wallet-header">
        <div className="wallet-status-indicator">
          <StatusIcon size={20} color={walletStatus.color} />
          <span className="status-text">
            {walletStatus.status === 'ready' && 'Wallet Ready'}
            {walletStatus.status === 'low' && 'Low Balance'}
            {walletStatus.status === 'empty' && 'Empty Wallet'}
          </span>
        </div>
        
        <button 
          className="refresh-button"
          onClick={() => {
            refetchBalance();
            setLastRefresh(new Date());
          }}
          disabled={balanceLoading}
        >
          <RefreshCw size={16} className={balanceLoading ? 'spinning' : ''} />
        </button>
      </div>

      <div className="wallet-grid">
        {/* Balance Card - Most Important */}
        <div className="wallet-card balance-card">
          <div className="card-header">
            <TrendingUp size={16} />
            <span>Balance</span>
          </div>
          <div className="balance-display">
            <div className="balance-main">
              <span className="balance-amount">
                {balance ? formatBalance(balance.formatted) : '0.0000'}
              </span>
              <span className="balance-symbol">{balance?.symbol || 'AVAX'}</span>
            </div>
            <span className="balance-usd">≈ $-- USD</span>
          </div>
        </div>

        {/* Address Card */}
        <div className="wallet-card address-card">
          <div className="card-header">
            <Wallet size={16} />
            <span>Address</span>
          </div>
          <div className="address-compact">
            <span className="address-text" title={address}>
              {address && formatAddress(address)}
            </span>
            <div className="address-actions">
              <button
                className="action-btn"
                onClick={() => setShowFullAddress(!showFullAddress)}
                title={showFullAddress ? 'Hide' : 'Show full'}
              >
                {showFullAddress ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
              <button
                className={`action-btn ${copySuccess ? 'success' : ''}`}
                onClick={() => address && copyToClipboard(address)}
                title="Copy"
              >
                <Copy size={12} />
              </button>
              <button
                className="action-btn"
                onClick={() => address && openInExplorer(address)}
                title="Explorer"
              >
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Connection Card */}
        <div className="wallet-card connection-card">
          <div className="card-header">
            <Shield size={16} />
            <span>Connection</span>
          </div>
          <div className="connection-compact">
            <div className="connection-item">
              <span className="label">Connector:</span>
              <span className="value">{connector?.name || 'Unknown'}</span>
            </div>
            <div className="connection-item">
              <span className="label">Network:</span>
              <span className="value">Fuji Testnet</span>
            </div>
            <div className="connection-item">
              <span className="label">Updated:</span>
              <span className="value">
                <Clock size={10} />
                {lastRefresh.toLocaleTimeString().slice(0, 5)}
              </span>
            </div>
          </div>
        </div>

        {/* BNPL Status Card */}
        <div className="wallet-card bnpl-card">
          <div className="card-header">
            <CheckCircle size={16} />
            <span>BNPL Status</span>
          </div>
          <div className="bnpl-compact">
            <div className="bnpl-item">
              <span className="label">Credit Score:</span>
              <span className="value">--</span>
            </div>
            <div className="bnpl-item">
              <span className="label">Active Loans:</span>
              <span className="value">0</span>
            </div>
            <div className="bnpl-item">
              <span className="label">Collateral:</span>
              <span className="value">
                {balance ? formatBalance(balance.formatted) : '0'} {balance?.symbol || 'AVAX'}
              </span>
            </div>
          </div>
        </div>

        {/* Account Link Card */}
        {user && (
          <div className="wallet-card account-card">
            <div className="card-header">
              <User size={16} />
              <span>Account</span>
            </div>
            <div className="account-compact">
              <div className="account-info">
                <span className="account-name">{user.username}</span>
                <span className="account-status">
                  <CheckCircle size={12} color="#10b981" />
                  Linked
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ENS Card (if available) */}
        {ensName && (
          <div className="wallet-card ens-card">
            <div className="card-header">
              <span>ENS</span>
            </div>
            <div className="ens-compact">
              <span className="ens-name">{ensName}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedWalletInfo;
