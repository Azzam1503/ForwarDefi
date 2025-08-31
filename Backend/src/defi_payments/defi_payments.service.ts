import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, Contract, Provider, Wallet } from 'ethers';
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
import {
  BNPLOrder,
  BNPLTier,
  QuoteResult,
  NetworkInfo,
  TransactionResult,
  OrderCreationResult,
  RawOrder,
  QuoteResponse,
} from './interfaces/defi.interface';

@Injectable()
export class DefiPaymentsService implements OnModuleInit, OnModuleDestroy {
  private provider: Provider;
  private contract: Contract;
  private tokenContract: Contract;
  private wallet: Wallet;
  private eventListeners: Array<() => void> = [];

  private readonly contractABI = [
    // View functions
    'function getOrder(uint256 id) external view returns (tuple(address buyer, address merchant, uint256 principal, uint256 collateral, uint256 totalFee, uint256 createdAt, uint256 dueAt, uint256 installments, uint256 nominalPrincipal, uint256 nominalFee, uint256 paidPrincipal, uint256 paidFee, uint256 paidInstallments, bool closed))',
    'function quote(uint256 purchaseAmount, address buyer) external view returns (uint256 collateralRequired, uint256 totalFee)',
    'function creditScore(address who) external view returns (uint16)',
    'function availableLiquidity() external view returns (uint256)',
    'function totalDue(uint256 id) external view returns (uint256)',
    'function tiers(uint256 index) external view returns (tuple(uint256 minScore, uint16 collateralBps, uint16 feeBps, uint256 maxLoan))',
    'function getTiersCount() external view returns (uint256)',
    'function nominalInstallment(uint256 id) external view returns (uint256 principalPart, uint256 feePart)',

    // Transaction functions
    'function createOrder(uint256 purchaseAmount, address merchant, uint256 dueAt, uint256 installments) external returns (uint256)',
    'function repayInstallment(uint256 id, uint256 amount) external',
    'function repayFull(uint256 id) external',
    'function liquidate(uint256 id) external',

    // Admin functions
    'function fundLiquidity(uint256 amount) external',
    'function withdrawLiquidity(address to, uint256 amount) external',
    'function setCreditScore(address who, uint16 score) external',
    'function setTier(uint256 idx, uint256 minScore, uint16 collateralBps, uint16 feeBps, uint256 maxLoan) external',

    // Events
    'event OrderCreated(uint256 indexed id, address indexed buyer, address indexed merchant, uint256 principal, uint256 collateral, uint256 totalFee, uint256 dueAt, uint256 installments)',
    'event InstallmentPaid(uint256 indexed id, address indexed payer, uint256 amount, uint256 paidPrincipal, uint256 paidFee)',
    'event OrderFullyRepaid(uint256 indexed id, address indexed payer, uint256 totalPaid, uint256 feeDiscount)',
    'event OrderLiquidated(uint256 indexed id, uint256 seizedCollateral)',
    'event CreditScoreUpdated(address indexed who, uint16 oldScore, uint16 newScore)',
    'event LiquidityFunded(address indexed funder, uint256 amount)',
    'event LiquidityWithdrawn(address indexed to, uint256 amount)',
  ];

  private readonly tokenABI = [
    // ERC20 standard functions
    'function name() external view returns (string)',
    'function symbol() external view returns (string)',
    'function decimals() external view returns (uint8)',
    'function totalSupply() external view returns (uint256)',
    'function balanceOf(address account) external view returns (uint256)',
    'function allowance(address owner, address spender) external view returns (uint256)',
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function transfer(address to, uint256 amount) external returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) external returns (bool)',

    // MockUSDC specific functions
    'function mint(address to, uint256 amount) external',

