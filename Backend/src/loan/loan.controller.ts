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
import { LoanService } from './loan.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanStatus } from './entities/loan.entity';
import { Correlation } from 'src/core/correlation/correlation.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('loans')
@Controller('loans')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new loan',
    description: 'Create a new loan application for a user',
  })
  @ApiResponse({
    status: 201,
    description: 'Loan created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Validation failed',
  })
  create(
    @Correlation() correlation_id: string,
    @Body() createLoanDto: CreateLoanDto,
  ) {
    return this.loanService.create(correlation_id, createLoanDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all loans',
    description: 'Retrieve all loans in the system',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all loans',
  })
  findAll(@Correlation() correlation_id: string) {
    return this.loanService.findAll(correlation_id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get loan by ID',
    description: 'Retrieve a specific loan by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Loan ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'Loan found successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Loan not found',
  })
  findOne(@Correlation() correlation_id: string, @Param('id') id: string) {
    return this.loanService.findOne(correlation_id, id);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get loans by user ID',
    description: 'Retrieve all loans for a specific user',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user loans',
  })
  findByUserId(
    @Correlation() correlation_id: string,
    @Param('userId') userId: string,
  ) {
    return this.loanService.findByUserId(correlation_id, userId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update loan',
    description: 'Update loan details',
  })
  @ApiParam({
    name: 'id',
    description: 'Loan ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'Loan updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Loan not found',
  })
  update(
    @Correlation() correlation_id: string,
    @Param('id') id: string,
    @Body() updateLoanDto: UpdateLoanDto,
  ) {
    return this.loanService.update(correlation_id, id, updateLoanDto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update loan status',
    description:
      'Update the status of a loan (PENDING, APPROVED, ACTIVE, REPAID, DEFAULTED)',
  })
  @ApiParam({
    name: 'id',
    description: 'Loan ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'Loan status updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Loan not found',
  })
  updateStatus(
    @Correlation() correlation_id: string,
    @Param('id') id: string,
    @Body('status') status: LoanStatus,
  ) {
    return this.loanService.updateStatus(correlation_id, id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete loan',
    description: 'Delete a loan by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Loan ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 204,
    description: 'Loan deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Loan not found',
  })
  remove(@Correlation() correlation_id: string, @Param('id') id: string) {
    return this.loanService.remove(correlation_id, id);
  }
}
