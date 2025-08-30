import {
  IsEthereumAddress,
  IsNumberString,
  IsPositive,
  Min,
  IsOptional,
} from 'class-validator';

import { Transform, Type } from 'class-transformer';

export class CreateOrderDto {
  @IsNumberString()
  @Transform(({ value }) => String(value))
  purchaseAmount: string;

  @IsEthereumAddress()
  merchant: string;

  @IsNumberString()
  @Transform(({ value }) => String(value))
  dueInSeconds: string;

  @Min(1)
  @Type(() => Number)
  installments: number;
}

export class RepayInstallmentDto {
  @IsNumberString()
  orderId: string;

  @IsNumberString()
  amount: string;
}

export class QuoteDto {
  @IsNumberString()
  purchaseAmount: string;

  @IsEthereumAddress()
  buyer: string;
}

export class FundLiquidityDto {
  @IsNumberString()
  amount: string;
}

export class SetCreditScoreDto {
  @IsEthereumAddress()
  address: string;

  @Min(0)
  @Type(() => Number)
  score: number;
}

export class WithdrawLiquidityDto {
  @IsEthereumAddress()
  to: string;

  @IsNumberString()
  amount: string;
}

export class SetTierDto {
  @Min(0)
  @Type(() => Number)
  idx: number;

  @IsNumberString()
  minScore: string;

  @Min(0)
  @Type(() => Number)
  collateralBps: number;

  @Min(0)
  @Type(() => Number)
  feeBps: number;

  @IsNumberString()
  maxLoan: string;
}
