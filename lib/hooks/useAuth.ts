// lib/hooks/useAuth.ts - CORRECTED VERSION
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { api } from '@lib/api/client';
import { API_ENDPOINTS } from '@lib/api/endpoints';
import { decodeJWT, isTokenExpired, parseDjangoError, clearAuthData as clearAuthDataUtil, saveAuthData as saveAuthDataUtil } from '@lib/api/jwt-utils';

// Storage keys
const AUTH_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  EMPLOYEE_DATA: 'employee_data',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  REMEMBER_ME: 'remember_me',
};

// Types based on your Django backend
export interface DjangoUser {
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
  role?: 'EMPLOYEE' | 'MANAGER' | 'HR' | 'ADMIN' | 'FINANCE'; // Custom field for frontend
  permissions?: string[];
}

export interface Employee {
  id: string;
  employee_id: string;
  user: string;
  national_id?: string;
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
  manager?: string;
  branch?: string;
  employment_status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED';
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user?: DjangoUser;
  employee?: Employee;
}

export interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
  rememberMe?: boolean;
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

export const useAuth = () => {
  const [user, setUser] = useState<DjangoUser | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const router = useRouter();

  // Check biometric availability
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (compatible && enrolled) {
        setBiometricAvailable(true);
        
        // Check if user has enabled biometric auth
        const enabled = await SecureStore.getItemAsync(AUTH_KEYS.BIOMETRIC_ENABLED);
        setBiometricEnabled(enabled === 'true');
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  };

  // Load saved auth state on mount
  useEffect(() => {
    loadAuthState();
  }, []);

// Update the loadAuthState function to handle SecureStore errors:
const loadAuthState = async () => {
  try {
    const [accessToken, userData, employeeData] = await Promise.all([
      SecureStore.getItemAsync(AUTH_KEYS.ACCESS_TOKEN).catch(() => null),
      SecureStore.getItemAsync(AUTH_KEYS.USER_DATA).catch(() => null),
      SecureStore.getItemAsync(AUTH_KEYS.EMPLOYEE_DATA).catch(() => null),
    ]);

    if (accessToken && userData) {
      // Check if token is expired
      if (isTokenExpired(accessToken)) {
        try {
          // Try to refresh token
          await refreshToken();
        } catch (refreshError) {
          // Refresh failed, clear auth data
          await clearAuthData();
          return;
        }
      }

      setToken(accessToken);
      
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Load employee data if available
      if (employeeData) {
        try {
          const parsedEmployee = JSON.parse(employeeData);
          setEmployee(parsedEmployee);
        } catch (e) {
          console.error('Error parsing employee data:', e);
        }
      } else {
        // If no saved employee data, try to fetch it
        // But only for non-admin users
        const userRole = parsedUser.role || 
          (parsedUser.is_superuser ? 'ADMIN' : 
           parsedUser.is_staff ? 'HR' : 'EMPLOYEE');
        
        if (userRole !== 'ADMIN' && userRole !== 'HR') {
          await fetchEmployeeProfile();
        }
      }
    }
  } catch (error) {
    console.error('Error loading auth state:', error);
  } finally {
    setIsLoading(false);
  }
};

const fetchEmployeeData = async () => {
  try {
    console.log('🔄 Manually fetching employee data...');
    
    // Clear any existing employee data
    await SecureStore.deleteItemAsync(AUTH_KEYS.EMPLOYEE_DATA);
    setEmployee(null);
    
    // Fetch fresh data
    const employeeData = await fetchEmployeeProfile();
    
    if (employeeData) {
      console.log('✅ Employee data fetched successfully');
      return { success: true, data: employeeData };
    } else {
      console.log('⚠️ No employee data found');
      return { success: false, error: 'No employee data found' };
    }
  } catch (error: any) {
    console.error('❌ Error fetching employee data:', error);
    return { success: false, error: error.message };
  }
};

// Update the clearAuthData function in useAuth.ts:
const clearAuthData = async () => {
  try {
    // Clear each item individually
    const deletePromises = [
      SecureStore.deleteItemAsync(AUTH_KEYS.ACCESS_TOKEN).catch(() => {}),
      SecureStore.deleteItemAsync(AUTH_KEYS.REFRESH_TOKEN).catch(() => {}),
      SecureStore.deleteItemAsync(AUTH_KEYS.USER_DATA).catch(() => {}),
      SecureStore.deleteItemAsync(AUTH_KEYS.EMPLOYEE_DATA).catch(() => {}),
    ];
    
    await Promise.all(deletePromises);
    
    setToken(null);
    setUser(null);
    setEmployee(null);
  } catch (error) {
    console.error('Error clearing auth data:', error);
    // Even if SecureStore fails, clear local state
    setToken(null);
    setUser(null);
    setEmployee(null);
  }
};

const saveAuthData = async (data: AuthResponse) => {
  try {
    await saveAuthDataUtil(data);
    setToken(data.access);
    setUser(data.user || null);
    
    // If employee data comes from login response, use it
    if (data.employee) {
      setEmployee(data.employee);
      await SecureStore.setItemAsync(
        AUTH_KEYS.EMPLOYEE_DATA, 
        JSON.stringify(data.employee)
      );
    } else {
      // Otherwise, clear existing employee data
      setEmployee(null);
      await SecureStore.deleteItemAsync(AUTH_KEYS.EMPLOYEE_DATA);
    }
  } catch (error) {
    console.error('Error saving auth data:', error);
    throw error;
  }
};


const login = async (credentials: LoginCredentials) => {
  try {
    setIsLoading(true);
    
    // Django REST Framework JWT endpoint
    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      email: credentials.email || credentials.username, // Fixed: use email or username
      password: credentials.password,
    });
    
    await saveAuthData(response.data);
    
    // Save remember me preference
    if (credentials.rememberMe) {
      await SecureStore.setItemAsync(AUTH_KEYS.REMEMBER_ME, 'true');
    }
    
    // ALWAYS try to fetch employee profile after login
    await fetchEmployeeProfile();
    
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Login error:', error);
    
    const message = parseDjangoError(error);
    
    return { success: false, error: message };
  } finally {
    setIsLoading(false);
  }
};

