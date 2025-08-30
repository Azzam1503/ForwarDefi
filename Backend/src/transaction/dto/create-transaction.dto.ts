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

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @IsOptional()
  @IsString()
  loan_id?: string;

  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNotEmpty()
  @IsEnum(TransactionSubtype)
  subtype: TransactionSubtype;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  tx_hash?: string;
}
