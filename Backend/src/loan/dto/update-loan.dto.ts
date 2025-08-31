import { PartialType } from '@nestjs/mapped-types';
import { CreateLoanDto } from './create-loan.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { LoanStatus } from '../entities/loan.entity';

export class UpdateLoanDto extends PartialType(CreateLoanDto) {
  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;
}
