import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan, LoanStatus } from './entities/loan.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { v4 as uuidv4 } from 'uuid';
import { CustomLogger } from 'src/core/logger/logger.service';

@Injectable()
export class LoanService {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly logger: CustomLogger,
  ) {}

  private generateId(): string {
    return uuidv4().replace(/-/g, '');
  }

  async create(correlation_id: string, createLoanDto: CreateLoanDto) {
    this.logger.setContext(this.constructor.name + '/create');
    this.logger.debug(correlation_id, 'Starting loan creation process');

    const loan_id = this.generateId();
    this.logger.debug(correlation_id, `Generated loan ID: ${loan_id}`);

    const loan = this.loanRepository.create({
      loan_id,
      ...createLoanDto,
      status: LoanStatus.PENDING,
    });

    this.logger.debug(correlation_id, 'Saving loan to database');
    const savedLoan = await this.loanRepository.save(loan);
    this.logger.debug(
      correlation_id,
      `Loan created successfully with ID: ${loan_id}`,
    );

    return {
      message: 'Loan created successfully',
      data: savedLoan,
    };
  }

  async findAll(correlation_id: string) {
    this.logger.setContext(this.constructor.name + '/findAll');
    this.logger.debug(correlation_id, 'Fetching all loans');

    const loans = await this.loanRepository.find({
      order: { created_at: 'DESC' },
    });

    this.logger.debug(correlation_id, `Found ${loans.length} loans`);
    return {
      message: 'Loans retrieved successfully',
      data: loans,
    };
  }

  async findOne(correlation_id: string, loan_id: string) {
    this.logger.setContext(this.constructor.name + '/findOne');
    this.logger.debug(correlation_id, `Finding loan by ID: ${loan_id}`);

    const loan = await this.loanRepository.findOne({
      where: { loan_id },
    });

    if (loan) {
      this.logger.debug(correlation_id, `Loan found successfully: ${loan_id}`);
      return {
        message: 'Loan found successfully',
        data: loan,
      };
    } else {
      this.logger.debug(correlation_id, `Loan not found: ${loan_id}`);
      return {
        message: 'Loan not found',
        data: null,
      };
    }
  }

  async findByUserId(correlation_id: string, user_id: string) {
    this.logger.setContext(this.constructor.name + '/findByUserId');
    this.logger.debug(correlation_id, `Finding loans for user ID: ${user_id}`);

    const loans = await this.loanRepository.find({
      where: { user_id },
      order: { created_at: 'DESC' },
    });

    this.logger.debug(
      correlation_id,
      `Found ${loans.length} loans for user: ${user_id}`,
    );
    return {
      message: 'User loans retrieved successfully',
      data: loans,
    };
  }

  async update(
    correlation_id: string,
    loan_id: string,
    updateLoanDto: UpdateLoanDto,
  ) {
    this.logger.setContext(this.constructor.name + '/update');
    this.logger.debug(correlation_id, `Updating loan ID: ${loan_id}`);

    await this.loanRepository.update(loan_id, updateLoanDto);
    this.logger.debug(correlation_id, `Loan updated successfully: ${loan_id}`);

    const result = await this.findOne(correlation_id, loan_id);
    return {
      message: 'Loan updated successfully',
      data: result.data,
    };
  }

  async updateStatus(
    correlation_id: string,
    loan_id: string,
    status: LoanStatus,
  ) {
    this.logger.setContext(this.constructor.name + '/updateStatus');
    this.logger.debug(
      correlation_id,
      `Updating loan status to ${status} for loan ID: ${loan_id}`,
    );

    await this.loanRepository.update(loan_id, { status });
    this.logger.debug(
      correlation_id,
      `Loan status updated successfully: ${loan_id}`,
    );

    const result = await this.findOne(correlation_id, loan_id);
    return {
      message: 'Loan status updated successfully',
      data: result.data,
    };
  }

  async remove(correlation_id: string, loan_id: string) {
    this.logger.setContext(this.constructor.name + '/remove');
    this.logger.debug(correlation_id, `Deleting loan ID: ${loan_id}`);

    await this.loanRepository.delete(loan_id);
    this.logger.debug(correlation_id, `Loan deleted successfully: ${loan_id}`);

    return {
      message: 'Loan deleted successfully',
      data: null,
    };
  }
}