// lib/hooks/useAuth.ts - Updated fetchEmployeeProfile function
const fetchEmployeeProfile = async () => {
  try {
    console.log('🔍 Fetching employee profile from:', '/employees/me/');
    
    // Clear any cached employee data first
    await SecureStore.deleteItemAsync(AUTH_KEYS.EMPLOYEE_DATA);
    
    const response = await api.get('/employees/me/');
    
    console.log('📋 Raw API Response:', {
      status: response.status,
      data: response.data,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      keys: response.data ? Object.keys(response.data) : [],
    });
    
    // Log all available data
    console.log('📊 Employee Data Breakdown:');
    console.log('- employee_number:', response.data?.employee_number);
    console.log('- job_title:', response.data?.job_title);
    console.log('- employment_type:', response.data?.employment_type);
    console.log('- department:', response.data?.department);
    console.log('- department_name:', response.data?.department_name);
    console.log('- organization:', response.data?.organization);
    console.log('- organization_data:', response.data?.organization_data);
    console.log('- has organization field:', 'organization' in (response.data || {}));
    
    // Check for nested organization data
    let organizationData = null;
    
    if (response.data?.organization_data) {
      // If organization_data exists in the response
      organizationData = response.data.organization_data;
      console.log('✅ Found organization_data:', organizationData);
    } else if (response.data?.organization) {
      // If organization is a direct field (could be ID or object)
      organizationData = response.data.organization;
      console.log('✅ Found organization field:', organizationData);
    } else if (response.data?.department && response.data.department.organization) {
      // Try to get organization from department
      organizationData = response.data.department.organization;
      console.log('✅ Found organization via department:', organizationData);
    }
    
    // Prepare employee data
    const employeeData = {
      id: response.data?.id || undefined,
      employee_number: response.data?.employee_number || undefined,
      job_title: response.data?.job_title || undefined,
      employment_type: response.data?.employment_type || undefined,
      hire_date: response.data?.hire_date || undefined,
      basic_salary: response.data?.basic_salary || undefined,
      
      // Organization data
      organization: organizationData,
      
      // Department data
      department: response.data?.department || undefined,
      department_name: response.data?.department_name || undefined,
      
      // Branch data
      branch: response.data?.branch || undefined,
      branch_name: response.data?.branch_name || undefined,
      
      // Allowances
      housing_allowance: response.data?.housing_allowance || undefined,
      transport_allowance: response.data?.transport_allowance || undefined,
      medical_allowance: response.data?.medical_allowance || undefined,
      
      // Statutory info
      nssf_number: response.data?.nssf_number || undefined,
      nhif_number: response.data?.nhif_number || undefined,
      kra_pin: response.data?.kra_pin || undefined,
      
      // Payment info
      payment_method: response.data?.payment_method || undefined,
      bank_account_number: response.data?.bank_account_number || undefined,
      bank_name: response.data?.bank_name || undefined,
      mpesa_number: response.data?.mpesa_number || undefined,
      
      // Employment status
      employment_status: response.data?.employment_status || undefined,
    };
    
    console.log('✅ Prepared employee data:', employeeData);
    console.log('✅ Has organization:', !!employeeData.organization);
    
    // Save to state and storage
    setEmployee(employeeData);
    await SecureStore.setItemAsync(
      AUTH_KEYS.EMPLOYEE_DATA, 
      JSON.stringify(employeeData)
    );
    
    return employeeData;
    
  } catch (error: any) {
    console.error('❌ Error fetching employee profile:', {
      message: error.message,
      status: error.response?.status,
      response: error.response?.data,
      url: error.config?.url,
    });
    
    // Check specific error types
    if (error.response?.status === 404) {
      console.warn('⚠️ Employee profile not found (404)');
    } else if (error.response?.status === 401) {
      console.warn('⚠️ Unauthorized (401) - token may be invalid');
    } else if (error.response?.status === 403) {
      console.warn('⚠️ Forbidden (403) - no permission');
    }
    
    return null;
  }
};

