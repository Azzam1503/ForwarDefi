import React, { useState, useEffect } from 'react';
import { loanApi } from '../../services/api';
import * as LoanTypes from '../../types/loan';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Shield, 
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  RefreshCw,
  Edit3,
  Trash2,
  Download
} from 'lucide-react';
import '../../styles/loan-details.css';

interface LoanDetailsProps {
  loanId: string;
  onBack?: () => void;
  onEdit?: (loan: Loan) => void;
  onDelete?: (loanId: string) => void;
}

const LoanDetails: React.FC<LoanDetailsProps> = ({ loanId, onBack, onEdit, onDelete }) => {
  const [loan, setLoan] = useState<LoanTypes.Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLoanDetails();
  }, [loanId]);

  const fetchLoanDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await loanApi.getLoanById(loanId);
      setLoan(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch loan details');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLoanDetails();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPercentage = (rate: number): string => {
    return `${Number(rate).toFixed(2)}%`;
  };

  const getStatusIcon = (status: LoanTypes.LoanStatus) => {
    switch (status) {
      case LoanTypes.LoanStatus.PENDING:
        return <Clock size={20} />;
      case LoanTypes.LoanStatus.APPROVED:
        return <CheckCircle size={20} />;
      case LoanTypes.LoanStatus.ACTIVE:
        return <TrendingUp size={20} />;
      case LoanTypes.LoanStatus.REPAID:
        return <CheckCircle size={20} />;
      case LoanTypes.LoanStatus.DEFAULTED:
        return <XCircle size={20} />;
      default:
        return <AlertCircle size={20} />;
    }
  };

  const calculateLoanMetrics = (loan: Loan) => {
    const monthlyRate = loan.interest_rate / 100 / 12;
    const estimatedTerm = 12; // Default term, could be stored in loan entity
    const monthlyPayment = (loan.amount * monthlyRate * Math.pow(1 + monthlyRate, estimatedTerm)) / (Math.pow(1 + monthlyRate, estimatedTerm) - 1);
    const totalAmount = monthlyPayment * estimatedTerm;
    const totalInterest = totalAmount - loan.amount;
    const collateralizationRatio = (loan.collateral_amount / loan.amount) * 100;

    return {
      monthlyPayment,
      totalAmount,
      totalInterest,
      collateralizationRatio,
      estimatedTerm,
    };
  };

  if (loading) {
    return (
      <div className="loan-details-loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <h3>Loading Purchase Details</h3>
          <p>Please wait while we fetch your loan information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loan-details-error">
        <div className="error-content">
          <AlertCircle size={48} />
          <h3>Error Loading Purchases</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button className="btn-primary" onClick={fetchLoanDetails}>
              Try Again
            </button>
            {onBack && (
              <button className="btn-secondary" onClick={onBack}>
                Go Back
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="loan-details-not-found">
        <div className="not-found-content">
          <FileText size={48} />
          <h3>Purchase Not Found</h3>
          <p>The requested loan could not be found.</p>
          {onBack && (
            <button className="btn-primary" onClick={onBack}>
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  const metrics = calculateLoanMetrics(loan);

  return (
    <div className="loan-details">
      {/* Breadcrumb Navigation */}
      <div className="loan-details-breadcrumb">
        <div className="breadcrumb-content">
          <span className="breadcrumb-item">Purchase</span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-item active">Purchase Details</span>
        </div>
      </div>

      {/* Header Section */}
      <div className="loan-details-header">
        <div className="header-content">
          <div className="header-info">
            <div className="header-nav">
              {onBack && (
                <button className="btn-back" onClick={onBack}>
                  <ArrowLeft size={16} />
                  Back to Purchases
                </button>
              )}
            </div>
            
            <div className="header-main">
              <h1 className="header-title">Purchase Details</h1>
              <div className="loan-meta">
                <span className="loan-id">ID: {loan.loan_id.slice(0, 8)}...</span>
                <div 
                  className="status-badge large"
                  style={{
                    backgroundColor: LoanTypes.LoanStatusColors[loan.status].bg,
                    color: LoanTypes.LoanStatusColors[loan.status].color,
                  }}
                >
                  {getStatusIcon(loan.status)}
                  {LoanTypes.LoanStatusColors[loan.status].text}
                </div>
              </div>
            </div>
          </div>

          <div className="header-actions">
            <button 
              className="btn-refresh" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
              Refresh
            </button>
            
            {onEdit && loan.status === LoanTypes.LoanStatus.PENDING && (
              <button className="btn-secondary" onClick={() => onEdit(loan)}>
                <Edit3 size={16} />
                Edit
              </button>
            )}
            
            <button className="btn-secondary">
              <Download size={16} />
              Export
            </button>

            {onDelete && loan.status === LoanTypes.LoanStatus.PENDING && (
              <button 
                className="btn-danger" 
                onClick={() => onDelete(loan.loan_id)}
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="loan-details-content">
        <div className="details-grid">
          {/* Loan Overview Card */}
          <div className="details-card loan-overview">
            <div className="card-header">
              <DollarSign size={20} />
              <h3>Purchase Overview</h3>
            </div>
            
            <div className="card-content">
              <div className="overview-hero">
                <div className="hero-amount">
                  <span className="amount-label">Purchase Amount</span>
                  <span className="amount-value">{formatCurrency(loan.amount)}</span>
                </div>
                <div className="hero-rate">
                  <span className="rate-label">Interest Rate</span>
                  <span className="rate-value">{formatPercentage(loan.interest_rate)}</span>
                </div>
              </div>
              
              <div className="overview-details">
                <div className="detail-row">
                  <div className="detail-item">
                    <span className="detail-label">Monthly Payment</span>
                    <span className="detail-value">{formatCurrency(metrics.monthlyPayment)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Amount</span>
                    <span className="detail-value">{formatCurrency(metrics.totalAmount)}</span>
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-item">
                    <span className="detail-label">Total Interest</span>
                    <span className="detail-value">{formatCurrency(metrics.totalInterest)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Term</span>
                    <span className="detail-value">{metrics.estimatedTerm} months</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collateral Information */}
          <div className="details-card collateral-info">
            <div className="card-header">
              <Shield size={20} />
              <h3>Collateral Details</h3>
            </div>
            
            <div className="card-content">
              <div className="collateral-hero">
                <div className="collateral-amount">
                  <span className="amount-label">Collateral Amount</span>
                  <span className="amount-value">{formatCurrency(loan.collateral_amount)}</span>
                </div>
                <div className="collateral-ratio">
                  <span className="ratio-label">Collateralization Ratio</span>
                  <span className="ratio-value">{Number(metrics.collateralizationRatio).toFixed(0)}%</span>
                </div>
              </div>
              
              <div className="collateral-details">
                <div className="detail-item">
                  <span className="detail-label">Collateral Type</span>
                  <span className="detail-value">Crypto Assets</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Risk Level</span>
                  <span className={`detail-value risk-${metrics.collateralizationRatio >= 150 ? 'low' : metrics.collateralizationRatio >= 120 ? 'medium' : 'high'}`}>
                    {metrics.collateralizationRatio >= 150 ? 'Low' : 
                     metrics.collateralizationRatio >= 120 ? 'Medium' : 'High'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="details-card timeline-card">
            <div className="card-header">
              <Calendar size={20} />
              <h3>Purchase Timeline</h3>
            </div>
            
            <div className="card-content">
              <div className="timeline">
                <div className="timeline-item completed">
                  <div className="timeline-marker">
                    <CheckCircle size={16} />
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-title">Application Submitted</div>
                    <div className="timeline-date">{formatDate(loan.created_at)}</div>
                  </div>
                </div>

                {loan.status !== LoanTypes.LoanStatus.PENDING && (
                  <div className="timeline-item completed">
                    <div className="timeline-marker">
                      <CheckCircle size={16} />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-title">Application Reviewed</div>
                      <div className="timeline-date">{formatDate(loan.updated_at)}</div>
                    </div>
                  </div>
                )}

                {loan.status === LoanTypes.LoanStatus.APPROVED && (
                  <div className="timeline-item pending">
                    <div className="timeline-marker">
                      <Clock size={16} />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-title">Awaiting Activation</div>
                      <div className="timeline-date">Pending</div>
                    </div>
                  </div>
                )}

                {loan.status === LoanTypes.LoanStatus.ACTIVE && (
                  <div className="timeline-item active">
                    <div className="timeline-marker">
                      <TrendingUp size={16} />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-title">Purchase Active</div>
                      <div className="timeline-date">In Progress</div>
                    </div>
                  </div>
                )}

                {loan.status === LoanTypes.LoanStatus.REPAID && (
                  <div className="timeline-item completed">
                    <div className="timeline-marker">
                      <CheckCircle size={16} />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-title">Purchase Repaid</div>
                      <div className="timeline-date">{formatDate(loan.updated_at)}</div>
                    </div>
                  </div>
                )}

                {loan.status === LoanTypes.LoanStatus.DEFAULTED && (
                  <div className="timeline-item failed">
                    <div className="timeline-marker">
                      <XCircle size={16} />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-title">Purchase Defaulted</div>
                      <div className="timeline-date">{formatDate(loan.updated_at)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions & Next Steps */}
          <div className="details-card actions-card">
            <div className="card-header">
              <AlertCircle size={20} />
              <h3>Actions & Next Steps</h3>
            </div>
            
            <div className="card-content">
              <div className="actions-list">
                {loan.status === LoanTypes.LoanStatus.PENDING && (
                  <>
                    <div className="action-item">
                      <div className="action-icon pending">
                        <Clock size={16} />
                      </div>
                      <div className="action-content">
                        <div className="action-title">Under Review</div>
                        <div className="action-description">
                          Your purchase application is being reviewed. You'll be notified of the decision soon.
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {loan.status === LoanTypes.LoanStatus.APPROVED && (
                  <div className="action-item">
                    <div className="action-icon approved">
                      <CheckCircle size={16} />
                    </div>
                    <div className="action-content">
                      <div className="action-title">Purchase Approved</div>
                      <div className="action-description">
                        Congratulations! Your purchase has been approved. Funds will be disbursed soon.
                      </div>
                    </div>
                  </div>
                )}

                {loan.status === LoanTypes.LoanStatus.ACTIVE && (
                  <div className="action-item">
                    <div className="action-icon active">
                      <TrendingUp size={16} />
                    </div>
                    <div className="action-content">
                      <div className="action-title">Make Payment</div>
                      <div className="action-description">
                        Your purchase is active. Make your monthly payments to stay on track.
                      </div>
                    </div>
                    <button className="action-button">
                      Make Payment
                    </button>
                  </div>
                )}

                {loan.status === LoanTypes.LoanStatus.REPAID && (
                  <div className="action-item">
                    <div className="action-icon completed">
                      <CheckCircle size={16} />
                    </div>
                    <div className="action-content">
                      <div className="action-title">Purchase Completed</div>
                      <div className="action-description">
                        Congratulations! You've successfully repaid this purchase.
                      </div>
                    </div>
                  </div>
                )}

                {loan.status === LoanTypes.LoanStatus.DEFAULTED && (
                  <div className="action-item">
                    <div className="action-icon failed">
                      <XCircle size={16} />
                    </div>
                    <div className="action-content">
                      <div className="action-title">Purchase Defaulted</div>
                      <div className="action-description">
                        This purchase has been marked as defaulted. Contact support for assistance.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanDetails;
