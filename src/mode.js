/**
 * Mode Configuration Module
 * Provides environment-based configuration for the application
 */

// Get the current mode from Vite
const mode = import.meta.env.MODE || 'development';

// Environment variables with defaults
const config = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  
  // Deployment URL
  deploymentUrl: import.meta.env.VITE_DEPLOYMENT_URL || '',
  
  // App Mode
  appMode: import.meta.env.VITE_APP_MODE || mode,
  
  // Logging
  enableLogging: import.meta.env.VITE_ENABLE_LOGGING === 'true',
  
  // Current mode
  mode: mode,
  
  // Environment info
  isDevelopment: mode === 'development',
  isProduction: mode === 'production',
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

