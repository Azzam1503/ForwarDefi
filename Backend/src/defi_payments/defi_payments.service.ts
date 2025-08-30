import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers, Contract, Provider, Wallet } from 'ethers';
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
  private readonly logger = new Logger(DefiPaymentsService.name);
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

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      await this.initializeProvider();
      await this.initializeContract();
      this.setupEventListeners();
      this.logger.log('BNPL Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize BNPL Service:', error);
      throw error;
    }
  }

  onModuleDestroy() {
    this.removeEventListeners();
    this.logger.log('BNPL Service destroyed');
  }

  private async initializeProvider() {
    const rpcUrl =
      this.configService.get<string>('AVALANCHE_RPC_URL') ||
      'https://api.avax.network/ext/bc/C/rpc';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    // Test connection
    const network = await this.provider.getNetwork();
    this.logger.log(
      `Connected to network: ${network.name} (${network.chainId})`,
    );

    const privateKey = this.configService.get<string>('PRIVATE_KEY');
    if (privateKey) {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      const address = await this.wallet.getAddress();
      this.logger.log(`Wallet initialized: ${address}`);
    } else {
      this.logger.warn('No private key provided - read-only mode');
    }
  }

  private async initializeContract() {
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
      this.logger.log(`BNPL contract initialized at ${contractAddress}`);
      await this.tokenContract.name();
      this.logger.log(`Token contract initialized at ${tokenAddress}`);
    } catch (error) {
      throw new Error(
        `Failed to connect to contract at ${contractAddress}: ${error?.message}`,
      );
    }
  }

  // ==================== TOKEN FUNCTIONS ====================

  async getTokenBalance(
    address: string,
  ): Promise<{ balance: string; formatted: string }> {
    try {
      const balance = await this.tokenContract.balanceOf(address);
      return {
        balance: balance.toString(),
        formatted: this.formatTokenAmount(balance.toString()),
      };
    } catch (error) {
      this.logger.error(`Failed to get token balance for ${address}:`, error);
      throw new Error(`Failed to get token balance: ${error.message}`);
    }
  }

  async getTokenAllowance(
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
        `Failed to get allowance for ${owner} -> ${spender}:`,
        error,
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

      return {
        name,
        symbol,
        decimals,
        totalSupply: totalSupply.toString(),
      };
    } catch (error) {
      this.logger.error('Failed to get token info:', error);
      throw new Error(`Failed to get token info: ${error.message}`);
    }
  }

  async mintTokens(to: string, amount: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      const tx = await this.tokenContract.mint(to, amount);
      await tx.wait();

      this.logger.log(
        `Tokens minted to ${to}: ${this.formatTokenAmount(amount)}, tx: ${tx.hash}`,
      );
      return tx.hash;
    } catch (error) {
      this.logger.error(`Failed to mint tokens to ${to}:`, error);
      throw new Error(`Failed to mint tokens: ${error.message}`);
    }
  }

  async approveTokens(spender: string, amount: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      const tx = await this.tokenContract.approve(spender, amount);
      await tx.wait();

      this.logger.log(
        `Tokens approved for ${spender}: ${this.formatTokenAmount(amount)}, tx: ${tx.hash}`,
      );
      return tx.hash;
    } catch (error) {
      this.logger.error(`Failed to approve tokens for ${spender}:`, error);
      throw new Error(`Failed to approve tokens: ${error.message}`);
    }
  }

  // Helper function to check if user has sufficient balance and allowance
  async checkUserTokenStatus(userAddress: string): Promise<{
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
        this.getTokenBalance(userAddress),
        this.getTokenAllowance(userAddress, contractAddress),
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

  async getOrder(orderId: string): Promise<BNPLOrder> {
    try {
      const order = (await this.contract.getOrder(orderId)) as RawOrder;
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
      this.logger.error(`Failed to get order ${orderId}:`, error);
      throw new Error(`Failed to retrieve order: ${error?.message}`);
    }
  }

  async getQuote(dto: QuoteDto): Promise<QuoteResult> {
    try {
      const result = (await this.contract.quote(
        dto.purchaseAmount,
        dto.buyer,
      )) as QuoteResponse;
      return {
        collateralRequired: String(result.collateralRequired),
        totalFee: String(result.totalFee),
      };
    } catch (error) {
      this.logger.error('Failed to get quote:', error);
      throw new Error(
        `Failed to get quote: ${error && typeof error === 'object' && 'message' in error ? error.message : String(error)}`,
      );
    }
  }

  async getCreditScore(address: string): Promise<number> {
    try {
      const score = (await this.contract.creditScore(address)) as number;
      return Number(score);
    } catch (error) {
      this.logger.error(`Failed to get credit score for ${address}:`, error);
      throw new Error(`Failed to get credit score: ${error?.message}`);
    }
  }

  async getAvailableLiquidity(): Promise<string> {
    try {
      const liquidity = await this.contract.availableLiquidity();
      return liquidity.toString();
    } catch (error) {
      this.logger.error('Failed to get available liquidity:', error);
      throw new Error(`Failed to get liquidity: ${error?.message}`);
    }
  }

  async getTotalDue(orderId: string): Promise<string> {
    try {
      const due = await this.contract.totalDue(orderId);
      return String(due);
    } catch (error) {
      this.logger.error(`Failed to get total due for order ${orderId}:`, error);
      throw new Error(`Failed to get total due: ${error?.message}`);
    }
  }

  async getNominalInstallment(
    orderId: string,
  ): Promise<{ principalPart: string; feePart: string }> {
    try {
      const result = await this.contract.nominalInstallment(orderId);
      return {
        principalPart: result.principalPart.toString(),
        feePart: result.feePart.toString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get nominal installment for order ${orderId}:`,
        error,
      );
      throw new Error(`Failed to get nominal installment: ${error?.message}`);
    }
  }

  async getTiers(): Promise<BNPLTier[]> {
    try {
      const count = await this.contract.getTiersCount();
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

      return tiers;
    } catch (error) {
      this.logger.error('Failed to get tiers:', error);
      throw new Error(`Failed to get tiers: ${error?.message}`);
    }
  }

  // ==================== TRANSACTION FUNCTIONS ====================

  async createOrder(
    dto: CreateOrderDto,
    buyerAddress: string,
  ): Promise<OrderCreationResult> {
    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      const dueAt = Math.floor(Date.now() / 1000) + parseInt(dto.dueInSeconds);

      // Estimate gas first
      const gasEstimate = await this.contract.createOrder.estimateGas(
        dto.purchaseAmount,
        dto.merchant,
        dueAt,
        dto.installments,
      );

      const tx = await this.contract.createOrder(
        dto.purchaseAmount,
        dto.merchant,
        dueAt,
        dto.installments,
        { gasLimit: (gasEstimate * BigInt(120)) / BigInt(100) }, // 20% buffer
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

      this.logger.log(`Order created successfully: ${orderId}, tx: ${tx.hash}`);
      return { orderId, txHash: tx.hash };
    } catch (error) {
      this.logger.error('Failed to create order:', error);
      throw new Error(`Failed to create order: ${error?.message}`);
    }
  }

  async repayInstallment(dto: RepayInstallmentDto): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      const gasEstimate = await this.contract.repayInstallment.estimateGas(
        dto.orderId,
        dto.amount,
      );

      const tx = await this.contract.repayInstallment(dto.orderId, dto.amount, {
        gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
      });
      await tx.wait();

      this.logger.log(
        `Installment repaid for order ${dto.orderId}, tx: ${tx.hash}`,
      );
      return tx.hash;
    } catch (error) {
      this.logger.error(
        `Failed to repay installment for order ${dto.orderId}:`,
        error,
      );
      throw new Error(`Failed to repay installment: ${error?.message}`);
    }
  }

  async repayFull(orderId: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      const gasEstimate = await this.contract.repayFull.estimateGas(orderId);

      const tx = await this.contract.repayFull(orderId, {
        gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
      });
      await tx.wait();

      this.logger.log(
        `Full repayment completed for order ${orderId}, tx: ${tx.hash}`,
      );
      return tx.hash;
    } catch (error) {
      this.logger.error(`Failed to repay full for order ${orderId}:`, error);
      throw new Error(`Failed to repay full: ${error?.message}`);
    }
  }

  async liquidateOrder(orderId: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      const gasEstimate = await this.contract.liquidate.estimateGas(orderId);

      const tx = await this.contract.liquidate(orderId, {
        gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
      });
      await tx.wait();

      this.logger.log(`Order ${orderId} liquidated, tx: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      this.logger.error(`Failed to liquidate order ${orderId}:`, error);
      throw new Error(`Failed to liquidate order: ${error?.message}`);
    }
  }

  // ==================== ADMIN FUNCTIONS ====================

  async fundLiquidity(dto: FundLiquidityDto): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      const gasEstimate = await this.contract.fundLiquidity.estimateGas(
        dto.amount,
      );

      const tx = await this.contract.fundLiquidity(dto.amount, {
        gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
      });
      await tx.wait();

      this.logger.log(`Liquidity funded: ${dto.amount}, tx: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      this.logger.error('Failed to fund liquidity:', error);
      throw new Error(`Failed to fund liquidity: ${error?.message}`);
    }
  }

  async withdrawLiquidity(dto: WithdrawLiquidityDto): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      const gasEstimate = await this.contract.withdrawLiquidity.estimateGas(
        dto.to,
        dto.amount,
      );

      const tx = await this.contract.withdrawLiquidity(dto.to, dto.amount, {
        gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
      });
      await tx.wait();

      this.logger.log(
        `Liquidity withdrawn: ${dto.amount} to ${dto.to}, tx: ${tx.hash}`,
      );
      return tx.hash;
    } catch (error) {
      this.logger.error('Failed to withdraw liquidity:', error);
      throw new Error(`Failed to withdraw liquidity: ${error?.message}`);
    }
  }

  async setCreditScore(dto: SetCreditScoreDto): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      const gasEstimate = await this.contract.setCreditScore.estimateGas(
        dto.address,
        dto.score,
      );

      const tx = await this.contract.setCreditScore(dto.address, dto.score, {
        gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
      });
      await tx.wait();

      this.logger.log(
        `Credit score set for ${dto.address}: ${dto.score}, tx: ${tx.hash}`,
      );
      return tx.hash;
    } catch (error) {
      this.logger.error(
        `Failed to set credit score for ${dto.address}:`,
        error,
      );
      throw new Error(`Failed to set credit score: ${error?.message}`);
    }
  }

  async setTier(dto: SetTierDto): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      const gasEstimate = await this.contract.setTier.estimateGas(
        dto.idx,
        dto.minScore,
        dto.collateralBps,
        dto.feeBps,
        dto.maxLoan,
      );

      const tx = await this.contract.setTier(
        dto.idx,
        dto.minScore,
        dto.collateralBps,
        dto.feeBps,
        dto.maxLoan,
        { gasLimit: (gasEstimate * BigInt(120)) / BigInt(100) },
      );
      await tx.wait();

      this.logger.log(`Tier ${dto.idx} updated, tx: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      this.logger.error(`Failed to set tier ${dto.idx}:`, error);
      throw new Error(`Failed to set tier: ${error?.message}`);
    }
  }

  // ==================== EVENT LISTENING ====================

  setupEventListeners() {
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
      this.logger.log(
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
      this.logger.log(
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
      this.logger.log(
        `Event: Order Fully Repaid - Order: ${id}, Total: ${this.formatTokenAmount(totalPaid.toString())} USDC`,
      );
    };

    const orderLiquidatedListener = (id, seizedCollateral, event) => {
      this.logger.log(
        `Event: Order Liquidated - Order: ${id}, Seized: ${this.formatTokenAmount(seizedCollateral.toString())} USDC`,
      );
    };

    const creditScoreUpdatedListener = (who, oldScore, newScore, event) => {
      this.logger.log(
        `Event: Credit Score Updated - Address: ${who}, Old: ${oldScore}, New: ${newScore}`,
      );
    };

    const liquidityFundedListener = (funder, amount, event) => {
      this.logger.log(
        `Event: Liquidity Funded - Funder: ${funder}, Amount: ${this.formatTokenAmount(amount.toString())} USDC`,
      );
    };

    const liquidityWithdrawnListener = (to, amount, event) => {
      this.logger.log(
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

    this.logger.log('Event listeners setup complete');
  }

  private removeEventListeners() {
    this.eventListeners.forEach((cleanup) => cleanup());
    this.eventListeners = [];
  }

  // ==================== UTILITY FUNCTIONS ====================

  formatTokenAmount(amount: string, decimals: number = 6): string {
    return ethers.formatUnits(amount, decimals);
  }

  parseTokenAmount(amount: string, decimals: number = 6): string {
    return ethers.parseUnits(amount, decimals).toString();
  }

  async getNetworkInfo(): Promise<NetworkInfo> {
    try {
      const network = await this.provider.getNetwork();
      const feeData = await this.provider.getFeeData();
      return {
        chainId: network.chainId.toString(),
        name: network.name,
        gasPrice: feeData.gasPrice?.toString() || '0',
      };
    } catch (error) {
      this.logger.error('Failed to get network info:', error);
      throw new Error(`Failed to get network info: ${error?.message}`);
    }
  }

  async getWalletBalance(): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not configured');
    }

    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      this.logger.error('Failed to get wallet balance:', error);
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
