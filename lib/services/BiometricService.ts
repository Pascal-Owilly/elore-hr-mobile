import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'none';

export interface BiometricCredentials {
  email: string;
  password: string;
}

class BiometricService {
  private static readonly BIOMETRIC_STORAGE_KEY = 'biometric_enabled';
  private static readonly CREDENTIALS_STORAGE_KEY = 'biometric_credentials';

  /**
   * Check if biometric authentication is available on the device
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Get supported biometric types
   */
  async getSupportedBiometrics(): Promise<BiometricType> {
    try {
      const biometrics = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      if (biometrics.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'fingerprint';
      } else if (biometrics.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'face';
      } else if (biometrics.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'iris';
      }
      
      return 'none';
    } catch (error) {
      console.error('Error getting supported biometrics:', error);
      return 'none';
    }
  }

  /**
   * Authenticate with biometrics
   */
  async authenticate(): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Elore HR',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  /**
   * Save biometric credentials securely
   */
  async saveBiometricCredentials(email: string, password: string): Promise<boolean> {
    try {
      const credentials: BiometricCredentials = { email, password };
      await SecureStore.setItemAsync(
        BiometricService.CREDENTIALS_STORAGE_KEY,
        JSON.stringify(credentials)
      );
      await this.setBiometricEnabled(true);
      return true;
    } catch (error) {
      console.error('Error saving biometric credentials:', error);
      return false;
    }
  }

  /**
   * Get saved biometric credentials
   * MODIFIED: Added catch block to handle decryption failures
   */
  async getBiometricCredentials(): Promise<BiometricCredentials | null> {
    try {
      const stored = await SecureStore.getItemAsync(BiometricService.CREDENTIALS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('🚨 Corrupted biometric credentials detected. Wiping key.', error);
      // If we can't read it, it's useless. Delete it to prevent future errors.
      await SecureStore.deleteItemAsync(BiometricService.CREDENTIALS_STORAGE_KEY).catch(() => {});
      return null;
    }
  }

  /**
   * Clear biometric credentials
   */
  async clearBiometricCredentials(): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(BiometricService.CREDENTIALS_STORAGE_KEY);
      await this.setBiometricEnabled(false);
      return true;
    } catch (error) {
      console.error('Error clearing biometric credentials:', error);
      return false;
    }
  }

  /**
   * Check if biometric login is enabled
   * MODIFIED: Added catch block to handle decryption failures
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(BiometricService.BIOMETRIC_STORAGE_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('🚨 Corrupted biometric status key. Resetting to false.', error);
      await SecureStore.deleteItemAsync(BiometricService.BIOMETRIC_STORAGE_KEY).catch(() => {});
      return false;
    }
  }

  /**
   * Set biometric login enabled/disabled
   */
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await SecureStore.setItemAsync(
        BiometricService.BIOMETRIC_STORAGE_KEY,
        enabled.toString()
      );
    } catch (error) {
      console.error('Error setting biometric status:', error);
    }
  }

  /**
   * Check if device has biometric capabilities
   */
  async hasBiometricCapability(): Promise<{
    available: boolean;
    type: BiometricType;
    enabled: boolean;
  }> {
    // We wrap this whole call to ensure the UI component calling it never crashes
    try {
        const available = await this.isBiometricAvailable();
        const type = await this.getSupportedBiometrics();
        const enabled = await this.isBiometricEnabled();
        
        return { available, type, enabled };
    } catch (error) {
        console.error('Failed to check capabilities:', error);
        return { available: false, type: 'none', enabled: false };
    }
  }

  /**
   * Show biometric setup dialog
   */
  async showSetupDialog(
    email: string,
    password: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      // Dynamic icon/type naming for the alert
      const typeLabel = Platform.OS === 'ios' ? 'FaceID/TouchID' : 'Biometric';

      Alert.alert(
        `Enable ${typeLabel} Login`,
        `Do you want to enable ${typeLabel.toLowerCase()} login for faster access to your account?`,
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Enable',
            onPress: async () => {
              const saved = await this.saveBiometricCredentials(email, password);
              if (saved) {
                Alert.alert(
                  'Success',
                  `${typeLabel} login has been enabled.`
                );
              }
              resolve(saved);
            },
          },
        ]
      );
    });
  }

  /**
   * Show biometric removal dialog
   */
  async showRemoveDialog(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Disable Biometric Login',
        'Are you sure you want to disable biometric login?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Disable',
            onPress: async () => {
              const cleared = await this.clearBiometricCredentials();
              if (cleared) {
                Alert.alert('Success', 'Biometric login disabled.');
              }
              resolve(cleared);
            },
          },
        ]
      );
    });
  }
}

export const biometricService = new BiometricService();