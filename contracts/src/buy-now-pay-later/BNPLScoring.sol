// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./BNPLAdmin.sol";

/**
 * @title BNPLScoring
 * @dev Credit scoring functionality for BNPL system
 */
contract BNPLScoring is BNPLAdmin {
    constructor(
        address initialOwner,
        IERC20 _token,
        address _treasury,
        uint256 _maxPurchasePerOrder,
        uint16 _repayScoreIncrease,
        uint16 _liquidateScoreDecrease,
        uint16 _earlyRepayDiscountBps,
        uint16 _minInstallmentAmountBps
    ) BNPLAdmin(
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
    // Internal scoring helpers
    // ---------------------------
    function _applyRepayScoreBoost(address who, bool earlyFull) internal {
        uint16 old = creditScore[who];
        uint256 added = repayScoreIncrease;
        
        if (earlyFull && earlyRepayDiscountBps > 0) {
            uint256 bonus = (uint256(repayScoreIncrease) * uint256(earlyRepayDiscountBps)) / 10000;
            added += bonus;
        }
        
        uint256 newScore = uint256(old) + added;
        if (newScore > 1000) newScore = 1000;
        
        creditScore[who] = uint16(newScore);
        emit CreditScoreUpdated(who, old, uint16(newScore));
    }

    function _decreaseScore(address who) internal {
        uint16 old = creditScore[who];
        uint256 newScore = (uint256(old) > liquidateScoreDecrease) ? (uint256(old) - liquidateScoreDecrease) : 0;
        creditScore[who] = uint16(newScore);
        emit CreditScoreUpdated(who, old, uint16(newScore));
    }
}