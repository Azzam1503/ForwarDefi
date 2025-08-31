import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class AvalancheTransactionDto {
  @IsString()
  blockNumber: string;

  @IsString()
  timeStamp: string;

  @IsString()
  hash: string;

  @IsString()
  nonce: string;

  @IsString()
  blockHash: string;

  @IsString()
  transactionIndex: string;

  @IsString()
  from: string;

  @IsString()
  to: string;

  @IsString()
  value: string;

  @IsString()
  gas: string;

  @IsString()
  gasPrice: string;

  @IsString()
  isError: string;

  @IsString()
  txreceipt_status: string;

  @IsString()
  input: string;

  @IsString()
  contractAddress: string;

  @IsString()
  cumulativeGasUsed: string;

  @IsString()
  gasUsed: string;

  @IsString()
  confirmations: string;

  @IsString()
  methodId: string;

  @IsString()
  functionName: string;
}

export class AvalancheTransactionResponseDto {
  @IsString()
  status: string;

  @IsString()
  message: string;

  @IsOptional()
  result?: AvalancheTransactionDto[];
}

export class TransactionSummaryDto {
  @IsString()
  walletAddress: string;

  @IsNumber()
  totalTransactions: number;

  @IsString()
  dateRange: string;

  @IsNumber()
  totalValue: number;

  @IsString()
  currency: string;

  @IsOptional()
  transactions?: AvalancheTransactionDto[];
}
