import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { authApi, type User as ApiUser, type ApiError } from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  walletAddress?: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (firstName: string, lastName: string, email: string, password: string, phoneNumber?: string) => Promise<boolean>;
  signOut: () => void;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Convert API user to local user format
  const convertApiUser = (apiUser: ApiUser, walletAddress?: string): User => ({
    id: apiUser.user_id,
    username: `${apiUser.first_name} ${apiUser.last_name}`,
    email: apiUser.email,
    firstName: apiUser.first_name,
    lastName: apiUser.last_name,
    phoneNumber: apiUser.phone_number,
    walletAddress: walletAddress,
    isAdmin: apiUser.is_admin,
    isActive: apiUser.is_active,
    createdAt: new Date(apiUser.created_at),
    updatedAt: apiUser.updated_at ? new Date(apiUser.updated_at) : undefined,
  });

  // Load user from localStorage and validate token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      console.log(`🚀 [AUTH CONTEXT] Initializing authentication...`);
      
      const token = localStorage.getItem('forwardefi_token');
      if (token) {
        console.log(`🎫 [AUTH CONTEXT] Found existing token, validating...`);
        console.log(`🎫 [AUTH CONTEXT] Token preview: ${token.substring(0, 20)}...`);
        
        try {
          setLoading(true);
          const response = await authApi.getProfile();
          const userData = convertApiUser(response.data, address);
          setUser(userData);
          localStorage.setItem('forwardefi_user', JSON.stringify(userData));
          
          console.log(`✅ [AUTH CONTEXT] Authentication restored for user: ${userData.email}`);
          console.log(`👤 [AUTH CONTEXT] User data:`, {
            id: userData.id,
            email: userData.email,
            name: userData.username,
            walletAddress: userData.walletAddress,
          });
        } catch (error) {
          console.error('❌ [AUTH CONTEXT] Token validation failed:', error);
          console.log(`🧹 [AUTH CONTEXT] Clearing invalid tokens and user data`);
          
          // Clear invalid token
          localStorage.removeItem('forwardefi_token');
          localStorage.removeItem('forwardefi_user');
        } finally {
          setLoading(false);
        }
      } else {
        console.log(`🔍 [AUTH CONTEXT] No existing token found`);
      }
    };

    initializeAuth();
  }, [address]);

  // Update wallet address when connected
  useEffect(() => {
    if (user && address && user.walletAddress !== address) {
      console.log(`🔗 [AUTH CONTEXT] Wallet connected for user ${user.email}: ${address}`);
      
      const updatedUser = { ...user, walletAddress: address };
      setUser(updatedUser);
      localStorage.setItem('forwardefi_user', JSON.stringify(updatedUser));
      
      // Save wallet address to database
      const saveWalletAddressToDb = async () => {
        try {
          console.log(`💾 [AUTH CONTEXT] Saving wallet address to database for user: ${user.id}`);
          await authApi.saveWalletAddress(user.id, address);
          console.log(`✅ [AUTH CONTEXT] Wallet address saved to database successfully`);
        } catch (error) {
          console.error(`❌ [AUTH CONTEXT] Failed to save wallet address to database:`, error);
          // Don't throw error to avoid breaking the wallet connection flow
        }
      };
      
      saveWalletAddressToDb();
      
      console.log(`💾 [AUTH CONTEXT] Updated user data with wallet address`);
    }
  }, [address, user]);

  // Auto-disconnect wallet if connected but user is not authenticated
  useEffect(() => {
    if (isConnected && !user) {
      console.log(`🚫 [AUTH CONTEXT] Wallet connected but user not authenticated - auto-disconnecting`);
      disconnect();
    }
  }, [isConnected, user, disconnect]);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    console.log(`🔐 [AUTH CONTEXT] Starting sign in process for: ${email}`);
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`⏳ [AUTH CONTEXT] Setting loading state and clearing errors`);
      
      const response = await authApi.signIn({ email, password });
      
      console.log(`🎫 [AUTH CONTEXT] Storing JWT token in localStorage`);
      // Store JWT token
      localStorage.setItem('forwardefi_token', response.data.token);
      
      console.log(`👤 [AUTH CONTEXT] Converting and storing user data`);
      // Convert and store user data
      const userData = convertApiUser(response.data.user, address);
      setUser(userData);
      localStorage.setItem('forwardefi_user', JSON.stringify(userData));
      
      console.log(`✅ [AUTH CONTEXT] Sign in completed successfully for: ${email}`);
      console.log(`👤 [AUTH CONTEXT] User authenticated:`, {
        id: userData.id,
        email: userData.email,
        name: userData.username,
        walletAddress: userData.walletAddress,
      });
      
      return true;
    } catch (error) {
      console.error('❌ [AUTH CONTEXT] Sign in error:', error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || 'Sign in failed';
      setError(errorMessage);
      
      console.log(`💥 [AUTH CONTEXT] Sign in failed for ${email}: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
      console.log(`🏁 [AUTH CONTEXT] Sign in process completed, loading state cleared`);
    }
  };

  const signUp = async (firstName: string, lastName: string, email: string, password: string, phoneNumber?: string): Promise<boolean> => {
    console.log(`📝 [AUTH CONTEXT] Starting sign up process for: ${email}`);
    console.log(`📝 [AUTH CONTEXT] User details:`, {
      firstName,
      lastName,
      email,
      phoneNumber: phoneNumber || 'Not provided',
    });
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`⏳ [AUTH CONTEXT] Setting loading state and clearing errors`);
      
      const response = await authApi.signUp({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        phone_number: phoneNumber,
      });
      
      console.log(`✅ [AUTH CONTEXT] Sign up API call successful, now signing in...`);
      
      // For sign up, we need to sign in afterward to get the token
      const signInSuccess = await signIn(email, password);
      
      if (signInSuccess) {
        console.log(`🎉 [AUTH CONTEXT] Complete sign up process successful for: ${email}`);
      } else {
        console.log(`⚠️ [AUTH CONTEXT] Sign up succeeded but auto sign-in failed for: ${email}`);
      }
      
      return signInSuccess;
    } catch (error) {
      console.error('❌ [AUTH CONTEXT] Sign up error:', error);
      const apiError = error as ApiError;
      const errorMessage = apiError.message || 'Sign up failed';
      setError(errorMessage);
      
      console.log(`💥 [AUTH CONTEXT] Sign up failed for ${email}: ${errorMessage}`);
      return false;
    } finally {
      setLoading(false);
      console.log(`🏁 [AUTH CONTEXT] Sign up process completed, loading state cleared`);
    }
  };

  const signOut = () => {
    console.log(`🚪 [AUTH CONTEXT] Starting sign out process`);
    
    if (user) {
      console.log(`👋 [AUTH CONTEXT] Signing out user: ${user.email}`);
    }
    
    setUser(null);
    setError(null);
    localStorage.removeItem('forwardefi_user');
    localStorage.removeItem('forwardefi_token');
    
    console.log(`🧹 [AUTH CONTEXT] Cleared user data and tokens from localStorage`);
    
    // Disconnect wallet when signing out
    if (isConnected) {
      console.log(`🔌 [AUTH CONTEXT] Disconnecting wallet`);
      disconnect();
    }
    
    console.log(`✅ [AUTH CONTEXT] Sign out completed successfully`);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('forwardefi_user', JSON.stringify(updatedUser));
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
