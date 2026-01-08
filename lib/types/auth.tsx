import { 
  ResetPasswordRequest, 
  ResetPasswordConfirmRequest, 
  ChangePasswordRequest,
  ApiResponse 
} from '@/lib/types/auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

export const authApi = {
  // Change Password
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/auth/change-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password');
      }

      return { message: result.message || 'Password changed successfully' };
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },

  // Reset Password Request
  async resetPasswordRequest(data: ResetPasswordRequest): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send reset email');
      }

      return { message: result.message || 'Reset password email sent' };
    } catch (error) {
      console.error('Reset password request error:', error);
      throw error;
    }
  },

  // Reset Password Confirm
  async resetPasswordConfirm(data: ResetPasswordConfirmRequest): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password-confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }

      return { message: result.message || 'Password reset successfully' };
    } catch (error) {
      console.error('Reset password confirm error:', error);
      throw error;
    }
  },
};

// Helper function to get auth token
async function getAuthToken(): Promise<string> {
  // Implement based on your auth storage
  // For example, using AsyncStorage or secure store
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return token;
}