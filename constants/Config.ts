// App Configuration Constants
export const Config = {
  // API Configuration
  // For development on localhost (simulator/emulator)
  // API_BASE_URL: 'http://localhost:8000',
  
  // For physical device testing, use your computer's IP:
  API_BASE_URL: 'http://127.0.0.1:8000', // CHANGE THIS TO YOUR ACTUAL IP
  
  // App Info
  APP_NAME: 'Elore HR ',
  APP_VERSION: '1.0.0',
  
  // Development flags
  IS_DEV: __DEV__,
  IS_PROD: !__DEV__,
  
  // Log configuration
  logConfig: () => {
    console.log('📱 App Configuration:');
    console.log('API Base URL:', Config.API_BASE_URL);
    console.log('Environment:', Config.IS_DEV ? 'Development' : 'Production');
    console.log('=============================');
  },
} as const;

// Log config on import
if (Config.IS_DEV) {
  Config.logConfig();
}