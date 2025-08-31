import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { loanApi } from '../../services/api';
import * as LoanTypes from '../../types/loan';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Eye, 
  Filter,
  Search,
  RefreshCw,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  MoreHorizontal
} from 'lucide-react';

interface PurchasesListProps {
  onCreatePurchase?: () => void;
  onViewPurchase?: (loanId: string) => void;
}

const PurchasesList: React.FC<PurchasesListProps> = ({ onCreatePurchase, onViewPurchase }) => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<LoanTypes.Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoanTypes.LoanStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (user) {
      fetchUserPurchases();
    }
  }, [user]);

  const fetchUserPurchases = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const response = await loanApi.getUserLoans(user.id);
      setLoans(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchUserPurchases();
  };

  const handleSort = (field: 'date' | 'amount' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedPurchases = useMemo(() => {
    return loans
      .filter(loan => {
        // Status filter
        if (statusFilter !== 'ALL' && loan.status !== statusFilter) {
          return false;
        }

        // Search filter
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          return (
            loan.loan_id.toLowerCase().includes(term) ||
            loan.amount.toString().includes(term) ||
            loan.status.toLowerCase().includes(term)
          );
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'date':
            comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            break;
          case 'amount':
            comparison = a.amount - b.amount;
            break;
          case 'status':
            comparison = a.status.localeCompare(b.status);
            break;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [loans, searchTerm, statusFilter, sortBy, sortOrder]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: LoanTypes.LoanStatus) => {
    switch (status) {
      case LoanTypes.LoanStatus.PENDING:
        return <Clock size={20} />;
      case LoanTypes.LoanStatus.APPROVED:
        return <CheckCircle size={16} />;
      case LoanTypes.LoanStatus.ACTIVE:
        return <TrendingUp size={16} />;
      case LoanTypes.LoanStatus.REPAID:
        return <CheckCircle size={16} />;
      case LoanTypes.LoanStatus.DEFAULTED:
        return <XCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const purchaseSummary = useMemo(() => {
    return {
      total: loans.length,
      active: loans.filter(l => l.status === LoanTypes.LoanStatus.ACTIVE).length,
      pending: loans.filter(l => l.status === LoanTypes.LoanStatus.PENDING).length,
      repaid: loans.filter(l => l.status === LoanTypes.LoanStatus.REPAID).length,
      totalPurchased: loans.reduce((sum, loan) => {
        if (loan.status === LoanTypes.LoanStatus.ACTIVE || loan.status === LoanTypes.LoanStatus.REPAID) {
          return sum + loan.amount;
        }
        return sum;
      }, 0),
    };
  }, [loans]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
  };

  if (!user) {
    return (
      <div className="loans-unauthorized">
        <div className="unauthorized-content">
          <AlertCircle size={48} />
          <h3>Authentication Required</h3>
          <p>Please sign in to view your purchases</p>
        </div>
      </div>
    );
  }

  return (
    <div className="loans-list">
      {/* Header Section */}
      <div className="loans-header">
        <div className="header-content">
          <h2>My Purchases</h2>
          <p>Manage your purchase applications and active purchases</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn-refresh" 
            onClick={handleRefresh} 
            disabled={loading}
            title="Refresh purchases"
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          {onCreatePurchase && (
            <button className="btn-primary" onClick={onCreatePurchase}>
              <Plus size={16} />
              New Purchase
            </button>
          )}
        </div>
      </div>

      {/* Purchase Summary Cards */}
      <div className="loans-summary">
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-icon total">
              <DollarSign size={24} />
            </div>
            <div className="summary-content">
              <div className="summary-value">{purchaseSummary.total}</div>
              <div className="summary-label">Total Purchases</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon active">
              <TrendingUp size={24} />
            </div>
            <div className="summary-content">
              <div className="summary-value">{purchaseSummary.active}</div>
              <div className="summary-label">Active Purchases</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon pending">
              <Clock size={24} />
            </div>
            <div className="summary-content">
              <div className="summary-value">{purchaseSummary.pending}</div>
              <div className="summary-label">Pending</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon borrowed">
              <DollarSign size={24} />
            </div>
            <div className="summary-content">
              <div className="summary-value">{formatCurrency(purchaseSummary.totalPurchased)}</div>
              <div className="summary-label">Total Purchased</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="loans-controls">
        <div className="search-section">
          <div className="search-input">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search purchases by ID, amount, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-group">
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LoanTypes.LoanStatus | 'ALL')}
            >
              <option value="ALL">All Status</option>
              {Object.values(LoanTypes.LoanStatus).map(status => (
                <option key={status} value={status}>
                  {LoanTypes.LoanStatusColors[status].text}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as 'date' | 'amount' | 'status');
                setSortOrder(order as 'asc' | 'desc');
              }}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
              <option value="status-asc">Status A-Z</option>
              <option value="status-desc">Status Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Purchases Content */}
      <div className="loans-content">
        {loading ? (
          <div className="loans-loading">
            <div className="spinner"></div>
            <p>Loading your purchases...</p>
          </div>
        ) : error ? (
          <div className="loans-error">
            <AlertCircle size={48} />
            <h3>Error Loading Purchases</h3>
            <p>{error}</p>
            <button className="btn-primary" onClick={handleRefresh}>
              Try Again
            </button>
          </div>
        ) : filteredAndSortedPurchases.length === 0 ? (
          <div className="loans-empty">
            {loans.length === 0 ? (
              <div className="empty-content">
                <DollarSign size={48} />
                <h3>No Purchases Yet</h3>
                <p>You haven't applied for any purchases yet. Get started with your first purchase application!</p>
                {onCreatePurchase && (
                  <button className="btn-primary" onClick={onCreatePurchase}>
                    <Plus size={16} />
                    Apply for Purchase
                  </button>
                )}
              </div>
            ) : (
              <div className="empty-content">
                <Filter size={48} />
                <h3>No Matching Purchases</h3>
                <p>No purchases match your current search and filter criteria.</p>
                <button 
                  className="btn-secondary" 
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="loans-grid">
            {filteredAndSortedPurchases.map((loan) => (
              <div key={loan.loan_id} className="loan-card">
                <div className="loan-header">
                  <div className="loan-id">
                    <span className="id-label">Purchase ID:</span>
                    <span className="id-value">{loan.loan_id.slice(0, 8)}...</span>
                  </div>
                  
                  <div className="loan-status">
                    <div 
                      className="status-badge"
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

                <div className="loan-content">
                  <div className="loan-amount">
                    <DollarSign size={20} />
                    <span className="amount-value">{formatCurrency(loan.amount)}</span>
                  </div>

                  <div className="loan-details">
                    <div className="detail-item">
                      <TrendingUp size={14} />
                      <span>Rate: {Number(loan.interest_rate).toFixed(2)}%</span>
                    </div>
                    <div className="detail-item">
                      <Calendar size={14} />
                      <span>Applied: {formatDate(loan.created_at)}</span>
                    </div>
                  </div>

                  <div className="collateral-info">
                    <span className="collateral-label">Collateral:</span>
                    <span className="collateral-value">{formatCurrency(loan.collateral_amount)}</span>
                  </div>
                </div>

                <div className="loan-actions">
                  {onViewPurchase && (
                    <button 
                      className="btn-view"
                      onClick={() => onViewPurchase(loan.loan_id)}
                      title="View purchase details"
                    >
                      <Eye size={14} />
                      View Details
                    </button>
                  )}
                  
                  <button className="btn-menu" title="More options">
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasesList;
