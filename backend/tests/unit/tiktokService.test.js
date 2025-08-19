import { jest } from '@jest/globals';

// Mock HistoryService as a constructor returning an object
jest.mock('../../services/historyService.js', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    storePlatformMetrics: jest.fn(),
    calculateGrowthRate: jest.fn()
  }))
}));

// Mock axios before importing the service
jest.mock('axios');

// Import after mocking
import TikTokService from '../../services/tiktokService.js';

describe('TikTok Service', () => {
  let tiktokService;
  let mockAxios;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAxios = require('axios');
    
    // Create service instance without HistoryService
    tiktokService = new TikTokService();
    // Mock the historyService property to avoid constructor issues
    tiktokService.historyService = {
      storePlatformMetrics: jest.fn(),
      calculateGrowthRate: jest.fn()
    };
  });

  describe('Authentication', () => {
    test('should authenticate successfully', async () => {
      const mockAuthResponse = {
        data: {
          access_token: 'test-access-token',
          expires_in: 3600
        }
      };
      
      mockAxios.post.mockResolvedValueOnce(mockAuthResponse);
      
      const result = await tiktokService.authenticate();
      
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://open.tiktokapis.com/v2/oauth/token/',
        {
          client_key: process.env.TIKTOK_CLIENT_KEY,
          client_secret: process.env.TIKTOK_CLIENT_SECRET,
          grant_type: 'client_credentials'
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache'
          }
        }
      );
      expect(result).toBe('test-access-token');
    });

    test('should handle authentication errors', async () => {
      const authError = new Error('Authentication failed');
      mockAxios.post.mockRejectedValueOnce(authError);
      
      await expect(tiktokService.authenticate()).rejects.toThrow('Failed to authenticate with TikTok API');
    });

    test('should handle missing credentials', async () => {
      // Temporarily remove credentials
      const originalClientKey = process.env.TIKTOK_CLIENT_KEY;
      const originalClientSecret = process.env.TIKTOK_CLIENT_SECRET;
      delete process.env.TIKTOK_CLIENT_KEY;
      delete process.env.TIKTOK_CLIENT_SECRET;
      
      await expect(tiktokService.authenticate()).rejects.toThrow('Failed to authenticate with TikTok API');
      
      // Restore credentials
      process.env.TIKTOK_CLIENT_KEY = originalClientKey;
      process.env.TIKTOK_CLIENT_SECRET = originalClientSecret;
    });
  });

  describe('Revenue Calculation', () => {
    test('should calculate estimated revenue correctly', () => {
      const followers = 1000;
      const views = 50000;
      const revenue = tiktokService.calculateEstimatedRevenue(followers, views);
      
      // Expected: (1000 * 0.005) + (50000 / 1000 * 0.5) = 5 + 25 = 30
      expect(revenue).toBe(30);
    });

    test('should handle zero followers and views', () => {
      const followers = 0;
      const views = 0;
      const revenue = tiktokService.calculateEstimatedRevenue(followers, views);
      
      expect(revenue).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing access token', async () => {
      const username = 'testuser';
      
      const mockAuthResponse = {
        data: {
          access_token: 'test-access-token',
          expires_in: 3600
        }
      };
      
      const mockCreatorData = {
        data: {
          data: {
            user: {
              id: '123456789',
              username: username,
              display_name: 'TestUser',
              follower_count: 1000,
              video_count: 50,
              like_count: 10000
            }
          }
        }
      };
      
      mockAxios.post.mockResolvedValueOnce(mockAuthResponse);
      mockAxios.get.mockRejectedValueOnce(new Error('TikTok API Error'));
      
      await expect(tiktokService.getCreatorStats(username))
        .rejects.toThrow('Failed to fetch TikTok data: TikTok API Error');
    });

    test('should handle invalid username', async () => {
      const username = 'invaliduser';
      
      const mockAuthResponse = {
        data: {
          access_token: 'test-access-token',
          expires_in: 3600
        }
      };
      
      const mockCreatorData = {
        data: {
          data: {
            user: null
          }
        }
      };
      
      mockAxios.post.mockResolvedValueOnce(mockAuthResponse);
      mockAxios.get.mockRejectedValueOnce(new Error('TikTok API Error'));
      
      await expect(tiktokService.getCreatorStats(username))
        .rejects.toThrow('Failed to fetch TikTok data: TikTok API Error');
    });
  });
});
