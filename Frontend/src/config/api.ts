// API Configuration
// This can be overridden by environment variables in production

export const API_CONFIG = {
  // Dev tunnel URL for development
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://66mz5dpp-7002.inc1.devtunnels.ms',

  // API endpoints
  ENDPOINTS: {
    USERS: {
      SIGNUP: '/users/signup',
      LOGIN: '/users/login',
      PROFILE: '/users/me',
      BY_ID: (id: string) => `/users/${id}`,
    },
    LOANS: {
      CREATE: '/loans',
      ALL: '/loans',
      BY_ID: (id: string) => `/loans/${id}`,
      BY_USER: (userId: string) => `/loans/user/${userId}`,
      UPDATE_STATUS: (id: string) => `/loans/${id}/status`,
    },
    TRANSACTIONS: {
      CREATE: '/transactions',
      ALL: '/transactions',
      BY_ID: (id: string) => `/transactions/${id}`,
      BY_USER: (userId: string) => `/transactions/user/${userId}`,
      BY_LOAN: (loanId: string) => `/transactions/loan/${loanId}`,
    },
    REPAYMENTS: {
      CREATE: '/repayments',
      ALL: '/repayments',
      BY_ID: (id: string) => `/repayments/${id}`,
      BY_LOAN: (loanId: string) => `/repayments/loan/${loanId}`,
      MARK_PAID: (id: string) => `/repayments/${id}/mark-paid`,
    },
  },

  // Request configuration
  TIMEOUT: 10000, // 10 seconds

  // Development settings
  ENABLE_LOGGING: import.meta.env.DEV || import.meta.env.VITE_ENABLE_API_LOGGING === 'true',
} as const;

// Helper function to get full URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Log configuration in development
if (API_CONFIG.ENABLE_LOGGING) {
  console.log('🔧 [API CONFIG] API Configuration loaded:', {
    baseUrl: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    loggingEnabled: API_CONFIG.ENABLE_LOGGING,
  });
}
