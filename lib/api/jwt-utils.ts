// import * as SecureStore from 'expo-secure-store';
import { safeSetItem, safeGetItem, safeDeleteItem } from '@lib/utils/secure-store';

export interface DecodedJWT {
  token_type: string;
  exp: number;
  iat: number;
  jti: string;
  user_id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
}

/**
 * Decode a JWT token without external libraries
 */
export const decodeJWT = (token: string): DecodedJWT | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const expiryTime = decoded.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  
  // Consider token expired if it's within 5 minutes of expiry
  return currentTime >= (expiryTime - 5 * 60 * 1000);
};

/**
 * Get time remaining until token expires (in minutes)
 */
export const getTokenExpiryMinutes = (token: string): number => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return 0;
  
  const expiryTime = decoded.exp * 1000;
  const currentTime = Date.now();
  const minutesRemaining = Math.max(0, Math.floor((expiryTime - currentTime) / 60000));
  
  return minutesRemaining;
};

/**
 * Validate Django JWT response
 */
export const validateAuthResponse = (response: any): boolean => {
  if (!response) return false;
  
  const requiredFields = ['access', 'refresh'];
  
  for (const field of requiredFields) {
    if (!response[field] || typeof response[field] !== 'string') {
      console.error(`Invalid auth response: missing or invalid ${field}`);
      return false;
    }
  }
  
  // Validate JWT format (should have 3 parts separated by dots)
  if (!response.access.includes('.')) {
    console.error('Invalid JWT access token format');
    return false;
  }
  
  return true;
};

/**
 * Parse Django error response
 */
export const parseDjangoError = (error: any): string => {
  if (!error.response?.data) {
    return error.message || 'An unknown error occurred';
  }

  const data = error.response.data;
  
  // Handle different Django error formats
  if (data.detail) {
    return data.detail;
  }
  
  if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
    return data.non_field_errors[0];
  }
  
  if (data.message) {
    return data.message;
  }
  
  // Handle field-specific errors
  if (typeof data === 'object') {
    const fieldErrors: string[] = [];
    
    Object.keys(data).forEach((field) => {
      if (Array.isArray(data[field])) {
        data[field].forEach((err: string) => {
          fieldErrors.push(`${field}: ${err}`);
        });
      } else if (typeof data[field] === 'string') {
        fieldErrors.push(`${field}: ${data[field]}`);
      }
    });
    
    if (fieldErrors.length > 0) {
      return fieldErrors[0];
    }
  }
  
  // Fallback to status text or generic error
  return error.response.statusText || 'Request failed';
};

/**
 * Create headers for Django authentication
 */
export const createAuthHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Get user info from stored tokens
 */
export const getUserFromTokens = async (): Promise<{
  user: any;
  employee: any;
  isAuthenticated: boolean;
}> => {
  try {
    const [accessToken, userData, employeeData] = await Promise.all([
      getItem('access_token'),
      getItem('user_data'),
      getItem('employee_data'),
    ]);

    if (!accessToken) {
      return {
        user: null,
        employee: null,
        isAuthenticated: false,
      };
    }

    return {
      user: userData ? JSON.parse(userData) : null,
      employee: employeeData ? JSON.parse(employeeData) : null,
      isAuthenticated: !isTokenExpired(accessToken),
    };
  } catch (error) {
    console.error('Error getting user from tokens:', error);
    return {
      user: null,
      employee: null,
      isAuthenticated: false,
    };
  }
};

/**
 * Clear all auth data from SecureStore
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    // Clear each item individually to avoid Promise.all issues
    await deleteItem('access_token');
    await deleteItem('refresh_token');
    await deleteItem('user_data');
    await deleteItem('employee_data');
    await deleteItem('remember_me');
    await deleteItem('biometric_enabled');
    
    console.log('Auth data cleared successfully');
  } catch (error) {
    console.error('Error clearing auth data:', error);
    // Don't throw the error, just log it
  }
};

/**
 * Save auth data to SecureStore
 */
export const saveAuthData = async (authResponse: {
  access: string;
  refresh: string;
  user?: any;
  employee?: any;
}): Promise<void> => {
  try {
    // Save each item individually
    await setItem('access_token', authResponse.access);
    await setItem('refresh_token', authResponse.refresh);

    if (authResponse.user) {
      await setItem('user_data', JSON.stringify(authResponse.user));
    }

    if (authResponse.employee) {
      await setItem('employee_data', JSON.stringify(authResponse.employee));
    }

    console.log('Auth data saved successfully');
  } catch (error) {
    console.error('Error saving auth data:', error);
    throw error;
  }
};

/**
 * Check authentication status
 */
export const checkAuthStatus = async (): Promise<{
  isAuthenticated: boolean;
  needsRefresh: boolean;
  userData: any | null;
}> => {
  try {
    const accessToken = await getItem('access_token');
    const refreshToken = await getItem('refresh_token');
    const userDataStr = await getItem('user_data');

    if (!accessToken || !refreshToken) {
      return {
        isAuthenticated: false,
        needsRefresh: false,
        userData: null,
      };
    }

    const decoded = decodeJWT(accessToken);
    if (!decoded) {
      return {
        isAuthenticated: false,
        needsRefresh: false,
        userData: null,
      };
    }

    const isExpired = decoded.exp * 1000 < Date.now();
    const userData = userDataStr ? JSON.parse(userDataStr) : null;

    return {
      isAuthenticated: !isExpired,
      needsRefresh: isExpired,
      userData,
    };
  } catch (error) {
    console.error('Error checking auth status:', error);
    return {
      isAuthenticated: false,
      needsRefresh: false,
      userData: null,
    };
  }
};

/**
 * Get stored tokens
 */
export const getStoredTokens = async (): Promise<{
  access: string | null;
  refresh: string | null;
}> => {
  try {
    const [access, refresh] = await Promise.all([
      getItem('access_token'),
      getItem('refresh_token'),
    ]);

    return { access, refresh };
  } catch (error) {
    console.error('Error getting stored tokens:', error);
    return { access: null, refresh: null };
  }
};

/**
 * Check if token is about to expire (within 5 minutes)
 */
export const isTokenAboutToExpire = async (): Promise<boolean> => {
  try {
    const accessToken = await getItem('access_token');
    if (!accessToken) return true;

    const decoded = decodeJWT(accessToken);
    if (!decoded || !decoded.exp) return true;

    const expiryTime = decoded.exp * 1000;
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    return currentTime >= (expiryTime - fiveMinutes);
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return true;
  }
};

// Helper functions to handle SecureStore operations safely
const setItem = async (key: string, value: string): Promise<void> => {
  try {
    await safeSetItem(key, value);
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    throw error;
  }
};

const getItem = async (key: string): Promise<string | null> => {
  try {
    return await safeGetItem(key);
  } catch (error) {
    console.error(`Error getting ${key}:`, error);
    return null;
  }
};

const deleteItem = async (key: string): Promise<void> => {
  try {
    await safeDeleteItem(key);
  } catch (error) {
    console.error(`Error deleting ${key}:`, error);
    // Don't throw, just log the error
  }
};