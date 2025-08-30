import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoanApplicationForm from './LoanApplicationForm';
import LoansList from './LoansList';
import LoanDetails from './LoanDetails';
import { 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  CreditCard
} from 'lucide-react';

type LoanView = 'list' | 'create' | 'details';

interface LoanState {
  view: LoanView;
  selectedLoanId?: string;
  message?: {
    type: 'success' | 'error';
    title: string;
    content: string;
  };
}

const Loans: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<LoanState>({
    view: 'list'
  });

  const handleCreateLoan = () => {
    setState(prev => ({
      ...prev,
      view: 'create',
      message: undefined
    }));
  };

  const handleViewLoan = (loanId: string) => {
    setState(prev => ({
      ...prev,
      view: 'details',
      selectedLoanId: loanId,
      message: undefined
    }));
  };

  const handleLoanCreated = (loanId: string) => {
    setState(prev => ({
      ...prev,
      view: 'details',
      selectedLoanId: loanId,
      message: {
        type: 'success',
        title: 'Application Submitted!',
        content: 'Your loan application has been submitted successfully and is now under review.'
      }
    }));
  };

  const handleBackToList = () => {
    setState(prev => ({
      ...prev,
      view: 'list',
      selectedLoanId: undefined,
      message: undefined
    }));
  };

  const handleCancelCreate = () => {
    setState(prev => ({
      ...prev,
      view: 'list',
      message: undefined
    }));
  };

  const handleDeleteLoan = async (loanId: string) => {
    // This would typically show a confirmation dialog
    try {
      // await loanApi.deleteLoan(loanId);
      setState(prev => ({
        ...prev,
        view: 'list',
        selectedLoanId: undefined,
        message: {
          type: 'success',
          title: 'Loan Deleted',
          content: 'The loan application has been deleted successfully.'
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        message: {
          type: 'error',
          title: 'Delete Failed',
          content: 'Failed to delete the loan application. Please try again.'
        }
      }));
    }
  };

  const dismissMessage = () => {
    setState(prev => ({
      ...prev,
      message: undefined
    }));
  };

  if (!isAuthenticated) {
    return (
      <div className="loans-unauthorized">
        <div className="unauthorized-content">
          <CreditCard size={64} />
          <h2>Authentication Required</h2>
          <p>Please sign in to access loan features and manage your applications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="loans-container">
      {/* Success/Error Messages */}
      {state.message && (
        <div className={`message-banner ${state.message.type}`}>
          <div className="message-content">
            <div className="message-icon">
              {state.message.type === 'success' ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
            </div>
            <div className="message-text">
              <div className="message-title">{state.message.title}</div>
              <div className="message-description">{state.message.content}</div>
            </div>
          </div>
          <button className="message-close" onClick={dismissMessage}>
            ×
          </button>
        </div>
      )}

      {/* Navigation Breadcrumb */}
      <div className="loans-breadcrumb">
        <div className="breadcrumb-content">
          <span className="breadcrumb-item">Loans</span>
          {state.view === 'create' && (
            <>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item active">New Application</span>
            </>
          )}
          {state.view === 'details' && (
            <>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item active">Loan Details</span>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="loans-main">
        {state.view === 'list' && (
          <LoansList
            onCreateLoan={handleCreateLoan}
            onViewLoan={handleViewLoan}
          />
        )}

        {state.view === 'create' && (
          <LoanApplicationForm
            onSuccess={handleLoanCreated}
            onCancel={handleCancelCreate}
          />
        )}

        {state.view === 'details' && state.selectedLoanId && (
          <LoanDetails
            loanId={state.selectedLoanId}
            onBack={handleBackToList}
            onDelete={handleDeleteLoan}
          />
        )}
      </div>
    </div>
  );
};

export default Loans;
