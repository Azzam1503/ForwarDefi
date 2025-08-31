// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./BNPLScoring.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title BNPLOrders
 * @dev Order creation and basic order management
 */
contract BNPLOrders is BNPLScoring {
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
    ) BNPLScoring(
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
     * createOrder: Create a new BNPL order
     */
    function createOrder(
        uint256 purchaseAmount,
        address merchant,
        uint256 dueAt,
        uint256 installments
    ) external nonReentrant returns (uint256) {
        require(merchant != address(0), "merchant=0");
        require(purchaseAmount > 0, "amount=0");
        require(dueAt > block.timestamp, "dueAt<=now");
        require(installments >= 1, "installments>=1");
        require(purchaseAmount <= maxPurchasePerOrder, "exceeds cap");

        return _executeOrderCreation(purchaseAmount, merchant, dueAt, installments);
    }

    function _executeOrderCreation(
        uint256 purchaseAmount,
        address merchant,
        uint256 dueAt,
        uint256 installments
    ) internal returns (uint256) {
        (uint256 collateralRequired, uint256 totalFee) = quote(purchaseAmount, msg.sender);
        require(availableLiquidity() >= purchaseAmount, "insufficient pool");

        // pull collateral from buyer
        if (collateralRequired > 0) {
            token.safeTransferFrom(msg.sender, address(this), collateralRequired);
        }

        // pay merchant from pool
        token.safeTransfer(merchant, purchaseAmount);

        return _storeNewOrder(purchaseAmount, merchant, dueAt, installments, collateralRequired, totalFee);
    }

    function _storeNewOrder(
        uint256 purchaseAmount,
        address merchant,
        uint256 dueAt,
        uint256 installments,
        uint256 collateralRequired,
        uint256 totalFee
    ) internal returns (uint256) {
        lastOrderId += 1;
        
        orders[lastOrderId] = Order({
            buyer: msg.sender,
            merchant: merchant,
            principal: purchaseAmount,
            collateral: collateralRequired,
            totalFee: totalFee,
            createdAt: block.timestamp,
            dueAt: dueAt,
            installments: installments,
            nominalPrincipal: purchaseAmount / installments,
            nominalFee: totalFee / installments,
            paidPrincipal: 0,
            paidFee: 0,
            paidInstallments: 0,
            closed: false
        });

        emit OrderCreated(lastOrderId, msg.sender, merchant, purchaseAmount, collateralRequired, totalFee, dueAt, installments);
        return lastOrderId;
    }

    /**
     * liquidate: seize collateral to treasury after due date if unpaid
     */
    function liquidate(uint256 id) external nonReentrant {
        Order storage o = orders[id];
        require(!o.closed, "closed");
        require(block.timestamp > o.dueAt, "not overdue");

        uint256 seized = o.collateral;
        if (seized > 0) token.safeTransfer(treasury, seized);

        o.closed = true;
        _decreaseScore(o.buyer);

        emit OrderLiquidated(id, seized);
    }
}