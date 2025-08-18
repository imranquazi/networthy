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
  Zap,
  Target,
  Award,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  const [authStatus, setAuthStatus] = useState<{ authenticated: boolean; user?: { email: string; platform: string } } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
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

    const timer = setTimeout(() => {
      checkAuth();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Gradient background for top section */}
      <div className="absolute inset-0 h-[600px] bg-gradient-to-b from-gray-950 via-[#71bf49] to-white pointer-events-none"></div>
      {/* Header */}
      <header className="relative z-10 backdrop-blur-md supports-[backdrop-filter] border-none">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div>
                <Image 
                  src="/assets/Asset 10.png" 
                  alt="Networthy Logo" 
                  width={175}
                  height={175}
                  className="object-contain" 
                />
              </div>
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
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">
            🚀 Creator Analytics Platform
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Track Your
            <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Creator Success
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
            Networthy is your all-in-one platform for tracking revenue, growth, and performance across all your content creation platforms. 
            Get insights that help you grow your creator business.
          </p>
          
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/register">
                {authStatus?.authenticated ? "Go to Dashboard" : "Get Started"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-7xl">
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
                  Understand your audience across platforms with detailed analytics and demographics.
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
      <section className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-7xl">
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

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8">
                <Image 
                  src="/assets/Asset 1.png" 
                  alt="Networthy Logo" 
                  fill 
                  sizes="32px" 
                  className="object-contain" 
                />
              </div>
              <span className="font-semibold">Networthy</span>
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

