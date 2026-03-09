/**
 * Mode Configuration Module
 * Provides environment-based configuration for the application
 * Supports both localhost and production Render backend URLs
 */

// Get the current mode from Vite
const mode = import.meta.env.MODE || 'development';

// Environment variables with proper production handling
const isProduction = mode === 'production';

// Define both backend URLs
const LOCAL_API_URL = 'http://localhost:5000';
const PROD_API_URL = 'https://qms-sjuv.onrender.com';

// Support both URLs in all environments
const getApiUrl = () => {
  // Check for user preference in environment variable
  const preferredApi = import.meta.env.VITE_PREFERRED_API;
  
  if (preferredApi === 'local') {
    console.log('Using local backend: http://localhost:5000');
    return LOCAL_API_URL;
  }
  
  if (preferredApi === 'production' || preferredApi === 'render') {
    console.log('Using production backend: https://qms-sjuv.onrender.com');
    return PROD_API_URL;
  }
  
  // Default based on mode
  if (isProduction) {
    console.log('Production mode - Using Render backend: https://qms-sjuv.onrender.com');
    return PROD_API_URL;
  }
  
  console.log('Development mode - Defaulting to local backend: http://localhost:5000');
  console.log('Production backend also available: https://qms-sjuv.onrender.com');
  return LOCAL_API_URL;
};

// Environment variables with defaults
const config = {
  // API Configuration
  apiUrl: getApiUrl(),
  
  // Deployment URL
  deploymentUrl: import.meta.env.VITE_DEPLOYMENT_URL || '',
  
  // App Mode
  appMode: import.meta.env.VITE_APP_MODE || mode,
  
  // Logging
  enableLogging: import.meta.env.VITE_ENABLE_LOGGING === 'true' || !isProduction,
  
  // Current mode
  mode: mode,
  
  // Environment info
  isDevelopment: mode === 'development',
  isProduction: isProduction,
  isTest: mode === 'test',
};

/**
 * Get the current configuration
 * @returns {Object} Configuration object
 */
export function getConfig() {
  return config;
}

/**
 * Get API URL based on current mode
 * @returns {string} API URL
 */
export function getApiUrl() {
  return config.apiUrl;
}

/**
 * Check if current mode is development
 * @returns {boolean}
 */
export function isDevelopment() {
  return config.isDevelopment;
}

/**
 * Check if current mode is production
 * @returns {boolean}
 */
export function isProduction() {
  return config.isProduction;
}

/**
 * Get environment info
 * @returns {Object} Environment information
 */
export function getEnvironmentInfo() {
  return {
    mode: config.mode,
    isDevelopment: config.isDevelopment,
    isProduction: config.isProduction,
    isTest: config.isTest,
    apiUrl: config.apiUrl,
    deploymentUrl: config.deploymentUrl,
  };
}

export default config;

