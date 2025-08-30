// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./BNPLOrders.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BNPLRepayments
 * @dev Repayment functionality for BNPL system
 */
contract BNPLRepayments is BNPLOrders {
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
    ) BNPLOrders(
        initialOwner,
        _token,
        _treasury,
        _maxPurchasePerOrder,
        _repayScoreIncrease,
        _liquidateScoreDecrease,
        _earlyRepayDiscountBps,
        _minInstallmentAmountBps
    ) {}

    /**
     * repayInstallment: Flexible installment repayment
     */
    function repayInstallment(uint256 id, uint256 amount) external nonReentrant {
        Order storage o = orders[id];
        require(!o.closed, "closed");
        require(msg.sender == o.buyer, "not buyer");
        require(block.timestamp <= o.dueAt, "overdue");
        require(amount > 0, "amount=0");

        uint256 remaining = totalDue(id);
        require(remaining > 0, "nothing due");

        // if paying all remaining → treat as full repay with early discount
        if (amount >= remaining) {
            _handleFullRepaymentInInstallment(id, o, remaining);
            return;
        }

        _handlePartialRepayment(id, o, amount);
    }

    function _handleFullRepaymentInInstallment(uint256 id, Order storage o, uint256 remaining) internal {
        token.safeTransferFrom(msg.sender, address(this), remaining);
        
        uint256 remFee = o.totalFee - o.paidFee;
        uint256 remPrincipal = o.principal - o.paidPrincipal;

        uint256 discount = 0;
        if (block.timestamp <= o.dueAt && earlyRepayDiscountBps > 0) {
            discount = (remFee * uint256(earlyRepayDiscountBps)) / 10000;
        }
        
        if (remFee > 0) {
            uint256 feeAfterDiscount = remFee - discount;
            if (feeAfterDiscount > 0) token.safeTransfer(treasury, feeAfterDiscount);
        }
        
        if (o.collateral > 0) token.safeTransfer(o.buyer, o.collateral);

        o.paidPrincipal += remPrincipal;
        o.paidFee += remFee;
        o.paidInstallments = o.installments;
        o.closed = true;

        _applyRepayScoreBoost(o.buyer, true);
        emit OrderFullyRepaid(id, msg.sender, remaining, discount);
    }

    function _handlePartialRepayment(uint256 id, Order storage o, uint256 amount) internal {
        // enforce min allowed amount
        uint256 minAllowed = ((o.nominalPrincipal + o.nominalFee) * uint256(minInstallmentAmountBps)) / 10000;
        require(amount >= minAllowed, "amount too small");

        token.safeTransferFrom(msg.sender, address(this), amount);

        uint256 feePortion = _processFeePayment(o);
        _processPrincipalPayment(o, amount - feePortion);
        _updateInstallmentCount(o);

        emit InstallmentPaid(id, msg.sender, amount, o.paidPrincipal, o.paidFee);

        if (o.paidPrincipal >= o.principal && o.paidFee >= o.totalFee) {
            _finalizeFullyPaidOrder(id, o, amount);
        }
    }

    function _processFeePayment(Order storage o) internal returns (uint256) {
        uint256 remainingFee = o.totalFee - o.paidFee;
        uint256 feePortion = o.nominalFee;
        if (feePortion > remainingFee) feePortion = remainingFee;

        if (feePortion > 0) {
            token.safeTransfer(treasury, feePortion);
            o.paidFee += feePortion;
        }
        
        return feePortion;
    }

    function _processPrincipalPayment(Order storage o, uint256 principalAmount) internal {
        uint256 remainingPrincipal = o.principal - o.paidPrincipal;
        if (principalAmount > remainingPrincipal) principalAmount = remainingPrincipal;
        o.paidPrincipal += principalAmount;
    }

    function _updateInstallmentCount(Order storage o) internal {
        if (o.nominalPrincipal > 0) {
            uint256 completed = o.paidPrincipal / o.nominalPrincipal;
            if (completed > o.installments) completed = o.installments;
            o.paidInstallments = completed;
        }
    }

    function _finalizeFullyPaidOrder(uint256 id, Order storage o, uint256 amount) internal {
        if (o.collateral > 0) token.safeTransfer(o.buyer, o.collateral);
        o.closed = true;
        _applyRepayScoreBoost(o.buyer, false);
        emit OrderFullyRepaid(id, msg.sender, amount, 0);
    }

    /**
     * repayFull: Explicit full repayment with early discount
     */
    function repayFull(uint256 id) external nonReentrant {
        Order storage o = orders[id];
        require(!o.closed, "closed");
        require(msg.sender == o.buyer, "not buyer");
        require(block.timestamp <= o.dueAt, "overdue");

        uint256 remPrincipal = o.principal - o.paidPrincipal;
        uint256 remFee = o.totalFee - o.paidFee;
        uint256 remTotal = remPrincipal + remFee;
        require(remTotal > 0, "nothing due");

        _executeFullRepayment(id, o, remTotal, remPrincipal, remFee);
    }

    function _executeFullRepayment(
        uint256 id,
        Order storage o,
        uint256 remTotal,
        uint256 remPrincipal,
        uint256 remFee
    ) internal {
        token.safeTransferFrom(msg.sender, address(this), remTotal);

        uint256 discount = 0;
        if (earlyRepayDiscountBps > 0) {
            discount = (remFee * uint256(earlyRepayDiscountBps)) / 10000;
        }

        if (remFee > 0) {
            uint256 feeToSend = remFee - discount;
            if (feeToSend > 0) token.safeTransfer(treasury, feeToSend);
            o.paidFee += remFee;
        }

        o.paidPrincipal += remPrincipal;

        if (o.collateral > 0) token.safeTransfer(o.buyer, o.collateral);

        o.paidInstallments = o.installments;
        o.closed = true;

        _applyRepayScoreBoost(o.buyer, true);
        emit OrderFullyRepaid(id, msg.sender, remTotal, discount);
    }
}