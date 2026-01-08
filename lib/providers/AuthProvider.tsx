import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { api } from '@lib/api/client';
import { API_ENDPOINTS } from '@lib/api/endpoints';

interface AuthContextType {
  user: any;
  employee: any;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>; // Updated return type
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const [accessToken, userData] = await Promise.all([
        SecureStore.getItemAsync('access_token'),
        SecureStore.getItemAsync('user_data'),
      ]);
      
      if (accessToken && userData) {
        setToken(accessToken);
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔐 Attempting login for:', email);
      
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });
      
      const { access, refresh, user } = response.data;
      console.log('✅ Login successful for:', user.email);
      
      // Store tokens and user data
      await Promise.all([
        SecureStore.setItemAsync('access_token', access),
        SecureStore.setItemAsync('refresh_token', refresh),
        SecureStore.setItemAsync('user_data', JSON.stringify(user)),
      ]);
      
      // Update state
      setToken(access);
      setUser(user);
      
      console.log('🔄 Navigation to app...');
      
      // Navigate to app after successful login
      // Note: Make sure this matches your app route structure
      // If your app is at /(app), use router.replace('/(app)')
      // If your app is at /app, use router.replace('/app')
      router.replace('/(app)');
      
      return { success: true };
      
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid credentials';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      console.log('🚪 Starting logout process...');
      
      // Clear all auth data from SecureStore
      await Promise.all([
        SecureStore.deleteItemAsync('access_token'),
        SecureStore.deleteItemAsync('refresh_token'),
        SecureStore.deleteItemAsync('user_data'),
        SecureStore.deleteItemAsync('employee_data'),
      ]);
      
      // Clear React state
      setToken(null);
      setUser(null);
      setEmployee(null);
      
      console.log('✅ Auth data cleared, redirecting to home page...');
      
      // IMPORTANT: Redirect to ROOT INDEX PAGE (/)
      // This will show your landing page with "Get Started", "Login", "Register" buttons
      router.replace('/');
      
      console.log('🎉 Logout completed successfully');
      return { success: true };
      
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      
      // Even if SecureStore fails, clear state and redirect
      setToken(null);
      setUser(null);
      setEmployee(null);
      
      // Still try to redirect to home page
      router.replace('/');
      
      return { 
        success: false, 
        error: error.message || 'Failed to logout completely'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    employee,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};