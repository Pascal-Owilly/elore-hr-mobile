import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import NetInfo from '@react-native-community/netinfo';
import { KenyaConstants } from '@constants/KenyaConstants';
import { API_ENDPOINTS } from './endpoints';

console.log('🌐 API Configuration Debug:');
console.log('1. API_BASE_URL set to:', process.env.EXPO_PUBLIC_API_BASE_URL);
console.log('2. Full API endpoint:', `${process.env.EXPO_PUBLIC_API_BASE_URL}/api`);
console.log('3. Trying Django login endpoint:', `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/auth/login/`);
console.log('4. Constants.expoConfig?.extra:', Constants.expoConfig?.extra);
console.log('5. process.env.EXPO_PUBLIC_API_BASE_URL:', process.env.EXPO_PUBLIC_API_BASE_URL);

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';


// Create axios instance with Django backend configuration
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000'),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});


// Add request logging
api.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log(`📡 [API Request] ${config.method?.toUpperCase()} ${fullUrl}`);
    console.log('🔑 Auth Header:', config.headers.Authorization ? 'Present' : 'Missing');
    console.log('📦 Request Headers:', {
      'Content-Type': config.headers['Content-Type'],
      'Accept': config.headers['Accept'],
      'X-Device-Id': config.headers['X-Device-Id'],
      'X-App-Version': config.headers['X-App-Version'],
    });
    
    if (config.data) {
      console.log('📝 Request Data:', typeof config.data === 'object' ? 
        JSON.stringify(config.data).substring(0, 200) + '...' : 
        config.data);
    } 
    
    return config;
  },
  (error) => {
    console.error('❌ [API Request Setup Error]', error);
    return Promise.reject(error);
  }
);


