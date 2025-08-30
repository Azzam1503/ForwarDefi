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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('avalanche')
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
  @ApiOperation({
    summary: 'Get wallet transactions',
    description:
      'Fetch the last 3 months of transactions for a given wallet address on Avalanche C-Chain',
  })
  @ApiParam({
    name: 'walletId',
    description: 'Avalanche wallet address',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Wallet transactions retrieved successfully',
        },
        data: {
          type: 'object',
          properties: {
            walletAddress: {
              type: 'string',
              example: '0x1234567890abcdef1234567890abcdef12345678',
            },
            totalTransactions: { type: 'number', example: 25 },
            dateRange: { type: 'string', example: '2024-01-15 to 2024-04-15' },
            totalValue: { type: 'number', example: 1250.75 },
            currency: { type: 'string', example: 'AVAX' },
            transactions: {
              type: 'array',
              items: { $ref: '#/components/schemas/AvalancheTransactionDto' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid wallet address',
  })
  @ApiResponse({
    status: 404,
    description: 'No transactions found for the wallet',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - API failure',
  })
  async getTransactions(
    @Correlation() correlation_id: string,
    @Param('walletId') walletId: string,
  ) {
    this.logger.log(`Received request for transactions of wallet: ${walletId}`);

    try {
      const result = await this.avalancheService.getTransactions(walletId);
      this.logger.log(
        `Successfully retrieved ${result.data.totalTransactions} transactions for wallet: ${walletId}`,
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
  @ApiOperation({
    summary: 'Health check',
    description: 'Check the health status of the Avalanche service',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Avalanche service is healthy' },
        data: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'healthy' },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-04-15T10:30:00.000Z',
            },
          },
        },
      },
    },
  })
  async healthCheck(@Correlation() correlation_id: string) {
    return await this.avalancheService.healthCheck();
  }
}
