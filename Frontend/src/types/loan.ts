// Loan Type Definitions
// Matching backend entities and DTOs

export enum LoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  REPAID = 'REPAID',
  DEFAULTED = 'DEFAULTED',
}

export interface Loan {
  loan_id: string;
  user_id: string;
  amount: number;
  interest_rate: number;
  collateral_amount: number;
  status: LoanStatus;
  created_at: Date;
  updated_at: Date;
}

export interface CreateLoanRequest {
  user_id: string;
  amount: number;
  interest_rate: number;
  collateral_amount: number;
}

export interface UpdateLoanRequest {
  amount?: number;
  interest_rate?: number;
  collateral_amount?: number;
  status?: LoanStatus;
}

export interface LoanApiResponse {
  message: string;
  data: Loan;
}

export interface LoansApiResponse {
  message: string;
  data: Loan[];
}

// Frontend-specific types for UI
export interface LoanFormData {
  amount: string;
  requestedTerm: string; // Duration in months
  purpose: string;
  collateralAmount: string;
  collateralRatio: string; // Collateral ratio as percentage (30, 40, 50)
}

export interface LoanSummary {
  totalBorrowed: number;
  activeLoans: number;
  completedLoans: number;
  totalRepaid: number;
  creditScore: number | null;
  nextPaymentDue: Date | null;
}

export interface LoanCalculation {
  loanAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalInterest: number;
  totalAmount: number;
  collateralRequired: number;
}

// Status color mapping for UI
export const LoanStatusColors = {
  [LoanStatus.PENDING]: {
    bg: 'rgba(245, 158, 11, 0.2)',
    color: '#f59e0b',
    text: 'Pending Review'
  },
  [LoanStatus.APPROVED]: {
    bg: 'rgba(59, 130, 246, 0.2)',
    color: '#3b82f6',
    text: 'Approved'
  },
  [LoanStatus.ACTIVE]: {
    bg: 'rgba(16, 185, 129, 0.2)',
    color: '#10b981',
    text: 'Active'
  },
  [LoanStatus.REPAID]: {
    bg: 'rgba(34, 197, 94, 0.2)',
    color: '#22c55e',
    text: 'Repaid'
  },
  [LoanStatus.DEFAULTED]: {
    bg: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    text: 'Defaulted'
  },
} as const;

export const LoanPurposes = [
  'Personal Expense',
  'Business Investment',
  'Debt Consolidation',
  'Emergency Fund',
  'Education',
  'Home Improvement',
  'Vehicle Purchase',
  'Investment Opportunity',
  'Other'
] as const;

export type LoanPurpose = typeof LoanPurposes[number];
