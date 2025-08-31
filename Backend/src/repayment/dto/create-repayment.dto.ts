import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRepaymentDto {
  @ApiProperty({
    description: 'Loan ID for the repayment',
    example: 'uuid-string',
  })
  @IsNotEmpty()
  @IsString()
  loan_id: string;

  @ApiProperty({
    description: 'Repayment amount in AVAX',
    example: 250.0,
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Due date for the repayment',
    example: '2024-12-31',
    format: 'date',
  })
  @IsNotEmpty()
  @IsDateString()
  due_date: string;
}
