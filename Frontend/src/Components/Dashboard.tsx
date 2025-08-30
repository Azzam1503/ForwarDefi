import React from 'react';
import WalletInfo from "./Wallet/WalletInfo";
import ChainChecker from "./Wallet/ChainChecker";
import { useAuth } from '../contexts/AuthContext';
import ProtectedConnectButton from './ProtectedConnectButton';

const Dashboard: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome to ForwarDefi{isAuthenticated ? `, ${user?.username}` : ''}</h1>
        <p>Your decentralized Buy Now, Pay Later platform on Avalanche</p>
      </div>

      <div className="dashboard-content">
        <div className="wallet-section">
          <h2>Wallet Connection</h2>
          <ProtectedConnectButton />
          {isAuthenticated && (
            <>
              <ChainChecker />
              <WalletInfo />
            </>
          )}
        </div>

        {isAuthenticated ? (
          <div className="features-section">
            <h2>BNPL Features</h2>
            <div className="feature-cards">
              <div className="feature-card">
                <h3>Create Loan</h3>
                <p>Request a crypto loan with flexible payment terms</p>
                <button className="feature-btn" disabled>
                  Coming Soon
                </button>
              </div>
              
              <div className="feature-card">
                <h3>My Loans</h3>
                <p>View and manage your active loan agreements</p>
                <button className="feature-btn" disabled>
                  Coming Soon
                </button>
              </div>
              
              <div className="feature-card">
                <h3>Payment History</h3>
                <p>Track your payment history and credit score</p>
                <button className="feature-btn" disabled>
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="auth-prompt">
            <h2>Get Started</h2>
            <p>Sign up or sign in to access BNPL features and start managing your crypto loans.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
