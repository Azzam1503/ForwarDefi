import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAccount, useBalance } from 'wagmi';
import { loanApi } from '../../services/api';
import * as LoanTypes from '../../types/loan';
import { 
  DollarSign, 
  Calculator, 
  Shield, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  ArrowRight,
  Wallet,
  Target
} from 'lucide-react';
import '../../styles/loan-application.css';

interface LoanApplicationFormProps {
  onSuccess?: (loanId: string) => void;
  onCancel?: () => void;
}

const LoanApplicationForm: React.FC<LoanApplicationFormProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });

  const [step, setStep] = useState<'form' | 'calculation' | 'review' | 'submitting'>('form');
  const [formData, setFormData] = useState<LoanTypes.LoanFormData>({
    amount: '',
    requestedTerm: '12',
    purpose: 'Personal Expense',
    collateralAmount: '',
    collateralRatio: '40' // Default to 40%
  });

  const [calculation, setCalculation] = useState<LoanTypes.LoanCalculation | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Calculate loan terms in real-time
  useEffect(() => {
    if (formData.amount && formData.requestedTerm && formData.collateralRatio) {
      const amount = parseFloat(formData.amount);
      const term = parseInt(formData.requestedTerm);
      const collateralRatio = parseFloat(formData.collateralRatio) / 100; // Convert percentage to decimal
      const collateral = amount * collateralRatio;

      if (amount > 0 && term > 0 && collateralRatio > 0) {
        // Interest calculation based on collateral ratio
        const baseRate = 5.5; // 5.5% base rate
        const riskAdjustment = amount > 10000 ? 1 : 0; // Higher amounts = higher rate
        
        // Lower collateral ratio = higher interest rate
        let collateralAdjustment = 0;
        if (collateralRatio === 0.3) { // 30% collateral
          collateralAdjustment = 1.5; // Higher rate
        } else if (collateralRatio === 0.4) { // 40% collateral
          collateralAdjustment = 0.5; // Medium rate
        } else if (collateralRatio === 0.5) { // 50% collateral
          collateralAdjustment = 0; // Lower rate
        }
        
        const interestRate = baseRate + riskAdjustment + collateralAdjustment;
        const monthlyRate = interestRate / 100 / 12;
        const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
        const totalAmount = monthlyPayment * term;
        const totalInterest = totalAmount - amount;

        setCalculation({
          loanAmount: amount,
          interestRate: interestRate,
          termMonths: term,
          monthlyPayment: monthlyPayment,
          totalInterest: totalInterest,
          totalAmount: totalAmount,
          collateralRequired: collateral
        });
      }
    }
  }, [formData.amount, formData.requestedTerm, formData.collateralRatio]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Amount validation
    const amount = parseFloat(formData.amount);
    if (!formData.amount || amount <= 0) {
      newErrors.amount = 'Please enter a valid loan amount';
    } else if (amount < 100) {
      newErrors.amount = 'Minimum loan amount is $100';
    } else if (amount > 100000) {
      newErrors.amount = 'Maximum loan amount is $100,000';
    }

    // Collateral validation
    const collateralRatio = parseFloat(formData.collateralRatio);
    if (!formData.collateralRatio || collateralRatio <= 0) {
      newErrors.collateralRatio = 'Please select a collateral ratio';
    } else if (collateralRatio < 30 || collateralRatio > 50) {
      newErrors.collateralRatio = 'Collateral ratio must be between 30% and 50%';
    }

    // Term validation
    const term = parseInt(formData.requestedTerm);
    if (term < 1 || term > 60) {
      newErrors.requestedTerm = 'Loan term must be between 1 and 60 months';
    }

    // Wallet validation
    if (!address) {
      newErrors.wallet = 'Please connect your wallet to proceed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoanTypes.LoanFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleNext = () => {
    if (step === 'form') {
      if (validateForm()) {
        setStep('calculation');
      }
    } else if (step === 'calculation') {
      setStep('review');
    }
  };

  const handleSubmit = async () => {
    if (!user || !calculation) return;

    setStep('submitting');
    setLoading(true);
    setSubmitError('');

    try {
      const loanRequest: LoanTypes.CreateLoanRequest = {
        user_id: user.id,
        amount: calculation.loanAmount,
        interest_rate: calculation.interestRate,
        collateral_amount: calculation.collateralRequired
      };

      const response = await loanApi.createLoan(loanRequest);
      
      if (onSuccess) {
        onSuccess(response.data.loan_id);
      }
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to submit loan application');
      setStep('review');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (rate: number): string => {
    return `${rate.toFixed(2)}%`;
  };

  return (
    <div className="loan-application-form">
      <div className="form-header">
        <h2>Apply for a Purchase</h2>
        <p>Get instant access to crypto-backed lending</p>
        
        <div className="progress-steps">
          <div className={`step ${step === 'form' ? 'active' : step !== 'form' ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <span>Purchase Details</span>
          </div>
          <div className={`step ${step === 'calculation' ? 'active' : step === 'review' || step === 'submitting' ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <span>Calculate Terms</span>
          </div>
          <div className={`step ${step === 'review' || step === 'submitting' ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Review & Submit</span>
          </div>
        </div>
      </div>

      <div className="form-content">
        {step === 'form' && (
          <div className="form-step">
            <h3>Loan Application Details</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="amount">
                  <DollarSign size={16} />
                  Purchase Amount (USD)
                </label>
                <input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="Enter amount (min $100)"
                  min="100"
                  max="100000"
                  step="0.01"
                />
                {errors.amount && <span className="error-text">{errors.amount}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="term">
                  <Clock size={16} />
                  Purchase Term (Months)
                </label>
                <select
                  id="term"
                  value={formData.requestedTerm}
                  onChange={(e) => handleInputChange('requestedTerm', e.target.value)}
                >
                  {[3, 6, 12, 18, 24, 36, 48, 60].map(months => (
                    <option key={months} value={months}>
                      {months} months
                    </option>
                  ))}
                </select>
                {errors.requestedTerm && <span className="error-text">{errors.requestedTerm}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="collateral">
                  <Shield size={16} />
                  Collateral Ratio
                </label>
                <div className="collateral-ratio-info">
                  <div 
                    className={`ratio-option ${formData.collateralRatio === '30' ? 'selected' : ''}`}
                    onClick={() => handleInputChange('collateralRatio', '30')}
                  >
                    <div>
                      <div className="ratio-percentage">30%</div>
                      <div className="ratio-description">Lower collateral requirement</div>
                    </div>
                    <div className="ratio-rate">+1.5% rate</div>
                  </div>
                  <div 
                    className={`ratio-option ${formData.collateralRatio === '40' ? 'selected' : ''}`}
                    onClick={() => handleInputChange('collateralRatio', '40')}
                  >
                    <div>
                      <div className="ratio-percentage">40%</div>
                      <div className="ratio-description">Balanced option</div>
                    </div>
                    <div className="ratio-rate">+0.5% rate</div>
                  </div>
                  <div 
                    className={`ratio-option ${formData.collateralRatio === '50' ? 'selected' : ''}`}
                    onClick={() => handleInputChange('collateralRatio', '50')}
                  >
                    <div>
                      <div className="ratio-percentage">50%</div>
                      <div className="ratio-description">Higher collateral requirement</div>
                    </div>
                    <div className="ratio-rate">Base rate</div>
                  </div>
                </div>
                {errors.collateralRatio && <span className="error-text">{errors.collateralRatio}</span>}
                <div className="help-text">
                  Lower collateral ratio = higher interest rate. Select based on your preference.
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="purpose">
                  <Target size={16} />
                  Purpose
                </label>
                <select
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => handleInputChange('purpose', e.target.value)}
                >
                  {LoanTypes.LoanPurposes.map(purpose => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Wallet Status */}
            <div className="wallet-status">
              <div className="status-header">
                <Wallet size={20} />
                <span>Wallet Status</span>
              </div>
              {address ? (
                <div className="wallet-connected">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Wallet Connected</span>
                  <div className="wallet-details">
                    <span>Balance: {balance ? `${Number(balance.formatted).toFixed(4)} ${balance.symbol}` : '0 AVAX'}</span>
                  </div>
                </div>
              ) : (
                <div className="wallet-disconnected">
                  <AlertCircle size={16} className="text-red-500" />
                  <span>Wallet Not Connected</span>
                </div>
              )}
              {errors.wallet && <span className="error-text">{errors.wallet}</span>}
            </div>
          </div>
        )}

        {step === 'calculation' && calculation && (
          <div className="calculation-step">
            <h3>Purchase Calculation</h3>
            
            <div className="calculation-grid">
              <div className="calc-card primary">
                <div className="calc-header">
                  <Calculator size={20} />
                  <span>Monthly Payment</span>
                </div>
                <div className="calc-value">{formatCurrency(calculation.monthlyPayment)}</div>
              </div>

              <div className="calc-card">
                <div className="calc-header">
                  <TrendingUp size={20} />
                  <span>Interest Rate</span>
                </div>
                <div className="calc-value">{formatPercentage(calculation.interestRate)}</div>
              </div>

              <div className="calc-card">
                <div className="calc-header">
                  <DollarSign size={20} />
                  <span>Total Interest</span>
                </div>
                <div className="calc-value">{formatCurrency(calculation.totalInterest)}</div>
              </div>

              <div className="calc-card">
                <div className="calc-header">
                  <Shield size={20} />
                  <span>Collateral Required</span>
                </div>
                <div className="calc-value">{formatCurrency(calculation.collateralRequired)}</div>
              </div>
            </div>

            <div className="loan-summary">
              <h4>Purchase Summary</h4>
              <div className="summary-items">
                <div className="summary-item">
                  <span>Purchase Amount:</span>
                  <span>{formatCurrency(calculation.loanAmount)}</span>
                </div>
                <div className="summary-item">
                  <span>Term:</span>
                  <span>{calculation.termMonths} months</span>
                </div>
                <div className="summary-item">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(calculation.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'review' && calculation && (
          <div className="review-step">
            <h3>Review Your Application</h3>
            
            <div className="review-sections">
              <div className="review-section">
                <h4>Application Details</h4>
                <div className="review-items">
                  <div className="review-item">
                    <span>Purpose:</span>
                    <span>{formData.purpose}</span>
                  </div>
                  <div className="review-item">
                    <span>Requested Amount:</span>
                    <span>{formatCurrency(calculation.loanAmount)}</span>
                  </div>
                  <div className="review-item">
                    <span>Term:</span>
                    <span>{calculation.termMonths} months</span>
                  </div>
                </div>
              </div>

              <div className="review-section">
                <h4>Purchase Terms</h4>
                <div className="review-items">
                  <div className="review-item">
                    <span>Interest Rate:</span>
                    <span>{formatPercentage(calculation.interestRate)}</span>
                  </div>
                  <div className="review-item">
                    <span>Monthly Payment:</span>
                    <span>{formatCurrency(calculation.monthlyPayment)}</span>
                  </div>
                  <div className="review-item">
                    <span>Total Interest:</span>
                    <span>{formatCurrency(calculation.totalInterest)}</span>
                  </div>
                  <div className="review-item total">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(calculation.totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="review-section">
                <h4>Collateral</h4>
                <div className="review-items">
                  <div className="review-item">
                    <span>Collateral Ratio:</span>
                    <span>{formData.collateralRatio}%</span>
                  </div>
                  <div className="review-item">
                    <span>Required Collateral:</span>
                    <span>{formatCurrency(calculation.collateralRequired)}</span>
                  </div>
                  <div className="review-item">
                    <span>Interest Rate Impact:</span>
                    <span>
                      {formData.collateralRatio === '30' ? 'Higher Rate (+1.5%)' :
                       formData.collateralRatio === '40' ? 'Medium Rate (+0.5%)' :
                       'Lower Rate (Base)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {submitError && (
              <div className="error-message">
                <AlertCircle size={16} />
                {submitError}
              </div>
            )}
          </div>
        )}

        {step === 'submitting' && (
          <div className="submitting-step">
            <div className="submitting-content">
              <div className="spinner"></div>
              <h3>Submitting Your Application</h3>
              <p>Please wait while we process your purchase application...</p>
            </div>
          </div>
        )}
      </div>

      <div className="form-actions">
        {step === 'form' && (
          <>
            {onCancel && (
              <button type="button" className="btn-secondary" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button type="button" className="btn-primary" onClick={handleNext}>
              Calculate Terms
              <ArrowRight size={16} />
            </button>
          </>
        )}

        {step === 'calculation' && (
          <>
            <button type="button" className="btn-secondary" onClick={() => setStep('form')}>
              Back
            </button>
            <button type="button" className="btn-primary" onClick={handleNext}>
              Review Application
              <ArrowRight size={16} />
            </button>
          </>
        )}

        {step === 'review' && (
          <>
            <button type="button" className="btn-secondary" onClick={() => setStep('calculation')}>
              Back
            </button>
            <button 
              type="button" 
              className="btn-primary" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
              <ArrowRight size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LoanApplicationForm;
