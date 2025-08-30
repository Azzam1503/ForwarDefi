import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAccount, useBalance } from 'wagmi';
import { User, Wallet, Calendar, Mail, Copy, ExternalLink } from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const openInExplorer = (addr: string) => {
    // For Avalanche Fuji testnet
    window.open(`https://testnet.snowtrace.io/address/${addr}`, '_blank');
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <h2>Please sign in to view your profile</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>Manage your account and wallet information</p>
      </div>

      <div className="profile-grid">
        {/* User Information Card */}
        <div className="profile-card">
          <div className="card-header">
            <User size={24} />
            <h2>Account Information</h2>
          </div>
          
          <div className="profile-info">
            <div className="info-item">
              <label>Username</label>
              <p>{user.username}</p>
            </div>
            
            <div className="info-item">
              <label>
                <Mail size={16} />
                Email
              </label>
              <p>{user.email}</p>
            </div>
            
            <div className="info-item">
              <label>
                <Calendar size={16} />
                Member Since
              </label>
              <p>{user.createdAt.toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Wallet Information Card */}
        <div className="profile-card">
          <div className="card-header">
            <Wallet size={24} />
            <h2>Wallet Information</h2>
          </div>
          
          {isConnected && address ? (
            <div className="wallet-info">
              <div className="info-item">
                <label>Wallet Address</label>
                <div className="address-display">
                  <span className="address-text">{formatAddress(address)}</span>
                  <div className="address-actions">
                    <button
                      onClick={() => copyToClipboard(address)}
                      className="icon-btn"
                      title="Copy address"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => openInExplorer(address)}
                      className="icon-btn"
                      title="View in explorer"
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              </div>
              
              {balance && (
                <div className="info-item">
                  <label>Balance</label>
                  <p className="balance-amount">
                    {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                  </p>
                </div>
              )}
              
              <div className="info-item">
                <label>Network</label>
                <p>Avalanche Fuji Testnet</p>
              </div>
            </div>
          ) : (
            <div className="wallet-not-connected">
              <p>No wallet connected</p>
              <p className="text-muted">Connect your wallet to view balance and transaction history</p>
            </div>
          )}
        </div>

        {/* BNPL Stats Card */}
        <div className="profile-card">
          <div className="card-header">
            <h2>BNPL Statistics</h2>
          </div>
          
          <div className="stats-grid">
            <div className="stat-item">
              <label>Total Borrowed</label>
              <p className="stat-value">$0.00</p>
            </div>
            
            <div className="stat-item">
              <label>Active Loans</label>
              <p className="stat-value">0</p>
            </div>
            
            <div className="stat-item">
              <label>Completed Payments</label>
              <p className="stat-value">0</p>
            </div>
            
            <div className="stat-item">
              <label>Credit Score</label>
              <p className="stat-value">-</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
