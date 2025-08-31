import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan, LoanStatus } from './entities/loan.entity';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
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
export class LoanService {
  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    private readonly logger: CustomLogger,
    private readonly defiPaymentsService: DefiPaymentsService,
    private readonly transactionService: TransactionService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  private generateId(): string {
    return uuidv4().replace(/-/g, '');
  }

  async create(correlation_id: string, createLoanDto: CreateLoanDto) {
    this.logger.setContext(this.constructor.name + '/create');
    this.logger.debug(correlation_id, 'Starting loan creation process');

    // Business logic validation for collateral amount
    this.validateCollateralAmount(
      createLoanDto.amount,
      createLoanDto.collateral_amount,
    );

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

    try {
      // Try to get user's wallet address (optional)
      let buyerAddress: string | null = null;
      try {
        buyerAddress = await this.userService.getWalletAddress(
          correlation_id,
          createLoanDto.user_id,
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

          // Check if user has sufficient allowance
          this.logger.debug(correlation_id, 'Checking user token allowance');
          const userTokenStatus =
            await this.defiPaymentsService.checkUserTokenStatus(
              correlation_id,
              buyerAddress,
            );

          // If insufficient allowance, approve tokens
          if (
            !userTokenStatus.hasAllowance ||
            BigInt(userTokenStatus.allowance) <
              BigInt(createLoanDto.amount * 1000000)
          ) {
            this.logger.debug(
              correlation_id,
              'Insufficient allowance, approving tokens',
            );
            const approvalAmount = (createLoanDto.amount * 1000000).toString();
            await this.defiPaymentsService.approveTokens(
              correlation_id,
              contractAddress,
              approvalAmount,
            );
            this.logger.debug(correlation_id, 'Tokens approved successfully');
          }

          // Create order on blockchain using DefiPaymentsService
          this.logger.debug(correlation_id, 'Creating order on blockchain');

          const createOrderDto = {
            purchaseAmount: (createLoanDto.amount * 1000000).toString(), // Convert to USDC units (6 decimals)
            merchant: '0xD4Fa7d8c4462E002fc6978A650141bCC7bf0db30', // Hardcoded merchant address (treasury address from deployment)
            dueInSeconds: (30 * 24 * 60 * 60).toString(), // 30 days from now
            installments: createLoanDto.installments ?? 1, // Default to 1 if not provided
          };

          const blockchainResult = await this.defiPaymentsService.createOrder(
            correlation_id,
            createOrderDto,
            buyerAddress,
          );

          // Update loan with blockchain information
          await this.loanRepository.update(loan_id, {
            blockchain_order_id: blockchainResult.orderId.toString(),
            blockchain_tx_hash: blockchainResult.txHash,
            status: LoanStatus.APPROVED,
          });

          // Record blockchain transaction
          await this.transactionService.create(correlation_id, {
            user_id: createLoanDto.user_id,
            loan_id: loan_id,
            type: TransactionType.BLOCKCHAIN_ORDER_CREATION,
            subtype: TransactionSubtype.DEBIT,
            amount: createLoanDto.amount,
            tx_hash: blockchainResult.txHash,
            blockchain_order_id: blockchainResult.orderId.toString(),
            blockchain_status: 'CONFIRMED',
          });

          this.logger.debug(
            correlation_id,
            `Loan created successfully with blockchain order ID: ${blockchainResult.orderId}`,
          );

          // Get updated loan data
          const updatedLoan = await this.findOne(correlation_id, loan_id);

          return {
            message: 'Loan created successfully on blockchain',
            data: {
              ...updatedLoan.data,
              blockchain_order_id: blockchainResult.orderId,
              blockchain_tx_hash: blockchainResult.txHash,
            },
          };
        } catch (blockchainError) {
          this.logger.error(
            correlation_id,
            `Blockchain integration failed: ${blockchainError.message}`,
          );

          // Record failed transaction
          await this.transactionService.create(correlation_id, {
            user_id: createLoanDto.user_id,
            loan_id: loan_id,
            type: TransactionType.BLOCKCHAIN_ORDER_CREATION,
            subtype: TransactionSubtype.DEBIT,
            amount: createLoanDto.amount,
            blockchain_status: 'FAILED',
          });

          // Mark loan as failed when blockchain integration fails
          await this.loanRepository.update(loan_id, {
            status: LoanStatus.FAILED,
          });

          this.logger.debug(
            correlation_id,
            'Loan marked as failed due to blockchain integration failure',
          );
        }
      }

      // If no wallet address, create loan in database only
      if (!buyerAddress) {
        await this.loanRepository.update(loan_id, {
          status: LoanStatus.PENDING,
        });

        const updatedLoan = await this.findOne(correlation_id, loan_id);

        return {
          message: 'Loan created in database (no wallet address available)',
          data: updatedLoan.data,
        };
      } else {
        // If blockchain failed, loan is already marked as FAILED
        const updatedLoan = await this.findOne(correlation_id, loan_id);

        return {
          message: 'Loan creation failed (blockchain integration failed)',
          data: updatedLoan.data,
        };
      }
    } catch (error) {
      this.logger.error(
        correlation_id,
        `Error in loan creation process: ${error.message}`,
      );
      throw error;
    }
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

    // Business logic validation for collateral amount if both amount and collateral_amount are provided
    if (updateLoanDto.amount && updateLoanDto.collateral_amount) {
      this.validateCollateralAmount(
        updateLoanDto.amount,
        updateLoanDto.collateral_amount,
      );
    } else if (updateLoanDto.collateral_amount) {
      // If only collateral_amount is being updated, fetch current loan amount
      const currentLoan = await this.loanRepository.findOne({
        where: { loan_id },
      });
      if (currentLoan) {
        this.validateCollateralAmount(
          currentLoan.amount,
          updateLoanDto.collateral_amount,
        );
      }
    }

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

  /**
   * Validates collateral amount against loan amount
   * @param loanAmount - The principal loan amount
   * @param collateralAmount - The collateral amount
   * @throws HttpException if validation fails
   */
  private validateCollateralAmount(
    loanAmount: number,
    collateralAmount: number,
  ): void {
    // Collateral must be less than loan amount
    if (collateralAmount >= loanAmount) {
      throw new HttpException(
        {
          message: 'Collateral amount must be less than loan amount',
          data: null,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