const logout = async () => {
  try {
    setIsLoading(true);
    
    // Try to call Django logout endpoint if it exists
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (apiError) {
      console.log('Logout API call failed, proceeding with local logout');
    }
    
    // Clear auth data
    await clearAuthData();
    
    // Navigate to login
    router.replace('/auth/login');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      
      const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
      await saveAuthData(response.data);
      
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Registration error:', error);
      
      const message = parseDjangoError(error);
      
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const biometricLogin = async () => {
    try {
      if (!biometricAvailable) {
        throw new Error('Biometric authentication not available');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access HR Portal',
        fallbackLabel: 'Use password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Check if we have saved credentials
        const rememberMe = await SecureStore.getItemAsync(AUTH_KEYS.REMEMBER_ME);
        if (rememberMe === 'true') {
          // Try to refresh token if available
          const refreshToken = await SecureStore.getItemAsync(AUTH_KEYS.REFRESH_TOKEN);
          if (refreshToken) {
            try {
              const response = await api.post<{ access: string }>(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
                refresh: refreshToken,
              });
              
              await SecureStore.setItemAsync(AUTH_KEYS.ACCESS_TOKEN, response.data.access);
              setToken(response.data.access);
              
              // Reload user data
              await loadAuthState();
              
              return { success: true };
            } catch (refreshError) {
              return { success: false, error: 'Session expired. Please login again.' };
            }
          }
        }
        return { success: false, error: 'Please login with credentials' };
      } else {
        return { success: false, error: 'Authentication cancelled or failed' };
      }
    } catch (error: any) {
      console.error('Biometric login error:', error);
      return { success: false, error: error.message };
    }
  };

  const toggleBiometric = async (enable: boolean) => {
    try {
      if (enable && !biometricAvailable) {
        throw new Error('Biometric authentication not available on this device');
      }

      await SecureStore.setItemAsync(AUTH_KEYS.BIOMETRIC_ENABLED, enable.toString());
      setBiometricEnabled(enable);
      
      return { success: true };
    } catch (error: any) {
      console.error('Toggle biometric error:', error);
      return { success: false, error: error.message };
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(AUTH_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post<{ access: string }>(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
        refresh: refreshToken,
      });

      await SecureStore.setItemAsync(AUTH_KEYS.ACCESS_TOKEN, response.data.access);
      setToken(response.data.access);
      
      return { success: true };
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
      return { success: false };
    }
  };

  const updateProfile = async (data: Partial<DjangoUser>) => {
    try {
      const response = await api.patch<DjangoUser>(API_ENDPOINTS.AUTH.USER_PROFILE, data);
      
      await SecureStore.setItemAsync(AUTH_KEYS.USER_DATA, JSON.stringify(response.data));
      setUser(response.data);
      
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return { success: false, error: parseDjangoError(error) };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        old_password: currentPassword,
        new_password: newPassword,
        confirm_password: newPassword,
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Change password error:', error);
      return { success: false, error: parseDjangoError(error) };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { email });
      return { success: true };
    } catch (error: any) {
      console.error('Forgot password error:', error);
      return { success: false, error: parseDjangoError(error) };
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD_CONFIRM, {
        token,
        password,
      });
      return { success: true };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { success: false, error: parseDjangoError(error) };
    }
  };

  // Helper functions
  const getFullName = () => {
    if (!user) return '';
    return `${user.first_name} ${user.last_name}`.trim();
  };

  const getEmployeeId = () => {
    return employee?.employee_id || '';
  };

  const getUserRole = (): string => {
    if (!user) return 'EMPLOYEE';
    
    // Map Django roles to your frontend roles
    if (user.is_superuser) return 'ADMIN';
    if (user.is_staff) return 'HR'; // Assuming staff users are HR
    
    // Check for custom role field
    if (user.role) return user.role;
    
    // Default to employee
    return 'EMPLOYEE';
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Superusers have all permissions
    if (user.is_superuser) return true;
    
    // Check permissions array
    if (user.permissions?.includes(permission)) return true;
    
    // Role-based permissions
    const role = getUserRole();
    
    switch (permission) {
      case 'VIEW_PAYROLL':
        return ['ADMIN', 'HR', 'FINANCE', 'MANAGER'].includes(role);
      case 'MANAGE_EMPLOYEES':
        return ['ADMIN', 'HR'].includes(role);
      case 'APPROVE_LEAVES':
        return ['ADMIN', 'HR', 'MANAGER'].includes(role);
      case 'PROCESS_PAYROLL':
        return ['ADMIN', 'FINANCE'].includes(role);
      case 'VIEW_REPORTS':
        return ['ADMIN', 'HR', 'MANAGER', 'FINANCE'].includes(role);
      default:
        return false;
    }
  };

  const isTokenValid = (): boolean => {
    if (!token) return false;
    return !isTokenExpired(token);
  };

  const checkAuth = async (): Promise<boolean> => {
    try {
      if (!token) return false;
      
      if (isTokenExpired(token)) {
        return await refreshToken().then(() => true).catch(() => false);
      }
      
      return true;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  };

  return {
    // State
    user,
    employee,
    token,
    isLoading,
    isAuthenticated: !!user && !!token && !isTokenExpired(token || ''),
    biometricAvailable,
    biometricEnabled,
    
    // Actions
    login,
    logout,
    register,
    biometricLogin,
    toggleBiometric,
    refreshToken,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    fetchEmployeeProfile,
    fetchEmployeeData, // Add this

    
    // Utilities
    saveAuthData,
    clearAuthData,
    loadAuthState,
    
    // Helpers
    getFullName,
    getEmployeeId,
    getUserRole,
    hasPermission,
    isTokenValid,
    checkAuth,
    
    // Role check helpers (for your layout)
    isAdmin: () => getUserRole() === 'ADMIN',
    isHR: () => getUserRole() === 'HR',
    isFinance: () => getUserRole() === 'FINANCE',
    isManager: () => getUserRole() === 'MANAGER',
    isEmployee: () => getUserRole() === 'EMPLOYEE',
  };
};