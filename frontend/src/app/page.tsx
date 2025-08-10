'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  BarChart3,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';

export default function HomePage() {
  const [authStatus, setAuthStatus] = useState<{ authenticated: boolean; user?: { email: string; platform: string } } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try token-based auth first
        const token = localStorage.getItem('authToken');
        if (token) {
          try {
            const response = await fetch('http://localhost:4000/api/auth/status-token', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            const data = await response.json();
            
            if (data.authenticated) {
              setAuthStatus({ authenticated: true, user: data.user });
              return;
            }
          } catch {
            console.log('Token auth failed, trying session auth...');
          }
        }
        
        // Fallback to session-based auth
        const response = await fetch('http://localhost:4000/api/auth/me', {
          credentials: 'include',
          cache: 'no-cache' // Force fresh request
        });
        const data = await response.json();
        
        if (response.ok) {
          setAuthStatus({ authenticated: true, user: data.user });
        } else {
          setAuthStatus({ authenticated: false });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Don't retry on network errors, just show unauthenticated state
        setAuthStatus({ authenticated: false });
      }
    };

    // Add a small delay before the first check to ensure backend is ready
    const timer = setTimeout(() => {
      checkAuth();
    }, 500);

    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-networthyBlue to-networthyGreen">
      {/* Header */}
      <header className="bg-white/80 shadow-lg border-b rounded-b-2xl py-4 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16">
            <Image src="/NETWORTHY.png" alt="Networthy Logo" fill className="rounded-full shadow-networthy object-contain bg-networthyYellow p-2" />
          </div>
          <h1 className="text-4xl text-black tracking-tight drop-shadow-sm great-vibes-regular">
            Networthy
          </h1>
        </div>
        <div className="flex items-center space-x-4">
                        {authStatus?.authenticated ? (
                <>
                  <span className="text-sm text-gray-600">
                    Welcome, {authStatus.user?.email}
                  </span>
                  <Link href="/dashboard" className="bg-networthyGreen text-white px-6 py-2 rounded-lg hover:bg-networthyGreen/90 transition-colors font-semibold">
                    Dashboard
                  </Link>
                  <button 
                    onClick={async () => {
                      try {
                        await fetch('http://localhost:4000/api/auth/logout', {
                          credentials: 'include'
                        });
                        // Force page reload to clear all state
                        window.location.reload();
                      } catch (error) {
                        console.error('Logout error:', error);
                        // Force reload anyway
                        window.location.reload();
                      }
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-black hover:text-networthyGreen transition-colors font-semibold">
                    Sign In
                  </Link>
                  <Link href="/register" className="bg-networthyGreen text-black px-6 py-2 rounded-lg hover:bg-networthyGreen/90 transition-colors font-semibold">
                    Get Started
                  </Link>
                </>
              )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold text-white mb-6 great-vibes-regular">
            Track Your Creator Success
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Networthy is your all-in-one platform for tracking revenue, growth, and performance across all your content creation platforms. 
            Get insights that help you grow your creator business.
          </p>
          <Link href={authStatus?.authenticated ? "/dashboard" : "/register"} className="inline-flex items-center bg-black text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors">
            {authStatus?.authenticated ? "Go to Dashboard" : "Get Started"} <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div className="panel p-8 text-center">
            <div className="p-4 bg-networthyGreen/20 rounded-full mb-4 mx-auto w-16 h-16 flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-xl font-semibold text-black mb-3">Revenue Tracking</h3>
            <p className="text-gray-600">
              Monitor your earnings across YouTube, Twitch, Instagram, TikTok, and more in one unified dashboard.
            </p>
          </div>

          <div className="panel p-8 text-center">
            <div className="p-4 bg-networthyBlue/20 rounded-full mb-4 mx-auto w-16 h-16 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-xl font-semibold text-black mb-3">Growth Analytics</h3>
            <p className="text-gray-600">
              Track your follower growth, engagement rates, and performance trends over time.
            </p>
          </div>

          <div className="panel p-8 text-center">
            <div className="p-4 bg-networthyYellow/20 rounded-full mb-4 mx-auto w-16 h-16 flex items-center justify-center">
              <Users className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-xl font-semibold text-black mb-3">Audience Insights</h3>
            <p className="text-gray-600">
              Understand your audience across platforms with detailed analytics and demographics.
            </p>
          </div>

          <div className="panel p-8 text-center">
            <div className="p-4 bg-networthyGreen/20 rounded-full mb-4 mx-auto w-16 h-16 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-xl font-semibold text-black mb-3">Performance Reports</h3>
            <p className="text-gray-600">
              Generate comprehensive reports to optimize your content strategy and maximize earnings.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="panel p-12 mb-20">
          <h2 className="text-4xl font-bold text-black text-center mb-12 great-vibes-regular">
            How Networthy Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-black text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-4 mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">Connect Your Platforms</h3>
              <p className="text-gray-600">
                Link your YouTube, Twitch, Instagram, TikTok, and other creator accounts to start tracking.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-black text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-4 mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">Automatic Data Sync</h3>
              <p className="text-gray-600">
                Networthy automatically syncs your revenue, followers, views, and engagement data.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-black text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-4 mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">Get Insights & Grow</h3>
              <p className="text-gray-600">
                Use our analytics to understand trends, optimize content, and increase your earnings.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <div className="panel p-8">
            <h3 className="text-2xl font-bold text-black mb-6">Why Choose Networthy?</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-black mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-black">Unified Dashboard</h4>
                  <p className="text-gray-600 text-sm">View all your platforms in one place with real-time updates</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-black mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-black">Revenue Optimization</h4>
                  <p className="text-gray-600 text-sm">Identify your highest-earning content and platforms</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-black mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-black">Growth Tracking</h4>
                  <p className="text-gray-600 text-sm">Monitor your progress with detailed growth analytics</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-black mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-black">Smart Insights</h4>
                  <p className="text-gray-600 text-sm">Get AI-powered recommendations to boost your earnings</p>
                </div>
              </div>
            </div>
          </div>

          <div className="panel p-8">
            <h3 className="text-2xl font-bold text-black mb-6">Perfect For</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-black" />
                <span className="text-black font-medium">Content Creators</span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-black" />
                <span className="text-black font-medium">Streamers & Gamers</span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-black" />
                <span className="text-black font-medium">Social Media Influencers</span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-black" />
                <span className="text-black font-medium">Podcasters</span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-black" />
                <span className="text-black font-medium">Digital Artists</span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-black" />
                <span className="text-black font-medium">Anyone Building a Creator Business</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center panel p-12">
          <h2 className="text-4xl font-bold text-black mb-6 great-vibes-regular">
            Ready to Track Your Success?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of creators who use Networthy to optimize their content strategy and maximize their earnings.
          </p>
          <Link href="/dashboard" className="inline-flex items-center bg-black text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors">
            Access Your Dashboard <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600">
            © 2025 Networthy. Empowering creators to track, analyze, and grow their success.
          </p>
        </div>
      </footer>
    </div>
  );
}

