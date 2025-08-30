import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Logger,
  HttpException,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { DefiPaymentsService } from './defi_payments.service';
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
  private readonly logger = new Logger(DefiPaymentsController.name);

  constructor(private readonly defi_payment_service: DefiPaymentsService) {}


  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    try {
      const order = await this.defi_payment_service.getOrder(id);
      return {
        success: true,
        data: order,
        formatted: {
          principal: this.defi_payment_service.formatTokenAmount(order.principal),
          collateral: this.defi_payment_service.formatTokenAmount(order.collateral),
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
      this.logger.error(`Error getting order ${id}:`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('quote')
  async getQuote(@Query() dto: QuoteDto) {
    try {
      const quote = await this.defi_payment_service.getQuote(dto);
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
      this.logger.error('Error getting quote:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('credit-score/:address')
  async getCreditScore(@Param('address') address: string) {
    try {
      const score = await this.defi_payment_service.getCreditScore(address);
      return {
        success: true,
        data: {
          address,
          creditScore: score,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting credit score for ${address}:`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('liquidity')
  async getAvailableLiquidity() {
    try {
      const liquidity = await this.defi_payment_service.getAvailableLiquidity();
      return {
        success: true,
        data: {
          availableLiquidity: liquidity,
          formatted: this.defi_payment_service.formatTokenAmount(liquidity),
        },
      };
    } catch (error) {
      this.logger.error('Error getting liquidity:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('orders/:id/total-due')
  async getTotalDue(@Param('id') id: string) {
    try {
      const due = await this.defi_payment_service.getTotalDue(id);
      return {
        success: true,
        data: {
          orderId: id,
          totalDue: due,
          formatted: this.defi_payment_service.formatTokenAmount(due),
        },
      };
    } catch (error) {
      this.logger.error(`Error getting total due for order ${id}:`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('orders/:id/installment')
  async getNominalInstallment(@Param('id') id: string) {
    try {
      const installment = await this.defi_payment_service.getNominalInstallment(id);
      return {
        success: true,
        data: installment,
        formatted: {
          principalPart: this.defi_payment_service.formatTokenAmount(
            installment.principalPart,
          ),
          feePart: this.defi_payment_service.formatTokenAmount(installment.feePart),
          total: this.defi_payment_service.formatTokenAmount(
            (
              BigInt(installment.principalPart) + BigInt(installment.feePart)
            ).toString(),
          ),
        },
      };
    } catch (error) {
      this.logger.error(
        `Error getting nominal installment for order ${id}:`,
        error,
      );
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('tiers')
  async getTiers() {
    try {
      const tiers = await this.defi_payment_service.getTiers();
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
      this.logger.error('Error getting tiers:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('network-info')
  async getNetworkInfo() {
    try {
      const networkInfo = await this.defi_payment_service.getNetworkInfo();
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
      this.logger.error('Error getting network info:', error);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('wallet/balance')
  async getWalletBalance() {
    try {
      if (!this.defi_payment_service.isTransactionMode()) {
        throw new Error('Wallet not configured');
      }
      const balance = await this.defi_payment_service.getWalletBalance();
      return {
        success: true,
        data: {
          balance,
          address: this.defi_payment_service.getWalletAddress(),
        },
      };
    } catch (error) {
      this.logger.error('Error getting wallet balance:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ==================== TRANSACTION ENDPOINTS ====================

  @Post('orders')
  async createOrder(
    @Body() dto: CreateOrderDto,
    @Query('buyer') buyerAddress: string,
  ) {
    try {
      if (!buyerAddress) {
        throw new Error('Buyer address required as query parameter');
      }

      const result = await this.defi_payment_service.createOrder(dto, buyerAddress);
      return {
        success: true,
        data: result,
        message: `Order ${result.orderId} created successfully`,
      };
    } catch (error) {
      this.logger.error('Error creating order:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('repay-installment')
  async repayInstallment(@Body() dto: RepayInstallmentDto) {
    try {
      const txHash = await this.defi_payment_service.repayInstallment(dto);
      return {
        success: true,
        data: { transactionHash: txHash },
        message: `Installment payment successful for order ${dto.orderId}`,
      };
    } catch (error) {
      this.logger.error('Error repaying installment:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('repay-full/:id')
  async repayFull(@Param('id') orderId: string) {
    try {
      const txHash = await this.defi_payment_service.repayFull(orderId);
      return {
        success: true,
        data: { transactionHash: txHash },
        message: `Full repayment successful for order ${orderId}`,
      };
    } catch (error) {
      this.logger.error(`Error repaying full for order ${orderId}:`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('liquidate/:id')
  async liquidateOrder(@Param('id') orderId: string) {
    try {
      const txHash = await this.defi_payment_service.liquidateOrder(orderId);
      return {
        success: true,
        data: { transactionHash: txHash },
        message: `Order ${orderId} liquidated successfully`,
      };
    } catch (error) {
      this.logger.error(`Error liquidating order ${orderId}:`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Post('admin/fund-liquidity')
  async fundLiquidity(@Body() dto: FundLiquidityDto) {
    try {
      const txHash = await this.defi_payment_service.fundLiquidity(dto);
      return {
        success: true,
        data: { transactionHash: txHash },
        message: `Liquidity funded: ${this.defi_payment_service.formatTokenAmount(dto.amount)} USDC`,
      };
    } catch (error) {
      this.logger.error('Error funding liquidity:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('admin/withdraw-liquidity')
  async withdrawLiquidity(@Body() dto: WithdrawLiquidityDto) {
    try {
      const txHash = await this.defi_payment_service.withdrawLiquidity(dto);
      return {
        success: true,
        data: { transactionHash: txHash },
        message: `Liquidity withdrawn: ${this.defi_payment_service.formatTokenAmount(dto.amount)} USDC to ${dto.to}`,
      };
    } catch (error) {
      this.logger.error('Error withdrawing liquidity:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('admin/set-credit-score')
  async setCreditScore(@Body() dto: SetCreditScoreDto) {
    try {
      const txHash = await this.defi_payment_service.setCreditScore(dto);
      return {
        success: true,
        data: { transactionHash: txHash },
        message: `Credit score set for ${dto.address}: ${dto.score}`,
      };
    } catch (error) {
      this.logger.error('Error setting credit score:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('admin/set-tier')
  async setTier(@Body() dto: SetTierDto) {
    try {
      const txHash = await this.defi_payment_service.setTier(dto);
      return {
        success: true,
        data: { transactionHash: txHash },
        message: `Tier ${dto.idx} updated successfully`,
      };
    } catch (error) {
      this.logger.error('Error setting tier:', error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ==================== HEALTH CHECK ====================

  @Get('health')
  async healthCheck() {
    try {
      const networkInfo = await this.defi_payment_service.getNetworkInfo();
      const liquidity = await this.defi_payment_service.getAvailableLiquidity();

      return {
        success: true,
        data: {
          status: 'healthy',
          network: networkInfo,
          contractAddress: this.defi_payment_service.getContractAddress(),
          walletAddress: this.defi_payment_service.getWalletAddress(),
          transactionMode: this.defi_payment_service.isTransactionMode(),
          availableLiquidity: this.defi_payment_service.formatTokenAmount(liquidity),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      throw new HttpException(
        'Service unhealthy',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
