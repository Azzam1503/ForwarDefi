import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BlockchainRepaymentDto {
  @ApiProperty({
    description: 'Blockchain order ID',
    example: 12345,
  })
  @IsNotEmpty()
  @IsNumber()
  orderId: number;

  @ApiProperty({
    description: 'Repayment amount in AVAX',
    example: 100.0,
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'User ID',
    example: 'uuid-string',
  })
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({
    description: 'Loan ID',
    example: 'uuid-string',
  })
  @IsNotEmpty()
  @IsString()
  loan_id: string;
}
