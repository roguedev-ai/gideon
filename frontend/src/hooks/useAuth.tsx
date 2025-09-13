import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as types from '../types/api';
import apiService from '../services/api';

// Auth Context Interface
interface AuthContextType {
  user: types.User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: types.LoginRequest) => Promise<void>;
  register: (userData: types.RegisterRequest) => Promise<void>;
  logout: () => void;
}

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<types.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const currentUser = await apiService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Token is invalid, remove it
          localStorage.removeItem('authToken');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (credentials: types.LoginRequest): Promise<void> => {
    try {
      setIsLoading(true);
      const tokenResponse = await apiService.login(credentials);

      // Store token
      localStorage.setItem('authToken', tokenResponse.access_token);

      // Get user data
      const currentUser = await apiService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      throw error; // Re-throw for component handling
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: types.RegisterRequest): Promise<void> => {
    try {
      setIsLoading(true);
      const newUser = await apiService.register(userData);

      // After registration, automatically log in
      const tokenResponse = await apiService.login({
        username: userData.username,
        password: userData.password
      });

      // Store token
      localStorage.setItem('authToken', tokenResponse.access_token);
      setUser(newUser);
    } catch (error) {
      throw error; // Re-throw for component handling
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = (): void => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const isAuthenticated = !!user;

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
