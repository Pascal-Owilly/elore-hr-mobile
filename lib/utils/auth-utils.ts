import * as SecureStore from 'expo-secure-store';

/**
 * Decode a JWT token without external libraries
 */
const decodeJWT = (token: string): any => {
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
  } catch {
    return null;
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
    const accessToken = await SecureStore.getItemAsync('access_token');
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    const userDataStr = await SecureStore.getItemAsync('user_data');

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
 * Get user info from stored tokens
 */
export const getUserFromStorage = async (): Promise<{
  user: any;
  employee: any;
}> => {
  try {
    const [userData, employeeData] = await Promise.all([
      SecureStore.getItemAsync('user_data'),
      SecureStore.getItemAsync('employee_data'),
    ]);

    return {
      user: userData ? JSON.parse(userData) : null,
      employee: employeeData ? JSON.parse(employeeData) : null,
    };
  } catch (error) {
    console.error('Error getting user from storage:', error);
    return {
      user: null,
      employee: null,
    };
  }
};

/**
 * Check if token is about to expire (within 5 minutes)
 */
export const isTokenAboutToExpire = async (): Promise<boolean> => {
  try {
    const accessToken = await SecureStore.getItemAsync('access_token');
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