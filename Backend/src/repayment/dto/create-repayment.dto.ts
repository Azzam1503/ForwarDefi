import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateRepaymentDto {
  @IsNotEmpty()
  @IsString()
  loan_id: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount: number;

  @IsNotEmpty()
  @IsDateString()
  due_date: string;
}
