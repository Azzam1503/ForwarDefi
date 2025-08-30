import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RepaymentService } from './repayment.service';
import { CreateRepaymentDto } from './dto/create-repayment.dto';
import { UpdateRepaymentDto } from './dto/update-repayment.dto';
import { Correlation } from 'src/core/correlation/correlation.decorator';

@Controller('repayments')
export class RepaymentController {
  constructor(private readonly repaymentService: RepaymentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Correlation() correlation_id: string,
    @Body() createRepaymentDto: CreateRepaymentDto,
  ) {
    return this.repaymentService.create(correlation_id, createRepaymentDto);
  }

  @Get()
  findAll(@Correlation() correlation_id: string) {
    return this.repaymentService.findAll(correlation_id);
  }

  @Get(':id')
  findOne(@Correlation() correlation_id: string, @Param('id') id: string) {
    return this.repaymentService.findOne(correlation_id, id);
  }

  @Get('loan/:loanId')
  findByLoanId(
    @Correlation() correlation_id: string,
    @Param('loanId') loanId: string,
  ) {
    return this.repaymentService.findByLoanId(correlation_id, loanId);
  }

  @Patch(':id')
  update(
    @Correlation() correlation_id: string,
    @Param('id') id: string,
    @Body() updateRepaymentDto: UpdateRepaymentDto,
  ) {
    return this.repaymentService.update(correlation_id, id, updateRepaymentDto);
  }

  @Patch(':id/mark-paid')
  markAsPaid(@Correlation() correlation_id: string, @Param('id') id: string) {
    return this.repaymentService.markAsPaid(correlation_id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Correlation() correlation_id: string, @Param('id') id: string) {
    return this.repaymentService.remove(correlation_id, id);
  }
}
