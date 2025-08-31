import React from 'react';
import { CreditCard } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-logo">
          <CreditCard size={48} />
          <h1>ForwarDefi</h1>
        </div>
        
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        
        <p className="loading-text">Loading your crypto BNPL platform...</p>
        
        <div className="loading-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
      
      <div className="loading-background">
        <div className="loading-orb orb-1"></div>
        <div className="loading-orb orb-2"></div>
        <div className="loading-orb orb-3"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
