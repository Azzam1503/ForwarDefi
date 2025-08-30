import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { AvalancheService } from './avalanche.service';
import { TransactionSummaryDto } from './dto/transaction.dto';
import { AVALANCHE_CONSTANTS } from './constants';
import { Correlation } from 'src/core/correlation/correlation.decorator';

@Controller('avalanche')
export class AvalancheController {
  private readonly logger = new Logger(AvalancheController.name);

  constructor(private readonly avalancheService: AvalancheService) {}

  /**
   * GET /avalanche/transactions/:walletId
   * Fetches the last 3 months of transactions for a given wallet address
   */
  @Get('transactions/:walletId')
  @HttpCode(HttpStatus.OK)
  async getTransactions(
    @Correlation() correlation_id: string,
    @Param('walletId') walletId: string,
  ): Promise<TransactionSummaryDto> {
    this.logger.log(`Received request for transactions of wallet: ${walletId}`);

    try {
      const result = await this.avalancheService.getTransactions(walletId);
      this.logger.log(
        `Successfully retrieved ${result.totalTransactions} transactions for wallet: ${walletId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error retrieving transactions for wallet ${walletId}: ${error.message}`,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        AVALANCHE_CONSTANTS.ERROR_MESSAGES.API_FAILURE,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /avalanche/health
   * Health check endpoint for the Avalanche service
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async healthCheck(
    @Correlation() correlation_id: string,
  ): Promise<{ status: string; timestamp: string }> {
    return await this.avalancheService.healthCheck();
  }
}
