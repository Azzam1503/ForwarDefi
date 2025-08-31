import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Repayment, RepaymentStatus } from './entities/repayment.entity';
import { CreateRepaymentDto } from './dto/create-repayment.dto';
import { UpdateRepaymentDto } from './dto/update-repayment.dto';
import { v4 as uuidv4 } from 'uuid';
import { CustomLogger } from 'src/core/logger/logger.service';
import { DefiPaymentsService } from 'src/defi_payments/defi_payments.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { UserService } from 'src/user/user.service';
import {
  TransactionType,
  TransactionSubtype,
} from 'src/transaction/entities/transaction.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RepaymentService {
  constructor(
    @InjectRepository(Repayment)
    private readonly repaymentRepository: Repository<Repayment>,
    private readonly logger: CustomLogger,
    private readonly defiPaymentsService: DefiPaymentsService,
    private readonly transactionService: TransactionService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  private generateId(): string {
    return uuidv4().replace(/-/g, '');
  }

  async create(correlation_id: string, createRepaymentDto: CreateRepaymentDto) {
    this.logger.setContext(this.constructor.name + '/create');
    this.logger.debug(correlation_id, 'Starting repayment creation process');

    const repayment_id = this.generateId();
    this.logger.debug(
      correlation_id,
      `Generated repayment ID: ${repayment_id}`,
    );

    const repayment = this.repaymentRepository.create({
      repayment_id,
      ...createRepaymentDto,
      due_date: new Date(createRepaymentDto.due_date),
      status: RepaymentStatus.PENDING,
    });

    this.logger.debug(correlation_id, 'Saving repayment to database');
    const savedRepayment = await this.repaymentRepository.save(repayment);
    this.logger.debug(
      correlation_id,
      `Repayment created successfully with ID: ${repayment_id}`,
    );

    return {
      message: 'Repayment created successfully',
      data: savedRepayment,
    };
  }

  async findAll(correlation_id: string) {
    this.logger.setContext(this.constructor.name + '/findAll');
    this.logger.debug(correlation_id, 'Fetching all repayments');

    const repayments = await this.repaymentRepository.find({
      order: { created_at: 'DESC' },
    });

    this.logger.debug(correlation_id, `Found ${repayments.length} repayments`);
    return {
      message: 'Repayments retrieved successfully',
      data: repayments,
    };
  }

  async findOne(correlation_id: string, repayment_id: string) {
    this.logger.setContext(this.constructor.name + '/findOne');
    this.logger.debug(
      correlation_id,
      `Finding repayment by ID: ${repayment_id}`,
    );

    const repayment = await this.repaymentRepository.findOne({
      where: { repayment_id },
    });

    if (repayment) {
      this.logger.debug(
        correlation_id,
        `Repayment found successfully: ${repayment_id}`,
      );
      return {
        message: 'Repayment found successfully',
        data: repayment,
      };
    } else {
      this.logger.debug(correlation_id, `Repayment not found: ${repayment_id}`);
      return {
        message: 'Repayment not found',
        data: null,
      };
    }
  }

  async findByLoanId(correlation_id: string, loan_id: string) {
    this.logger.setContext(this.constructor.name + '/findByLoanId');
    this.logger.debug(
      correlation_id,
      `Finding repayments for loan ID: ${loan_id}`,
    );

    const repayments = await this.repaymentRepository.find({
      where: { loan_id },
      order: { due_date: 'ASC' },
    });

    this.logger.debug(
      correlation_id,
      `Found ${repayments.length} repayments for loan: ${loan_id}`,
    );
    return {
      message: 'Loan repayments retrieved successfully',
      data: repayments,
    };
  }

  async update(
    correlation_id: string,
    repayment_id: string,
    updateRepaymentDto: UpdateRepaymentDto,
  ) {
    this.logger.setContext(this.constructor.name + '/update');
    this.logger.debug(correlation_id, `Updating repayment ID: ${repayment_id}`);

    const updateData: any = { ...updateRepaymentDto };
    if (updateRepaymentDto.due_date) {
      updateData.due_date = new Date(updateRepaymentDto.due_date);
    }
    if (updateRepaymentDto.paid_date) {
      updateData.paid_date = new Date(updateRepaymentDto.paid_date);
    }

    await this.repaymentRepository.update(repayment_id, updateData);
    this.logger.debug(
      correlation_id,
      `Repayment updated successfully: ${repayment_id}`,
    );

    const result = await this.findOne(correlation_id, repayment_id);
    return {
      message: 'Repayment updated successfully',
      data: result.data,
    };
  }

  async markAsPaid(correlation_id: string, repayment_id: string) {
    this.logger.setContext(this.constructor.name + '/markAsPaid');
    this.logger.debug(
      correlation_id,
      `Marking repayment as paid for ID: ${repayment_id}`,
    );

    await this.repaymentRepository.update(repayment_id, {
      status: RepaymentStatus.PAID,
      paid_date: new Date(),
    });
    this.logger.debug(
      correlation_id,
      `Repayment marked as paid successfully: ${repayment_id}`,
    );

    const result = await this.findOne(correlation_id, repayment_id);
    return {
      message: 'Repayment marked as paid successfully',
      data: result.data,
    };
  }

  async remove(correlation_id: string, repayment_id: string) {
    this.logger.setContext(this.constructor.name + '/remove');
    this.logger.debug(correlation_id, `Deleting repayment ID: ${repayment_id}`);

    await this.repaymentRepository.delete(repayment_id);
    this.logger.debug(
      correlation_id,
      `Repayment deleted successfully: ${repayment_id}`,
    );

    return {
      message: 'Repayment deleted successfully',
      data: null,
    };
  }

  async processBlockchainRepayment(
    correlation_id: string,
    orderId: number,
    amount: number,
    user_id: string,
    loan_id: string,
  ) {
    this.logger.setContext(
      this.constructor.name + '/processBlockchainRepayment',
    );
    this.logger.debug(
      correlation_id,
      `Processing blockchain repayment for order: ${orderId}`,
    );

    try {
      // Try to get user's wallet address (optional)
      let buyerAddress: string | null = null;
      try {
        buyerAddress = await this.userService.getWalletAddress(
          correlation_id,
          user_id,
        );
      } catch (error) {
        this.logger.warn(
          correlation_id,
          `Could not get user wallet address: ${error.message}`,
        );
      }

      // If we have a wallet address, try blockchain integration
      if (buyerAddress) {
        try {
          // Get contract address for approval
          const contractAddress = this.configService.get<string>(
            'BNPL_CONTRACT_ADDRESS',
          );
          if (!contractAddress) {
            throw new Error('BNPL_CONTRACT_ADDRESS not configured');
          }

          // Check if user has sufficient allowance for repayment
          this.logger.debug(
            correlation_id,
            'Checking user token allowance for repayment',
          );
          const userTokenStatus =
            await this.defiPaymentsService.checkUserTokenStatus(
              correlation_id,
              buyerAddress,
            );

          // If insufficient allowance, approve tokens
          if (
            !userTokenStatus.hasAllowance ||
            BigInt(userTokenStatus.allowance) < BigInt(amount * 1000000)
          ) {
            this.logger.debug(
              correlation_id,
              'Insufficient allowance for repayment, approving tokens',
            );
            const approvalAmount = (amount * 1000000).toString();
            await this.defiPaymentsService.approveTokens(
              correlation_id,
              contractAddress,
              approvalAmount,
            );
            this.logger.debug(
              correlation_id,
              'Tokens approved successfully for repayment',
            );
          }

          // Process repayment on blockchain using DefiPaymentsService
          const repayInstallmentDto = {
            orderId: orderId.toString(),
            amount: (amount * 1000000).toString(), // Convert to USDC units (6 decimals)
          };

          const txHash = await this.defiPaymentsService.repayInstallment(
            correlation_id,
            repayInstallmentDto,
          );

          // Create repayment record in database
          const repayment_id = this.generateId();
          const repayment = this.repaymentRepository.create({
            repayment_id,
            loan_id,
            amount,
            due_date: new Date(),
            status: RepaymentStatus.PAID,
            paid_date: new Date(),
            blockchain_tx_hash: txHash,
          });

          const savedRepayment = await this.repaymentRepository.save(repayment);

          // Record blockchain transaction
          await this.transactionService.create(correlation_id, {
            user_id,
            loan_id,
            type: TransactionType.BLOCKCHAIN_REPAYMENT,
            subtype: TransactionSubtype.CREDIT,
            amount,
            tx_hash: txHash,
            blockchain_order_id: orderId.toString(),
            blockchain_status: 'CONFIRMED',
          });

          this.logger.debug(
            correlation_id,
            `Blockchain repayment processed successfully for order: ${orderId}`,
          );

          return {
            message: 'Repayment processed successfully on blockchain',
            data: {
              ...savedRepayment,
              blockchain_tx_hash: txHash,
              blockchain_order_id: orderId,
            },
          };
        } catch (blockchainError) {
          this.logger.error(
            correlation_id,
            `Blockchain repayment failed: ${blockchainError.message}`,
          );

          // Record failed transaction
          await this.transactionService.create(correlation_id, {
            user_id,
            loan_id,
            type: TransactionType.BLOCKCHAIN_REPAYMENT,
            subtype: TransactionSubtype.CREDIT,
            amount,
            blockchain_order_id: orderId.toString(),
            blockchain_status: 'FAILED',
          });

          // Continue with database-only repayment creation
          this.logger.debug(
            correlation_id,
            'Continuing with database-only repayment creation',
          );
        }
      }

      // If no wallet address or blockchain failed, create repayment in database only
      const repayment_id = this.generateId();
      const repayment = this.repaymentRepository.create({
        repayment_id,
        loan_id,
        amount,
        due_date: new Date(),
        status: RepaymentStatus.PAID,
        paid_date: new Date(),
      });

      const savedRepayment = await this.repaymentRepository.save(repayment);

      this.logger.debug(
        correlation_id,
        `Repayment created in database only for order: ${orderId}`,
      );

      return {
        message: buyerAddress
          ? 'Repayment created in database (blockchain integration failed)'
          : 'Repayment created in database (no wallet address available)',
        data: savedRepayment,
      };
    } catch (error) {
      this.logger.error(
        correlation_id,
        `Error in blockchain repayment process: ${error.message}`,
      );
      throw error;
    }
  }
}
