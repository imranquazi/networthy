import { useState, useEffect } from 'react';
import { authConfig, getApiUrl, shouldUseHttpOnlyCookies } from '@/config/auth';

interface User {
  email: string;
  platform: string | Array<{ name: string }>;
}

interface AuthStatus {
  authenticated: boolean;
  user: User | null;
}

export function useAuth() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      let authRes, authData;
      
      // In production, prioritize session-based auth (httpOnly cookies)
      if (shouldUseHttpOnlyCookies()) {
        try {
          authRes = await fetch(getApiUrl(authConfig.endpoints.me), {
            credentials: 'include' // This sends httpOnly cookies
          });
          authData = await authRes.json();
          
          if (authRes.ok && authData.authenticated) {
            setAuthStatus({ authenticated: true, user: authData.user });
            setLoading(false);
            return;
          }
        } catch (error) {
          if (authConfig.development.debugAuth) {
            console.log('Session auth failed, trying token auth...', error);
          }
        }
      }
      
      // Fallback to token-based auth (for development or when cookies fail)
      const token = localStorage.getItem('authToken');
      if (token && (authConfig.development.allowLocalStorageFallback || !shouldUseHttpOnlyCookies())) {
        try {
          authRes = await fetch(getApiUrl(authConfig.endpoints.statusToken), {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          authData = await authRes.json();
          
          if (authRes.ok && authData.authenticated) {
            setAuthStatus({ authenticated: true, user: authData.user });
            setLoading(false);
            return;
          }
        } catch (error) {
          if (authConfig.development.debugAuth) {
            console.log('Token auth failed:', error);
          }
        }
      }
      
      // If both auth methods fail, user is not authenticated
      setAuthStatus({ authenticated: false, user: null });
    } catch (error) {
      if (authConfig.development.debugAuth) {
        console.error('Error checking auth:', error);
      }
      setAuthStatus({ authenticated: false, user: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const logout = () => {
    // Clear both token and session
    localStorage.removeItem('authToken');
    setAuthStatus({ authenticated: false, user: null });
    
    // Call logout endpoint to clear server-side session
    fetch(getApiUrl(authConfig.endpoints.logout), {
      method: 'POST',
      credentials: 'include'
    }).finally(() => {
      window.location.href = authConfig.redirects.login;
    });
  };

  const requireAuth = () => {
    if (!loading && !authStatus?.authenticated) {
      window.location.href = authConfig.redirects.login;
      return false;
    }
    return true; // Authenticated
  };

  return {
    authStatus,
    loading,
    checkAuth,
    logout,
    requireAuth,
    isAuthenticated: authStatus?.authenticated || false,
    user: authStatus?.user || null
  };
}
