import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class CreateLoanDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  interest_rate: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  collateral_amount: number;
}
