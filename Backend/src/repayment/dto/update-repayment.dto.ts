import { PartialType } from '@nestjs/mapped-types';
import { CreateRepaymentDto } from './create-repayment.dto';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { RepaymentStatus } from '../entities/repayment.entity';

export class UpdateRepaymentDto extends PartialType(CreateRepaymentDto) {
  @IsOptional()
  @IsEnum(RepaymentStatus)
  status?: RepaymentStatus;

  @IsOptional()
  @IsDateString()
  paid_date?: string;
}
