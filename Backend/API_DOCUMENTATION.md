# BNPL/Loan System API Documentation

## Overview

This is a NestJS backend API for a BNPL (Buy Now Pay Later) / Loan system on Avalanche blockchain. The system manages loans, repayments, and transactions.

## Database Schema

### Tables

1. **loans** - Loan applications and management
2. **repayments** - Repayment schedules and tracking
3. **transactions** - Transaction logging for blockchain operations

## API Endpoints

### Loans

#### Create Loan

```http
POST /loans
Content-Type: application/json

{
  "user_id": "uuid-string",
  "amount": 1000.00,
  "interest_rate": 5.5,
  "collateral_amount": 1500.00
}
```

#### Get All Loans

```http
GET /loans
```

#### Get Loan by ID

```http
GET /loans/:id
```

#### Get Loans by User

```http
GET /loans/user/:userId
```

#### Update Loan

```http
PATCH /loans/:id
Content-Type: application/json

{
  "amount": 1200.00,
  "interest_rate": 6.0,
  "status": "APPROVED"
}
```

#### Update Loan Status

```http
PATCH /loans/:id/status
Content-Type: application/json

{
  "status": "APPROVED"
}
```

#### Delete Loan

```http
DELETE /loans/:id
```

### Repayments

#### Create Repayment Schedule

```http
POST /repayments
Content-Type: application/json

{
  "loan_id": "uuid-string",
  "amount": 250.00,
  "due_date": "2024-01-15"
}
```

#### Get All Repayments

```http
GET /repayments
```

#### Get Repayment by ID

```http
GET /repayments/:id
```

#### Get Repayments by Loan

```http
GET /repayments/loan/:loanId
```

#### Update Repayment

```http
PATCH /repayments/:id
Content-Type: application/json

{
  "amount": 275.00,
  "due_date": "2024-01-20",
  "status": "PAID",
  "paid_date": "2024-01-18"
}
```

#### Mark Repayment as Paid

```http
PATCH /repayments/:id/mark-paid
```

#### Delete Repayment

```http
DELETE /repayments/:id
```

### Transactions

#### Log Transaction

```http
POST /transactions
Content-Type: application/json

{
  "user_id": "uuid-string",
  "loan_id": "uuid-string",
  "type": "LOAN_DISBURSEMENT",
  "subtype": "CREDIT",
  "amount": 1000.00,
  "tx_hash": "0x1234567890abcdef..."
}
```

#### Get All Transactions

```http
GET /transactions
```

#### Get Transaction by ID

```http
GET /transactions/:id
```

#### Get Transactions by User

```http
GET /transactions/user/:userId
```

#### Get Transactions by Loan

```http
GET /transactions/loan/:loanId
```

#### Delete Transaction

```http
DELETE /transactions/:id
```

## Data Types

### Loan Status

- `PENDING` - Loan application submitted
- `APPROVED` - Loan approved but not disbursed
- `ACTIVE` - Loan disbursed and active
- `REPAID` - Loan fully repaid
- `DEFAULTED` - Loan in default

### Repayment Status

- `PENDING` - Repayment scheduled but not paid
- `PAID` - Repayment completed
- `LATE` - Repayment overdue

### Transaction Types

- `LOAN_DISBURSEMENT` - Loan amount disbursed to user
- `REPAYMENT` - Repayment made by user
- `COLLATERAL_DEPOSIT` - Collateral deposited
- `COLLATERAL_LIQUIDATION` - Collateral liquidated

### Transaction Subtypes

- `CREDIT` - Money coming into the user's account
- `DEBIT` - Money going out of the user's account

## Environment Variables

```env
DB_HOST=localhost
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
PORT=3000
```

## Running the Application

### Development

```bash
npm run start:dev
```

### Production

```bash
npm run build
npm run start:prod
```

## UUID Generation

All IDs are generated using UUID v4 with hyphens removed for consistency with blockchain addresses.

## Validation

All endpoints use class-validator for input validation with the following rules:

- Required fields are validated
- Numbers have minimum/maximum constraints
- Enums are validated against allowed values
- Dates are validated for proper format
