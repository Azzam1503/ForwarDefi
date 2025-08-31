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

@Controller('loans')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Correlation() correlation_id: string,
    @Body() createLoanDto: CreateLoanDto,
  ) {
    return this.loanService.create(correlation_id, createLoanDto);
  }

  @Get()
  findAll(@Correlation() correlation_id: string) {
    return this.loanService.findAll(correlation_id);
  }

  @Get(':id')
  findOne(@Correlation() correlation_id: string, @Param('id') id: string) {
    return this.loanService.findOne(correlation_id, id);
  }

  @Get('user/:userId')
  findByUserId(
    @Correlation() correlation_id: string,
    @Param('userId') userId: string,
  ) {
    return this.loanService.findByUserId(correlation_id, userId);
  }

  @Patch(':id')
  update(
    @Correlation() correlation_id: string,
    @Param('id') id: string,
    @Body() updateLoanDto: UpdateLoanDto,
  ) {
    return this.loanService.update(correlation_id, id, updateLoanDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Correlation() correlation_id: string,
    @Param('id') id: string,
    @Body('status') status: LoanStatus,
  ) {
    return this.loanService.updateStatus(correlation_id, id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Correlation() correlation_id: string, @Param('id') id: string) {
    return this.loanService.remove(correlation_id, id);
  }
}
