import { BigNumberish } from 'ethers';

export interface RawOrder {
  buyer: string;
  merchant: string;
  principal: BigNumberish;
  collateral: BigNumberish;
  totalFee: BigNumberish;
  createdAt: BigNumberish;
  dueAt: BigNumberish;
  installments: BigNumberish;
  nominalPrincipal: BigNumberish;
  nominalFee: BigNumberish;
  paidPrincipal: BigNumberish;
  paidFee: BigNumberish;
  paidInstallments: BigNumberish;
  closed: boolean;
}

export interface BNPLOrder {
  buyer: string;
  merchant: string;
  principal: string;
  collateral: string;
  totalFee: string;
  createdAt: string;
  dueAt: string;
  installments: string;
  nominalPrincipal: string;
  nominalFee: string;
  paidPrincipal: string;
  paidFee: string;
  paidInstallments: string;
  closed: boolean;
}

export interface BNPLTier {
  minScore: string;
  collateralBps: number;
  feeBps: number;
  maxLoan: string;
}

export interface QuoteResult {
  collateralRequired: string;
  totalFee: string;
}

export interface QuoteResponse {
  collateralRequired: BigNumberish;
  totalFee: BigNumberish;
}

export interface NetworkInfo {
  chainId: string;
  name: string;
  gasPrice: string;
}

export interface TransactionResult {
  success: boolean;
  transactionHash: string;
}

export interface OrderCreationResult {
  orderId: string;
  txHash: string;
}
