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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('repayments')
@Controller('repayments')
export class RepaymentController {
  constructor(private readonly repaymentService: RepaymentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new repayment',
    description: 'Create a new repayment schedule for a loan',
  })
  @ApiResponse({
    status: 201,
    description: 'Repayment created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Validation failed',
  })
  create(
    @Correlation() correlation_id: string,
    @Body() createRepaymentDto: CreateRepaymentDto,
  ) {
    return this.repaymentService.create(correlation_id, createRepaymentDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all repayments',
    description: 'Retrieve all repayments in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all repayments',
  })
  findAll(@Correlation() correlation_id: string) {
    return this.repaymentService.findAll(correlation_id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get repayment by ID',
    description: 'Retrieve a specific repayment by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Repayment ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'Repayment found successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Repayment not found',
  })
  findOne(@Correlation() correlation_id: string, @Param('id') id: string) {
    return this.repaymentService.findOne(correlation_id, id);
  }

  @Get('loan/:loanId')
  @ApiOperation({
    summary: 'Get repayments by loan ID',
    description: 'Retrieve all repayments for a specific loan',
  })
  @ApiParam({
    name: 'loanId',
    description: 'Loan ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'List of loan repayments',
  })
  findByLoanId(
    @Correlation() correlation_id: string,
    @Param('loanId') loanId: string,
  ) {
    return this.repaymentService.findByLoanId(correlation_id, loanId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update repayment',
    description: 'Update repayment details',
  })
  @ApiParam({
    name: 'id',
    description: 'Repayment ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'Repayment updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Repayment not found',
  })
  update(
    @Correlation() correlation_id: string,
    @Param('id') id: string,
    @Body() updateRepaymentDto: UpdateRepaymentDto,
  ) {
    return this.repaymentService.update(correlation_id, id, updateRepaymentDto);
  }

  @Patch(':id/mark-paid')
  @ApiOperation({
    summary: 'Mark repayment as paid',
    description: 'Mark a repayment as paid and set the paid date',
  })
  @ApiParam({
    name: 'id',
    description: 'Repayment ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'Repayment marked as paid successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Repayment not found',
  })
  markAsPaid(@Correlation() correlation_id: string, @Param('id') id: string) {
    return this.repaymentService.markAsPaid(correlation_id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete repayment',
    description: 'Delete a repayment by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Repayment ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 204,
    description: 'Repayment deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Repayment not found',
  })
  remove(@Correlation() correlation_id: string, @Param('id') id: string) {
    return this.repaymentService.remove(correlation_id, id);
  }
}
