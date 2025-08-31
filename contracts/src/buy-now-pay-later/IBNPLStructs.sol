// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/**
 * @title IBNPLStructs
 * @dev Interface containing all structs and events for BNPL system
 */
interface IBNPLStructs {
    struct Tier {
        uint256 minScore;    // inclusive
        uint16 collateralBps;
        uint16 feeBps;
        uint256 maxLoan;
    }

    struct Order {
        address buyer;
        address merchant;
        uint256 principal;        // loan principal
        uint256 collateral;       // locked collateral amount
        uint256 totalFee;         // total fee = principal * feeBps / 10000
        uint256 createdAt;
        uint256 dueAt;
        uint256 installments;     // number of installments
        uint256 nominalPrincipal; // principal / installments (floor)
        uint256 nominalFee;       // totalFee / installments (floor)
        uint256 paidPrincipal;    // principal repaid so far
        uint256 paidFee;          // fee already paid to treasury
        uint256 paidInstallments; // count of fully covered installments (derived)
        bool    closed;           // true if REPAID or LIQUIDATED
    }

    // Events
    event OrderCreated(uint256 indexed id, address indexed buyer, address indexed merchant, uint256 principal, uint256 collateral, uint256 totalFee, uint256 dueAt, uint256 installments);
    event InstallmentPaid(uint256 indexed id, address indexed payer, uint256 amount, uint256 paidPrincipal, uint256 paidFee);
    event OrderFullyRepaid(uint256 indexed id, address indexed payer, uint256 totalPaid, uint256 feeDiscount);
    event OrderLiquidated(uint256 indexed id, uint256 seizedCollateral);
    event CreditScoreUpdated(address indexed who, uint16 oldScore, uint16 newScore);
    event TierUpdated(uint256 idx);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event LiquidityFunded(address indexed from, uint256 amount);
    event LiquidityWithdrawn(address indexed to, uint256 amount);
    event ParamsUpdated();
}