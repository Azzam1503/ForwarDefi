import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, BarChart3, TrendingUp, Calendar, FileText } from 'lucide-react';

const History: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="history-container">
      {/* Header */}
      <div className="history-header">
        <div className="header-content">
          <div className="header-info">
            <div className="header-nav">
              <button className="btn-back" onClick={() => navigate('/')}>
                <ArrowLeft size={16} />
                Back to Dashboard
              </button>
            </div>
            <div className="header-main">
              <h1 className="header-title">Payment History</h1>
              <p className="header-subtitle">
                Track your payment history and monitor your credit score improvement
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="coming-soon-content">
        <div className="coming-soon-card">
          <div className="coming-soon-icon">
            <Clock size={64} />
          </div>
          <h2 className="coming-soon-title">Coming Soon</h2>
          <p className="coming-soon-description">
            We're working hard to bring you comprehensive payment history tracking and analytics.
            This feature will include detailed payment records, credit score monitoring, and performance insights.
          </p>
          
          <div className="feature-preview">
            <h3>What to expect:</h3>
            <div className="feature-grid">
              <div className="feature-item">
                <div className="feature-icon">
                  <BarChart3 size={24} />
                </div>
                <div className="feature-content">
                  <h4>Payment Analytics</h4>
                  <p>Detailed insights into your payment patterns and trends</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="feature-content">
                  <h4>Credit Scoring</h4>
                  <p>Monitor your credit score improvement over time</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">
                  <Calendar size={24} />
                </div>
                <div className="feature-content">
                  <h4>Payment Calendar</h4>
                  <p>Visual timeline of all your payment activities</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">
                  <FileText size={24} />
                </div>
                <div className="feature-content">
                  <h4>Transaction Reports</h4>
                  <p>Generate detailed reports for your records</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="coming-soon-actions">
            <button className="btn-primary" onClick={() => navigate('/')}>
              Back to Dashboard
            </button>
            <button className="btn-secondary" onClick={() => navigate('/loans')}>
              View My Purchases
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;
