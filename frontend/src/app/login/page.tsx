'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already authenticated
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
              // User is already logged in, redirect to dashboard
              window.location.href = '/dashboard';
              return;
            }
          } catch {
            console.log('Token auth failed, trying session auth...');
          }
        }
        
        // Fallback to session-based auth
        try {
          const response = await fetch('http://localhost:4000/api/auth/status', {
            credentials: 'include'
          });
          const data = await response.json();
          
          if (data.authenticated) {
            // User is already logged in, redirect to dashboard
            window.location.href = '/dashboard';
          } else {
            setLoading(false);
          }
        } catch {
          console.log('Session auth failed, showing login form...');
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        // Store token for development
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        // Redirect to dashboard on successful login
        window.location.href = '/dashboard';
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-networthyBlue to-networthyGreen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-networthyBlue to-networthyGreen">
      <div className="bg-white/90 rounded-2xl shadow-xl p-10 w-full max-w-md flex flex-col items-center">
        <div className="mb-8 flex flex-col items-center">
          <Image src="/NETWORTHY.png" alt="Networthy Logo" width={64} height={64} className="rounded-full mb-2" />
          <h1 className="text-3xl font-bold text-black mb-2">Sign in to Networthy</h1>
          <p className="text-gray-600 text-center">Access your creator dashboard</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Email/Password Login */}
        <form onSubmit={handleLogin} className="w-full space-y-4 mb-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-networthyGreen focus:border-transparent text-black bg-white"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-networthyGreen focus:border-transparent text-black bg-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full bg-networthyGreen text-black py-3 rounded-lg font-semibold hover:bg-networthyGreen/90 transition-colors disabled:opacity-50"
          >
            {loginLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>



        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-networthyGreen hover:underline">
              Create Account
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-gray-600 hover:text-black transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 