// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/*
  BNPLInstallmentsProrated.sol

  Features:
  - True BNPL lender flow (pool pays merchants).
  - Installment repayments with prorated fee per installment (fee goes to treasury on payment).
  - Flexible payments: pay nominal installment, larger amounts, or repay full remaining.
  - Early repayment discount: discount applied to remaining fee when repaying full before due date.
  - On-chain credit score & tiering for collateral% and feeBps.
  - Liquidity funding / withdrawal by owner.
  - SafeERC20 + ReentrancyGuard used for safety.
*/

import "./BNPLRepayments.sol";

contract BNPLInstallmentsProrated is BNPLRepayments {
    constructor(
        address initialOwner,
        IERC20 _token,
        address _treasury,
        uint256 _maxPurchasePerOrder,
        uint16 _repayScoreIncrease,
        uint16 _liquidateScoreDecrease,
        uint16 _earlyRepayDiscountBps,
        uint16 _minInstallmentAmountBps
    ) BNPLRepayments(
        initialOwner,
        _token,
        _treasury,
        _maxPurchasePerOrder,
        _repayScoreIncrease,
        _liquidateScoreDecrease,
        _earlyRepayDiscountBps,
        _minInstallmentAmountBps
    ) {
        // All functionality inherited from parent contracts
        // This contract serves as the main entry point with all features:
        // - Order creation and management (from BNPLOrders)
        // - Installment and full repayments (from BNPLRepayments) 
        // - Credit scoring system (from BNPLScoring)
        // - Admin functions and liquidity management (from BNPLAdmin)
        // - Core storage and view functions (from BNPLStorage)
    }

    /**
     * @dev Get contract version for identification
     */
    function version() external pure returns (string memory) {
        return "BNPLInstallmentsProrated v1.0";
    }
}