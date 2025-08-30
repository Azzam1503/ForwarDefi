// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IBNPLStructs.sol";

/**
 * @title BNPLStorage
 * @dev Storage and basic functionality for BNPL system
 */
contract BNPLStorage is Ownable, ReentrancyGuard, IBNPLStructs {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;   // e.g., USDC on Avalanche (6 decimals)
    address public treasury;         // receives fees & seized collateral
    uint256 public maxPurchasePerOrder;
    uint256 public lastOrderId;

    // Credit scoring (0..1000)
    mapping(address => uint16) public creditScore;
    Tier[] public tiers;

    // Score deltas
    uint16 public repayScoreIncrease;
    uint16 public liquidateScoreDecrease;

    // Early repay discount on remaining fee (bps). e.g., 2000 => 20% discount on remaining fee
    uint16 public earlyRepayDiscountBps;

    // Minimum fraction of nominal installment allowed for flexible payments (bps)
    uint16 public minInstallmentAmountBps; // e.g., 5000 => 50% of nominalInstallment

    mapping(uint256 => Order) public orders;

    constructor(
        address initialOwner,
        IERC20 _token,
        address _treasury,
        uint256 _maxPurchasePerOrder,
        uint16 _repayScoreIncrease,
        uint16 _liquidateScoreDecrease,
        uint16 _earlyRepayDiscountBps,
        uint16 _minInstallmentAmountBps
    ) Ownable() {
        require(address(_token) != address(0), "token=0");
        require(_treasury != address(0), "treasury=0");
        require(_minInstallmentAmountBps > 0 && _minInstallmentAmountBps <= 10000, "minBps");

        // Transfer ownership to initialOwner
        _transferOwnership(initialOwner);
        
        token = _token;
        treasury = _treasury;
        maxPurchasePerOrder = _maxPurchasePerOrder;
        repayScoreIncrease = _repayScoreIncrease;
        liquidateScoreDecrease = _liquidateScoreDecrease;
        earlyRepayDiscountBps = _earlyRepayDiscountBps;
        minInstallmentAmountBps = _minInstallmentAmountBps;

        // default tiers (owner can change)
        tiers.push(Tier({ minScore: 750, collateralBps: 2000, feeBps: 200, maxLoan: _maxPurchasePerOrder }));
        tiers.push(Tier({ minScore: 600, collateralBps: 4000, feeBps: 400, maxLoan: _maxPurchasePerOrder / 2 }));
        tiers.push(Tier({ minScore: 0,   collateralBps: 8000, feeBps: 800, maxLoan: _maxPurchasePerOrder / 10 }));
    }

    // ---------------------------
    // View functions
    // ---------------------------
    function availableLiquidity() public view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function totalDue(uint256 id) public view returns (uint256) {
        Order storage o = orders[id];
        if (o.closed) return 0;
        uint256 remainingPrincipal = o.principal - o.paidPrincipal;
        uint256 remainingFee = o.totalFee - o.paidFee;
        return remainingPrincipal + remainingFee;
    }

    function nominalInstallment(uint256 id) public view returns (uint256 principalPart, uint256 feePart) {
        Order storage o = orders[id];
        principalPart = o.nominalPrincipal;
        feePart = o.nominalFee;
    }

    function getOrder(uint256 id) external view returns (Order memory) {
        return orders[id];
    }

    function getTiersCount() external view returns (uint256) {
        return tiers.length;
    }

    function _tierFor(address who) internal view returns (Tier memory) {
        uint16 s = creditScore[who];
        for (uint256 i = 0; i < tiers.length; i++) {
            if (s >= tiers[i].minScore) return tiers[i];
        }
        return tiers[tiers.length - 1];
    }

    function quote(uint256 purchaseAmount, address buyer) public view returns (uint256 collateralRequired, uint256 totalFee) {
        Tier memory t = _tierFor(buyer);
        require(purchaseAmount <= t.maxLoan, "exceeds tier max loan");
        totalFee = (purchaseAmount * uint256(t.feeBps)) / 10000;
        collateralRequired = (purchaseAmount * uint256(t.collateralBps)) / 10000;
    }
}