    // Events
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
  ];

  constructor(
    private configService: ConfigService,
    private readonly logger: CustomLogger,
  ) {}

  async onModuleInit() {
    const correlation_id = 'module-init';
    this.logger.setContext(this.constructor.name + '/onModuleInit');
    try {
      this.logger.debug(correlation_id, 'Starting BNPL Service initialization');
      await this.initializeProvider();
      await this.initializeContract();
      this.setupEventListeners(correlation_id);
      this.logger.debug(
        correlation_id,
        'BNPL Service initialized successfully',
      );
    } catch (error) {
      this.logger.error(
        correlation_id,
        'Failed to initialize BNPL Service:',
        error,
      );
      throw error;
    }
  }

  onModuleDestroy() {
    const correlation_id = 'module-destroy';
    this.logger.setContext(this.constructor.name + '/onModuleDestroy');
    this.removeEventListeners();
    this.logger.debug(correlation_id, 'BNPL Service destroyed');
  }

  private async initializeProvider() {
    const correlation_id = 'provider-init';
    this.logger.setContext(this.constructor.name + '/initializeProvider');
    const rpcUrl =
      this.configService.get<string>('AVALANCHE_RPC_URL') ||
      'https://api.avax.network/ext/bc/C/rpc';
    this.provider = new ethers.JsonRpcProvider(rpcUrl, 43113, {
      polling: true,
    });

    // Test connection
    const network = await this.provider.getNetwork();
    this.logger.debug(
      correlation_id,
      `Connected to network: ${network.name} (${network.chainId})`,
    );

    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    if (privateKey) {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      const address = await this.wallet.getAddress();
      this.logger.debug(correlation_id, `Wallet initialized: ${address}`);
    } else {
      this.logger.debug(
        correlation_id,
        'No private key provided - read-only mode',
      );
    }
  }

  private async initializeContract() {
    const correlation_id = 'contract-init';
    this.logger.setContext(this.constructor.name + '/initializeContract');
    const contractAddress = this.configService.get<string>(
      'BNPL_CONTRACT_ADDRESS',
    );
    if (!contractAddress) {
      throw new Error('BNPL_CONTRACT_ADDRESS not configured');
    }

    const tokenAddress = this.configService.get<string>(
      'TOKEN_CONTRACT_ADDRESS',
    );
    if (!tokenAddress) {
      throw new Error('TOKEN_CONTRACT_ADDRESS not configured');
    }

    const signer = this.wallet || this.provider;
    this.contract = new ethers.Contract(
      contractAddress,
      this.contractABI,
      signer,
    );
    this.tokenContract = new ethers.Contract(
      tokenAddress,
      this.tokenABI,
      signer,
    );

    // Test contract connection
    try {
      await this.contract.getTiersCount();
      this.logger.debug(
        correlation_id,
        `BNPL contract initialized at ${contractAddress}`,
      );
      await this.tokenContract.name();
      this.logger.debug(
        correlation_id,
        `Token contract initialized at ${tokenAddress}`,
      );
    } catch (error) {
      throw new Error(
        `Failed to connect to contract at ${contractAddress}: ${error?.message}`,
      );
    }
  }

  // ==================== TOKEN FUNCTIONS ====================

  async getTokenBalance(
    correlation_id: string,
    address: string,
  ): Promise<{ balance: string; formatted: string }> {
    try {
      const balance = await this.tokenContract.balanceOf(address);
      return {
        balance: balance.toString(),
        formatted: this.formatTokenAmount(balance.toString()),
      };
    } catch (error) {
      this.logger.error(
        correlation_id,
        `Failed to get token balance for ${address}:`,
        error,
      );
      throw new Error(`Failed to get token balance: ${error.message}`);
    }
  }

  async getTokenAllowance(
    correlation_id: string,
    owner: string,
    spender: string,
  ): Promise<{ allowance: string; formatted: string }> {
    try {
      const allowance = await this.tokenContract.allowance(owner, spender);
      return {
        allowance: allowance.toString(),
        formatted: this.formatTokenAmount(allowance.toString()),
      };
    } catch (error) {
      this.logger.error(
        correlation_id,
        `Failed to get allowance for ${owner} -> ${spender}:`,
        { error },
      );
      throw new Error(`Failed to get allowance: ${error.message}`);
    }
  }

  async getTokenInfo(): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
  }> {
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.tokenContract.name(),
        this.tokenContract.symbol(),
        this.tokenContract.decimals(),
        this.tokenContract.totalSupply(),
      ]);

      // Ensure all values are properly serialized
      const result = {
        name: String(name),
        symbol: String(symbol),
        decimals: Number(decimals),
        totalSupply: totalSupply.toString(),
      };

      return this.serializeForJSON(result);
    } catch (error) {
      this.logger.error('Failed to get token info:', error);
      throw new Error(`Failed to get token info: ${error.message}`);
    }
  }

  async mintTokens(
    correlation_id: string,
    to: string,
    amount: string,
  ): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      const tx = await this.tokenContract.mint(to, amount);
      await tx.wait();

      this.logger.debug(
        correlation_id,
        `Tokens minted to ${to}: ${this.formatTokenAmount(amount)}, tx: ${tx.hash}`,
      );
      return tx.hash;
    } catch (error) {
      this.logger.error(`Failed to mint tokens to ${to}:`, error);
      throw new Error(`Failed to mint tokens: ${error.message}`);
    }
  }

  async approveTokens(
    correlation_id: string,
    spender: string,
    amount: string,
  ): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      const tx = await this.tokenContract.approve(spender, amount);
      await tx.wait();

      this.logger.debug(
        correlation_id,
        `Tokens approved for ${spender}: ${this.formatTokenAmount(amount)}, tx: ${tx.hash}`,
      );
      return tx.hash;
    } catch (error) {
      this.logger.error(`Failed to approve tokens for ${spender}:`, error);
      throw new Error(`Failed to approve tokens: ${error.message}`);
    }
  }

  // Helper function to check if user has sufficient balance and allowance
  async checkUserTokenStatus(
    correlation_id: string,
    userAddress: string,
  ): Promise<{
    balance: string;
    allowance: string;
    hasBalance: boolean;
    hasAllowance: boolean;
    formattedBalance: string;
    formattedAllowance: string;
  }> {
    try {
      const contractAddress = this.configService.get<string>(
        'BNPL_CONTRACT_ADDRESS',
      ) as string;
      const [balanceResult, allowanceResult] = await Promise.all([
        this.getTokenBalance(correlation_id, userAddress),
        this.getTokenAllowance(correlation_id, userAddress, contractAddress),
      ]);

      return {
        balance: balanceResult.balance,
        allowance: allowanceResult.allowance,
        hasBalance: BigInt(balanceResult.balance) > 0n,
        hasAllowance: BigInt(allowanceResult.allowance) > 0n,
        formattedBalance: balanceResult.formatted,
        formattedAllowance: allowanceResult.formatted,
      };
    } catch (error) {
      this.logger.error(
        `Failed to check token status for ${userAddress}:`,
        error,
      );
      throw new Error(`Failed to check token status: ${error.message}`);
    }
  }

  // ==================== READ FUNCTIONS ====================

  async getOrder(correlation_id: string, orderId: string): Promise<BNPLOrder> {
    this.logger.setContext(this.constructor.name + '/getOrder');
    this.logger.debug(correlation_id, `Fetching order: ${orderId}`);

    try {
      const order = (await this.contract.getOrder(orderId)) as RawOrder;
      this.logger.debug(
        correlation_id,
        `Order retrieved successfully: ${orderId}`,
      );
      return {
        buyer: order.buyer,
        merchant: order.merchant,
        principal: order.principal.toString(),
        collateral: order.collateral.toString(),
        totalFee: order.totalFee.toString(),
        createdAt: order.createdAt.toString(),
        dueAt: order.dueAt.toString(),
        installments: order.installments.toString(),
        nominalPrincipal: order.nominalPrincipal.toString(),
        nominalFee: order.nominalFee.toString(),
        paidPrincipal: order.paidPrincipal.toString(),
        paidFee: order.paidFee.toString(),
        paidInstallments: order.paidInstallments.toString(),
        closed: order.closed,
      };
    } catch (error) {
      this.logger.error(
        correlation_id,
        `Failed to get order ${orderId}:`,
        error,
      );
      throw new Error(`Failed to retrieve order: ${error?.message}`);
    }
  }

  async getQuote(correlation_id: string, dto: QuoteDto): Promise<QuoteResult> {
    this.logger.setContext(this.constructor.name + '/getQuote');
    this.logger.debug(
      correlation_id,
      `Getting quote for buyer: ${dto.buyer}, amount: ${dto.purchaseAmount}`,
    );

    try {
      const result = (await this.contract.quote(
        dto.purchaseAmount,
        dto.buyer,
      )) as QuoteResponse;
      this.logger.debug(
        correlation_id,
        `Quote retrieved successfully for buyer: ${dto.buyer}`,
      );
      return {
        collateralRequired: String(result.collateralRequired),
        totalFee: String(result.totalFee),
      };
    } catch (error) {
      this.logger.error(correlation_id, 'Failed to get quote:', error);
      throw new Error(
        `Failed to get quote: ${error && typeof error === 'object' && 'message' in error ? error.message : String(error)}`,
      );
    }
  }

  async getCreditScore(
    correlation_id: string,
    address: string,
  ): Promise<number> {
    this.logger.setContext(this.constructor.name + '/getCreditScore');
    this.logger.debug(
      correlation_id,
      `Getting credit score for address: ${address}`,
    );

    try {
      const score = (await this.contract.creditScore(address)) as number;
      this.logger.debug(
        correlation_id,
        `Credit score retrieved successfully for address: ${address}`,
      );
      return Number(score);
    } catch (error) {
      this.logger.error(
        correlation_id,
        `Failed to get credit score for ${address}:`,
        error,
      );
      throw new Error(`Failed to get credit score: ${error?.message}`);
    }
  }

  async getAvailableLiquidity(correlation_id: string): Promise<string> {
    this.logger.setContext(this.constructor.name + '/getAvailableLiquidity');
    this.logger.debug(correlation_id, 'Getting available liquidity');

    try {
      const liquidity = await this.contract.availableLiquidity();
      this.logger.debug(
        correlation_id,
        `Available liquidity retrieved: ${liquidity.toString()}`,
      );
      return liquidity.toString();
    } catch (error) {
      this.logger.error(
        correlation_id,
        'Failed to get available liquidity:',
        error,
      );
      throw new Error(`Failed to get liquidity: ${error?.message}`);
    }
  }

  async getTotalDue(correlation_id: string, orderId: string): Promise<string> {
    this.logger.setContext(this.constructor.name + '/getTotalDue');
    this.logger.debug(
      correlation_id,
      `Getting total due for order: ${orderId}`,
    );

    try {
      const due = await this.contract.totalDue(orderId);
      this.logger.debug(
        correlation_id,
        `Total due retrieved for order ${orderId}: ${String(due)}`,
      );
      return String(due);
    } catch (error) {
      this.logger.error(
        correlation_id,
        `Failed to get total due for order ${orderId}:`,
        error,
      );
      throw new Error(`Failed to get total due: ${error?.message}`);
    }
  }

  async getNominalInstallment(
    correlation_id: string,
    orderId: string,
  ): Promise<{ principalPart: string; feePart: string }> {
    this.logger.setContext(this.constructor.name + '/getNominalInstallment');
    this.logger.debug(
      correlation_id,
      `Getting nominal installment for order: ${orderId}`,
    );

    try {
      const result = await this.contract.nominalInstallment(orderId);
      this.logger.debug(
        correlation_id,
        `Nominal installment retrieved for order ${orderId}`,
      );
      return {
        principalPart: result.principalPart.toString(),
        feePart: result.feePart.toString(),
      };
    } catch (error) {
      this.logger.error(
        correlation_id,
        `Failed to get nominal installment for order ${orderId}:`,
        error,
      );
      throw new Error(`Failed to get nominal installment: ${error?.message}`);
    }
  }

  async getTiers(correlation_id: string): Promise<BNPLTier[]> {
    this.logger.setContext(this.constructor.name + '/getTiers');
    this.logger.debug(correlation_id, 'Getting all tiers');

    try {
      const count = await this.contract.getTiersCount();
      this.logger.debug(correlation_id, `Found ${count} tiers`);
      const tiers: BNPLTier[] = [];

      for (let i = 0; i < count; i++) {
        const tier = await this.contract.tiers(i);
        tiers.push({
          minScore: tier.minScore.toString(),
          collateralBps: Number(tier.collateralBps),
          feeBps: Number(tier.feeBps),
          maxLoan: tier.maxLoan.toString(),
        });
      }

      this.logger.debug(
        correlation_id,
        `Successfully retrieved ${tiers.length} tiers`,
      );
      return tiers;
    } catch (error) {
      this.logger.error(correlation_id, 'Failed to get tiers:', error);
      throw new Error(`Failed to get tiers: ${error?.message}`);
    }
  }

  // ==================== TRANSACTION FUNCTIONS ====================

  async createOrder(
    correlation_id: string,
    dto: CreateOrderDto,
    buyerAddress: string,
  ): Promise<OrderCreationResult> {
    this.logger.setContext(this.constructor.name + '/createOrder');
    this.logger.debug(
      correlation_id,
      `Creating order for buyer: ${buyerAddress}, amount: ${dto.purchaseAmount}`,
    );

    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      const dueAt = Math.floor(Date.now() / 1000) + parseInt(dto.dueInSeconds);
      this.logger.debug(correlation_id, `Calculated due date: ${dueAt}`);

      // Estimate gas first
      this.logger.debug(correlation_id, 'Estimating gas for order creation');
      const gasEstimate = await this.contract.createOrder.estimateGas(
        dto.purchaseAmount,
        dto.merchant,
        dueAt,
        dto.installments,
      );

      this.logger.debug(
        correlation_id,
        `Gas estimate: ${gasEstimate}, proceeding with transaction`,
      );
      const tx = await this.contract.createOrder(
        dto.purchaseAmount,
        dto.merchant,
        dueAt,
        dto.installments,
        { gasLimit: (gasEstimate * BigInt(120)) / BigInt(100) }, // 20% buffer
      );

      this.logger.debug(
        correlation_id,
        `Transaction sent: ${tx.hash}, waiting for confirmation`,
      );
      const receipt = await tx.wait();

      // Parse the OrderCreated event to get the order ID
      const orderCreatedEvent = receipt.logs.find((log) => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed?.name === 'OrderCreated';
        } catch {
          return false;
        }
      });

      let orderId = '0';
      if (orderCreatedEvent) {
        const parsed = this.contract.interface.parseLog(orderCreatedEvent);
        orderId = parsed?.args.id.toString();
      }

      this.logger.debug(
        correlation_id,
        `Order created successfully: ${orderId}, tx: ${tx.hash}`,
      );
      return { orderId, txHash: tx.hash };
    } catch (error) {
      this.logger.error(correlation_id, 'Failed to create order:', error);
      throw new Error(`Failed to create order: ${error?.message}`);
    }
  }

  async repayInstallment(
    correlation_id: string,
    dto: RepayInstallmentDto,
  ): Promise<string> {
    this.logger.setContext(this.constructor.name + '/repayInstallment');
    this.logger.debug(
      correlation_id,
      `Repaying installment for order: ${dto.orderId}, amount: ${dto.amount}`,
    );

    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      this.logger.debug(
        correlation_id,
        'Estimating gas for installment repayment',
      );
      const gasEstimate = await this.contract.repayInstallment.estimateGas(
        dto.orderId,
        dto.amount,
      );

      this.logger.debug(
        correlation_id,
        `Gas estimate: ${gasEstimate}, proceeding with transaction`,
      );
      const tx = await this.contract.repayInstallment(dto.orderId, dto.amount, {
        gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
      });
      this.logger.debug(
        correlation_id,
        `Transaction sent: ${tx.hash}, waiting for confirmation`,
      );
      await tx.wait();

      this.logger.debug(
        correlation_id,
        `Installment repaid for order ${dto.orderId}, tx: ${tx.hash}`,
      );
      return tx.hash;
    } catch (error) {
      this.logger.error(
        correlation_id,
        `Failed to repay installment for order ${dto.orderId}:`,
        error,
      );
      throw new Error(`Failed to repay installment: ${error?.message}`);
    }
  }

  async repayFull(correlation_id: string, orderId: string): Promise<string> {
    this.logger.setContext(this.constructor.name + '/repayFull');
    this.logger.debug(
      correlation_id,
      `Repaying full amount for order: ${orderId}`,
    );

    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      this.logger.debug(correlation_id, 'Estimating gas for full repayment');
      const gasEstimate = await this.contract.repayFull.estimateGas(orderId);

      this.logger.debug(
        correlation_id,
        `Gas estimate: ${gasEstimate}, proceeding with transaction`,
      );
      const tx = await this.contract.repayFull(orderId, {
        gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
      });
      this.logger.debug(
        correlation_id,
        `Transaction sent: ${tx.hash}, waiting for confirmation`,
      );
      await tx.wait();

      this.logger.debug(
        correlation_id,
        `Full repayment completed for order ${orderId}, tx: ${tx.hash}`,
      );
      return tx.hash;
    } catch (error) {
      this.logger.error(
        correlation_id,
        `Failed to repay full for order ${orderId}:`,
        error,
      );
      throw new Error(`Failed to repay full: ${error?.message}`);
    }
  }

  async liquidateOrder(
    correlation_id: string,
    orderId: string,
  ): Promise<string> {
    this.logger.setContext(this.constructor.name + '/liquidateOrder');
    this.logger.debug(correlation_id, `Liquidating order: ${orderId}`);

    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      this.logger.debug(correlation_id, 'Estimating gas for liquidation');
      const gasEstimate = await this.contract.liquidate.estimateGas(orderId);

      this.logger.debug(
        correlation_id,
        `Gas estimate: ${gasEstimate}, proceeding with transaction`,
      );
      const tx = await this.contract.liquidate(orderId, {
        gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
      });
      this.logger.debug(
        correlation_id,
        `Transaction sent: ${tx.hash}, waiting for confirmation`,
      );
      await tx.wait();

      this.logger.debug(
        correlation_id,
        `Order ${orderId} liquidated, tx: ${tx.hash}`,
      );
      return tx.hash;
    } catch (error) {
      this.logger.error(
        correlation_id,
        `Failed to liquidate order ${orderId}:`,
        error,
      );
      throw new Error(`Failed to liquidate order: ${error?.message}`);
    }
  }

  // ==================== ADMIN FUNCTIONS ====================

  async fundLiquidity(
    correlation_id: string,
    dto: FundLiquidityDto,
  ): Promise<string> {
    this.logger.setContext(this.constructor.name + '/fundLiquidity');
    this.logger.debug(correlation_id, `Funding liquidity: ${dto.amount}`);

    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      this.logger.debug(correlation_id, 'Estimating gas for liquidity funding');
      const gasEstimate = await this.contract.fundLiquidity.estimateGas(
        dto.amount,
      );

      this.logger.debug(
        correlation_id,
        `Gas estimate: ${gasEstimate}, proceeding with transaction`,
      );
      const tx = await this.contract.fundLiquidity(dto.amount, {
        gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
      });
      this.logger.debug(
        correlation_id,
        `Transaction sent: ${tx.hash}, waiting for confirmation`,
      );
      await tx.wait();

      this.logger.debug(
        correlation_id,
        `Liquidity funded: ${dto.amount}, tx: ${tx.hash}`,
      );
      return tx.hash;
    } catch (error) {
      this.logger.error(correlation_id, 'Failed to fund liquidity:', error);
      throw new Error(`Failed to fund liquidity: ${error?.message}`);
    }
  }

  async withdrawLiquidity(
    correlation_id: string,
    dto: WithdrawLiquidityDto,
  ): Promise<string> {
    this.logger.setContext(this.constructor.name + '/withdrawLiquidity');
    this.logger.debug(
      correlation_id,
      `Withdrawing liquidity: ${dto.amount} to ${dto.to}`,
    );

    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      this.logger.debug(
        correlation_id,
        'Estimating gas for liquidity withdrawal',
      );
      const gasEstimate = await this.contract.withdrawLiquidity.estimateGas(
        dto.to,
        dto.amount,
      );

      this.logger.debug(
        correlation_id,
        `Gas estimate: ${gasEstimate}, proceeding with transaction`,
      );
      const tx = await this.contract.withdrawLiquidity(dto.to, dto.amount, {
        gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
      });
      this.logger.debug(
        correlation_id,
        `Transaction sent: ${tx.hash}, waiting for confirmation`,
      );
      await tx.wait();

      this.logger.debug(
        correlation_id,
        `Liquidity withdrawn: ${dto.amount} to ${dto.to}, tx: ${tx.hash}`,
      );
      return tx.hash;
    } catch (error) {
      this.logger.error(correlation_id, 'Failed to withdraw liquidity:', error);
      throw new Error(`Failed to withdraw liquidity: ${error?.message}`);
    }
  }

  async setCreditScore(
    correlation_id: string,
    dto: SetCreditScoreDto,
  ): Promise<string> {
    this.logger.setContext(this.constructor.name + '/setCreditScore');
    this.logger.debug(
      correlation_id,
      `Setting credit score for ${dto.address}: ${dto.score}`,
    );

    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      this.logger.debug(
        correlation_id,
        'Estimating gas for credit score setting',
      );
      const gasEstimate = await this.contract.setCreditScore.estimateGas(
        dto.address,
        dto.score,
      );

      this.logger.debug(
        correlation_id,
        `Gas estimate: ${gasEstimate}, proceeding with transaction`,
      );
      const tx = await this.contract.setCreditScore(dto.address, dto.score, {
        gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
      });
      this.logger.debug(
        correlation_id,
        `Transaction sent: ${tx.hash}, waiting for confirmation`,
      );
      await tx.wait();

      this.logger.debug(
        correlation_id,
        `Credit score set for ${dto.address}: ${dto.score}, tx: ${tx.hash}`,
      );
      return tx.hash;
    } catch (error) {
      this.logger.error(
        correlation_id,
        `Failed to set credit score for ${dto.address}:`,
        error,
      );
      throw new Error(`Failed to set credit score: ${error?.message}`);
    }
  }

  async setTier(correlation_id: string, dto: SetTierDto): Promise<string> {
    this.logger.setContext(this.constructor.name + '/setTier');
    this.logger.debug(
      correlation_id,
      `Setting tier ${dto.idx} with parameters: minScore=${dto.minScore}, collateralBps=${dto.collateralBps}, feeBps=${dto.feeBps}, maxLoan=${dto.maxLoan}`,
    );

    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      this.logger.debug(correlation_id, 'Estimating gas for tier setting');
      const gasEstimate = await this.contract.setTier.estimateGas(
        dto.idx,
        dto.minScore,
        dto.collateralBps,
        dto.feeBps,
        dto.maxLoan,
      );

      this.logger.debug(
        correlation_id,
        `Gas estimate: ${gasEstimate}, proceeding with transaction`,
      );
      const tx = await this.contract.setTier(
        dto.idx,
        dto.minScore,
        dto.collateralBps,
        dto.feeBps,
        dto.maxLoan,
        { gasLimit: (gasEstimate * BigInt(120)) / BigInt(100) },
      );
      this.logger.debug(
        correlation_id,
        `Transaction sent: ${tx.hash}, waiting for confirmation`,
      );
      await tx.wait();

      this.logger.debug(
        correlation_id,
        `Tier ${dto.idx} updated, tx: ${tx.hash}`,
      );
      return tx.hash;
    } catch (error) {
      this.logger.error(
        correlation_id,
        `Failed to set tier ${dto.idx}:`,
        error,
      );
      throw new Error(`Failed to set tier: ${error?.message}`);
    }
  }

  // ==================== EVENT LISTENING ====================

  setupEventListeners(correlation_id: string) {
    this.logger.setContext(this.constructor.name + '/setupEventListeners');
    this.logger.debug(correlation_id, 'Setting up event listeners');

    if (!this.contract) return;

    const orderCreatedListener = (
      id,
      buyer,
      merchant,
      principal,
      collateral,
      totalFee,
      dueAt,
      installments,
      event,
    ) => {
      this.logger.debug(
        correlation_id,
        `Event: Order Created - ID: ${id}, Buyer: ${buyer}, Principal: ${this.formatTokenAmount(principal.toString())} USDC`,
      );
    };

    const installmentPaidListener = (
      id,
      payer,
      amount,
      paidPrincipal,
      paidFee,
      event,
    ) => {
      this.logger.debug(
        correlation_id,
        `Event: Installment Paid - Order: ${id}, Amount: ${this.formatTokenAmount(amount.toString())} USDC`,
      );
    };

    const orderFullyRepaidListener = (
      id,
      payer,
      totalPaid,
      feeDiscount,
      event,
    ) => {
      this.logger.debug(
        correlation_id,
        `Event: Order Fully Repaid - Order: ${id}, Total: ${this.formatTokenAmount(totalPaid.toString())} USDC`,
      );
    };

    const orderLiquidatedListener = (id, seizedCollateral, event) => {
      this.logger.debug(
        correlation_id,
        `Event: Order Liquidated - Order: ${id}, Seized: ${this.formatTokenAmount(seizedCollateral.toString())} USDC`,
      );
    };

    const creditScoreUpdatedListener = (who, oldScore, newScore, event) => {
      this.logger.debug(
        correlation_id,
        `Event: Credit Score Updated - Address: ${who}, Old: ${oldScore}, New: ${newScore}`,
      );
    };

    const liquidityFundedListener = (funder, amount, event) => {
      this.logger.debug(
        correlation_id,
        `Event: Liquidity Funded - Funder: ${funder}, Amount: ${this.formatTokenAmount(amount.toString())} USDC`,
      );
    };

    const liquidityWithdrawnListener = (to, amount, event) => {
      this.logger.debug(
        correlation_id,
        `Event: Liquidity Withdrawn - To: ${to}, Amount: ${this.formatTokenAmount(amount.toString())} USDC`,
      );
    };

    // Set up listeners
    void this.contract.on('OrderCreated', orderCreatedListener);
    void this.contract.on('InstallmentPaid', installmentPaidListener);
    void this.contract.on('OrderFullyRepaid', orderFullyRepaidListener);
    void this.contract.on('OrderLiquidated', orderLiquidatedListener);
    void this.contract.on('CreditScoreUpdated', creditScoreUpdatedListener);
    void this.contract.on('LiquidityFunded', liquidityFundedListener);
    void this.contract.on('LiquidityWithdrawn', liquidityWithdrawnListener);

    // Store cleanup functions
    this.eventListeners = [
      () => this.contract.off('OrderCreated', orderCreatedListener),
      () => this.contract.off('InstallmentPaid', installmentPaidListener),
      () => this.contract.off('OrderFullyRepaid', orderFullyRepaidListener),
      () => this.contract.off('OrderLiquidated', orderLiquidatedListener),
      () => this.contract.off('CreditScoreUpdated', creditScoreUpdatedListener),
      () => this.contract.off('LiquidityFunded', liquidityFundedListener),
      () => this.contract.off('LiquidityWithdrawn', liquidityWithdrawnListener),
    ];

    this.logger.debug(correlation_id, 'Event listeners setup complete');
  }

  private removeEventListeners() {
    this.eventListeners.forEach((cleanup) => cleanup());
    this.eventListeners = [];
  }

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Safely convert any value to a JSON-serializable format
   * This handles BigInt, BigNumber, and other non-serializable types
   */
  private serializeForJSON(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.map((item) => this.serializeForJSON(item));
      }

      const serialized: any = {};
      for (const [key, val] of Object.entries(value)) {
        serialized[key] = this.serializeForJSON(val);
      }
      return serialized;
    }

    return value;
  }

  formatTokenAmount(amount: string, decimals: number = 6): string {
    return ethers.formatUnits(amount, decimals);
  }

  parseTokenAmount(amount: string, decimals: number = 6): string {
    return ethers.parseUnits(amount, decimals).toString();
  }

  async getNetworkInfo(): Promise<NetworkInfo> {
    const correlation_id = 'network-info';
    this.logger.setContext(this.constructor.name + '/getNetworkInfo');
    this.logger.debug(correlation_id, 'Getting network information');

    try {
      const network = await this.provider.getNetwork();
      const feeData = await this.provider.getFeeData();
      this.logger.debug(
        correlation_id,
        `Network info retrieved: ${network.name} (${network.chainId})`,
      );
      return {
        chainId: network.chainId.toString(),
        name: network.name,
        gasPrice: feeData.gasPrice?.toString() || '0',
      };
    } catch (error) {
      this.logger.error(correlation_id, 'Failed to get network info:', error);
      throw new Error(`Failed to get network info: ${error?.message}`);
    }
  }

  async getWalletBalance(): Promise<string> {
    const correlation_id = 'wallet-balance';
    this.logger.setContext(this.constructor.name + '/getWalletBalance');
    this.logger.debug(correlation_id, 'Getting wallet balance');

    if (!this.wallet) {
      throw new Error('Wallet not configured');
    }

    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      const formattedBalance = ethers.formatEther(balance);
      this.logger.debug(
        correlation_id,
        `Wallet balance retrieved: ${formattedBalance} AVAX`,
      );
      return formattedBalance;
    } catch (error) {
      this.logger.error(correlation_id, 'Failed to get wallet balance:', error);
      throw new Error(`Failed to get wallet balance: ${error?.message}`);
    }
  }

  isTransactionMode(): boolean {
    return !!this.wallet;
  }

  getContractAddress(): string {
    return (this.contract?.target as string) || 'Not initialized';
  }

  getWalletAddress(): string {
    return this.wallet?.address || 'No wallet configured';
  }
}
