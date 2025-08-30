import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import {
  TransactionType,
  TransactionSubtype,
} from '../entities/transaction.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'User ID for the transaction',
    example: 'uuid-string',
  })
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({
    description: 'Loan ID (optional)',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  @IsString()
  loan_id?: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: TransactionType,
    example: TransactionType.LOAN_DISBURSEMENT,
  })
  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    description: 'Transaction subtype (CREDIT or DEBIT)',
    enum: TransactionSubtype,
    example: TransactionSubtype.CREDIT,
  })
  @IsNotEmpty()
  @IsEnum(TransactionSubtype)
  subtype: TransactionSubtype;

  @ApiProperty({
    description: 'Transaction amount in AVAX',
    example: 100.0,
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Blockchain transaction hash (optional)',
    example: '0x1234567890abcdef...',
    required: false,
  })
  @IsOptional()
  @IsString()
  tx_hash?: string;
}
