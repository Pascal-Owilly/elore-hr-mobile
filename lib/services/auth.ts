import { api, offlineApi } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
  device_name?: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login: string;
  employee?: {
    id: string;
    employee_id: string;
    national_id: string;
    kra_pin?: string;
    nhif_number?: string;
    nssf_number?: string;
    department?: string;
    position?: string;
    hire_date: string;
    employment_type: string;
    basic_salary: number;
    bank_name?: string;
    bank_account?: string;
    phone_number: string;
    profile_picture?: string;
  };
}

export interface AuthResponse extends AuthTokens {
  user?: User;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface ResetPasswordConfirmData {
  uid: string;
  token: string;
  new_password: string;
  confirm_password: string;
}

class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Login with username/email and password
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
      //   username: credentials.username || credentials.email,
      //   password: credentials.password,
      //   device_name: credentials.device_name || Platform.OS,
      // });

      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
        email: credentials.email || credentials.username, // Send email field
        password: credentials.password,
        device_name: credentials.device_name || Platform.OS,

      });

      const { access, refresh } = response.data;

      // Store tokens
      await this.storeTokens({ access, refresh });

      // Fetch user profile
      const user = await this.fetchUserProfile();

      return { access, refresh, user };
    } catch (error) {
      console.error('Login error:', error);
      throw this.formatAuthError(error);
    }
  }

  // Register new user
  async register(data: RegisterData): Promise<User> {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw this.formatAuthError(error);
    }
  }

  // Refresh access token
  async refreshToken(): Promise<AuthTokens> {
    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
        refresh: refreshToken,
      });

      const { access } = response.data;

      // Update access token (refresh token remains the same)
      await SecureStore.setItemAsync('access_token', access);

      return { access, refresh: refreshToken };
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logout();
      throw error;
    }
  }

  // Get current user profile
  async fetchUserProfile(): Promise<User> {
    try {
      const response = await api.get(API_ENDPOINTS.EMPLOYEES.PROFILE);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      
      // Fallback to getting basic user info
      try {
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
          // Decode JWT to get basic user info
          const decoded = this.decodeJWT(token);
          if (decoded) {
            return {
              id: decoded.user_id || decoded.id,
              username: decoded.username,
              email: decoded.email || '',
              first_name: decoded.first_name || '',
              last_name: decoded.last_name || '',
              is_active: decoded.is_active || true,
              is_staff: decoded.is_staff || false,
              is_superuser: decoded.is_superuser || false,
              date_joined: decoded.date_joined || new Date().toISOString(),
              last_login: decoded.last_login || new Date().toISOString(),
            } as User;
          }
        }
      } catch (decodeError) {
        console.error('Failed to decode token:', decodeError);
      }
      
      throw error;
    }
  }

  // Change password
  async changePassword(data: ChangePasswordData): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
    } catch (error) {
      console.error('Change password error:', error);
      throw this.formatAuthError(error);
    }
  }

  // Request password reset
  async resetPassword(data: ResetPasswordData): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
    } catch (error) {
      console.error('Reset password error:', error);
      throw this.formatAuthError(error);
    }
  }

  // Confirm password reset
  async resetPasswordConfirm(data: ResetPasswordConfirmData): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD_CONFIRM, data);
    } catch (error) {
      console.error('Reset password confirm error:', error);
      throw this.formatAuthError(error);
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if exists
      await api.post('/auth/logout/', {}).catch(() => {
        // Ignore errors if endpoint doesn't exist
      });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear stored tokens
      await this.clearTokens();
      
      // Clear any cached data
      await this.clearAuthData();
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const accessToken = await SecureStore.getItemAsync('access_token');
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      
      if (!accessToken || !refreshToken) {
        return false;
      }

      // Check if access token is expired
      const decoded = this.decodeJWT(accessToken);
      if (decoded && decoded.exp) {
        const isExpired = Date.now() >= decoded.exp * 1000;
        if (isExpired) {
          // Try to refresh token
          try {
            await this.refreshToken();
            return true;
          } catch {
            return false;
          }
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  // Get current tokens
  async getCurrentTokens(): Promise<AuthTokens | null> {
    try {
      const access = await SecureStore.getItemAsync('access_token');
      const refresh = await SecureStore.getItemAsync('refresh_token');
      
      if (!access || !refresh) {
        return null;
      }

      return { access, refresh };
    } catch (error) {
      console.error('Failed to get tokens:', error);
      return null;
    }
  }

  // Store tokens securely
  private async storeTokens(tokens: AuthTokens): Promise<void> {
    try {
      await SecureStore.setItemAsync('access_token', tokens.access);
      await SecureStore.setItemAsync('refresh_token', tokens.refresh);
      
      // Also store in localStorage for web compatibility if needed
      if (Platform.OS === 'web') {
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);
      }
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw error;
    }
  }

  // Clear all auth data
  private async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      
      // Clear from localStorage for web
      if (Platform.OS === 'web') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  // Clear additional auth-related data
  private async clearAuthData(): Promise<void> {
    try {
      // Clear any user-specific cached data
      await SecureStore.deleteItemAsync('user_profile');
      
      // Clear web storage
      if (Platform.OS === 'web') {
        localStorage.removeItem('user_profile');
        localStorage.removeItem('last_login');
      }
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  // Decode JWT token without external library
  private decodeJWT(token: string): any {
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
  }

  // Format auth errors for user display
  private formatAuthError(error: any): Error {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          if (data.detail) {
            return new Error(data.detail);
          }
          if (data.non_field_errors) {
            return new Error(data.non_field_errors[0]);
          }
          if (data.password) {
            return new Error(data.password[0]);
          }
          if (data.username) {
            return new Error(data.username[0]);
          }
          if (data.email) {
            return new Error(data.email[0]);
          }
          return new Error('Invalid data. Please check your input.');
        
        case 401:
          return new Error('Invalid username or password.');
        
        case 403:
          return new Error('Account disabled. Please contact HR.');
        
        case 404:
          return new Error('Authentication service unavailable.');
        
        case 429:
          return new Error('Too many attempts. Please try again later.');
        
        default:
          return new Error('Authentication failed. Please try again.');
      }
    }
    
    if (error.message === 'Network Error') {
      return new Error('No internet connection. Please check your network.');
    }
    
    return error;
  }

  // Login with employee ID (if supported)
  async loginWithEmployeeID(employeeId: string, password: string): Promise<AuthResponse> {
    try {
      // This endpoint might need to be created
      const response = await api.post('/auth/login/employee/', {
        employee_id: employeeId,
        password: password,
      });

      const { access, refresh } = response.data;
      await this.storeTokens({ access, refresh });

      const user = await this.fetchUserProfile();
      return { access, refresh, user };
    } catch (error) {
      console.error('Employee login error:', error);
      throw this.formatAuthError(error);
    }
  }

  // Get user by ID (for admin purposes)
  async getUserById(userId: string): Promise<User> {
    try {
      const response = await api.get(API_ENDPOINTS.AUTH.USER_DETAIL(userId));
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw error;
    }
  }

  // Get all users (for admin purposes)
  async getUsers(params?: any): Promise<User[]> {
    try {
      const response = await api.get(API_ENDPOINTS.AUTH.USERS_LIST, { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  }
}

export default AuthService.getInstance();