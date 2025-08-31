import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsOptional,
  Min,
  Max,
  ValidateIf,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Custom validator for collateral amount
function IsValidCollateralAmount(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidCollateralAmount',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const loan = args.object as any;
          const loanAmount = loan.amount;
          const collateralAmount = value;

          if (!loanAmount || !collateralAmount) {
            return true; // Let other validators handle missing values
          }

          // Collateral must be less than loan amount
          if (collateralAmount >= loanAmount) {
            return false;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const loan = args.object as any;
          const loanAmount = loan.amount;
          return `Collateral amount must be less than loan amount (${loanAmount})`;
        },
      },
    });
  };
}

export class CreateLoanDto {
  @ApiProperty({
    description: 'User ID for the loan applicant',
    example: 'uuid-string',
  })
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({
    description:
      'Loan amount in AVAX (collateral must be less than this amount)',
    example: 1000.0,
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Interest rate percentage (0-100)',
    example: 5.5,
    minimum: 0,
    maximum: 100,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  interest_rate: number;

  @ApiProperty({
    description: 'Collateral amount in AVAX (must be less than loan amount)',
    example: 500.0,
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  @IsValidCollateralAmount({
    message: 'Collateral amount must be less than loan amount',
  })
  collateral_amount: number;

  @ApiProperty({
    description: 'Number of installments for the loan (default: 1)',
    example: 3,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  installments?: number;
}
