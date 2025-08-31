import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Correlation } from 'src/core/correlation/correlation.decorator';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Correlation() correlation_id: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionService.create(correlation_id, createTransactionDto);
  }

  @Get()
  findAll(@Correlation() correlation_id: string) {
    return this.transactionService.findAll(correlation_id);
  }

  @Get(':id')
  findOne(@Correlation() correlation_id: string, @Param('id') id: string) {
    return this.transactionService.findOne(correlation_id, id);
  }

  @Get('user/:userId')
  findByUserId(
    @Correlation() correlation_id: string,
    @Param('userId') userId: string,
  ) {
    return this.transactionService.findByUserId(correlation_id, userId);
  }

  @Get('loan/:loanId')
  findByLoanId(
    @Correlation() correlation_id: string,
    @Param('loanId') loanId: string,
  ) {
    return this.transactionService.findByLoanId(correlation_id, loanId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Correlation() correlation_id: string, @Param('id') id: string) {
    return this.transactionService.remove(correlation_id, id);
  }
}
