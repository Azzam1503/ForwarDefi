import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAccount, useBalance, useEnsName } from 'wagmi';
import { 
  User, 
  Wallet, 
  Calendar, 
  Mail, 
  Copy, 
  ExternalLink, 
  Phone,
  Shield,
  CheckCircle,
  XCircle,
  TrendingUp,
  CreditCard,
  Activity,
  Award,
  Eye,
  EyeOff,
  Edit3,
  Settings,
  Bell,
  Globe
} from 'lucide-react';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { address, isConnected, connector } = useAccount();
  const { data: balance } = useBalance({ address });
  const { data: ensName } = useEnsName({ address });
  
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'activity'>('overview');

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatAddress = (addr: string) => {
    if (showFullAddress) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const openInExplorer = (addr: string) => {
    window.open(`https://testnet.snowtrace.io/address/${addr}`, '_blank');
  };

  const formatBalance = (value: string) => {
    const num = parseFloat(value);
    return num.toFixed(4);
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-unauthenticated">
          <div className="unauth-content">
            <User size={64} className="unauth-icon" />
            <h2>Access Your Profile</h2>
            <p>Please sign in to view and manage your account information</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Enhanced Profile Header */}
      <div className="profile-hero">
        <div className="profile-hero-content">
          <div className="profile-avatar">
            <div className="avatar-circle">
              <User size={48} />
            </div>
            <div className="avatar-status">
              {user.isActive ? (
                <CheckCircle size={20} className="status-icon active" />
              ) : (
                <XCircle size={20} className="status-icon inactive" />
              )}
            </div>
          </div>
          
          <div className="profile-identity">
            <h1 className="profile-name">{user.firstName} {user.lastName}</h1>
            <p className="profile-email">{user.email}</p>
            <div className="profile-badges">
              <div className="badge">
                <Shield size={14} />
                <span>Verified Account</span>
              </div>
              <div className="badge">
                <Calendar size={14} />
                <span>Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
          
          <div className="profile-actions">
            <button className="action-btn primary">
              <Edit3 size={16} />
              Edit Profile
            </button>
            <button className="action-btn secondary">
              <Settings size={16} />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="profile-navigation">
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <User size={16} />
            Overview
          </button>
          <button 
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={16} />
            Settings
          </button>
          <button 
            className={`nav-tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <Activity size={16} />
            Activity
          </button>
        </div>
      </div>

      {/* Profile Content Based on Active Tab */}
      <div className="profile-content">
        {activeTab === 'overview' && (
          <div className="profile-overview">
            <div className="overview-grid">
              {/* Account Details Card */}
              <div className="profile-card account-details">
                <div className="card-header">
                  <div className="header-icon">
                    <User size={20} />
                  </div>
                  <h3>Account Details</h3>
                  <button className="header-action">
                    <Edit3 size={16} />
                  </button>
                </div>
                
                <div className="card-content">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <div className="detail-label">
                        <User size={16} />
                        Full Name
                      </div>
                      <div className="detail-value">{user.firstName} {user.lastName}</div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">
                        <Mail size={16} />
                        Email Address
                      </div>
                      <div className="detail-value">{user.email}</div>
                    </div>
                    
                    {user.phoneNumber && (
                      <div className="detail-item">
                        <div className="detail-label">
                          <Phone size={16} />
                          Phone Number
                        </div>
                        <div className="detail-value">{user.phoneNumber}</div>
                      </div>
                    )}
                    
                    <div className="detail-item">
                      <div className="detail-label">
                        <Calendar size={16} />
                        Join Date
                      </div>
                      <div className="detail-value">
                        {new Date(user.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                    
                    <div className="detail-item">
                      <div className="detail-label">
                        <Shield size={16} />
                        Account Status
                      </div>
                      <div className={`detail-value status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? (
                          <>
                            <CheckCircle size={16} />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle size={16} />
                            Inactive
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wallet Information Card */}
              <div className="profile-card wallet-details">
                <div className="card-header">
                  <div className="header-icon">
                    <Wallet size={20} />
                  </div>
                  <h3>Wallet Information</h3>
                  <div className="connection-status">
                    {isConnected ? (
                      <div className="status-indicator connected">
                        <CheckCircle size={14} />
                        Connected
                      </div>
                    ) : (
                      <div className="status-indicator disconnected">
                        <XCircle size={14} />
                        Disconnected
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="card-content">
                  {isConnected && address ? (
                    <div className="wallet-connected">
                      <div className="wallet-address-section">
                        <div className="address-header">
                          <span className="address-label">Wallet Address</span>
                          <div className="address-controls">
                            <button
                              className="control-btn"
                              onClick={() => setShowFullAddress(!showFullAddress)}
                              title={showFullAddress ? 'Show short address' : 'Show full address'}
                            >
                              {showFullAddress ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button
                              className={`control-btn ${copiedAddress ? 'success' : ''}`}
                              onClick={() => copyToClipboard(address)}
                              title="Copy address"
                            >
                              {copiedAddress ? <CheckCircle size={14} /> : <Copy size={14} />}
                            </button>
                            <button
                              className="control-btn"
                              onClick={() => openInExplorer(address)}
                              title="View in explorer"
                            >
                              <ExternalLink size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="address-display">
                          <code className="address-text">{formatAddress(address)}</code>
                        </div>
                        {ensName && (
                          <div className="ens-display">
                            <Globe size={14} />
                            <span>{ensName}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="wallet-stats">
                        <div className="stat-row">
                          <div className="stat-item">
                            <div className="stat-label">Balance</div>
                            <div className="stat-value balance">
                              {balance ? `${formatBalance(balance.formatted)} ${balance.symbol}` : '0.0000 AVAX'}
                            </div>
                          </div>
                          
                          <div className="stat-item">
                            <div className="stat-label">Network</div>
                            <div className="stat-value network">
                              <div className="network-indicator"></div>
                              Avalanche Fuji
                            </div>
                          </div>
                        </div>
                        
                        <div className="stat-row">
                          <div className="stat-item">
                            <div className="stat-label">Connector</div>
                            <div className="stat-value">{connector?.name || 'Unknown'}</div>
                          </div>
                          
                          <div className="stat-item">
                            <div className="stat-label">Chain ID</div>
                            <div className="stat-value">43113</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="wallet-disconnected">
                      <div className="disconnected-content">
                        <Wallet size={48} className="disconnected-icon" />
                        <h4>No Wallet Connected</h4>
                        <p>Connect your wallet to view balance and manage your crypto assets</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* BNPL Statistics Card */}
              <div className="profile-card bnpl-stats">
                <div className="card-header">
                  <div className="header-icon">
                    <CreditCard size={20} />
                  </div>
                  <h3>BNPL Performance</h3>
                  <div className="performance-indicator">
                    <TrendingUp size={14} />
                    <span>Excellent</span>
                  </div>
                </div>
                
                <div className="card-content">
                  <div className="stats-grid-enhanced">
                    <div className="stat-card">
                      <div className="stat-icon total">
                        <CreditCard size={24} />
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">$0.00</div>
                        <div className="stat-label">Total Borrowed</div>
                        <div className="stat-change positive">+0%</div>
                      </div>
                    </div>
                    
                    <div className="stat-card">
                      <div className="stat-icon active">
                        <Activity size={24} />
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">0</div>
                        <div className="stat-label">Active Purchases</div>
                        <div className="stat-change neutral">-</div>
                      </div>
                    </div>
                    
                    <div className="stat-card">
                      <div className="stat-icon completed">
                        <CheckCircle size={24} />
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">0</div>
                        <div className="stat-label">Payments Made</div>
                        <div className="stat-change neutral">-</div>
                      </div>
                    </div>
                    
                    <div className="stat-card">
                      <div className="stat-icon score">
                        <Award size={24} />
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">-</div>
                        <div className="stat-label">Credit Score</div>
                        <div className="stat-change building">Building</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="credit-progress">
                    <div className="progress-header">
                      <span>Credit Building Progress</span>
                      <span>0%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '0%' }}></div>
                    </div>
                    <div className="progress-info">
                      <span>Complete your first loan to start building credit</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="profile-settings">
            <div className="settings-placeholder">
              <Settings size={48} />
              <h3>Settings</h3>
              <p>Profile settings and preferences coming soon</p>
            </div>
          </div>
        )}
        
        {activeTab === 'activity' && (
          <div className="profile-activity">
            <div className="activity-placeholder">
              <Activity size={48} />
              <h3>Activity Feed</h3>
              <p>Transaction history and activity tracking coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
