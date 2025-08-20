'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Eye,
  LogOut,
  Settings,
  BarChart3,
  Calendar,
  Target,
  Link as LinkIcon,
  CheckCircle,
  ExternalLink,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import RealTimeUpdates from '@/components/RealTimeUpdates';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface RevenueFormProps {
  platform: string;
  initialRevenue: number;
  onClose: () => void;
  onSave: (data: { platform: string; revenue: number; currency: string; period: string }) => void;
}

function RevenueForm({ platform, initialRevenue, onClose, onSave }: RevenueFormProps) {
  const [revenue, setRevenue] = useState(initialRevenue);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    
    // Prevent negative numbers
    if (value < 0) {
      setError('Revenue cannot be negative');
      return;
    }
    
    setError('');
    setRevenue(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate revenue is not negative
    if (revenue < 0) {
      setError('Revenue cannot be negative');
      return;
    }
    
    const updated = {
      platform,
      revenue: Number(revenue),
      currency: "USD",
      period: "monthly"
    };

    const res = await fetch(`http://localhost:4000/api/platforms/${platform}/revenue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revenue: Number(revenue) })
    });

    if (res.ok) {
      onSave(updated);
      onClose();
    } else {
      alert("Failed to update revenue");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-3">
      <div>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={revenue}
          onChange={handleInputChange}
          className={`w-full ${error ? 'border-red-500' : ''}`}
          placeholder="Enter revenue amount"
        />
        {error && (
          <p className="text-red-500 text-xs mt-1">{error}</p>
        )}
      </div>
      <div className="flex space-x-2">
        <Button type="submit" size="sm" disabled={revenue < 0}>Save</Button>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}

interface PlatformData {
  name: string;
  subscribers?: number;
  followers?: number;
  views?: number;
  viewers?: number;
  engagement?: number;
  revenue: number;
  growth: number;
  error?: string;
}

interface AnalyticsData {
  totalRevenue: number;
  totalGrowth: number;
  topPlatform: string;
  monthlyTrend: number[];
  platformBreakdown: { platform: string; percentage: number }[];
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [platformData, setPlatformData] = useState<PlatformData[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<{ authenticated: boolean; user: { email: string; platform: string } | null } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [dataStatus, setDataStatus] = useState<'mock' | 'real' | 'loading' | 'api_error'>('loading');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const fetchData = useCallback(async () => {
    if (isFetching) return; // Prevent multiple simultaneous calls
    setIsFetching(true);
    
    try {
      // Simple authentication check
      const token = localStorage.getItem('authToken');
      let authRes, authData;
      
      try {
        if (token) {
          // Try token-based auth first
          authRes = await fetch('http://localhost:4000/api/auth/status-token', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          authData = await authRes.json();
        }
        
        if (!token || !authData?.authenticated) {
          // Fallback to session-based auth
          authRes = await fetch('http://localhost:4000/api/auth/me', {
            credentials: 'include'
          });
          authData = await authRes.json();
        }
        
        if (authRes && authRes.ok && authData.authenticated) {
          setAuthStatus({ authenticated: true, user: authData.user });
          // Set connected platforms if available
          if (authData.user && authData.user.platform) {
            setConnectedPlatforms(authData.user.platform.map((p: { name: string }) => p.name.toLowerCase()));
          }
        } else {
          setAuthStatus({ authenticated: false, user: null });
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Authentication failed:', error);
        setAuthStatus({ authenticated: false, user: null });
        setLoading(false);
        return;
      }

      // Get URL parameters for OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const platform = urlParams.get('platform');
      const email = urlParams.get('email');

      if (platform && email) {
        window.history.replaceState({}, document.title, window.location.pathname);
        setConnectedPlatforms(prev => [...prev, platform.toLowerCase()]);
        alert(`Successfully connected ${platform}! Your data will appear in the dashboard.`);
      }

      // Don't force refresh to prevent infinite loops
      const refreshParam = '';
      
      // Use token-based authentication for API calls
      const authToken = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      let platforms, analytics;
      
      try {
        const [platformsRes, analyticsRes] = await Promise.all([
          fetch(`http://localhost:4000/api/platforms${refreshParam}`, {
            credentials: 'include',
            cache: 'no-cache',
            headers
          }),
          fetch(`http://localhost:4000/api/analytics${refreshParam}`, {
            credentials: 'include',
            cache: 'no-cache',
            headers
          })
        ]);

        if (!platformsRes.ok || !analyticsRes.ok) {
          throw new Error(`API request failed: platforms=${platformsRes.status}, analytics=${analyticsRes.status}`);
        }

        platforms = await platformsRes.json();
        analytics = await analyticsRes.json();
      } catch (error) {
        console.error('Error fetching data:', error);
        setDataStatus('mock');
        setLoading(false);
        return;
      }

      console.log('Platform data received:', platforms);
      console.log('Connected platforms:', connectedPlatforms);
      

      
      // Defensive check: ensure platforms is an array and has correct structure
      if (Array.isArray(platforms)) {
        const validPlatforms = platforms.filter(platform => {
          if (typeof platform !== 'object' || platform === null) {
            console.error('Invalid platform object:', platform);
            return false;
          }
          if (!platform.name || typeof platform.name !== 'string') {
            console.error('Platform missing name:', platform);
            return false;
          }
          return true;
        });
        
        if (validPlatforms.length !== platforms.length) {
          console.warn('Some platforms were filtered out due to invalid structure');
        }
        
        setPlatformData(validPlatforms);
        // Simplified logic: just check if data is mock or not
        const hasRealData = platforms.some((platform: PlatformData) => {
          const isMockData = (
            (platform.name === 'YouTube' && platform.subscribers === 125000 && platform.views === 2500000 && platform.revenue === 1200) ||
            (platform.name === 'Twitch' && platform.followers === 45000 && platform.viewers === 180000 && platform.revenue === 850) ||
            (platform.name === 'TikTok' && platform.followers === 89000 && platform.views === 1200000 && platform.revenue === 430)
          );
          
          return !isMockData;
        });
        


        setPlatformData(platforms);
        setAnalyticsData(analytics);
        
        // Simple status setting
        if (hasRealData) {
          setDataStatus('real');
        } else {
          setDataStatus('mock');
        }
      } else {
        console.error('Platforms data is not an array:', platforms);
        setPlatformData([]);
        setDataStatus('mock');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
      setDataStatus('mock');
    } finally {
      setIsFetching(false);
    }
  }, []); // Remove connectedPlatforms dependency to prevent infinite loops

  useEffect(() => {
    fetchData();
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube': return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000"/>
        </svg>
      );
      case 'twitch': return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" fill="#9146FF"/>
        </svg>
      );
      case 'tiktok': return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" fill="#000000"/>
        </svg>
      );
      case 'kick': return (
        <svg className="w-5 h-5" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd" strokeLinejoin="round" strokeMiterlimit="2"><path d="M37 .036h164.448v113.621h54.71v-56.82h54.731V.036h164.448v170.777h-54.73v56.82h-54.711v56.8h54.71v56.82h54.73V512.03H310.89v-56.82h-54.73v-56.8h-54.711v113.62H37V.036z" fill="#53fc18"/></svg>
      );
      default: return <BarChart3 className="w-5 h-5" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const refreshConnectedPlatforms = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        const response = await fetch('http://localhost:4000/api/auth/status-token', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (response.ok) {
          const userData = await response.json();
          if (userData.user && userData.user.platform) {
            setConnectedPlatforms(userData.user.platform.map((p: { name: string }) => p.name.toLowerCase()));
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing connected platforms:', error);
    }
  };

  const refreshPlatformTokens = async (platform: string) => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        alert('Please refresh the page and make sure you\'re logged in');
        return;
      }

      // Use the existing OAuth endpoints for token refresh
      let oauthUrl = '';
      if (platform.toLowerCase() === 'youtube') {
        oauthUrl = `http://localhost:4000/api/auth/google?token=${encodeURIComponent(authToken)}`;
      } else if (platform.toLowerCase() === 'twitch') {
        oauthUrl = `http://localhost:4000/api/auth/twitch?token=${encodeURIComponent(authToken)}`;
      } else if (platform.toLowerCase() === 'tiktok') {
        oauthUrl = `http://localhost:4000/api/auth/tiktok?token=${encodeURIComponent(authToken)}`;
      } else {
        alert('Unsupported platform for token refresh');
        return;
      }

      // Redirect to OAuth endpoint
      window.location.href = oauthUrl;
    } catch (error) {
      console.error('Failed to refresh platform tokens:', error);
      alert('Failed to refresh platform tokens. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:4000/api/auth/logout', {
        credentials: 'include'
      });
      setAuthStatus({ authenticated: false, user: null });
      setConnectedPlatforms([]);
      setShowSettings(false);
      logout(); // Use the logout function from useAuth hook
    } catch (error) {
      console.error('Logout error:', error);
      setAuthStatus({ authenticated: false, user: null });
      setConnectedPlatforms([]);
      logout(); // Use the logout function from useAuth hook
    }
  };

  const handleDeleteAccount = async () => {
    // Prevent multiple simultaneous delete requests
    if (isDeletingAccount) {
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data, including:\n\n' +
      '• Your account information\n' +
      '• All connected platform data\n' +
      '• Historical analytics\n' +
      '• Manual revenue entries\n' +
      '• All authentication tokens\n\n' +
      'This action is irreversible!'
    );

    if (!confirmed) {
      return;
    }

    setIsDeletingAccount(true);

    try {
      // Try session-based authentication first
      let response = await fetch('http://localhost:4000/api/auth/delete-account', {
        method: 'DELETE',
        credentials: 'include'
      });

      // If session auth fails, try token-based authentication
      if (response.status === 401) {
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
          response = await fetch(`http://localhost:4000/api/auth/delete-account?token=${encodeURIComponent(authToken)}`, {
            method: 'DELETE'
          });
        }
      }

      if (response.ok) {
        // Clear all local storage and session storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear all cookies
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });

        // Show success message
        alert('Account deleted successfully. You will be redirected to the homepage.');
        
        // Redirect to homepage
        window.location.href = '/';
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to delete account: ${errorMessage}`);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-primary"></div>
      </div>
    );
  }

  // Simple authentication check - redirect to login if not authenticated
  if (!authStatus?.authenticated) {
    // Use window.location to avoid React Router conflicts
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
      return null;
    }
    return null;
  }

  // Remove the old authentication check since we're using ProtectedRoute now

  return (
    // <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div>
                  <Image 
                    src="/assets/Asset 1.png" 
                    alt="Networthy Logo" 
                    width={175}
                    height={175}
                    className="object-contain" 
                  />
                </div>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Home
              </Link>
              {authStatus?.authenticated && authStatus.user && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-muted-foreground">Signed in as:</span>
                  <span className="font-medium">{authStatus.user.email}</span>
                </div>
              )}
              {dataStatus === 'mock' && (
                <Badge variant="secondary">
                  📊 Demo Data
                </Badge>
              )}
              {dataStatus === 'real' && (
                <Badge variant="default">
                  ✅ Real Data
                </Badge>
              )}
              {dataStatus === 'api_error' && (
                <Badge variant="destructive">
                  ⚠️ API Issues
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setLoading(true);
                  fetchData();
                }}
                title="Refresh Data"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-7xl">
          {/* API Issues Warning */}
          {(dataStatus === 'mock' || dataStatus === 'api_error') && connectedPlatforms.length > 0 && (
            <Card className="mb-6 border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      API Connection Issue
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Your platforms are connected but we're having trouble fetching data from the APIs. 
                        This could be due to API quota limits, network issues, or your channels being new with no data yet.
                        The graphs below show demo data until this is resolved.
                      </p>
                      {platformData.some(p => p.error) && (
                        <p className="mt-2 text-xs text-yellow-600">
                          💡 <strong>Tip:</strong> Some APIs have daily quotas. Try refreshing later or check your platform settings.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Success Message for Real Data */}
          {dataStatus === 'real' && connectedPlatforms.length > 0 && (
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Real Data Connected
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>
                        Your platform data is being fetched from the actual APIs. 
                        {platformData.some(p => (p.subscribers || 0) === 0 && (p.followers || 0) === 0 && (p.views || 0) === 0) 
                          ? ' Some platforms show zero values because they are new or have no activity yet. This is normal for new channels!' 
                          : ' All data is up to date!'}
                      </p>
                      {platformData.some(p => p.error) && (
                        <p className="mt-2 text-xs text-green-600">
                          ⚠️ <strong>Note:</strong> Some platforms have API errors but we're still showing available data.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData ? formatCurrency(analyticsData.totalRevenue) : '$0'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData ? `${analyticsData.totalGrowth}%` : '0%'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {platformData.reduce((sum, platform) => sum + (platform.followers || platform.subscribers || 0), 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {platformData.reduce((sum, platform) => sum + (platform.views || platform.viewers || 0), 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData?.totalRevenue === 0 && (
                  <p className="text-sm text-muted-foreground mb-4">
                    📊 Revenue trend shows zero because your channels are new. Start creating content to see your revenue grow!
                  </p>
                )}
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData?.monthlyTrend.map((value, index) => ({ month: `Month ${index + 1}`, revenue: value })) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
                    <Line type="monotone" dataKey="revenue" stroke="#2176ae" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Platform Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Platform</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData?.totalRevenue === 0 && (
                  <p className="text-sm text-muted-foreground mb-4">
                    📊 Chart shows follower distribution since revenue is zero. Focus on growing your audience first!
                  </p>
                )}
                {!analyticsData?.platformBreakdown && (
                  <p className="text-sm text-muted-foreground mb-4">
                    📊 Loading chart data...
                  </p>
                )}
                <ResponsiveContainer width="100%" height={300}>
                  {(() => {
                    console.log('Chart render - analyticsData:', analyticsData);
                    console.log('Chart render - platformBreakdown:', analyticsData?.platformBreakdown);
                    return analyticsData?.platformBreakdown && analyticsData.platformBreakdown.length > 0 ? (
                    <PieChart>
                      <Pie
                        data={analyticsData.platformBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ platform, percentage }: { platform: string; percentage: number }) => `${platform} ${percentage}%`}
                        outerRadius={90}
                        fill="#2176ae"
                        dataKey="percentage"
                      >
                        {analyticsData.platformBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={["#2176ae", "#53fc18", "#ffe066", "#1a2639", "#f4faff"][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No data available for chart</p>
                    </div>
                  );
                  })()}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Platform Performance */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Platform Performance</CardTitle>
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('http://localhost:4000/api/platforms', {
                        credentials: 'include',
                        cache: 'no-cache'
                      });
                      const data = await response.json();
                      setPlatformData(data);
                    } catch (error) {
                      console.error('Error refreshing data:', error);
                    }
                  }}
                >
                  Refresh Data
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Platform</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Followers/Subscribers</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Views/Viewers</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Growth</th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {platformData.filter(platform => platform && typeof platform === 'object' && platform.name).map((platform) => (
                      <tr key={platform.name} className="hover:bg-muted/50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center">
                              {getPlatformIcon(platform.name)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium">{platform.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                          {formatNumber(platform.followers || platform.subscribers || 0)}
                        </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                           {formatNumber(platform.views || platform.viewers || 0)}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                           {formatCurrency(platform.revenue)}
                           <Button
                             variant="link"
                             size="sm"
                             onClick={() => setEditingPlatform(platform.name)}
                             className="ml-2 p-0 h-auto"
                           >
                             Edit
                           </Button>
                           {editingPlatform === platform.name && (
                             <RevenueForm
                               platform={platform.name}
                               initialRevenue={platform.revenue}
                               onClose={() => setEditingPlatform(null)}
                               onSave={async (updated) => {
                                 // Update platform data and recalculate analytics
                                 setPlatformData(prev => {
                                   const updatedPlatformData = prev.map(p => 
                                     p.name === updated.platform ? { ...p, revenue: updated.revenue } : p
                                   );
                                   
                                   // Recalculate analytics data for the chart
                                   (async () => {
                                     try {
                                       const response = await fetch('http://localhost:4000/api/analytics', {
                                         method: 'POST',
                                         headers: {
                                           'Content-Type': 'application/json',
                                         },
                                         body: JSON.stringify({ platforms: updatedPlatformData }),
                                         credentials: 'include'
                                       });
                                       
                                       if (response.ok) {
                                         const newAnalytics = await response.json();
                                         console.log('Updated analytics data:', newAnalytics);
                                         setAnalyticsData(newAnalytics);
                                       } else {
                                         console.error('Failed to update analytics:', response.status);
                                       }
                                     } catch (error) {
                                       console.error('Error updating analytics:', error);
                                     }
                                   })();
                                   
                                   return updatedPlatformData;
                                 });
                               }}
                             />
                           )}
                           {platform.error && (
                             <div className="mt-2">
                               <Badge variant="destructive" className="text-xs">
                                 API Error
                               </Badge>
                               <Button
                                 variant="link"
                                 size="sm"
                                 onClick={() => refreshPlatformTokens(platform.name)}
                                 className="ml-2 p-0 h-auto text-xs"
                               >
                                 Refresh Token
                               </Button>
                             </div>
                           )}
                         </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={platform.growth >= 0 ? "default" : "destructive"}>
                            {platform.growth >= 0 ? '+' : ''}{platform.growth}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Settings</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(false)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Connected Accounts</h3>
                  <div className="space-y-3">
                                     {/* YouTube */}
                   <div className="flex items-center justify-between p-3 border rounded-lg">
                     <div className="flex items-center space-x-3">
                       <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                         <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                         </svg>
                       </div>
                       <div>
                         <span className="font-medium">YouTube</span>
                         {platformData.find(p => p.name.toLowerCase() === 'youtube')?.error && (
                           <div className="text-xs text-red-600 mt-1">Token expired</div>
                         )}
                       </div>
                     </div>
                     {connectedPlatforms.includes('youtube') ? (
                       <div className="flex items-center gap-2">
                         <Badge variant="default">Connected</Badge>
                         {platformData.find(p => p.name.toLowerCase() === 'youtube')?.error && (
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => refreshPlatformTokens('youtube')}
                           >
                             Refresh
                           </Button>
                         )}
                       </div>
                     ) : (
                       <Button
                         size="sm"
                         onClick={async () => {
                           try {
                             const authToken = localStorage.getItem('authToken');
                             if (!authToken) {
                               alert('Please refresh the page and make sure you\'re logged in');
                               return;
                             }
                             window.location.href = `http://localhost:4000/api/auth/google?token=${encodeURIComponent(authToken)}`;
                           } catch (error) {
                             console.error('Auth check failed:', error);
                             alert('Please refresh the page and try again');
                           }
                         }}
                       >
                         Connect
                       </Button>
                     )}
                   </div>

                                     {/* Twitch */}
                   <div className="flex items-center justify-between p-3 border rounded-lg">
                     <div className="flex items-center space-x-3">
                       <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                         <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                         </svg>
                       </div>
                       <div>
                         <span className="font-medium">Twitch</span>
                         {platformData.find(p => p.name.toLowerCase() === 'twitch')?.error && (
                           <div className="text-xs text-red-600 mt-1">Token expired</div>
                         )}
                       </div>
                     </div>
                     {connectedPlatforms.includes('twitch') ? (
                       <div className="flex items-center gap-2">
                         <Badge variant="default">Connected</Badge>
                         {platformData.find(p => p.name.toLowerCase() === 'twitch')?.error && (
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => refreshPlatformTokens('twitch')}
                           >
                             Refresh
                           </Button>
                         )}
                       </div>
                     ) : (
                       <Button
                         size="sm"
                         onClick={async () => {
                           try {
                             const authToken = localStorage.getItem('authToken');
                             if (!authToken) {
                               alert('Please refresh the page and make sure you\'re logged in');
                               return;
                             }
                             window.location.href = `http://localhost:4000/api/auth/twitch?token=${encodeURIComponent(authToken)}`;
                           } catch (error) {
                             console.error('Auth check failed:', error);
                             alert('Please refresh the page and try again');
                           }
                         }}
                       >
                         Connect
                       </Button>
                     )}
                   </div>

                  {/* TikTok */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                        </svg>
                      </div>
                      <span className="font-medium">TikTok</span>
                    </div>
                    {connectedPlatforms.includes('tiktok') ? (
                      <Badge variant="default">Connected</Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            const authToken = localStorage.getItem('authToken');
                            if (!authToken) {
                              alert('Please refresh the page and make sure you\'re logged in');
                              return;
                            }
                            window.location.href = `http://localhost:4000/api/auth/tiktok?token=${encodeURIComponent(authToken)}`;
                          } catch (error) {
                            console.error('Auth check failed:', error);
                            alert('Please refresh the page and try again');
                          }
                        }}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <Button
                  onClick={refreshConnectedPlatforms}
                  className="w-full"
                >
                  Refresh Connected Accounts
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>

              {/* Danger Zone */}
              <div className="pt-6 border-t border-red-200">
                <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2">Delete Account</h4>
                    <p className="text-sm text-red-600 mb-3">
                      This action will permanently delete your account and all associated data. 
                      This cannot be undone.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isDeletingAccount}
                      className="w-full"
                    >
                      {isDeletingAccount ? 'Deleting Account...' : 'Delete My Account'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-time Updates Component */}
      <RealTimeUpdates 
        onUpdate={(update) => {
          console.log('🔄 Real-time update received:', update);
          if (update.type === 'platform_update') {
            // Instead of reloading, just refetch data
            fetchData();
          }
        }}
        onConnect={() => {
          console.log('✅ Real-time connection established');
        }}
        onDisconnect={() => {
          console.log('❌ Real-time connection lost');
        }}
      />
      </div>
    // </ProtectedRoute>
  );
} 