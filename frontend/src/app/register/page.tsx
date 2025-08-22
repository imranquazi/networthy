'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { authConfig, getApiUrl } from '@/config/auth';

export default function RegisterPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
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
              window.location.href = '/dashboard';
              return;
            }
          } catch {
            console.log('Token auth failed, trying session auth...');
          }
        }
        
        try {
          const response = await fetch(getApiUrl('/api/auth/status'), {
            credentials: 'include'
          });
          const data = await response.json();
          
          if (data.authenticated) {
            window.location.href = '/dashboard';
          } else {
            setLoading(false);
          }
        } catch {
          console.log('Session auth failed, showing register form...');
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setRegisterLoading(false);
      return;
    }

    try {
      const response = await fetch(getApiUrl(authConfig.endpoints.register), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        window.location.href = '/dashboard';
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setRegisterLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Gradient background for top section */}
      <div className="absolute inset-0 h-[600px] bg-gradient-to-b from-gray-950 via-[#71bf49] to-white pointer-events-none"></div>
      <div className="relative z-10 flex items-center justify-center p-6 min-h-screen">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="-ml-2">
              <Image 
                src="/assets/Asset 10.png" 
                alt="Networthy Logo" 
                width={175}
                height={175}
                className="object-contain w-auto h-auto" 
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-white/80">Join Networthy to track your creator success</p>
        </div>

        {/* Register Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create your account to get started with Networthy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Create a password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                />
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={registerLoading}>
                {registerLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
            </div>

            <div className="mt-6 text-center">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
} 