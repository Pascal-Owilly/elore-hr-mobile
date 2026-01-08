import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ResetPasswordRequest, 
  ResetPasswordConfirmRequest, 
  ChangePasswordRequest,
  ApiResponse 
} from '@/lib/types/auth';

// Use your actual IP address from the logs
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.25:8000/api';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
};

// Get auth token from AsyncStorage
const getAuthToken = async (): Promise<string> => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }
    return token;
  } catch (error) {
    console.error('Error getting auth token from AsyncStorage:', error);
    throw new Error('Authentication error. Please log in again.');
  }
};

// Optional: Helper function to store tokens (if not already in your AuthProvider)
export const storeAuthTokens = async (accessToken: string, refreshToken?: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  } catch (error) {
    console.error('Error storing auth tokens:', error);
    throw error;
  }
};

// Optional: Clear tokens (for logout)
export const clearAuthTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_DATA,
    ]);
  } catch (error) {
    console.error('Error clearing auth tokens:', error);
    throw error;
  }
};

export const changePassword = async (data: ChangePasswordRequest): Promise<ApiResponse> => {
  try {
    const token = await getAuthToken();
    
    console.log('📡 Changing password...');
    const response = await fetch(`${API_BASE_URL}/auth/change-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-App-Version': '1.0.0',
      },
      body: JSON.stringify(data),
    });

    console.log(`✅ Password change response status: ${response.status}`);
    const result = await response.json();
    
    if (!response.ok) {
      const errorMessage = result.error || result.detail || result.message || 'Failed to change password';
      console.error('❌ Password change failed:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('✅ Password changed successfully');
    return { 
      message: result.message || 'Password changed successfully',
      data: result
    };
  } catch (error: any) {
    console.error('❌ Change password error:', error.message || error);
    throw error;
  }
};

export const resetPasswordRequest = async (data: ResetPasswordRequest): Promise<ApiResponse> => {
  try {
    console.log('📡 Requesting password reset for email:', data.email);
    const response = await fetch(`${API_BASE_URL}/auth/reset-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Version': '1.0.0',
      },
      body: JSON.stringify(data),
    });

    console.log(`✅ Reset request response status: ${response.status}`);
    const result = await response.json();
    
    if (!response.ok) {
      const errorMessage = result.error || result.detail || result.message || 'Failed to send reset email';
      console.error('❌ Reset request failed:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('✅ Reset request successful');
    return { 
      message: result.message || 'If your email exists in our system, you will receive password reset instructions.',
      data: result
    };
  } catch (error: any) {
    console.error('❌ Reset password request error:', error.message || error);
    throw error;
  }
};

export const resetPasswordConfirm = async (data: ResetPasswordConfirmRequest): Promise<ApiResponse> => {
  try {
    console.log('📡 Confirming password reset with UID:', data.uid);
    const response = await fetch(`${API_BASE_URL}/auth/reset-password-confirm/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Version': '1.0.0',
      },
      body: JSON.stringify(data),
    });

    console.log(`✅ Reset confirm response status: ${response.status}`);
    const result = await response.json();
    
    if (!response.ok) {
      const errorMessage = result.error || result.detail || result.message || 'Failed to reset password';
      console.error('❌ Reset confirm failed:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('✅ Password reset confirmed successfully');
    return { 
      message: result.message || 'Password reset successfully! You can now log in with your new password.',
      data: result
    };
  } catch (error: any) {
    console.error('❌ Reset password confirm error:', error.message || error);
    throw error;
  }
};

// Helper function to get stored user data
export const getStoredUserData = async (): Promise<any | null> => {
  try {
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Helper function to store user data
export const storeUserData = async (userData: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  } catch (error) {
    console.error('Error storing user data:', error);
    throw error;
  }
};