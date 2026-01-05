import * as SecureStore from 'expo-secure-store';

/**
 * Safe wrapper for SecureStore.setItemAsync
 */
export const safeSetItem = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`SecureStore.setItemAsync failed for key "${key}":`, error);
    
    // Fallback to AsyncStorage for development or as backup
    if (__DEV__) {
      try {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.setItem(key, value);
        console.warn(`Fell back to AsyncStorage for key "${key}"`);
      } catch (fallbackError) {
        console.error('AsyncStorage fallback also failed:', fallbackError);
      }
    }
    
    throw error;
  }
};

/**
 * Safe wrapper for SecureStore.getItemAsync
 */
export const safeGetItem = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`SecureStore.getItemAsync failed for key "${key}":`, error);
    
    // Fallback to AsyncStorage for development or as backup
    if (__DEV__) {
      try {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        const value = await AsyncStorage.default.getItem(key);
        console.warn(`Fell back to AsyncStorage for key "${key}"`);
        return value;
      } catch (fallbackError) {
        console.error('AsyncStorage fallback also failed:', fallbackError);
      }
    }
    
    return null;
  }
};

/**
 * Safe wrapper for SecureStore.deleteItemAsync
 */
export const safeDeleteItem = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`SecureStore.deleteItemAsync failed for key "${key}":`, error);
    
    // Fallback to AsyncStorage for development or as backup
    if (__DEV__) {
      try {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.default.removeItem(key);
        console.warn(`Fell back to AsyncStorage for key "${key}"`);
      } catch (fallbackError) {
        console.error('AsyncStorage fallback also failed:', fallbackError);
      }
    }
  }
};

/**
 * Check if SecureStore is available
 */
export const isSecureStoreAvailable = async (): Promise<boolean> => {
  try {
    // Try to set and get a test value
    const testKey = '__secure_store_test__';
    const testValue = 'test_value';
    
    await SecureStore.setItemAsync(testKey, testValue);
    const retrievedValue = await SecureStore.getItemAsync(testKey);
    await SecureStore.deleteItemAsync(testKey);
    
    return retrievedValue === testValue;
  } catch (error) {
    console.error('SecureStore is not available:', error);
    return false;
  }
};

/**
 * Clear all auth-related items
 */
export const clearAllAuthItems = async (): Promise<void> => {
  const authKeys = [
    'access_token',
    'refresh_token',
    'user_data',
    'employee_data',
    'remember_me',
    'biometric_enabled',
  ];
  
  const deletePromises = authKeys.map(key => safeDeleteItem(key));
  await Promise.all(deletePromises);
  console.log('All auth items cleared');
};

/**
 * Get all stored auth items (for debugging)
 */
export const getAllAuthItems = async (): Promise<Record<string, string | null>> => {
  const authKeys = [
    'access_token',
    'refresh_token',
    'user_data',
    'employee_data',
    'remember_me',
    'biometric_enabled',
  ];
  
  const results: Record<string, string | null> = {};
  
  for (const key of authKeys) {
    results[key] = await safeGetItem(key);
  }
  
  return results;
};