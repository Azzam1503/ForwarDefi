import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { DefiPaymentsService } from './defi_payments.service';
import { CustomLogger } from 'src/core/logger/logger.service';
import {
  CreateOrderDto,
  RepayInstallmentDto,
  QuoteDto,
  FundLiquidityDto,
  SetCreditScoreDto,
  WithdrawLiquidityDto,
  SetTierDto,
} from './dto/create-order.dto';

@Controller('DefiPaymentsController')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class DefiPaymentsController {
  constructor(
    private readonly defi_payment_service: DefiPaymentsService,
    private readonly logger: CustomLogger,
  ) {}

  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    const correlation_id = `get-order-${id}`;
    this.logger.setContext(this.constructor.name + '/getOrder');
    this.logger.debug(correlation_id, `Getting order: ${id}`);

    try {
      const order = await this.defi_payment_service.getOrder(id);
      this.logger.debug(correlation_id, `Order retrieved successfully: ${id}`);
      return {
        success: true,
        data: order,
        formatted: {
          principal: this.defi_payment_service.formatTokenAmount(
            order.principal,
          ),
          collateral: this.defi_payment_service.formatTokenAmount(
            order.collateral,
          ),
          totalFee: this.defi_payment_service.formatTokenAmount(order.totalFee),
          paidPrincipal: this.defi_payment_service.formatTokenAmount(
            order.paidPrincipal,
          ),
          paidFee: this.defi_payment_service.formatTokenAmount(order.paidFee),
          createdAt: new Date(parseInt(order.createdAt) * 1000).toISOString(),
          dueAt: new Date(parseInt(order.dueAt) * 1000).toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(correlation_id, `Error getting order ${id}:`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('quote')
  async getQuote(@Query() dto: QuoteDto) {
    const correlation_id = `get-quote-${dto.buyer}`;
    this.logger.setContext(this.constructor.name + '/getQuote');
    this.logger.debug(correlation_id, `Getting quote for buyer: ${dto.buyer}`);

    try {
      const quote = await this.defi_payment_service.getQuote(dto);
      this.logger.debug(
        correlation_id,
        `Quote retrieved successfully for buyer: ${dto.buyer}`,
      );
      return {
        success: true,
        data: quote,
        formatted: {
          collateralRequired: this.defi_payment_service.formatTokenAmount(
            quote.collateralRequired,
          ),
          totalFee: this.defi_payment_service.formatTokenAmount(quote.totalFee),
          purchaseAmount: this.defi_payment_service.formatTokenAmount(
            dto.purchaseAmount,
          ),
        },
      };
    } catch (error) {
      this.logger.error(correlation_id, 'Error getting quote:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('credit-score/:address')
  async getCreditScore(@Param('address') address: string) {
    const correlation_id = `get-credit-score-${address}`;
    this.logger.setContext(this.constructor.name + '/getCreditScore');
    this.logger.debug(
      correlation_id,
      `Getting credit score for address: ${address}`,
    );

    try {
      const score = await this.defi_payment_service.getCreditScore(address);
      this.logger.debug(
        correlation_id,
        `Credit score retrieved successfully for address: ${address}`,
      );
      return {
        success: true,
        data: {
          address,
          creditScore: score,
        },
      };
    } catch (error) {
      this.logger.error(
        correlation_id,
        `Error getting credit score for ${address}:`,
        error,
      );
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('liquidity')
  async getAvailableLiquidity() {
    const correlation_id = 'get-liquidity';
    this.logger.setContext(this.constructor.name + '/getAvailableLiquidity');
    this.logger.debug(correlation_id, 'Getting available liquidity');

    try {
      const liquidity = await this.defi_payment_service.getAvailableLiquidity();
      this.logger.debug(
        correlation_id,
        `Available liquidity retrieved: ${liquidity}`,
      );
      return {
        success: true,
        data: {
          availableLiquidity: liquidity,
          formatted: this.defi_payment_service.formatTokenAmount(liquidity),
        },
      };
    } catch (error) {
      this.logger.error(correlation_id, 'Error getting liquidity:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('orders/:id/total-due')
  async getTotalDue(@Param('id') id: string) {
    const correlation_id = `get-total-due-${id}`;
    this.logger.setContext(this.constructor.name + '/getTotalDue');
    this.logger.debug(correlation_id, `Getting total due for order: ${id}`);

    try {
      const due = await this.defi_payment_service.getTotalDue(id);
      this.logger.debug(
        correlation_id,
        `Total due retrieved for order ${id}: ${due}`,
      );
      return {
        success: true,
        data: {
          orderId: id,
          totalDue: due,
          formatted: this.defi_payment_service.formatTokenAmount(due),
        },
      };
    } catch (error) {
      this.logger.error(
        correlation_id,
        `Error getting total due for order ${id}:`,
        error,
      );
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('orders/:id/installment')
  async getNominalInstallment(@Param('id') id: string) {
    const correlation_id = `get-installment-${id}`;
    this.logger.setContext(this.constructor.name + '/getNominalInstallment');
    this.logger.debug(
      correlation_id,
      `Getting nominal installment for order: ${id}`,
    );

    try {
      const installment =
        await this.defi_payment_service.getNominalInstallment(id);
      this.logger.debug(
        correlation_id,
        `Nominal installment retrieved for order ${id}`,
      );
      return {
        success: true,
        data: installment,
        formatted: {
          principalPart: this.defi_payment_service.formatTokenAmount(
            installment.principalPart,
          ),
          feePart: this.defi_payment_service.formatTokenAmount(
            installment.feePart,
          ),
          total: this.defi_payment_service.formatTokenAmount(
            (
              BigInt(installment.principalPart) + BigInt(installment.feePart)
            ).toString(),
          ),
        },
      };
    } catch (error) {
      this.logger.error(
        correlation_id,
        `Error getting nominal installment for order ${id}:`,
        error,
      );
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('tiers')
  async getTiers() {
    const correlation_id = 'get-tiers';
    this.logger.setContext(this.constructor.name + '/getTiers');
    this.logger.debug(correlation_id, 'Getting all tiers');

    try {
      const tiers = await this.defi_payment_service.getTiers();
      this.logger.debug(
        correlation_id,
        `Successfully retrieved ${tiers.length} tiers`,
      );
      return {
        success: true,
        data: tiers.map((tier, index) => ({
          index,
          ...tier,
          formatted: {
            minScore: tier.minScore,
            collateralPercentage: (tier.collateralBps / 100).toFixed(2) + '%',
            feePercentage: (tier.feeBps / 100).toFixed(2) + '%',
            maxLoan: this.defi_payment_service.formatTokenAmount(tier.maxLoan),
          },
        })),
      };
    } catch (error) {
      this.logger.error(correlation_id, 'Error getting tiers:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('network-info')
  async getNetworkInfo() {
    const correlation_id = 'get-network-info';
    this.logger.setContext(this.constructor.name + '/getNetworkInfo');
    this.logger.debug(correlation_id, 'Getting network information');

    try {
      const networkInfo = await this.defi_payment_service.getNetworkInfo();
      this.logger.debug(
        correlation_id,
        'Network information retrieved successfully',
      );
      return {
        success: true,
        data: networkInfo,
        contract: {
          address: this.defi_payment_service.getContractAddress(),
          wallet: this.defi_payment_service.getWalletAddress(),
          transactionMode: this.defi_payment_service.isTransactionMode(),
        },
      };
    } catch (error) {
      this.logger.error(correlation_id, 'Error getting network info:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('wallet/balance')
  async getWalletBalance() {
    const correlation_id = 'get-wallet-balance';
    this.logger.setContext(this.constructor.name + '/getWalletBalance');
    this.logger.debug(correlation_id, 'Getting wallet balance');

    try {
      if (!this.defi_payment_service.isTransactionMode()) {
        throw new Error('Wallet not configured');
      }
      const balance = await this.defi_payment_service.getWalletBalance();
      this.logger.debug(
        correlation_id,
        `Wallet balance retrieved: ${balance} AVAX`,
      );
      return {
        success: true,
        data: {
          balance,
          address: this.defi_payment_service.getWalletAddress(),
        },
      };
    } catch (error) {
      this.logger.error(correlation_id, 'Error getting wallet balance:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ==================== TRANSACTION ENDPOINTS ====================

  @Post('orders')
  async createOrder(
    @Body() dto: CreateOrderDto,
    @Query('buyer') buyerAddress: string,
  ) {
    const correlation_id = `create-order-${buyerAddress}`;
    this.logger.setContext(this.constructor.name + '/createOrder');
    this.logger.debug(
      correlation_id,
      `Creating order for buyer: ${buyerAddress}`,
    );

    try {
      if (!buyerAddress) {
        throw new Error('Buyer address required as query parameter');
      }

      const result = await this.defi_payment_service.createOrder(
        dto,
        buyerAddress,
      );
      this.logger.debug(
        correlation_id,
        `Order created successfully: ${result.orderId}`,
      );
      return {
        success: true,
        data: result,
        message: `Order ${result.orderId} created successfully`,
      };
    } catch (error) {
      this.logger.error(correlation_id, 'Error creating order:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('repay-installment')
  async repayInstallment(@Body() dto: RepayInstallmentDto) {
    const correlation_id = `repay-installment-${dto.orderId}`;
    this.logger.setContext(this.constructor.name + '/repayInstallment');
    this.logger.debug(
      correlation_id,
      `Repaying installment for order: ${dto.orderId}`,
    );

    try {
      const txHash = await this.defi_payment_service.repayInstallment(dto);
      this.logger.debug(
        correlation_id,
        `Installment payment successful for order ${dto.orderId}`,
      );
      return {
        success: true,
        data: { transactionHash: txHash },
        message: `Installment payment successful for order ${dto.orderId}`,
      };
    } catch (error) {
      this.logger.error(correlation_id, 'Error repaying installment:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('repay-full/:id')
  async repayFull(@Param('id') orderId: string) {
    const correlation_id = `repay-full-${orderId}`;
    this.logger.setContext(this.constructor.name + '/repayFull');
    this.logger.debug(
      correlation_id,
      `Repaying full amount for order: ${orderId}`,
    );

    try {
      const txHash = await this.defi_payment_service.repayFull(orderId);
      this.logger.debug(
        correlation_id,
        `Full repayment successful for order ${orderId}`,
      );
      return {
        success: true,
        data: { transactionHash: txHash },
        message: `Full repayment successful for order ${orderId}`,
      };
    } catch (error) {
      this.logger.error(
        correlation_id,
        `Error repaying full for order ${orderId}:`,
        error,
      );
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('liquidate/:id')
  async liquidateOrder(@Param('id') orderId: string) {
    const correlation_id = `liquidate-${orderId}`;
    this.logger.setContext(this.constructor.name + '/liquidateOrder');
    this.logger.debug(correlation_id, `Liquidating order: ${orderId}`);

    try {
      const txHash = await this.defi_payment_service.liquidateOrder(orderId);
      this.logger.debug(
        correlation_id,
        `Order ${orderId} liquidated successfully`,
      );
      return {
        success: true,
        data: { transactionHash: txHash },
        message: `Order ${orderId} liquidated successfully`,
      };
    } catch (error) {
      this.logger.error(
        correlation_id,
        `Error liquidating order ${orderId}:`,
        error,
      );
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Post('admin/fund-liquidity')
  async fundLiquidity(@Body() dto: FundLiquidityDto) {
    const correlation_id = `fund-liquidity-${dto.amount}`;
    this.logger.setContext(this.constructor.name + '/fundLiquidity');
    this.logger.debug(correlation_id, `Funding liquidity: ${dto.amount}`);

    try {
      const txHash = await this.defi_payment_service.fundLiquidity(dto);
      this.logger.debug(
        correlation_id,
        `Liquidity funded successfully: ${dto.amount}`,
      );
      return {
        success: true,
        data: { transactionHash: txHash },
        message: `Liquidity funded: ${this.defi_payment_service.formatTokenAmount(dto.amount)} USDC`,
      };
    } catch (error) {
      this.logger.error(correlation_id, 'Error funding liquidity:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('admin/withdraw-liquidity')
  async withdrawLiquidity(@Body() dto: WithdrawLiquidityDto) {
    const correlation_id = `withdraw-liquidity-${dto.to}`;
    this.logger.setContext(this.constructor.name + '/withdrawLiquidity');
    this.logger.debug(
      correlation_id,
      `Withdrawing liquidity: ${dto.amount} to ${dto.to}`,
    );

    try {
      const txHash = await this.defi_payment_service.withdrawLiquidity(dto);
      this.logger.debug(
        correlation_id,
        `Liquidity withdrawn successfully: ${dto.amount} to ${dto.to}`,
      );
      return {
        success: true,
        data: { transactionHash: txHash },
        message: `Liquidity withdrawn: ${this.defi_payment_service.formatTokenAmount(dto.amount)} USDC to ${dto.to}`,
      };
    } catch (error) {
      this.logger.error(correlation_id, 'Error withdrawing liquidity:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('admin/set-credit-score')
  async setCreditScore(@Body() dto: SetCreditScoreDto) {
    const correlation_id = `set-credit-score-${dto.address}`;
    this.logger.setContext(this.constructor.name + '/setCreditScore');
    this.logger.debug(
      correlation_id,
      `Setting credit score for ${dto.address}: ${dto.score}`,
    );

    try {
      const txHash = await this.defi_payment_service.setCreditScore(dto);
      this.logger.debug(
        correlation_id,
        `Credit score set successfully for ${dto.address}: ${dto.score}`,
      );
      return {
        success: true,
        data: { transactionHash: txHash },
        message: `Credit score set for ${dto.address}: ${dto.score}`,
      };
    } catch (error) {
      this.logger.error(correlation_id, 'Error setting credit score:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('admin/set-tier')
  async setTier(@Body() dto: SetTierDto) {
    const correlation_id = `set-tier-${dto.idx}`;
    this.logger.setContext(this.constructor.name + '/setTier');
    this.logger.debug(
      correlation_id,
      `Setting tier ${dto.idx} with parameters: minScore=${dto.minScore}, collateralBps=${dto.collateralBps}, feeBps=${dto.feeBps}, maxLoan=${dto.maxLoan}`,
    );

    try {
      const txHash = await this.defi_payment_service.setTier(dto);
      this.logger.debug(correlation_id, `Tier ${dto.idx} updated successfully`);
      return {
        success: true,
        data: { transactionHash: txHash },
        message: `Tier ${dto.idx} updated successfully`,
      };
    } catch (error) {
      this.logger.error(correlation_id, 'Error setting tier:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ==================== HEALTH CHECK ====================

  @Get('health')
  async healthCheck() {
    const correlation_id = 'health-check';
    this.logger.setContext(this.constructor.name + '/healthCheck');
    this.logger.debug(correlation_id, 'Performing health check');

    try {
      const networkInfo = await this.defi_payment_service.getNetworkInfo();
      const liquidity = await this.defi_payment_service.getAvailableLiquidity();

      this.logger.debug(correlation_id, 'Health check completed successfully');
      return {
        success: true,
        data: {
          status: 'healthy',
          network: networkInfo,
          contractAddress: this.defi_payment_service.getContractAddress(),
          walletAddress: this.defi_payment_service.getWalletAddress(),
          transactionMode: this.defi_payment_service.isTransactionMode(),
          availableLiquidity:
            this.defi_payment_service.formatTokenAmount(liquidity),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(correlation_id, 'Health check failed:', error);
      throw new HttpException(
        'Service unhealthy',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
