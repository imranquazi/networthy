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
  Star,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authConfig, getApiUrl } from '@/config/auth';

export default function HomePage() {
  const [authStatus, setAuthStatus] = useState<{ authenticated: boolean; user?: { email: string; platform: string } } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try session-based auth first
        try {
          const response = await fetch(getApiUrl(authConfig.endpoints.me), {
            credentials: 'include'
          });
          const data = await response.json();
          
          if (data.authenticated) {
            setAuthStatus({ authenticated: true, user: data.user });
            return;
          }
        } catch (error) {
          console.log('Session auth failed:', error);
        }

        // Fallback to token-based auth
        const token = localStorage.getItem('authToken');
        if (token) {
          try {
            const response = await fetch(getApiUrl(authConfig.endpoints.statusToken), {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            const data = await response.json();
            
            if (data.authenticated) {
              setAuthStatus({ authenticated: true, user: data.user });
              return;
            }
          } catch (error) {
            console.log('Token auth failed:', error);
          }
        }
        
        setAuthStatus({ authenticated: false });
        localStorage.removeItem('authToken');
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthStatus({ authenticated: false });
        localStorage.removeItem('authToken');
      }
    };

    // Check auth immediately and then again after a short delay
    checkAuth();
    const timer = setTimeout(() => {
      checkAuth();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Gradient background for top section */}
      <div className="absolute inset-0 h-[1200px] bg-gradient-to-b from-gray-950 via-[#71bf49] to-white pointer-events-none"></div>
      {/* Header */}
      <header className="relative z-10 supports-[backdrop-filter] border-none">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image 
                src="/assets/Asset 10.png" 
                alt="Networthy Logo" 
                width={175}
                height={175}
                className="object-contain" 
              />
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {authStatus?.authenticated ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Welcome, {authStatus.user?.email}
                </span>
                <Button asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      localStorage.removeItem('authToken');
                      setAuthStatus({ authenticated: false });
                      setTimeout(() => {
                        window.location.reload();
                      }, 100);
                    } catch (error) {
                      console.error('Logout error:', error);
                      setAuthStatus({ authenticated: false });
                      localStorage.removeItem('authToken');
                      window.location.reload();
                    }
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="text-white hover:text-white/80" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-white">
            Track Your
            <span className="block text-white">
              Creator Success
            </span>
          </h1>
          <p className="mt-6 text-lg text-white/80 sm:text-xl">
            Networthy is your all-in-one platform for tracking revenue, growth, and performance across all your content creation platforms. 
            Get insights that help you grow your creator business.
          </p>
          
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href={authStatus?.authenticated ? "/dashboard" : "/register"}>
                {authStatus?.authenticated ? "Go to Dashboard" : "Get Started"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl bg-gray-100">
            {/* Custom poster overlay - will be hidden when video plays */}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-10" id="video-poster">
              <div className="text-center">
                <Image 
                  src="/assets/Asset 10.png" 
                  alt="Networthy Logo" 
                  width={150}
                  height={150}
                  className="mx-auto mb-4 object-contain" 
                />
                <p className="text-white text-lg font-semibold">Click to play video</p>
                <p className="text-white text-sm mt-2" id="loading-text">Loading video...</p>
              </div>
            </div>
            
            <video 
              className="w-full h-full object-cover"
              controls
              preload="metadata"
              style={{ objectPosition: 'center 20%' }}
              onPlay={() => {
                const poster = document.getElementById('video-poster');
                if (poster) poster.style.display = 'none';
              }}
              onPause={() => {
                const poster = document.getElementById('video-poster');
                if (poster) poster.style.display = 'flex';
              }}
              onError={(e) => {
                console.error('Video error:', e);
                const poster = document.getElementById('video-poster');
                if (poster) {
                  poster.innerHTML = `
                    <div class="text-center">
                      <p class="text-white text-lg font-semibold mb-2">Video failed to load</p>
                      <p class="text-white text-sm mb-4">Check browser console for details</p>
                      <a href="/assets/networthy-beta-trailer.mp4" class="text-blue-400 underline hover:text-blue-300" download>
                        Download video instead
                      </a>
                    </div>
                  `;
                }
              }}
              onLoadStart={() => {
                console.log('Video loading started');
                const loadingText = document.getElementById('loading-text');
                if (loadingText) loadingText.textContent = 'Loading video...';
              }}
              onCanPlay={() => {
                console.log('Video can play');
                const loadingText = document.getElementById('loading-text');
                if (loadingText) loadingText.textContent = 'Click to play video';
              }}
              onLoadedData={() => {
                console.log('Video data loaded');
              }}
            >
              <source src="/assets/networthy-beta-trailer.mp4" type="video/mp4" />
              <source src="/assets/networthy-beta-trailer.mov" type="video/quicktime" />
              <p className="absolute inset-0 flex items-center justify-center text-gray-500">
                Your browser does not support the video tag. 
                <br />
                <a href="/assets/networthy-beta-trailer.mp4" className="text-blue-500 underline ml-1" download>
                  Download video
                </a>
              </p>
            </video>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Revenue Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Monitor your earnings across YouTube, Twitch, TikTok, and more in one unified dashboard.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Growth Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track your follower growth, engagement rates, and performance trends over time.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Audience Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Understand your audience across platforms with detailed analytics.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Performance Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Generate comprehensive reports to optimize your content strategy and maximize earnings.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How Networthy Works
          </h2>
          <p className="mt-4 text-muted-foreground">
            Get started in three simple steps
          </p>
          
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                1
              </div>
              <h3 className="mt-4 text-lg font-semibold">Connect Your Platforms</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Link your YouTube, Twitch, TikTok, and other creator accounts to start tracking.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                2
              </div>
              <h3 className="mt-4 text-lg font-semibold">Automatic Data Sync</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Networthy automatically syncs your revenue, followers, views, and engagement data.
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                3
              </div>
              <h3 className="mt-4 text-lg font-semibold">Get Insights & Grow</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Use our analytics to understand trends, optimize content, and increase your earnings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Why Choose Networthy?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Unified Dashboard</h4>
                    <p className="text-sm text-muted-foreground">View all your platforms in one place with real-time updates</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Revenue Optimization</h4>
                    <p className="text-sm text-muted-foreground">Identify your highest-earning content and platforms</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Growth Tracking</h4>
                    <p className="text-sm text-muted-foreground">Monitor your progress with detailed growth analytics</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Smart Insights</h4>
                    <p className="text-sm text-muted-foreground">Get AI-powered recommendations to boost your earnings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Perfect For</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="font-medium">Content Creators</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="font-medium">Streamers & Gamers</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="font-medium">Social Media Influencers</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="font-medium">Podcasters</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="font-medium">Digital Artists</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-4 w-4 text-primary" />
                  <span className="font-medium">Anyone Building a Creator Business</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-3xl">Ready to Track Your Success?</CardTitle>
              <CardDescription className="text-lg">
                Join thousands of creators who use Networthy to optimize their content strategy and maximize their earnings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Access Your Dashboard
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mx-auto max-w-4xl text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Your Privacy & Security</h2>
          <p className="text-lg text-muted-foreground">
            We take your data protection seriously. Your privacy is our priority.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <CardTitle>Data Encryption</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All your data is encrypted in transit and at rest using industry-standard AES-256 encryption. Your sensitive information is never stored in plain text.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <CardTitle>Secure Authentication</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We use OAuth 2.0 for secure platform connections. Your credentials are never stored on our servers - we only access data through secure API tokens.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <CardTitle>Data Control</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You have complete control over your data. Delete your account anytime and we&apos;ll permanently remove all your information from our systems.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <CardTitle>Transparency</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We&apos;re transparent about what data we collect and how we use it. Our privacy policy is clear, simple, and easy to understand.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <CardTitle>No Data Selling</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We never sell, rent, or share your personal data with third parties. Your information is used solely to provide you with our analytics services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <CardTitle>GDPR Compliant</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We&apos;re fully compliant with GDPR and other privacy regulations. You have the right to access, modify, or delete your data at any time.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm font-medium">Your data is protected by enterprise-grade security</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="relative w-32 h-32">
                <Image 
                  src="/assets/Asset 1.png" 
                  alt="Networthy Logo" 
                  fill 
                  sizes="128px" 
                  className="object-contain" 
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Networthy. Empowering creators to track, analyze, and grow their success.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

