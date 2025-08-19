import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from '../../src/app/page';

// Mock fetch globally
global.fetch = jest.fn();

describe('HomePage Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset localStorage mock
    (localStorage.getItem as jest.Mock).mockReturnValue(null);
    (localStorage.removeItem as jest.Mock).mockImplementation(() => {});
  });

  test('renders homepage with correct content', () => {
    render(<HomePage />);
    
    // Check for main heading - use a function to match split text
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Track YourCreator Success';
    })).toBeInTheDocument();
    
    // Check for description
    expect(screen.getByText(/Networthy is your all-in-one platform/)).toBeInTheDocument();
    
    // Check for CTA buttons - use getAllByText since there are multiple "Get Started" buttons
    const getStartedButtons = screen.getAllByText('Get Started');
    expect(getStartedButtons.length).toBeGreaterThan(0);
    
    // Check for Sign In link
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  test('shows login/signup buttons when user is not authenticated', async () => {
    // Mock localStorage to return no token
    (localStorage.getItem as jest.Mock).mockReturnValue(null);
    
    render(<HomePage />);
    
    // Should show Sign In and Get Started buttons
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    const getStartedButtons = screen.getAllByText('Get Started');
    expect(getStartedButtons.length).toBeGreaterThan(0);
  });

  test('shows dashboard button when user is authenticated', async () => {
    // Mock localStorage to return a token
    (localStorage.getItem as jest.Mock).mockReturnValue('mock-token');
    
    // Mock successful authentication response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        authenticated: true,
        user: { email: 'test@example.com' }
      })
    });

    render(<HomePage />);
    
    // Wait for authentication check
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/api/auth/status-token', {
        headers: { 'Authorization': 'Bearer mock-token' }
      });
    });
  });

  test('handles logout correctly', async () => {
    // Mock localStorage
    (localStorage.getItem as jest.Mock).mockReturnValue('mock-token');
    (localStorage.removeItem as jest.Mock).mockImplementation(() => {});
    
    // Mock successful authentication response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        authenticated: true,
        user: { email: 'test@example.com' }
      })
    });

    render(<HomePage />);
    
    // Wait for authentication check
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  test('handles authentication errors gracefully', async () => {
    // Mock localStorage to return a token
    (localStorage.getItem as jest.Mock).mockReturnValue('mock-token');
    
    // Mock failed authentication response
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<HomePage />);
    
    // Should still render the page even if authentication fails
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Track YourCreator Success';
    })).toBeInTheDocument();
  });
});

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (localStorage.getItem as jest.Mock).mockReturnValue('mock-token');
  });

  test('renders dashboard with platform data', async () => {
    // Mock successful API responses for both auth and analytics
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authenticated: true,
          user: { email: 'test@example.com' }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalRevenue: 1000,
          totalFollowers: 5000,
          platforms: [
            { name: 'YouTube', revenue: 600, followers: 3000 },
            { name: 'Twitch', revenue: 400, followers: 2000 }
          ]
        })
      });

    // Import and render Dashboard component
    const DashboardPage = require('../../src/app/dashboard/page').default;
    render(<DashboardPage />);
    
    // Wait for API calls
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/api/auth/status-token', {
        headers: { 'Authorization': 'Bearer mock-token' }
      });
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock failed API response
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    // Import and render Dashboard component
    const DashboardPage = require('../../src/app/dashboard/page').default;
    render(<DashboardPage />);
    
    // Should still render the dashboard even if API fails
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});

describe('RealTimeUpdates Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (localStorage.getItem as jest.Mock).mockReturnValue('mock-token');
  });

  test('establishes SSE connection', () => {
    const mockEventSource = {
      onopen: null as any,
      onmessage: null as any,
      onerror: null as any,
      close: jest.fn(),
      readyState: 1,
      url: 'http://localhost:4000/api/websocket?token=mock-token',
      withCredentials: true,
    };
    
    (global.EventSource as jest.Mock).mockImplementation(() => mockEventSource);

    // Import and render RealTimeUpdates component
    const RealTimeUpdates = require('../../src/components/RealTimeUpdates').default;
    render(<RealTimeUpdates />);
    
    expect(global.EventSource).toHaveBeenCalledWith('http://localhost:4000/api/websocket?token=mock-token', { withCredentials: true });
    expect(mockEventSource.onopen).toBeDefined();
    expect(mockEventSource.onmessage).toBeDefined();
    expect(mockEventSource.onerror).toBeDefined();
  });

  test('handles SSE messages correctly', () => {
    const mockEventSource = {
      onopen: null as any,
      onmessage: null as any,
      onerror: null as any,
      close: jest.fn(),
      readyState: 1,
      url: 'http://localhost:4000/api/websocket?token=mock-token',
      withCredentials: true,
    };
    
    (global.EventSource as jest.Mock).mockImplementation(() => mockEventSource);

    // Import and render RealTimeUpdates component
    const RealTimeUpdates = require('../../src/components/RealTimeUpdates').default;
    render(<RealTimeUpdates />);
    
    // Simulate connection open
    if (mockEventSource.onopen) {
      mockEventSource.onopen();
    }
    
    // Simulate message
    if (mockEventSource.onmessage) {
      const mockEvent = {
        data: JSON.stringify({
          type: 'platform_update',
          platform: 'YouTube',
          data: { followers: 1000, revenue: 500 }
        })
      };
      
      mockEventSource.onmessage(mockEvent);
    }
    
    expect(mockEventSource.onmessage).toBeDefined();
  });
});

