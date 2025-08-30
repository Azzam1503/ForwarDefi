# API Response Format Standardization

## Overview

All API endpoints now follow a consistent response format with `message` and `data` properties for better standardization and user experience.

## 📋 **Standard Response Format**

All API responses now follow this structure:

```json
{
  "message": "Descriptive success message",
  "data": {
    // Actual API data here
  }
}
```

## 🎯 **Response Examples by Module**

### **1. User Module**

#### **User Registration**

```json
{
  "message": "User registered successfully",
  "data": {
    "user_id": "uuid-string",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone_number": "+1234567890",
    "is_admin": false,
    "is_active": true,
    "created_at": "2024-04-15T10:30:00.000Z"
  }
}
```

#### **User Login**

```json
{
  "message": "Login successful",
  "data": {
    "token": "jwt-token-string",
    "user": {
      "user_id": "uuid-string",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "phone_number": "+1234567890",
      "is_admin": false,
      "is_active": true,
      "created_at": "2024-04-15T10:30:00.000Z",
      "updated_at": "2024-04-15T10:30:00.000Z"
    }
  }
}
```

#### **Get User Profile**

```json
{
  "message": "User found successfully",
  "data": {
    "user_id": "uuid-string",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone_number": "+1234567890",
    "is_admin": false,
    "is_active": true,
    "is_deleted": false,
    "created_at": "2024-04-15T10:30:00.000Z",
    "updated_at": "2024-04-15T10:30:00.000Z"
  }
}
```

### **2. Loan Module**

#### **Create Loan**

```json
{
  "message": "Loan created successfully",
  "data": {
    "loan_id": "uuid-string",
    "user_id": "uuid-string",
    "amount": 1000.0,
    "interest_rate": 5.5,
    "collateral_amount": 1500.0,
    "status": "PENDING",
    "created_at": "2024-04-15T10:30:00.000Z",
    "updated_at": "2024-04-15T10:30:00.000Z"
  }
}
```

#### **Get All Loans**

```json
{
  "message": "Loans retrieved successfully",
  "data": [
    {
      "loan_id": "uuid-string",
      "user_id": "uuid-string",
      "amount": 1000.0,
      "interest_rate": 5.5,
      "collateral_amount": 1500.0,
      "status": "APPROVED",
      "created_at": "2024-04-15T10:30:00.000Z",
      "updated_at": "2024-04-15T10:30:00.000Z"
    }
  ]
}
```

#### **Get Loan by ID**

```json
{
  "message": "Loan found successfully",
  "data": {
    "loan_id": "uuid-string",
    "user_id": "uuid-string",
    "amount": 1000.0,
    "interest_rate": 5.5,
    "collateral_amount": 1500.0,
    "status": "ACTIVE",
    "created_at": "2024-04-15T10:30:00.000Z",
    "updated_at": "2024-04-15T10:30:00.000Z"
  }
}
```

#### **Update Loan**

```json
{
  "message": "Loan updated successfully",
  "data": {
    "loan_id": "uuid-string",
    "user_id": "uuid-string",
    "amount": 1200.0,
    "interest_rate": 6.0,
    "collateral_amount": 1800.0,
    "status": "ACTIVE",
    "created_at": "2024-04-15T10:30:00.000Z",
    "updated_at": "2024-04-15T10:30:00.000Z"
  }
}
```

#### **Delete Loan**

```json
{
  "message": "Loan deleted successfully",
  "data": null
}
```

### **3. Repayment Module**

#### **Create Repayment**

```json
{
  "message": "Repayment created successfully",
  "data": {
    "repayment_id": "uuid-string",
    "loan_id": "uuid-string",
    "amount": 250.0,
    "due_date": "2024-12-31",
    "paid_date": null,
    "status": "PENDING",
    "created_at": "2024-04-15T10:30:00.000Z",
    "updated_at": "2024-04-15T10:30:00.000Z"
  }
}
```

#### **Get All Repayments**

```json
{
  "message": "Repayments retrieved successfully",
  "data": [
    {
      "repayment_id": "uuid-string",
      "loan_id": "uuid-string",
      "amount": 250.0,
      "due_date": "2024-12-31",
      "paid_date": null,
      "status": "PENDING",
      "created_at": "2024-04-15T10:30:00.000Z",
      "updated_at": "2024-04-15T10:30:00.000Z"
    }
  ]
}
```

#### **Mark Repayment as Paid**

