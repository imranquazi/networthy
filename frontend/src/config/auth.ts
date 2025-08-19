// Authentication configuration for different environments
export const authConfig = {
  // API base URL - should be environment-specific
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  
  // Authentication endpoints
  endpoints: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    register: '/api/auth/register',
    me: '/api/auth/me',
    statusToken: '/api/auth/status-token',
  },
  
  // Security settings
  security: {
    // In production, prioritize httpOnly cookies over localStorage
    useHttpOnlyCookies: process.env.NODE_ENV === 'production',
    
    // Token expiration check (in seconds)
    tokenExpiryBuffer: 300, // 5 minutes
    
    // Auto-refresh token before expiry
    autoRefreshToken: true,
  },
  
  // Redirect settings
  redirects: {
    login: '/login',
    dashboard: '/dashboard',
    home: '/',
  },
  
  // Development settings
  development: {
    // Allow localStorage fallback in development
    allowLocalStorageFallback: process.env.NODE_ENV === 'development',
    
    // Debug authentication
    debugAuth: process.env.NODE_ENV === 'development',
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${authConfig.apiBaseUrl}${endpoint}`;
};

// Helper function to check if we're in production
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

// Helper function to check if we should use httpOnly cookies
export const shouldUseHttpOnlyCookies = (): boolean => {
  return authConfig.security.useHttpOnlyCookies;
};

