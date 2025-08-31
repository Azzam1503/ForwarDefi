# Avalanche Module Documentation

## Overview

The AvalancheModule is a NestJS module that fetches transaction history from the Avalanche C-Chain for any given wallet address. It uses the Snowtrace API as the primary data source with RPC fallback.

## Features

- ✅ Fetch last 3 months of transactions for any wallet address
- ✅ Snowtrace API integration with API key support
- ✅ RPC fallback for reliability
- ✅ Comprehensive error handling
- ✅ Input validation for wallet addresses
- ✅ Transaction summary with total value calculation
- ✅ Health check endpoint

## API Endpoints

### 1. Get Transactions

```http
GET /avalanche/transactions/:walletId
```

**Parameters:**

- `walletId` (string, required): Ethereum/Avalanche wallet address (0x...)

**Response:**

```json
{
  "walletAddress": "0x1234567890abcdef...",
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
```

### 2. Health Check

```http
GET /avalanche/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-04-15T10:30:00.000Z"
}
```

## Environment Variables

Add the following to your `.env` file:

```env
# Snowtrace API Key (required for full functionality)
SNOWTRACE_API_KEY=your_snowtrace_api_key_here

# Optional: Custom timeout (default: 5000ms)
AVALANCHE_REQUEST_TIMEOUT=5000
```

## Getting a Snowtrace API Key

1. Visit [Snowtrace.io](https://snowtrace.io/)
2. Create an account
3. Go to your profile settings
4. Generate an API key
5. Add the key to your `.env` file

## Error Handling

The module handles various error scenarios:

### 400 Bad Request

- Invalid wallet address format

### 404 Not Found

- No transactions found for the wallet address

### 500 Internal Server Error

- Snowtrace API key missing
- API failure or network issues
- Unexpected errors

## Example Usage

### cURL Request

```bash
# Get transactions for a wallet
curl -X GET "http://localhost:3000/avalanche/transactions/0x1234567890abcdef1234567890abcdef12345678" \
  -H "Content-Type: application/json"

# Health check
curl -X GET "http://localhost:3000/avalanche/health" \
  -H "Content-Type: application/json"
```

### JavaScript/TypeScript

```typescript
// Using fetch
const response = await fetch(
  'http://localhost:3000/avalanche/transactions/0x1234567890abcdef1234567890abcdef12345678',
);
const data = await response.json();

// Using axios
const response = await axios.get(
  'http://localhost:3000/avalanche/transactions/0x1234567890abcdef1234567890abcdef12345678',
);
const data = response.data;
```

## Architecture

### Service Layer (`AvalancheService`)

- **validateWalletAddress()**: Validates Ethereum/Avalanche address format
- **getThreeMonthsAgoTimestamp()**: Calculates timestamp for 3 months ago
- **weiToAvax()**: Converts Wei to AVAX
- **fetchTransactionsFromSnowtrace()**: Primary API call to Snowtrace
- **fetchTransactionsFromRPC()**: Fallback RPC call
- **filterTransactionsByDate()**: Filters transactions by date range
- **calculateTransactionSummary()**: Calculates transaction summary
- **getTransactions()**: Main method orchestrating the entire process

### Controller Layer (`AvalancheController`)

- **getTransactions()**: Handles GET requests for transactions
- **healthCheck()**: Health check endpoint

### Constants (`constants.ts`)

- API URLs and endpoints
- Error messages
- Configuration values
- HTTP status codes

## Data Flow

1. **Request Received**: Controller receives GET request with wallet address
2. **Validation**: Service validates wallet address format
3. **Time Calculation**: Calculates 3-month time range
4. **API Call**: Attempts to fetch data from Snowtrace API
5. **Fallback**: If Snowtrace fails, tries RPC endpoint
6. **Filtering**: Filters transactions by date range
7. **Processing**: Calculates summary and formats response
8. **Response**: Returns formatted transaction data

## Performance Considerations

- **Timeout**: 5-second timeout for API calls
- **Retry Logic**: Built-in retry mechanism for failed requests
- **Caching**: Consider implementing Redis caching for frequently requested wallets
- **Rate Limiting**: Snowtrace has rate limits (check their documentation)

## Security

- **Input Validation**: All wallet addresses are validated
- **Error Handling**: Sensitive information is not exposed in error messages
- **API Key**: Snowtrace API key is stored in environment variables
- **HTTPS**: Use HTTPS in production

## Testing

### Unit Tests

```bash
npm run test avalanche
```

### Integration Tests

```bash
npm run test:e2e
```

### Manual Testing

```bash
# Start the application
npm run start:dev

# Test with a real wallet address
curl -X GET "http://localhost:3000/avalanche/transactions/0x1234567890abcdef1234567890abcdef12345678"
```

## Troubleshooting

### Common Issues

1. **"API key is not configured"**
   - Ensure `SNOWTRACE_API_KEY` is set in your `.env` file

2. **"Invalid wallet address"**
   - Check that the wallet address follows Ethereum format (0x + 40 hex characters)

3. **"No transactions found"**
   - The wallet might not have any transactions in the last 3 months
   - Try with a different wallet address

4. **"API failure"**
   - Check your internet connection
   - Verify Snowtrace API is accessible
   - Check if you've exceeded rate limits

### Debug Mode

Enable debug logging by setting the log level:

```typescript
// In your main.ts
const app = await NestFactory.create(AppModule, {
  logger: ['debug', 'error', 'warn', 'log'],
});
```

## Future Enhancements

- [ ] Add caching layer (Redis)
- [ ] Support for custom date ranges
- [ ] Token transfer tracking
- [ ] Internal transaction support
- [ ] Pagination for large transaction sets
- [ ] WebSocket support for real-time updates