```json
{
  "message": "Repayment marked as paid successfully",
  "data": {
    "repayment_id": "uuid-string",
    "loan_id": "uuid-string",
    "amount": 250.0,
    "due_date": "2024-12-31",
    "paid_date": "2024-04-15T10:30:00.000Z",
    "status": "PAID",
    "created_at": "2024-04-15T10:30:00.000Z",
    "updated_at": "2024-04-15T10:30:00.000Z"
  }
}
```

### **4. Transaction Module**

#### **Create Transaction**

```json
{
  "message": "Transaction created successfully",
  "data": {
    "tx_id": "uuid-string",
    "user_id": "uuid-string",
    "loan_id": "uuid-string",
    "type": "LOAN_DISBURSEMENT",
    "subtype": "CREDIT",
    "amount": 100.0,
    "tx_hash": "0x1234567890abcdef...",
    "created_at": "2024-04-15T10:30:00.000Z"
  }
}
```

#### **Get All Transactions**

```json
{
  "message": "Transactions retrieved successfully",
  "data": [
    {
      "tx_id": "uuid-string",
      "user_id": "uuid-string",
      "loan_id": "uuid-string",
      "type": "LOAN_DISBURSEMENT",
      "subtype": "CREDIT",
      "amount": 100.0,
      "tx_hash": "0x1234567890abcdef...",
      "created_at": "2024-04-15T10:30:00.000Z"
    }
  ]
}
```

### **5. Avalanche Module**

#### **Get Wallet Transactions**

```json
{
  "message": "Wallet transactions retrieved successfully",
  "data": {
    "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "totalTransactions": 25,
    "dateRange": "2024-01-15 to 2024-04-15",
    "totalValue": 1250.75,
    "currency": "AVAX",
    "transactions": [
      {
        "blockNumber": "12345678",
        "timeStamp": "1640995200",
        "hash": "0xabc123...",
        "from": "0x1234567890abcdef...",
        "to": "0xfedcba0987654321...",
        "value": "1000000000000000000",
        "gas": "21000",
        "gasPrice": "25000000000",
        "isError": "0",
        "txreceipt_status": "1",
        "input": "0x",
        "contractAddress": "",
        "cumulativeGasUsed": "21000",
        "gasUsed": "21000",
        "confirmations": "100",
        "methodId": "0x",
        "functionName": ""
      }
    ]
  }
}
```

#### **Health Check**

```json
{
  "message": "Avalanche service is healthy",
  "data": {
    "status": "healthy",
    "timestamp": "2024-04-15T10:30:00.000Z"
  }
}
```

## 🔧 **Error Response Format**

Error responses maintain the same structure but with appropriate HTTP status codes:

```json
{
  "message": "Error description",
  "data": null
}
```

### **Common Error Examples**

#### **400 Bad Request**

```json
{
  "message": "Validation failed",
  "data": null
}
```

#### **401 Unauthorized**

```json
{
  "message": "Invalid credentials",
  "data": null
}
```

#### **404 Not Found**

```json
{
  "message": "Loan not found",
  "data": null
}
```

#### **500 Internal Server Error**

```json
{
  "message": "Internal server error",
  "data": null
}
```

## 📊 **Benefits of Standardized Format**

### **1. Consistency**

- All endpoints follow the same response structure
- Predictable API behavior across all modules
- Easier to understand and integrate

### **2. User Experience**

- Clear success/error messages
- Consistent data access patterns
- Better error handling

### **3. Development**

- Simplified frontend integration
- Easier testing and debugging
- Reduced code complexity

### **4. Documentation**

- Clear API documentation
- Better Swagger/OpenAPI schemas
- Improved developer experience

## 🚀 **Implementation Details**

### **Service Layer Changes**

- All service methods now return `{ message: string, data: any }`
- Removed specific return types (Promise<Entity>)
- Added descriptive success messages

### **Controller Layer Changes**

- Updated return type annotations
- Maintained existing functionality
- Enhanced logging with new data structure

### **Swagger Documentation**

- Updated response schemas to reflect new format
- Added message and data properties to all endpoints
- Maintained backward compatibility for API consumers

## ✅ **Migration Complete**

All modules have been successfully updated to follow the standardized response format:

- ✅ **User Module**: Registration, login, profile management
- ✅ **Loan Module**: CRUD operations, status updates
- ✅ **Repayment Module**: Scheduling, payment tracking
- ✅ **Transaction Module**: Logging, history, tracking
- ✅ **Avalanche Module**: Blockchain integration, health checks

The API now provides a consistent and user-friendly experience across all endpoints! 🎉