// Add response logging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ [API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ [API Error] ${error.config?.url}`, {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Add auth token (Django JWT uses 'access' token)
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add device info
    config.headers['X-Device-Id'] = Constants.deviceId;
    config.headers['X-App-Version'] = Constants.expoConfig?.version || '1.0.0';
    config.headers['X-Platform'] = Constants.platform?.os || 'unknown';
    config.headers['X-Device-Name'] = Constants.deviceName || 'unknown';

    // Add Kenya-specific headers
    config.headers['X-Country-Code'] = 'KE';
    config.headers['X-Currency'] = 'KES';
    config.headers['X-Time-Zone'] = 'Africa/Nairobi';

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with Django JWT handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors first
    if (!error.response) {
      console.error('🌐 [Network Error] No response from server');
      const networkState = await NetInfo.fetch();
      console.log('Network state:', networkState);
      
      if (!networkState.isConnected) {
        error.message = 'No internet connection. Please check your network.';
        error.isNetworkError = true;
      } else {
        error.message = `Cannot connect to server at ${API_BASE_URL}. Please check:`;
        error.details = [
          '1. Is Django server running? (python manage.py runserver 0.0.0.0:8000)',
          '2. Is the IP address correct?',
          '3. Check firewall/antivirus settings',
          `4. Try accessing ${API_BASE_URL} in your browser`,
        ];
        error.isNetworkError = true;
      }
      
      return Promise.reject(error);
    }

    // Handle token refresh for Django JWT
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Django REST Framework JWT refresh endpoint
        const response = await axios.post(
          `${API_BASE_URL}/api${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
          {
            refresh: refreshToken,
          }
        );

        const { access } = response.data;

        if (!access) {
          throw new Error('No access token in refresh response');
        }

        // Update access token in secure storage
        await SecureStore.setItemAsync('access_token', access);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Clear tokens and auth data
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        await SecureStore.deleteItemAsync('user_data');
        await SecureStore.deleteItemAsync('employee_data');
        
        // Emit logout event for app to handle
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:logout'));
        }
        
        // Return original error to be handled by caller
        return Promise.reject(error);
      }
    }

    // Handle 403 Forbidden (token valid but no permission)
    if (error.response?.status === 403) {
      error.message = 'You do not have permission to perform this action.';
    }

    // Handle Django REST Framework error formats
    if (error.response?.data) {
      const drfError = error.response.data;
      
      // Handle different Django error formats
      if (drfError.detail) {
        error.message = drfError.detail;
      } else if (drfError.non_field_errors) {
        error.message = drfError.non_field_errors[0];
      } else if (drfError.message) {
        error.message = drfError.message;
      } else if (typeof drfError === 'object') {
        // Combine field errors for display
        const fieldErrors: string[] = [];
        
        Object.keys(drfError).forEach((field) => {
          if (Array.isArray(drfError[field])) {
            fieldErrors.push(...drfError[field]);
          } else if (typeof drfError[field] === 'string') {
            fieldErrors.push(drfError[field]);
          }
        });
        
        if (fieldErrors.length > 0) {
          error.message = fieldErrors[0];
          error.fieldErrors = drfError;
        }
      }
    }

    // Handle Kenya-specific validation errors
    if (error.response?.data) {
      const data = error.response.data;
      
      if (data.national_id) {
        error.message = 'Please enter a valid Kenyan National ID (8-10 digits)';
      } else if (data.kra_pin) {
        error.message = 'Please enter a valid KRA PIN (Format: A123456789A)';
      } else if (data.phone_number) {
        error.message = 'Please enter a valid Kenyan phone number (e.g., 0712345678)';
      } else if (data.id_number) {
        error.message = 'Please enter a valid Kenyan ID number';
      }
    }

    // Add status code to error object for easier handling
    if (error.response?.status) {
      error.status = error.response.status;
    }

    return Promise.reject(error);
  }
);

// Store for offline request queue
interface QueuedRequest {
  request: any;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timestamp: number;
  id: string;
}

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private isOnline = true;
  private maxQueueSize = 50;
  private maxRetryAttempts = 3;

  constructor() {
    this.setupNetworkListener();
  }

  private setupNetworkListener() {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected === true;

      if (wasOffline && this.isOnline && this.queue.length > 0) {
        this.processQueue();
      }
    });
  }

  async addRequest(config: any): Promise<any> {
    if (this.isOnline) {
      return api(config);
    }

    // Generate unique ID for this request
    const requestId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise((resolve, reject) => {
      // Limit queue size
      if (this.queue.length >= this.maxQueueSize) {
        const removed = this.queue.shift();
        console.warn('Offline queue full, removed oldest request:', removed?.id);
      }

      this.queue.push({
        id: requestId,
        request: config,
        resolve,
        reject,
        timestamp: Date.now(),
      });

      console.log(`Request queued offline. Queue size: ${this.queue.length}`);
    });
  }

  private async processQueue() {
    while (this.queue.length > 0 && this.isOnline) {
      const queuedRequest = this.queue[0]; // Get first item without removing
      
      try {
        const response = await api(queuedRequest.request);
        queuedRequest.resolve(response);
        this.queue.shift(); // Remove successful request
        console.log(`Offline request processed successfully: ${queuedRequest.id}`);
      } catch (error) {
        console.error(`Failed to process offline request ${queuedRequest.id}:`, error);
        
        // Remove failed request from queue
        this.queue.shift();
        queuedRequest.reject(error);
      }
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  clearQueue(): void {
    this.queue = [];
  }

  getQueuedRequests(): QueuedRequest[] {
    return [...this.queue];
  }
}

// Initialize offline queue
const offlineQueue = new OfflineQueue();

// Offline API wrapper
export const offlineApi = {
  request: async (config: any) => {
    return offlineQueue.addRequest(config);
  },

  get: async (url: string, config?: any) => {
    return offlineQueue.addRequest({ ...config, method: 'GET', url });
  },

  post: async (url: string, data?: any, config?: any) => {
    return offlineQueue.addRequest({ ...config, method: 'POST', url, data });
  },

  put: async (url: string, data?: any, config?: any) => {
    return offlineQueue.addRequest({ ...config, method: 'PUT', url, data });
  },

  delete: async (url: string, config?: any) => {
    return offlineQueue.addRequest({ ...config, method: 'DELETE', url });
  },

  patch: async (url: string, data?: any, config?: any) => {
    return offlineQueue.addRequest({ ...config, method: 'PATCH', url, data });
  },

  // Queue management
  getQueueSize: () => offlineQueue.getQueueSize(),
  clearQueue: () => offlineQueue.clearQueue(),
  getQueuedRequests: () => offlineQueue.getQueuedRequests(),
};

// Kenya-specific API endpoints
export const kenyaApi = {
  // M-Pesa Payment (assuming endpoint exists)
  initiateMpesaPayment: async (data: {
    phone_number: string;
    amount: number;
    account_reference: string;
    transaction_desc: string;
  }) => {
    return api.post(API_ENDPOINTS.PAYROLL.MPESA_PAYMENT, {
      ...data,
      currency: 'KES',
      country_code: 'KE',
    });
  },

  checkMpesaStatus: async (checkoutRequestId: string) => {
    // This endpoint might need to be created in your Django backend
    return api.get(`/payroll/mpesa/status/${checkoutRequestId}/`);
  },

  // Statutory Calculations
  calculateStatutory: async (data: {
    gross_salary: number;
    employment_type: string;
    has_helb?: boolean;
    nssf_employee_contribution?: boolean;
  }) => {
    return api.post(API_ENDPOINTS.PAYROLL.STATUTORY_CALCULATION, {
      ...data,
      currency: 'KES',
      country: 'Kenya',
    });
  },

  // Kenya Public Holidays
  getPublicHolidays: async (year?: number) => {
    const currentYear = year || new Date().getFullYear();
    return api.get(API_ENDPOINTS.LEAVES.HOLIDAYS, {
      params: { 
        year: currentYear,
        country: 'Kenya'
      }
    });
  },

  // Geofencing
  verifyGeofence: async (data: {
    latitude: number;
    longitude: number;
    branch_id?: string;
    employee_id?: string;
  }) => {
    return api.post(API_ENDPOINTS.ATTENDANCE.VERIFY_GEOFENCE, {
      ...data,
      timestamp: new Date().toISOString(),
      accuracy: 10, // GPS accuracy in meters
    });
  },

  // Kenya Leave Rules
  getKenyaLeaveRules: async () => {
    return api.get(API_ENDPOINTS.LEAVES.KENYA_RULES);
  },

  // Get employee statutory details
  getEmployeeStatutory: async (employeeId?: string) => {
    const url = employeeId 
      ? `/employees/${employeeId}/statutory/`
      : '/employees/me/statutory/';
    return api.get(url);
  },

  // Calculate PAYE
  calculatePAYE: async (data: {
    monthly_income: number;
    allowances?: number;
    deductions?: number;
    has_disability?: boolean;
    has_insurance_relief?: boolean;
  }) => {
    return api.post('/payroll/calculate-paye/', {
      ...data,
      year: new Date().getFullYear(),
    });
  },

  // Get NSSF rates
  getNSSFRates: async () => {
    return api.get('/payroll/nssf-rates/');
  },

  // Get NHIF rates
  getNHIFRates: async () => {
    return api.get('/payroll/nhif-rates/');
  },

  // Verify KRA PIN
  verifyKRAPIN: async (kra_pin: string) => {
    return api.post('/verification/kra-pin/', { kra_pin });
  },

  // Verify National ID
  verifyNationalID: async (national_id: string) => {
    return api.post('/verification/national-id/', { national_id });
  },

  // Get counties (Kenya specific)
  getKenyaCounties: async () => {
    return api.get('/kenya/counties/');
  },

  // Get constituencies
  getConstituencies: async (countyId?: string) => {
    const url = countyId 
      ? `/kenya/constituencies/?county=${countyId}`
      : '/kenya/constituencies/';
    return api.get(url);
  },

  // Get wards
  getWards: async (constituencyId?: string) => {
    const url = constituencyId 
      ? `/kenya/wards/?constituency=${constituencyId}`
      : '/kenya/wards/';
    return api.get(url);
  },
};

// Export utility to check network status
export const getNetworkStatus = async (): Promise<{
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
}> => {
  const state = await NetInfo.fetch();
  return {
    isConnected: state.isConnected === true,
    isInternetReachable: state.isInternetReachable === true,
    type: state.type,
  };
};

// Simple test function you can call from your login screen
export const testLoginEndpoint = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    const testUrl = `${API_BASE_URL}/api${API_ENDPOINTS.AUTH.LOGIN}`;
    console.log('🔍 Testing login endpoint:', testUrl);
    
    // Just test if endpoint exists (don't actually login)
    const response = await axios.get(API_BASE_URL, { timeout: 5000 });
    
    return {
      success: true,
      message: `Backend is running at ${API_BASE_URL}`,
      details: {
        status: response.status,
        url: API_BASE_URL,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Cannot reach backend at ${API_BASE_URL}. Error: ${error.message}`,
      details: {
        error: error.message,
        url: API_BASE_URL,
      },
    };
  }
};

// Export API instance
export default api;

// Export API base URL constant
export { API_BASE_URL };