'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Eye, 
  BarChart3,
  Settings,
  ArrowLeft
} from 'lucide-react';
import RealTimeUpdates from '../../components/RealTimeUpdates';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <input
        type="number"
        value={revenue}
        onChange={(e) => setRevenue(Number(e.target.value))}
        className="w-full border border-gray-300 rounded px-3 py-2"
      />
      <div className="flex space-x-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">Save</button>
        <button type="button" onClick={onClose} className="text-gray-500 hover:underline">Cancel</button>
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

export default function CreatorDashboard() {
  const [platformData, setPlatformData] = useState<PlatformData[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string; platform: string } | null>(null);
  const [authStatus, setAuthStatus] = useState<{ authenticated: boolean; user: { email: string; platform: string } | null } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [dataStatus, setDataStatus] = useState<'mock' | 'real' | 'loading'>('loading');

    const fetchData = useCallback(async () => {
      try {
      // Check authentication status - try token first, then session
      const token = localStorage.getItem('authToken');
      let authRes, authData;
      
      try {
        if (token) {
          // Try token-based auth
          try {
            authRes = await fetch('http://localhost:4000/api/auth/status-token', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            authData = await authRes.json();
          } catch (error) {
            console.log('Token auth failed, trying session auth...', error);
          }
        }
        
        if (!token || !authData?.authenticated) {
          // Fallback to session-based auth
          try {
            authRes = await fetch('http://localhost:4000/api/auth/me', {
              credentials: 'include'
            });
            authData = await authRes.json();
          } catch (error) {
            console.log('Session auth failed, but not redirecting immediately...', error);
            // Don't redirect immediately on network errors
            setAuthStatus({ authenticated: false, user: null });
            setLoading(false);
            return;
          }
        }
        
        // Ensure authRes is defined
        if (!authRes) {
          console.log('No auth response, but not redirecting immediately...');
          setAuthStatus({ authenticated: false, user: null });
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Authentication failed:', error);
        // Don't redirect on network errors, just set loading to false
        setAuthStatus({ authenticated: false, user: null });
        setLoading(false);
        return;
      }
      
      if (authRes.ok && authData.authenticated) {
        setAuthStatus({ authenticated: true, user: authData.user });
        // Check connected platforms for this user using token authentication
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
          try {
            const connectedPlatformsRes = await fetch('http://localhost:4000/api/auth/status-token', {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });
            if (connectedPlatformsRes.ok) {
              const userData = await connectedPlatformsRes.json();
              if (userData.user && userData.user.platform) {
                setConnectedPlatforms(userData.user.platform.map((p: { name: string }) => p.name.toLowerCase()));
              }
            }
          } catch (error) {
            console.error('Error fetching connected platforms:', error);
          }
        }
      } else {
        setAuthStatus({ authenticated: false, user: null });
        // Don't redirect immediately, just set loading to false
        setLoading(false);
        return;
      }

      // Get URL parameters for OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const platform = urlParams.get('platform');
      const email = urlParams.get('email');

      if (platform && email) {
        setUser({ email, platform });
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        // Update connected platforms after OAuth
        setConnectedPlatforms(prev => [...prev, platform.toLowerCase()]);
        // Show success message
        alert(`Successfully connected ${platform}! Your data will appear in the dashboard.`);
      } else if (authData.authenticated && authData.user) {
        setUser(authData.user);
      }

      // Force refresh platform data if user has connected platforms
      const forceRefresh = connectedPlatforms.length > 0;
      const refreshParam = forceRefresh ? '?refresh=true' : '';
      
      // If user has connected platforms, add a small delay to ensure backend is ready
      if (forceRefresh) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
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
          // Don't redirect on API errors, just show mock data
          setDataStatus('mock');
          setLoading(false);
          return;
        }

      console.log('Platform data received:', platforms);
      console.log('Platform data type:', typeof platforms);
      console.log('Platform data is array:', Array.isArray(platforms));
      if (Array.isArray(platforms) && platforms.length > 0) {
        console.log('First platform structure:', Object.keys(platforms[0]));
      }
      console.log('Connected platforms:', connectedPlatforms);
      
      // Defensive check: ensure platforms is an array and has correct structure
      if (Array.isArray(platforms)) {
        // Ensure each platform has the expected structure
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
        // Determine if data is real or mock based on platform data
        const hasRealData = platforms.some((platform: PlatformData) => {
          // Check if this is the exact mock data pattern
          const isMockData = (
            (platform.name === 'YouTube' && platform.subscribers === 125000 && platform.views === 2500000 && platform.revenue === 1200) ||
            (platform.name === 'Twitch' && platform.followers === 45000 && platform.viewers === 180000 && platform.revenue === 850) ||
            (platform.name === 'TikTok' && platform.followers === 89000 && platform.views === 1200000 && platform.revenue === 430)
          );
          
          // Check if platform has API errors
          const hasApiError = platform.error && typeof platform.error === 'string';
          
          // Check if all values are zero (likely API quota exceeded or no data)
          const allValuesZero = (
            (platform.subscribers === 0 || platform.subscribers === undefined) &&
            (platform.followers === 0 || platform.followers === undefined) &&
            (platform.views === 0 || platform.views === undefined) &&
            (platform.viewers === 0 || platform.viewers === undefined) &&
            (platform.revenue === 0 || platform.revenue === undefined)
          );
          
          // If it's not mock data AND doesn't have API errors AND has some non-zero values, it's real data
          return !isMockData && !hasApiError && !allValuesZero;
        });
        
        // If user has connected platforms but we're getting mock data, retry once
        if (connectedPlatforms.length > 0 && !hasRealData && !refreshParam.includes('retry')) {
          console.log('Detected mock data for authenticated user, retrying...');
          // Wait a moment for backend to process, then retry with retry flag
          setTimeout(() => {
            // Add retry flag to prevent infinite loops
            const retryUrl = new URL(window.location.href);
            retryUrl.searchParams.set('retry', 'true');
            window.history.replaceState({}, document.title, retryUrl.toString());
            fetchData();
          }, 1000);
          return;
        }

        setPlatformData(platforms);
        setAnalyticsData(analytics);
        
        // Update data status based on whether we have real data
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
      // Don't retry automatically to prevent infinite loops
      setLoading(false);
      setDataStatus('mock');
    }
    }, [connectedPlatforms]);

  useEffect(() => {
    fetchData();
  }, []); // Remove fetchData from dependencies to prevent infinite loops

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-networthyBlue to-networthyGreen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-networthyYellow"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-networthyLight font-body">
      {/* Header */}
      <header className="bg-white/80 shadow-lg border-b rounded-b-2xl py-4 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16">
            <Image src="/NETWORTHY.png" alt="Networthy Logo" fill sizes="64px" className="rounded-full shadow-networthy object-contain bg-networthyYellow p-2" />
          </div>
          <h1 className="text-4xl text-black tracking-tight drop-shadow-sm great-vibes-regular">
            Networthy
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center text-black hover:text-networthyGreen transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Home
          </Link>
          {user && (
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-600">Connected to {Array.isArray(user.platform) ? user.platform.map(p => p.name).join(', ') : user.platform}:</span>
              <span className="font-medium text-black">{user.email}</span>
            </div>
          )}
          {dataStatus === 'mock' && (
            <div className="flex items-center space-x-2 text-sm">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                📊 Showing Demo Data
              </span>
            </div>
          )}
          {dataStatus === 'real' && (
            <div className="flex items-center space-x-2 text-sm">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                ✅ Real Data
              </span>
            </div>
          )}
          <button 
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="p-2 text-black hover:text-networthyGreen transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-black hover:text-networthyGreen transition-colors cursor-pointer"
          >
            <Settings className="w-6 h-6" />
          </button>
          {authStatus?.authenticated && (
            <button 
              onClick={async () => {
                try {
                  // Clear local storage first
                  localStorage.removeItem('authToken');
                  
                  // Call logout endpoint
                  await fetch('http://localhost:4000/api/auth/logout', {
                    credentials: 'include'
                  });
                  
                  // Clear all state
                  setUser(null);
                  setAuthStatus({ authenticated: false, user: null });
                  setConnectedPlatforms([]);
                  setShowSettings(false);
                  
                  // Small delay then redirect to ensure clean state
                  setTimeout(() => {
                    window.location.href = '/';
                  }, 100);
                } catch (error) {
                  console.error('Logout error:', error);
                  // Even if logout fails, clear local state and redirect
                  localStorage.removeItem('authToken');
                  setUser(null);
                  setAuthStatus({ authenticated: false, user: null });
                  setConnectedPlatforms([]);
                  window.location.href = '/';
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* API Issues Warning - Show when platforms are connected but have API errors or zero data */}
        {dataStatus === 'mock' && connectedPlatforms.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
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
          </div>
        )}
        
        {/* Success Message for Real Data */}
        {dataStatus === 'real' && connectedPlatforms.length > 0 && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-lg">
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
          </div>
        )}
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div className="panel p-8 flex flex-col items-center">
            <div className="p-3 bg-networthyGreen/20 rounded-full mb-2">
              <DollarSign className="w-7 h-7 text-black" />
            </div>
            <p className="text-sm font-medium text-black">Total Revenue</p>
            <p className="text-3xl font-bold text-black mt-1">
              {analyticsData ? formatCurrency(analyticsData.totalRevenue) : '$0'}
            </p>
          </div>
          <div className="panel p-8 flex flex-col items-center">
            <div className="p-3 bg-networthyBlue/20 rounded-full mb-2">
              <TrendingUp className="w-7 h-7 text-black" />
            </div>
            <p className="text-sm font-medium text-black">Growth</p>
            <p className="text-3xl font-bold text-black mt-1">
              {analyticsData ? `${analyticsData.totalGrowth}%` : '0%'}
            </p>
          </div>
          <div className="panel p-8 flex flex-col items-center">
            <div className="p-3 bg-networthyYellow/20 rounded-full mb-2">
              <Users className="w-7 h-7 text-black" />
            </div>
            <p className="text-sm font-medium text-black">Total Followers</p>
            <p className="text-3xl font-bold text-black mt-1">
              {platformData.reduce((sum, platform) => sum + (platform.followers || platform.subscribers || 0), 0).toLocaleString()}
            </p>
          </div>
          <div className="panel p-8 flex flex-col items-center">
            <div className="p-3 bg-networthyYellow/20 rounded-full mb-2">
              <Eye className="w-7 h-7 text-black" />
            </div>
            <p className="text-sm font-medium text-black">Total Views</p>
            <p className="text-3xl font-bold text-black mt-1">
              {platformData.reduce((sum, platform) => sum + (platform.views || platform.viewers || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
          {/* Revenue Trend */}
          <div className="panel p-8">
            <h3 className="text-lg font-semibold text-black mb-4 font-display">Revenue Trend</h3>
            {analyticsData?.totalRevenue === 0 && (
              <p className="text-sm text-gray-600 mb-4">
                📊 Revenue trend shows zero because your channels are new. Start creating content to see your revenue grow!
              </p>
            )}
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData?.monthlyTrend.map((value, index) => ({ month: `Month ${index + 1}`, revenue: value })) || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#000" />
                <YAxis stroke="#000" />
                <Tooltip formatter={(value: number) => formatCurrency(Number(value))} contentStyle={{ color: '#000' }} />
                <Line type="monotone" dataKey="revenue" stroke="#2176ae" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Breakdown */}
          <div className="panel p-8">
            <h3 className="text-lg font-semibold text-black mb-4 font-display">Revenue by Platform</h3>
            {analyticsData?.totalRevenue === 0 && (
              <p className="text-sm text-gray-600 mb-4">
                📊 Chart shows follower distribution since revenue is zero. Focus on growing your audience first!
              </p>
            )}
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData?.platformBreakdown || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ platform, percentage }: { platform: string; percentage: number }) => `${platform} ${percentage}%`}
                  outerRadius={90}
                  fill="#2176ae"
                  dataKey="percentage"
                >
                  {analyticsData?.platformBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={["#2176ae", "#53fc18", "#ffe066", "#1a2639", "#f4faff"][index % 5]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ color: '#000' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Performance */}
        <div className="panel">
          <div className="px-8 py-6 border-b border-networthyLight flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black font-display">Platform Performance</h3>
            <button
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
              className="bg-networthyGreen hover:bg-networthyGreen/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Refresh Data
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-networthyLight">
              <thead className="bg-networthyLight">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Platform</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Followers/Subscribers</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Views/Viewers</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">Growth</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-networthyLight">
                {platformData.filter(platform => platform && typeof platform === 'object' && platform.name).map((platform) => (
                  <tr key={platform.name} className="hover:bg-networthyLight/60 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center">
                          {getPlatformIcon(platform.name)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-black font-display">{platform.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-bold">
                      {formatNumber(platform.followers || platform.subscribers || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-bold">
                      {formatNumber(platform.views || platform.viewers || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-bold">
                      {formatCurrency(platform.revenue)}
                      <button
                        onClick={() => setEditingPlatform(platform.name)}
                        className="ml-2 text-networthyGreen text-xs underline hover:text-black transition"
                      >
                        Edit
                      </button>
                      {editingPlatform === platform.name && (
                        <RevenueForm
                          platform={platform.name}
                          initialRevenue={platform.revenue}
                          onClose={() => setEditingPlatform(null)}
                          onSave={(updated) => {
                            setPlatformData(prev =>
                              prev.map(p => p.name === updated.platform ? { ...p, revenue: updated.revenue } : p)
                            );
                          }}
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full italic ${
                          platform.growth >= 0
                            ? 'bg-networthyGreen/20 text-networthyGreen-important'
                            : 'bg-red-100 text-red-800-important'
                        }`}
                      >
                        {platform.growth >= 0 ? '+' : ''}
                        {platform.growth}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-black">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-black transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-black mb-4">Connected Accounts</h3>
                <div className="space-y-3">
                  {/* YouTube */}
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </div>
                      <span className="font-medium text-black">YouTube</span>
                    </div>
                    {connectedPlatforms.includes('youtube') ? (
                      <span className="text-green-600 text-sm font-medium">Connected</span>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            // Get the auth token from localStorage
                            const authToken = localStorage.getItem('authToken');
                            
                            if (!authToken) {
                              alert('Please refresh the page and make sure you\'re logged in');
                              return;
                            }
                            
                            // Navigate to OAuth with token
                            window.location.href = `http://localhost:4000/api/auth/google?token=${encodeURIComponent(authToken)}`;
                          } catch (error) {
                            console.error('Auth check failed:', error);
                            alert('Please refresh the page and try again');
                          }
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>

                  {/* Twitch */}
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                        </svg>
                      </div>
                      <span className="font-medium text-black">Twitch</span>
                    </div>
                    {connectedPlatforms.includes('twitch') ? (
                      <span className="text-green-600 text-sm font-medium">Connected</span>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            // Get the auth token from localStorage
                            const authToken = localStorage.getItem('authToken');
                            
                            if (!authToken) {
                              alert('Please refresh the page and make sure you\'re logged in');
                              return;
                            }
                            
                            // Navigate to OAuth with token
                            window.location.href = `http://localhost:4000/api/auth/twitch?token=${encodeURIComponent(authToken)}`;
                          } catch (error) {
                            console.error('Auth check failed:', error);
                            alert('Please refresh the page and try again');
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>

                  {/* TikTok */}
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                        </svg>
                      </div>
                      <span className="font-medium text-black">TikTok</span>
                    </div>
                    {connectedPlatforms.includes('tiktok') ? (
                      <span className="text-green-600 text-sm font-medium">Connected</span>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            // Get the auth token from localStorage
                            const authToken = localStorage.getItem('authToken');
                            
                            if (!authToken) {
                              alert('Please refresh the page and make sure you\'re logged in');
                              return;
                            }
                            
                            // Navigate to OAuth with token
                            window.location.href = `http://localhost:4000/api/auth/tiktok?token=${encodeURIComponent(authToken)}`;
                          } catch (error) {
                            console.error('Auth check failed:', error);
                            alert('Please refresh the page and try again');
                          }
                        }}
                        className="bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-3">
                <button
                  onClick={refreshConnectedPlatforms}
                  className="w-full bg-networthyGreen hover:bg-networthyGreen/90 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Refresh Connected Accounts
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-black py-3 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Updates Component */}
      <RealTimeUpdates 
        onUpdate={(update) => {
          console.log('🔄 Real-time update received:', update);
          if (update.type === 'platform_update') {
            // Refresh data when we receive a platform update
            window.location.reload();
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
  );
} 