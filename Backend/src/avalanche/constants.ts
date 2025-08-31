export const AVALANCHE_CONSTANTS = {
  // Snowtrace API configuration
  SNOWTRACE_BASE_URL: 'https://api.snowtrace.io/api',
  SNOWTRACE_API_KEY: process.env.SNOWTRACE_API_KEY,

  // Alternative RPC endpoints (fallback)
  AVALANCHE_RPC_URL: 'https://api.avax.network/ext/bc/C/rpc',
  AVALANCHE_RPC_URL_ALT: 'https://rpc.ankr.com/avalanche',

  // API endpoints
  ENDPOINTS: {
    SNOWTRACE_TRANSACTIONS: '/module=account&action=txlist',
    SNOWTRACE_INTERNAL_TRANSACTIONS: '/module=account&action=txlistinternal',
    SNOWTRACE_TOKEN_TRANSFERS: '/module=account&action=tokentx',
  },

  // Time configuration
  MONTHS_TO_FETCH: 3,
  MILLISECONDS_IN_DAY: 24 * 60 * 60 * 1000,

  // Response limits
  MAX_RESULTS: 10000,
  PAGE_SIZE: 100,

  // Error messages
  ERROR_MESSAGES: {
    INVALID_WALLET: 'Invalid wallet address provided',
    API_KEY_MISSING: 'Snowtrace API key is not configured',
    API_FAILURE: 'Failed to fetch data from Avalanche network',
    NO_TRANSACTIONS: 'No transactions found for the specified wallet',
    INVALID_RESPONSE: 'Invalid response from Avalanche API',
  },

  // HTTP status codes
  HTTP_STATUS: {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
} as const;

export const AVALANCHE_CONFIG = {
  // Request timeout (5 seconds)
  REQUEST_TIMEOUT: 5000,

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,

  // Rate limiting (requests per minute)
  RATE_LIMIT: 60,
} as const;
