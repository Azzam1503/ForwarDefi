// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./BNPLStorage.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BNPLAdmin
 * @dev Admin and configuration functions for BNPL system
 */
contract BNPLAdmin is BNPLStorage {
    using SafeERC20 for IERC20;
    
    constructor(
        address initialOwner,
        IERC20 _token,
        address _treasury,
        uint256 _maxPurchasePerOrder,
        uint16 _repayScoreIncrease,
        uint16 _liquidateScoreDecrease,
        uint16 _earlyRepayDiscountBps,
        uint16 _minInstallmentAmountBps
    ) BNPLStorage(
        initialOwner,
        _token,
        _treasury,
        _maxPurchasePerOrder,
        _repayScoreIncrease,
        _liquidateScoreDecrease,
        _earlyRepayDiscountBps,
        _minInstallmentAmountBps
    ) {}

    // ---------------------------
    // Admin / config functions
    // ---------------------------
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "treasury=0");
        emit TreasuryUpdated(treasury, _treasury);
        treasury = _treasury;
    }

    function setMaxPurchasePerOrder(uint256 _max) external onlyOwner {
        maxPurchasePerOrder = _max;
        emit ParamsUpdated();
    }

    function setTier(uint256 idx, uint256 minScore, uint16 collateralBps, uint16 feeBps, uint256 maxLoan) external onlyOwner {
        require(idx < tiers.length, "idx");
        require(collateralBps <= 10000 && feeBps <= 10000, "bps>10000");
        tiers[idx] = Tier({ minScore: minScore, collateralBps: collateralBps, feeBps: feeBps, maxLoan: maxLoan });
        emit TierUpdated(idx);
    }

    function addTier(uint256 minScore, uint16 collateralBps, uint16 feeBps, uint256 maxLoan) external onlyOwner {
        require(collateralBps <= 10000 && feeBps <= 10000, "bps>10000");
        tiers.push(Tier({ minScore: minScore, collateralBps: collateralBps, feeBps: feeBps, maxLoan: maxLoan }));
        emit TierUpdated(tiers.length - 1);
    }

    function setCreditScore(address who, uint16 score) external onlyOwner {
        require(who != address(0), "who=0");
        require(score <= 1000, "score>1000");
        uint16 old = creditScore[who];
        creditScore[who] = score;
        emit CreditScoreUpdated(who, old, score);
    }

    function setScoreDeltas(uint16 repayInc, uint16 liqDec) external onlyOwner {
        repayScoreIncrease = repayInc;
        liquidateScoreDecrease = liqDec;
        emit ParamsUpdated();
    }

    function setEarlyRepayDiscountBps(uint16 bps) external onlyOwner {
        earlyRepayDiscountBps = bps;
        emit ParamsUpdated();
    }

    function setMinInstallmentAmountBps(uint16 bps) external onlyOwner {
        require(bps > 0 && bps <= 10000, "minBps");
        minInstallmentAmountBps = bps;
        emit ParamsUpdated();
    }

    // ---------------------------
    // Liquidity management
    // ---------------------------
    function fundLiquidity(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "amount=0");
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit LiquidityFunded(msg.sender, amount);
    }

    function withdrawLiquidity(address to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "to=0");
        token.safeTransfer(to, amount);
        emit LiquidityWithdrawn(to, amount);
    }

    // ---------------------------
    // Safety / housekeeping
    // ---------------------------
    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "to=0");
        token.safeTransfer(to, amount);
    }
}