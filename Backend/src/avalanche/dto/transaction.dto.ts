import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AvalancheTransactionDto {
  @ApiProperty({
    description: 'Block number',
    example: '12345678',
  })
  @IsString()
  blockNumber: string;

  @ApiProperty({
    description: 'Transaction timestamp',
    example: '1640995200',
  })
  @IsString()
  timeStamp: string;

  @ApiProperty({
    description: 'Transaction hash',
    example: '0xabc123...',
  })
  @IsString()
  hash: string;

  @ApiProperty({
    description: 'Transaction nonce',
    example: '0',
  })
  @IsString()
  nonce: string;

  @ApiProperty({
    description: 'Block hash',
    example: '0xdef456...',
  })
  @IsString()
  blockHash: string;

  @ApiProperty({
    description: 'Transaction index in block',
    example: '0',
  })
  @IsString()
  transactionIndex: string;

  @ApiProperty({
    description: 'Sender address',
    example: '0x1234567890abcdef...',
  })
  @IsString()
  from: string;

  @ApiProperty({
    description: 'Recipient address',
    example: '0xfedcba0987654321...',
  })
  @IsString()
  to: string;

  @ApiProperty({
    description: 'Transaction value in Wei',
    example: '1000000000000000000',
  })
  @IsString()
  value: string;

  @ApiProperty({
    description: 'Gas limit',
    example: '21000',
  })
  @IsString()
  gas: string;

  @ApiProperty({
    description: 'Gas price in Wei',
    example: '25000000000',
  })
  @IsString()
  gasPrice: string;

  @ApiProperty({
    description: 'Error flag',
    example: '0',
  })
  @IsString()
  isError: string;

  @ApiProperty({
    description: 'Transaction receipt status',
    example: '1',
  })
  @IsString()
  txreceipt_status: string;

  @ApiProperty({
    description: 'Transaction input data',
    example: '0x',
  })
  @IsString()
  input: string;

  @ApiProperty({
    description: 'Contract address (if applicable)',
    example: '',
  })
  @IsString()
  contractAddress: string;

  @ApiProperty({
    description: 'Cumulative gas used',
    example: '21000',
  })
  @IsString()
  cumulativeGasUsed: string;

  @ApiProperty({
    description: 'Gas used',
    example: '21000',
  })
  @IsString()
  gasUsed: string;

  @ApiProperty({
    description: 'Number of confirmations',
    example: '100',
  })
  @IsString()
  confirmations: string;

  @ApiProperty({
    description: 'Method ID',
    example: '0x',
  })
  @IsString()
  methodId: string;

  @ApiProperty({
    description: 'Function name',
    example: '',
  })
  @IsString()
  functionName: string;
}

export class AvalancheTransactionResponseDto {
  @ApiProperty({
    description: 'API response status',
    example: '1',
  })
  @IsString()
  status: string;

  @ApiProperty({
    description: 'API response message',
    example: 'OK',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Array of transactions',
    type: [AvalancheTransactionDto],
    required: false,
  })
  @IsOptional()
  result?: AvalancheTransactionDto[];
}

export class TransactionSummaryDto {
  @ApiProperty({
    description: 'Wallet address',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsString()
  walletAddress: string;

  @ApiProperty({
    description: 'Total number of transactions',
    example: 25,
  })
  @IsNumber()
  totalTransactions: number;

  @ApiProperty({
    description: 'Date range of transactions',
    example: '2024-01-15 to 2024-04-15',
  })
  @IsString()
  dateRange: string;

  @ApiProperty({
    description: 'Total value of transactions in AVAX',
    example: 1250.75,
  })
  @IsNumber()
  totalValue: number;

  @ApiProperty({
    description: 'Currency of transactions',
    example: 'AVAX',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Array of transactions',
    type: [AvalancheTransactionDto],
    required: false,
  })
  @IsOptional()
  transactions?: AvalancheTransactionDto[];
}
