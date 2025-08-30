import { API_CONFIG, getApiUrl } from '../config/api';

// API Types based on backend DTOs
export interface SignUpRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number?: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface SignUpResponse {
  message: string;
  data: User;
}

export interface SignInResponse {
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

// HTTP Client class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    if (API_CONFIG.ENABLE_LOGGING) {
      console.log(`🔧 [API CLIENT] Initialized with base URL: ${baseURL}`);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Get token from localStorage if available
    const token = localStorage.getItem('forwardefi_token');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (API_CONFIG.ENABLE_LOGGING) {
      console.log(`🌐 [API] ${options.method || 'GET'} ${url}`);
      console.log(`📤 [API] Request config:`, {
        method: options.method || 'GET',
        headers: config.headers,
        body: options.body ? JSON.parse(options.body as string) : undefined,
      });
    }

    try {
      const response = await fetch(url, config);

      if (API_CONFIG.ENABLE_LOGGING) {
        console.log(`📡 [API] Response status: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        if (API_CONFIG.ENABLE_LOGGING) {
          console.error(`❌ [API] Error response:`, errorData);
        }
        throw {
          statusCode: response.status,
          message: errorData.message || 'An error occurred',
          error: errorData.error || 'API Error',
        } as ApiError;
      }

      const responseData = await response.json();
      if (API_CONFIG.ENABLE_LOGGING) {
        console.log(`✅ [API] Success response:`, responseData);
      }
      return responseData;
    } catch (error) {
      if (error instanceof TypeError) {
        // Network error
        if (API_CONFIG.ENABLE_LOGGING) {
          console.error(`🌐 [API] Network error:`, error);
        }
        throw {
          statusCode: 0,
          message: 'Network error - please check your connection and ensure the backend is running',
          error: 'NETWORK_ERROR',
        } as ApiError;
      }
      throw error;
    }
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create API client instance
const apiClient = new ApiClient(API_CONFIG.BASE_URL);

// Authentication API functions
export const authApi = {
  signUp: async (userData: SignUpRequest): Promise<SignUpResponse> => {
    if (API_CONFIG.ENABLE_LOGGING) {
      console.log(`🔐 [AUTH] Starting signup process for user:`, {
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone_number: userData.phone_number,
      });
    }

    try {
      const response = await apiClient.post<SignUpResponse>(API_CONFIG.ENDPOINTS.USERS.SIGNUP, userData);
      if (API_CONFIG.ENABLE_LOGGING) {
        console.log(`✅ [AUTH] Signup successful for user: ${userData.email}`);
      }
      return response;
    } catch (error) {
      if (API_CONFIG.ENABLE_LOGGING) {
        console.error(`❌ [AUTH] Signup failed for user: ${userData.email}`, error);
      }
      throw error;
    }
  },

  signIn: async (credentials: SignInRequest): Promise<SignInResponse> => {
    if (API_CONFIG.ENABLE_LOGGING) {
      console.log(`🔐 [AUTH] Starting signin process for user: ${credentials.email}`);
    }

    try {
      const response = await apiClient.post<SignInResponse>(API_CONFIG.ENDPOINTS.USERS.LOGIN, credentials);
      if (API_CONFIG.ENABLE_LOGGING) {
        console.log(`✅ [AUTH] Signin successful for user: ${credentials.email}`);
        console.log(`🎫 [AUTH] JWT token received (length: ${response.data.token.length})`);
      }
      return response;
    } catch (error) {
      if (API_CONFIG.ENABLE_LOGGING) {
        console.error(`❌ [AUTH] Signin failed for user: ${credentials.email}`, error);
      }
      throw error;
    }
  },

  getProfile: async (): Promise<{ message: string; data: User }> => {
    if (API_CONFIG.ENABLE_LOGGING) {
      console.log(`👤 [AUTH] Fetching user profile...`);
    }

    try {
      const response = await apiClient.get<{ message: string; data: User }>(API_CONFIG.ENDPOINTS.USERS.PROFILE);
      if (API_CONFIG.ENABLE_LOGGING) {
        console.log(`✅ [AUTH] Profile fetched successfully for user: ${response.data.email}`);
      }
      return response;
    } catch (error) {
      if (API_CONFIG.ENABLE_LOGGING) {
        console.error(`❌ [AUTH] Profile fetch failed`, error);
      }
      throw error;
    }
  },

  getUserById: async (userId: string): Promise<{ message: string; data: User }> => {
    if (API_CONFIG.ENABLE_LOGGING) {
      console.log(`👤 [AUTH] Fetching user by ID: ${userId}`);
    }

    try {
      const response = await apiClient.get<{ message: string; data: User }>(API_CONFIG.ENDPOINTS.USERS.BY_ID(userId));
      if (API_CONFIG.ENABLE_LOGGING) {
        console.log(`✅ [AUTH] User fetched successfully: ${response.data.email}`);
      }
      return response;
    } catch (error) {
      if (API_CONFIG.ENABLE_LOGGING) {
        console.error(`❌ [AUTH] User fetch failed for ID: ${userId}`, error);
      }
      throw error;
    }
  },
};

// Loan API functions (for future use)
export const loanApi = {
  createLoan: async (loanData: any) => {
    return apiClient.post('/loans', loanData);
  },

  getUserLoans: async (userId: string) => {
    return apiClient.get(`/loans/user/${userId}`);
  },

  getAllLoans: async () => {
    return apiClient.get('/loans');
  },

  updateLoanStatus: async (loanId: string, status: string) => {
    return apiClient.patch(`/loans/${loanId}/status`, { status });
  },
};

// Transaction API functions (for future use)
export const transactionApi = {
  logTransaction: async (transactionData: any) => {
    return apiClient.post('/transactions', transactionData);
  },

  getUserTransactions: async (userId: string) => {
    return apiClient.get(`/transactions/user/${userId}`);
  },

  getLoanTransactions: async (loanId: string) => {
    return apiClient.get(`/transactions/loan/${loanId}`);
  },
};

// Repayment API functions (for future use)
export const repaymentApi = {
  createRepayment: async (repaymentData: any) => {
    return apiClient.post('/repayments', repaymentData);
  },

  getLoanRepayments: async (loanId: string) => {
    return apiClient.get(`/repayments/loan/${loanId}`);
  },

  markRepaymentPaid: async (repaymentId: string) => {
    return apiClient.patch(`/repayments/${repaymentId}/mark-paid`, {});
  },
};

// Re-export interfaces to ensure they're available
export type { ApiError, User };

export default apiClient;
