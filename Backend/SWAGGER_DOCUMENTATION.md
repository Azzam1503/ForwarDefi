# Swagger API Documentation

## Overview

This NestJS application now includes comprehensive Swagger/OpenAPI documentation that provides an interactive API interface for testing and exploring all endpoints.

## 🚀 **Accessing the Documentation**

Once the application is running, you can access the Swagger documentation at:

```
http://localhost:7002/api
```

## 📋 **API Documentation Features**

### **Interactive Interface**

- **Try it out**: Test API endpoints directly from the browser
- **Request/Response Examples**: See sample data for all endpoints
- **Authentication**: JWT Bearer token support
- **Parameter Validation**: Real-time validation of request parameters
- **Response Schemas**: Detailed response structure documentation

### **Organized by Tags**

The API is organized into the following categories:

1. **🔐 Authentication (`auth`)**
   - User registration and login endpoints
   - JWT token management

2. **👥 Users (`users`)**
   - User profile management
   - User CRUD operations

3. **💰 Loans (`loans`)**
   - Loan application and management
   - Loan status updates
   - User loan history

4. **📅 Repayments (`repayments`)**
   - Repayment scheduling
   - Payment tracking
   - Loan repayment history

5. **💳 Transactions (`transactions`)**
   - Transaction logging
   - Transaction history
   - User and loan transaction tracking

6. **❄️ Avalanche (`avalanche`)**
   - Blockchain transaction fetching
   - Wallet transaction history
   - Avalanche C-Chain integration

## 🔧 **Configuration**

### **Swagger Setup (main.ts)**

```typescript
const config = new DocumentBuilder()
  .setTitle('BNPL/Loan System API')
  .setDescription(
    'A comprehensive API for BNPL (Buy Now Pay Later) and loan management system on Avalanche blockchain',
  )
  .setVersion('1.0')
  .addTag('auth', 'Authentication endpoints')
  .addTag('users', 'User management endpoints')
  .addTag('loans', 'Loan management endpoints')
  .addTag('repayments', 'Repayment management endpoints')
  .addTag('transactions', 'Transaction management endpoints')
  .addTag('avalanche', 'Avalanche blockchain integration endpoints')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    },
    'JWT-auth',
  )
  .build();
```

### **DTO Documentation**

All DTOs include comprehensive `@ApiProperty` decorators with:

- **Descriptions**: Clear explanations of each field
- **Examples**: Sample data for testing
- **Validation**: Min/max values, formats, and constraints
- **Required/Optional**: Field requirement specifications

### **Controller Documentation**

All controllers include:

- **@ApiTags**: Categorization of endpoints
- **@ApiOperation**: Summary and detailed descriptions
- **@ApiResponse**: HTTP status codes and response schemas
- **@ApiParam**: Parameter descriptions and examples
- **@ApiBearerAuth**: JWT authentication requirements

## 🔐 **Authentication**

### **JWT Bearer Token**

Most endpoints require JWT authentication. To use protected endpoints:

1. **Login**: Use the `/users/login` endpoint to get a JWT token
2. **Authorize**: Click the "Authorize" button in Swagger UI
3. **Enter Token**: Paste your JWT token in the format: `Bearer your-token-here`
4. **Test Endpoints**: All protected endpoints will now work

### **Token Format**

```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📝 **Example Usage**

### **1. User Registration**

```http
POST /users/signup
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "phone_number": "+1234567890"
}
```

### **2. User Login**

```http
POST /users/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

### **3. Create Loan (Authenticated)**

```http
POST /loans
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "user_id": "uuid-string",
  "amount": 1000.0,
  "interest_rate": 5.5,
  "collateral_amount": 1500.0
}
```

### **4. Get Avalanche Transactions**

```http
GET /avalanche/transactions/0x1234567890abcdef1234567890abcdef12345678
```

## 🎯 **Key Features**

### **Comprehensive DTO Documentation**

- **User DTOs**: Registration, login, and profile fields
- **Loan DTOs**: Amount, interest rate, collateral, and status
- **Repayment DTOs**: Amount, due dates, and payment tracking
- **Transaction DTOs**: Type, subtype, amount, and blockchain data
- **Avalanche DTOs**: Blockchain transaction details

### **Detailed Response Schemas**

- **Success Responses**: Complete data structures
- **Error Responses**: Validation and business logic errors
- **Status Codes**: HTTP status code explanations
- **Examples**: Real-world data examples

### **Parameter Validation**

- **Path Parameters**: ID validation and examples
- **Query Parameters**: Filtering and pagination
- **Body Parameters**: Request body validation
- **Headers**: Authentication and content-type

## 🛠️ **Development Features**

### **Auto-Generated Documentation**

- **Real-time Updates**: Documentation updates with code changes
- **Type Safety**: TypeScript integration for accurate schemas
- **Validation Integration**: Class-validator decorators automatically documented

### **Testing Support**

- **Try it out**: Test endpoints directly in the browser
- **Request Builder**: Automatic request body generation
- **Response Viewer**: Formatted JSON response display
- **Error Handling**: Clear error messages and status codes

## 📊 **API Statistics**

### **Total Endpoints**: 25+

### **Authentication**: JWT Bearer Token

### **Response Formats**: JSON

### **Content Types**: application/json

### **Status Codes**: 200, 201, 204, 400, 401, 404, 500

## 🔍 **Troubleshooting**

### **Common Issues**

1. **"Unknown authentication strategy"**
   - Ensure `AuthModule` is imported in `AppModule`
   - Check JWT dependencies are installed

2. **Swagger UI not loading**
   - Verify the application is running on the correct port
   - Check browser console for errors

3. **JWT token not working**
   - Ensure token format is correct: `Bearer <token>`
   - Check token expiration
   - Verify token was generated from the correct login endpoint

4. **Validation errors**
   - Check request body format matches DTO specifications
   - Verify required fields are provided
   - Check data types and constraints

## 🚀 **Getting Started**

1. **Start the Application**:

   ```bash
   npm run start:dev
   ```

2. **Access Documentation**:

   ```
   http://localhost:7002/api
   ```

3. **Test Authentication**:
   - Register a user using `/users/signup`
   - Login using `/users/login`
   - Copy the JWT token from the response

4. **Authorize Requests**:
   - Click "Authorize" in Swagger UI
   - Enter: `Bearer your-jwt-token`
   - Test protected endpoints

5. **Explore Endpoints**:
   - Browse by tags
   - Try out different endpoints
   - View request/response examples

## 📚 **Additional Resources**

- **Swagger UI**: https://swagger.io/tools/swagger-ui/
- **OpenAPI Specification**: https://swagger.io/specification/
- **NestJS Swagger**: https://docs.nestjs.com/openapi/introduction

---

**🎉 Your API is now fully documented and ready for testing!**
