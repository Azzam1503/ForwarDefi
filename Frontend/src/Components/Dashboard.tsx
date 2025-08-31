import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EnhancedChainChecker from "./Wallet/EnhancedChainChecker";
import EnhancedWalletInfo from "./Wallet/EnhancedWalletInfo";
import { useAuth } from '../contexts/AuthContext';
import { loanApi } from '../services/api';
import * as LoanTypes from '../types/loan';
import ProtectedConnectButton from './ProtectedConnectButton';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  History, 
  Shield, 
  Zap, 
  Target,
  Users,
  Activity,
  Award,
  ArrowRight,
  Star,
  Plus,
  Eye
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [userLoans, setUserLoans] = useState<LoanTypes.Loan[]>([]);
  const [loansLoading, setLoansLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserLoans();
    }
  }, [isAuthenticated, user]);

  const fetchUserLoans = async () => {
    if (!user) return;
    setLoansLoading(true);
    try {
      const response = await loanApi.getUserLoans(user.id);
      setUserLoans(response.data);
    } catch (error) {
      console.error('Failed to fetch user loans:', error);
    } finally {
      setLoansLoading(false);
    }
  };

  const stats = [
    {
      icon: <TrendingUp size={24} />,
      label: "Total Volume",
      value: "$2.4M",
      change: "+12.5%",
      positive: true,
    },
    {
      icon: <Users size={24} />,
      label: "Active Users",
      value: "1,234",
      change: "+8.2%",
      positive: true,
    },
    {
      icon: <Activity size={24} />,
      label: "Purchases Processed",
      value: "456",
      change: "+15.3%",
      positive: true,
    },
    {
      icon: <Award size={24} />,
      label: "Success Rate",
      value: "98.7%",
      change: "+0.5%",
      positive: true,
    },
  ];

  const getLoanSummary = () => {
    return {
      total: userLoans.length,
      active: userLoans.filter(l => l.status === LoanTypes.LoanStatus.ACTIVE).length,
      pending: userLoans.filter(l => l.status === LoanTypes.LoanStatus.PENDING).length,
      totalBorrowed: userLoans.reduce((sum, loan) => {
        if (loan.status === LoanTypes.LoanStatus.ACTIVE || loan.status === LoanTypes.LoanStatus.REPAID) {
          return sum + loan.amount;
        }
        return sum;
      }, 0),
    };
  };

  const loanSummary = getLoanSummary();

  const features = [
    {
      id: "create-loan",
      icon: <DollarSign size={32} />,
      title: 'Create Loan',
      description: 'Request instant crypto transfers with competitive rates and flexible terms',
      benefits: ['Instant approval', 'Low interest rates', 'Flexible repayment'],
      comingSoon: false,
      action: () => navigate('/loans')
    },
    {
      id: "my-loans",
      icon: <CreditCard size={32} />,
      title: 'My Purchases',
      description: 'View and manage your active purchase agreements and payment schedules',
      benefits: ['Track payments', 'Manage terms', 'View history'],
      comingSoon: false,
      action: () => navigate('/loans')
    },
    {
      id: "payment-history",
      icon: <History size={32} />,
      title: 'Payment History',
      description: 'Track your payment history and monitor your credit score improvement',
      benefits: ['Credit scoring', 'Payment analytics', 'Performance tracking'],
      comingSoon: false,
      action: () => navigate('/history')
    },
    {
      id: "insurance",
      icon: <Shield size={32} />,
      title: 'Purchase Protection',
      description: 'Protect your transfers with smart contract insurance and risk management',
      benefits: ['Smart contracts', 'Risk mitigation', 'Automated protection'],
      comingSoon: true
    }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome to ForwarDefi
            {isAuthenticated ? `, ${user?.firstName || user?.username}` : ""}
          </h1>
          <p className="hero-subtitle">
            Your decentralized Buy Now, Pay Later platform on Avalanche
          </p>
          <div className="hero-features">
            <div className="hero-feature">
              <Zap size={20} />
              <span>Instant Transfers</span>
            </div>
            <div className="hero-feature">
              <Shield size={20} />
              <span>Secure & Transparent</span>
            </div>
            <div className="hero-feature">
              <Target size={20} />
              <span>DeFi Native</span>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="platform-stats">
        <h2 className="section-title">Platform Overview</h2>
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
                <div
                  className={`stat-change ${
                    stat.positive ? "positive" : "negative"
                  }`}
                >
                  {stat.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-content">
          <div className="wallet-section">
            <div className="section-header">
              <h2 className="section-title">Wallet & Account</h2>
              <ProtectedConnectButton />
            </div>

            {isAuthenticated && (
              <div className="wallet-components">
                <EnhancedChainChecker />
                <EnhancedWalletInfo />
              </div>
            )}
          </div>

          {/* Quick Loans Overview */}
          {isAuthenticated && (
            <div className="loans-overview">
              <div className="section-header">
                <h2 className="section-title">Your Loans Overview</h2>
                <button
                  className="btn-view-all"
                  onClick={() => navigate("/loans")}
                >
                  <Eye size={16} />
                  View All Loans
                </button>
              </div>

              <div className="loans-quick-stats">
                <div className="quick-stat">
                  <div className="stat-icon total-loans">
                    <CreditCard size={20} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {loansLoading ? "..." : loanSummary.total}
                    </div>
                    <div className="stat-label">Total Loans</div>
                  </div>
                </div>

                <div className="quick-stat">
                  <div className="stat-icon active-loans">
                    <TrendingUp size={20} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {loansLoading ? "..." : loanSummary.active}
                    </div>
                    <div className="stat-label">Active Loans</div>
                  </div>
                </div>

                <div className="quick-stat">
                  <div className="stat-icon pending-loans">
                    <Activity size={20} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {loansLoading ? "..." : loanSummary.pending}
                    </div>
                    <div className="stat-label">Pending</div>
                  </div>
                </div>

                <div className="quick-stat">
                  <div className="stat-icon borrowed-amount">
                    <DollarSign size={20} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {loansLoading
                        ? "..."
                        : `$${loanSummary.totalBorrowed.toLocaleString()}`}
                    </div>
                    <div className="stat-label">Total Borrowed</div>
                  </div>
                </div>
              </div>

              <div className="loans-quick-actions">
                <button
                  className="quick-action-btn primary"
                  onClick={() => navigate("/loans")}
                >
                  <Plus size={16} />
                  Apply for New Loan
                </button>

                <button
                  className="quick-action-btn secondary"
                  onClick={() => navigate("/loans")}
                >
                  <Eye size={16} />
                  Manage Existing Loans
                </button>
              </div>
            </div>
          )}

          {/* Purchases Overview */}
          {isAuthenticated && (
            <div className="loans-overview">
              <div className="section-header">
                <h2 className="section-title">Your Purchases Overview</h2>
                <button className="btn-view-all" onClick={() => navigate('/loans')}>
                  <Eye size={16} />
                  View All Purchases
                </button>
              </div>
              
              <div className="loans-quick-stats">
                <div className="quick-stat">
                  <div className="stat-icon total-loans">
                    <CreditCard size={20} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{loansLoading ? '...' : loanSummary.total}</div>
                    <div className="stat-label">Total Purchases</div>
                  </div>
                </div>

                <div className="quick-stat">
                  <div className="stat-icon active-loans">
                    <TrendingUp size={20} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{loansLoading ? '...' : loanSummary.active}</div>
                    <div className="stat-label">Active Purchases</div>
                  </div>
                </div>

                <div className="quick-stat">
                  <div className="stat-icon pending-loans">
                    <Activity size={20} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{loansLoading ? '...' : loanSummary.pending}</div>
                    <div className="stat-label">Pending</div>
                  </div>
                </div>

                <div className="quick-stat">
                  <div className="stat-icon borrowed-amount">
                    <DollarSign size={20} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {loansLoading ? '...' : `$${loanSummary.totalBorrowed.toLocaleString()}`}
                    </div>
                    <div className="stat-label">Total Borrowed</div>
                  </div>
                </div>
              </div>

              <div className="loans-quick-actions">
                <button 
                  className="quick-action-btn primary"
                  onClick={() => navigate('/loans')}
                >
                  <Plus size={16} />
                  Apply for New Purchase
                </button>
                
                <button 
                  className="quick-action-btn secondary"
                  onClick={() => navigate('/loans')}
                >
                  <Eye size={16} />
                  Manage Existing Purchase
                </button>
              </div>
            </div>
          )}

          {/* Features Section */}
          {isAuthenticated ? (
            <div className="features-section">
              <h2 className="section-title">BNPL Features</h2>
              <div className="features-grid">
                {features.map((feature) => (
                  <div 
                    key={feature.id}
                    className={`feature-card ${activeFeature === feature.id ? 'active' : ''}`}
                    onMouseEnter={() => setActiveFeature(feature.id)}
                    onMouseLeave={() => setActiveFeature(null)}
                  >
                    <div className="feature-header">
                      <div className="feature-icon">{feature.icon}</div>
                      {feature.comingSoon && (
                        <div className="coming-soon-badge">
                          <Star size={12} />
                          <span>Soon</span>
                        </div>
                      )}
                    </div>
                    <div className="feature-content">
                      <h3 className="feature-title">{feature.title}</h3>
                      <p className="feature-description">{feature.description}</p>
                      <div className="feature-benefits">
                        {feature.benefits.map((benefit, index) => (
                          <div key={index} className="benefit-item">
                            <ArrowRight size={14} />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        className={`feature-btn ${feature.comingSoon ? "disabled" : ""}`}
                        disabled={feature.comingSoon}
                        onClick={feature.comingSoon ? undefined : feature.action}
                      >
                        {feature.comingSoon ? "Coming Soon" : "Get Started"}
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="auth-prompt">
              <div className="auth-prompt-content">
                <h2>Get Started with ForwarDefi</h2>
                <p>
                  Join thousands of users who trust ForwarDefi for their crypto lending needs. Sign up now to access exclusive BNPL features.
                </p>
                <div className="auth-benefits">
                  <div className="benefit">
                    <Shield size={20} />
                    <div>
                      <h4>Secure & Decentralized</h4>
                      <p>Built on Avalanche blockchain</p>
                    </div>
                  </div>
                  <div className="benefit">
                    <Zap size={20} />
                    <div>
                      <h4>Instant Processing</h4>
                      <p>Get loans approved in minutes</p>
                    </div>
                  </div>
                  <div className="benefit">
                    <Target size={20} />
                    <div>
                      <h4>Competitive Rates</h4>
                      <p>Best rates in DeFi market</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
