import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { v4 as uuidv4 } from 'uuid';
import { CustomLogger } from 'src/core/logger/logger.service';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly logger: CustomLogger,
  ) {}

  private generateId(): string {
    return uuidv4().replace(/-/g, '');
  }

  async create(
    correlation_id: string,
    createTransactionDto: CreateTransactionDto,
  ) {
    this.logger.setContext(this.constructor.name + '/create');
    this.logger.debug(correlation_id, 'Starting transaction creation process');

    const tx_id = this.generateId();
    this.logger.debug(correlation_id, `Generated transaction ID: ${tx_id}`);

    const transaction = this.transactionRepository.create({
      tx_id,
      ...createTransactionDto,
    });

    this.logger.debug(correlation_id, 'Saving transaction to database');
    const savedTransaction = await this.transactionRepository.save(transaction);
    this.logger.debug(
      correlation_id,
      `Transaction created successfully with ID: ${tx_id}`,
    );

    return {
      message: 'Transaction created successfully',
      data: savedTransaction,
    };
  }

  async findAll(correlation_id: string) {
    this.logger.setContext(this.constructor.name + '/findAll');
    this.logger.debug(correlation_id, 'Fetching all transactions');

    const transactions = await this.transactionRepository.find({
      order: { created_at: 'DESC' },
    });

    this.logger.debug(
      correlation_id,
      `Found ${transactions.length} transactions`,
    );
    return {
      message: 'Transactions retrieved successfully',
      data: transactions,
    };
  }

  async findOne(correlation_id: string, tx_id: string) {
    this.logger.setContext(this.constructor.name + '/findOne');
    this.logger.debug(correlation_id, `Finding transaction by ID: ${tx_id}`);

    const transaction = await this.transactionRepository.findOne({
      where: { tx_id },
    });

    if (transaction) {
      this.logger.debug(
        correlation_id,
        `Transaction found successfully: ${tx_id}`,
      );
      return {
        message: 'Transaction found successfully',
        data: transaction,
      };
    } else {
      this.logger.debug(correlation_id, `Transaction not found: ${tx_id}`);
      return {
        message: 'Transaction not found',
        data: null,
      };
    }
  }

  async findByUserId(correlation_id: string, user_id: string) {
    this.logger.setContext(this.constructor.name + '/findByUserId');
    this.logger.debug(
      correlation_id,
      `Finding transactions for user ID: ${user_id}`,
    );

    const transactions = await this.transactionRepository.find({
      where: { user_id },
      order: { created_at: 'DESC' },
    });

    this.logger.debug(
      correlation_id,
      `Found ${transactions.length} transactions for user: ${user_id}`,
    );
    return {
      message: 'User transactions retrieved successfully',
      data: transactions,
    };
  }

  async findByLoanId(correlation_id: string, loan_id: string) {
    this.logger.setContext(this.constructor.name + '/findByLoanId');
    this.logger.debug(
      correlation_id,
      `Finding transactions for loan ID: ${loan_id}`,
    );

    const transactions = await this.transactionRepository.find({
      where: { loan_id },
      order: { created_at: 'DESC' },
    });

    this.logger.debug(
      correlation_id,
      `Found ${transactions.length} transactions for loan: ${loan_id}`,
    );
    return {
      message: 'Loan transactions retrieved successfully',
      data: transactions,
    };
  }

  async remove(correlation_id: string, tx_id: string) {
    this.logger.setContext(this.constructor.name + '/remove');
    this.logger.debug(correlation_id, `Deleting transaction ID: ${tx_id}`);

    await this.transactionRepository.delete(tx_id);
    this.logger.debug(
      correlation_id,
      `Transaction deleted successfully: ${tx_id}`,
    );

    return {
      message: 'Transaction deleted successfully',
      data: null,
    };
  }
}
