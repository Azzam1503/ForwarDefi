import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useDisconnect } from 'wagmi';

interface User {
  id: string;
  username: string;
  email: string;
  walletAddress?: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (username: string, password: string) => Promise<boolean>;
  signUp: (username: string, email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  updateUser: (userData: Partial<User>) => void;
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
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('forwardefi_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Update wallet address when connected
  useEffect(() => {
    if (user && address) {
      const updatedUser = { ...user, walletAddress: address };
      setUser(updatedUser);
      localStorage.setItem('forwardefi_user', JSON.stringify(updatedUser));
    }
  }, [address, user]);

  // Auto-disconnect wallet if connected but user is not authenticated
  useEffect(() => {
    if (isConnected && !user) {
      disconnect();
    }
  }, [isConnected, user, disconnect]);

  const signIn = async (username: string, password: string): Promise<boolean> => {
    try {
      // In a real app, this would make an API call to your backend
      const savedUsers = JSON.parse(localStorage.getItem('forwardefi_users') || '[]');
      const foundUser = savedUsers.find((u: any) => u.username === username && u.password === password);
      
      if (foundUser) {
        const userProfile = {
          id: foundUser.id,
          username: foundUser.username,
          email: foundUser.email,
          walletAddress: address || undefined,
          createdAt: new Date(foundUser.createdAt)
        };
        setUser(userProfile);
        localStorage.setItem('forwardefi_user', JSON.stringify(userProfile));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Sign in error:', error);
      return false;
    }
  };

  const signUp = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      // In a real app, this would make an API call to your backend
      const savedUsers = JSON.parse(localStorage.getItem('forwardefi_users') || '[]');
      
      // Check if user already exists
      if (savedUsers.find((u: any) => u.username === username || u.email === email)) {
        return false;
      }

      const newUser = {
        id: Date.now().toString(),
        username,
        email,
        password, // In real app, this would be hashed
        createdAt: new Date().toISOString()
      };

      savedUsers.push(newUser);
      localStorage.setItem('forwardefi_users', JSON.stringify(savedUsers));

      const userProfile = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        walletAddress: address || undefined,
        createdAt: new Date(newUser.createdAt)
      };

      setUser(userProfile);
      localStorage.setItem('forwardefi_user', JSON.stringify(userProfile));
      return true;
    } catch (error) {
      console.error('Sign up error:', error);
      return false;
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('forwardefi_user');
    // Disconnect wallet when signing out
    if (isConnected) {
      disconnect();
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('forwardefi_user', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
