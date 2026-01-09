import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { api } from '@lib/api/client';
import { API_ENDPOINTS } from '@lib/api/endpoints';
import { biometricService, BiometricType } from '@lib/services/BiometricService';

interface AuthContextType {
  user: any;
  employee: any;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  biometricInfo: {
    available: boolean;
    type: BiometricType;
    enabled: boolean;
  };
  login: (email: string, password: string, rememberBiometric?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  biometricLogin: () => Promise<{ success: boolean; error?: string }>;
  enableBiometric: (email: string, password: string) => Promise<boolean>;
  disableBiometric: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricInfo, setBiometricInfo] = useState({
    available: false,
    type: 'none' as BiometricType,
    enabled: false,
  });

  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Orchestrates the initial boot sequence: check biometrics and load auth state
   */
  const initializeAuth = async () => {
    setIsLoading(true);
    try {
      // Run these in parallel, but handle their internal errors individually
      await Promise.all([
        loadAuthState(),
        checkBiometricCapability()
      ]);
    } catch (error) {
      console.error('Critical initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Attempts to load tokens. If SecureStore fails to decrypt (common on Android),
   * it wipes the corrupted keys so the app doesn't crash.
   */
  const loadAuthState = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('access_token');
      const userData = await SecureStore.getItemAsync('user_data');
      
      if (accessToken && userData) {
        setToken(accessToken);
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      // This is where your [Error: Could not decrypt] is caught
      console.error('🚨 SecureStore Decryption Failed. Wiping corrupted auth data.', error);
      await clearAllAuthData(); 
    }
  };

  const checkBiometricCapability = async () => {
    try {
      const info = await biometricService.hasBiometricCapability();
      setBiometricInfo(info);
    } catch (error) {
      console.error('Error checking biometric capability:', error);
      // Fallback state if biometric check fails
      setBiometricInfo({ available: false, type: 'none', enabled: false });
    }
  };

  /**
   * Helper to wipe all keys from SecureStore and reset React state
   */
  const clearAllAuthData = async () => {
    try {
      const keys = ['access_token', 'refresh_token', 'user_data', 'employee_data', 'biometric_enabled'];
      await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key).catch(() => {})));
    } finally {
      setToken(null);
      setUser(null);
      setEmployee(null);
    }
  };

const login = async (email: string, password: string, rememberBiometric = false) => {
  try {
    setIsLoading(true);
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
    const { access, refresh, user } = response.data;
    
    // ATTEMPT TO WRITE: 
    // If this fails, the catch block will trigger the 'wipe and retry'
    try {
      await Promise.all([
        SecureStore.setItemAsync('access_token', access),
        SecureStore.setItemAsync('refresh_token', refresh),
        SecureStore.setItemAsync('user_data', JSON.stringify(user)),
      ]);
    } catch (storageError) {
      console.warn("🔐 Storage write failed. Attempting to clear Keystore and retry...");
      
      // 1. Manually delete keys to reset the keychain state
      await SecureStore.deleteItemAsync('access_token').catch(() => {});
      await SecureStore.deleteItemAsync('refresh_token').catch(() => {});
      await SecureStore.deleteItemAsync('user_data').catch(() => {});
      
      // 2. Retry the write once more
      await SecureStore.setItemAsync('access_token', access);
      await SecureStore.setItemAsync('refresh_token', refresh);
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));
    }
    
    setToken(access);
    setUser(user);
    
    if (rememberBiometric && biometricInfo.available) {
      await biometricService.showSetupDialog(email, password);
      await checkBiometricCapability();
    }
    
    router.replace('/(app)');
    return { success: true };
    
  } catch (error: any) {
    console.error('❌ Login error:', error);
    return { success: false, error: "Security storage error. Please restart the app or clear app data." };
  } finally {
    setIsLoading(false);
  }
};

  const biometricLogin = async () => {
    try {
      setIsLoading(true);
      const authenticated = await biometricService.authenticate();
      
      if (!authenticated) {
        return { success: false, error: 'Biometric authentication failed' };
      }
      
      const credentials = await biometricService.getBiometricCredentials();
      if (!credentials) {
        return { success: false, error: 'No saved credentials found' };
      }
      
      return await login(credentials.email, credentials.password);
    } catch (error: any) {
      console.error('❌ Biometric login error:', error);
      return { success: false, error: 'Biometric login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const enableBiometric = async (email: string, password: string): Promise<boolean> => {
    const success = await biometricService.saveBiometricCredentials(email, password);
    if (success) await checkBiometricCapability();
    return success;
  };

  const disableBiometric = async (): Promise<boolean> => {
    const disabled = await biometricService.clearBiometricCredentials();
    if (disabled) await checkBiometricCapability();
    return disabled;
  };

const logout = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    setIsLoading(true);
    await clearAllAuthData(); 
    // REMOVE router.replace('/') from here
    // Let your AuthProvider state update trigger the Layout redirect
    return { success: true };
  } catch (error: any) {
    console.error('❌ Logout error:', error);
    setToken(null);
    setUser(null);
    return { success: false, error: error.message };
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
    biometricInfo,
    login,
    logout,
    biometricLogin,
    enableBiometric,
    disableBiometric,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};