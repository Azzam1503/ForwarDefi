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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new transaction',
    description: 'Create a new transaction record',
  })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Validation failed',
  })
  create(
    @Correlation() correlation_id: string,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionService.create(correlation_id, createTransactionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all transactions',
    description: 'Retrieve all transactions in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all transactions',
  })
  findAll(@Correlation() correlation_id: string) {
    return this.transactionService.findAll(correlation_id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get transaction by ID',
    description: 'Retrieve a specific transaction by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Transaction ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction found successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  findOne(@Correlation() correlation_id: string, @Param('id') id: string) {
    return this.transactionService.findOne(correlation_id, id);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get transactions by user ID',
    description: 'Retrieve all transactions for a specific user',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user transactions',
  })
  findByUserId(
    @Correlation() correlation_id: string,
    @Param('userId') userId: string,
  ) {
    return this.transactionService.findByUserId(correlation_id, userId);
  }

  @Get('loan/:loanId')
  @ApiOperation({
    summary: 'Get transactions by loan ID',
    description: 'Retrieve all transactions for a specific loan',
  })
  @ApiParam({
    name: 'loanId',
    description: 'Loan ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'List of loan transactions',
  })
  findByLoanId(
    @Correlation() correlation_id: string,
    @Param('loanId') loanId: string,
  ) {
    return this.transactionService.findByLoanId(correlation_id, loanId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete transaction',
    description: 'Delete a transaction by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Transaction ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 204,
    description: 'Transaction deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  remove(@Correlation() correlation_id: string, @Param('id') id: string) {
    return this.transactionService.remove(correlation_id, id);
  }
}
