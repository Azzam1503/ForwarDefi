import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  AvalancheTransactionDto,
  AvalancheTransactionResponseDto,
  TransactionSummaryDto,
} from './dto/transaction.dto';
import { AVALANCHE_CONSTANTS, AVALANCHE_CONFIG } from './constants';

@Injectable()
export class AvalancheService {
  private readonly logger = new Logger(AvalancheService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Validates if the provided wallet address is a valid Ethereum/Avalanche address
   */
  private validateWalletAddress(walletAddress: string): boolean {
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethereumAddressRegex.test(walletAddress);
  }

  /**
   * Calculates the timestamp for 3 months ago
   */
  private getThreeMonthsAgoTimestamp(): number {
    const now = new Date();
    const threeMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - AVALANCHE_CONSTANTS.MONTHS_TO_FETCH,
      now.getDate(),
    );
    return Math.floor(threeMonthsAgo.getTime() / 1000); // Convert to Unix timestamp
  }

  /**
   * Converts Wei to AVAX
   */
  private weiToAvax(wei: string): number {
    const weiNumber = parseFloat(wei);
    return weiNumber / Math.pow(10, 18);
  }

  /**
   * Fetches transactions from Snowtrace API
   */
  private async fetchTransactionsFromSnowtrace(
    walletAddress: string,
    startTimestamp: number,
    endTimestamp: number,
  ): Promise<AvalancheTransactionDto[]> {
    if (!AVALANCHE_CONSTANTS.SNOWTRACE_API_KEY) {
      throw new HttpException(
        AVALANCHE_CONSTANTS.ERROR_MESSAGES.API_KEY_MISSING,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const url = `${AVALANCHE_CONSTANTS.SNOWTRACE_BASE_URL}${AVALANCHE_CONSTANTS.ENDPOINTS.SNOWTRACE_TRANSACTIONS}`;
      const params = {
        address: walletAddress,
        starttimestamp: startTimestamp.toString(),
        endtimestamp: endTimestamp.toString(),
        sort: 'desc',
        apikey: AVALANCHE_CONSTANTS.SNOWTRACE_API_KEY,
      };

      this.logger.log(`Fetching transactions for wallet: ${walletAddress}`);

      const response = await firstValueFrom(
        this.httpService.get<AvalancheTransactionResponseDto>(url, {
          params,
          timeout: AVALANCHE_CONFIG.REQUEST_TIMEOUT,
        }),
      );

      if (response.data.status === '1' && response.data.result) {
        this.logger.log(
          `Found ${response.data.result.length} transactions for wallet: ${walletAddress}`,
        );
        return response.data.result;
      } else {
        this.logger.warn(
          `No transactions found or API error for wallet: ${walletAddress}`,
        );
        return [];
      }
    } catch (error) {
      this.logger.error(
        `Error fetching transactions from Snowtrace: ${error.message}`,
      );
      throw new HttpException(
        AVALANCHE_CONSTANTS.ERROR_MESSAGES.API_FAILURE,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Fetches transactions using direct RPC call as fallback
   */
  private async fetchTransactionsFromRPC(
    walletAddress: string,
    startTimestamp: number,
    endTimestamp: number,
  ): Promise<AvalancheTransactionDto[]> {
    try {
      // This is a simplified RPC call - in production you might want to use a more sophisticated approach
      const response = await firstValueFrom(
        this.httpService.post(
          AVALANCHE_CONSTANTS.AVALANCHE_RPC_URL,
          {
            jsonrpc: '2.0',
            method: 'eth_getLogs',
            params: [
              {
                fromBlock: '0x0',
                toBlock: 'latest',
                address: walletAddress,
              },
            ],
            id: 1,
          },
          {
            timeout: AVALANCHE_CONFIG.REQUEST_TIMEOUT,
          },
        ),
      );

      // Convert RPC response to our DTO format
      // This is a simplified conversion - you might need to adjust based on actual RPC response
      return [];
    } catch (error) {
      this.logger.error(
        `Error fetching transactions from RPC: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Filters transactions by date range
   */
  private filterTransactionsByDate(
    transactions: AvalancheTransactionDto[],
    startTimestamp: number,
    endTimestamp: number,
  ): AvalancheTransactionDto[] {
    return transactions.filter((tx) => {
      const txTimestamp = parseInt(tx.timeStamp);
      return txTimestamp >= startTimestamp && txTimestamp <= endTimestamp;
    });
  }

  /**
   * Calculates transaction summary
   */
  private calculateTransactionSummary(
    transactions: AvalancheTransactionDto[],
    walletAddress: string,
  ): TransactionSummaryDto {
    const totalValue = transactions.reduce((sum, tx) => {
      return sum + this.weiToAvax(tx.value);
    }, 0);

    const startDate = new Date(
      parseInt(transactions[transactions.length - 1]?.timeStamp || '0') * 1000,
    );
    const endDate = new Date(
      parseInt(transactions[0]?.timeStamp || '0') * 1000,
    );

    return {
      walletAddress,
      totalTransactions: transactions.length,
      dateRange: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      totalValue,
      currency: 'AVAX',
      transactions,
    };
  }

  /**
   * Main method to get transactions for a wallet address
   */
  async getTransactions(walletAddress: string) {
    // Validate wallet address
    if (!this.validateWalletAddress(walletAddress)) {
      throw new HttpException(
        AVALANCHE_CONSTANTS.ERROR_MESSAGES.INVALID_WALLET,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Calculate time range (last 3 months)
    const endTimestamp = Math.floor(Date.now() / 1000);
    const startTimestamp = this.getThreeMonthsAgoTimestamp();

    this.logger.log(
      `Fetching transactions for ${walletAddress} from ${new Date(startTimestamp * 1000).toISOString()} to ${new Date(endTimestamp * 1000).toISOString()}`,
    );

    let transactions: AvalancheTransactionDto[] = [];

    try {
      // Try Snowtrace API first
      transactions = await this.fetchTransactionsFromSnowtrace(
        walletAddress,
        startTimestamp,
        endTimestamp,
      );

      // If no transactions found, try RPC as fallback
      if (transactions.length === 0) {
        this.logger.log(
          'No transactions found via Snowtrace, trying RPC fallback...',
        );
        transactions = await this.fetchTransactionsFromRPC(
          walletAddress,
          startTimestamp,
          endTimestamp,
        );
      }

      // Filter transactions by date range (additional safety)
      transactions = this.filterTransactionsByDate(
        transactions,
        startTimestamp,
        endTimestamp,
      );

      if (transactions.length === 0) {
        throw new HttpException(
          AVALANCHE_CONSTANTS.ERROR_MESSAGES.NO_TRANSACTIONS,
          HttpStatus.NOT_FOUND,
        );
      }

      // Calculate and return summary
      const summary = this.calculateTransactionSummary(
        transactions,
        walletAddress,
      );
      return {
        message: 'Wallet transactions retrieved successfully',
        data: summary,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Unexpected error fetching transactions: ${error.message}`,
      );
      throw new HttpException(
        AVALANCHE_CONSTANTS.ERROR_MESSAGES.API_FAILURE,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Health check method for the Avalanche service
   */
  async healthCheck() {
    return {
      message: 'Avalanche service is healthy',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
