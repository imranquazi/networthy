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
import TwitchService from '../../services/twitchService.js';

describe('Twitch Service', () => {
  let twitchService;
  let mockAxios;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAxios = require('axios');
    
    // Create service instance without HistoryService
    twitchService = new TwitchService();
    // Mock the historyService property to avoid constructor issues
    twitchService.historyService = {
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
      
      const result = await twitchService.authenticate();
      
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://id.twitch.tv/oauth2/token',
        null,
        {
          params: {
            client_id: process.env.TWITCH_CLIENT_ID,
            client_secret: process.env.TWITCH_CLIENT_SECRET,
            grant_type: 'client_credentials'
          }
        }
      );
      expect(result).toBe('test-access-token');
    });

    test('should handle authentication errors', async () => {
      const authError = new Error('Authentication failed');
      mockAxios.post.mockRejectedValueOnce(authError);
      
      await expect(twitchService.authenticate()).rejects.toThrow('Failed to authenticate with Twitch API');
    });

    test('should handle missing credentials', async () => {
      // Temporarily remove credentials
      const originalClientId = process.env.TWITCH_CLIENT_ID;
      const originalClientSecret = process.env.TWITCH_CLIENT_SECRET;
      delete process.env.TWITCH_CLIENT_ID;
      delete process.env.TWITCH_CLIENT_SECRET;
      
      await expect(twitchService.authenticate()).rejects.toThrow('Failed to authenticate with Twitch API');
      
      // Restore credentials
      process.env.TWITCH_CLIENT_ID = originalClientId;
      process.env.TWITCH_CLIENT_SECRET = originalClientSecret;
    });
  });

  describe('Revenue Calculation', () => {
    test('should calculate estimated revenue correctly', () => {
      const followers = 1000;
      const viewers = 500;
      const revenue = twitchService.calculateEstimatedRevenue(followers, viewers);
      
      // Expected: (1000 * 0.01) + (500 * 0.05) = 10 + 25 = 35
      expect(revenue).toBe(35);
    });

    test('should handle zero followers and viewers', () => {
      const followers = 0;
      const viewers = 0;
      const revenue = twitchService.calculateEstimatedRevenue(followers, viewers);
      
      expect(revenue).toBe(0);
    });
  });

  describe('Channel ID from Username', () => {
    test('should get channel ID from username successfully', async () => {
      const username = 'testuser';
      
      const mockAuthResponse = {
        data: {
          access_token: 'test-access-token',
          expires_in: 3600
        }
      };
      
      const mockUserData = {
        data: {
          data: [{ id: '123456789' }]
        }
      };
      
      mockAxios.post.mockResolvedValueOnce(mockAuthResponse);
      mockAxios.get.mockResolvedValueOnce(mockUserData);
      
      const result = await twitchService.getChannelIdFromUsername(username);
      
      expect(mockAxios.get).toHaveBeenCalledWith(
        `https://api.twitch.tv/helix/users?login=${username}`,
        {
          headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID,
            'Authorization': 'Bearer test-access-token'
          }
        }
      );
      expect(result).toBe('123456789');
    });

    test('should handle channel not found', async () => {
      const username = 'testuser';
      
      const mockAuthResponse = {
        data: {
          access_token: 'test-access-token',
          expires_in: 3600
        }
      };
      
      const mockUserData = {
        data: {
          data: []
        }
      };
      
      mockAxios.post.mockResolvedValueOnce(mockAuthResponse);
      mockAxios.get.mockResolvedValueOnce(mockUserData);
      
      await expect(twitchService.getChannelIdFromUsername(username))
        .rejects.toThrow('Failed to get channel ID: Channel not found');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid username', async () => {
      const username = 'invaliduser';
      const accessToken = 'test-access-token';
      
      const mockUserData = {
        data: {
          data: []
        }
      };
      
      mockAxios.get.mockResolvedValueOnce(mockUserData);
      
      await expect(twitchService.getChannelStats(username, accessToken))
        .rejects.toThrow('Failed to fetch Twitch data: Twitch user not found');
    });

    test('should handle network errors', async () => {
      const username = 'testuser';
      const accessToken = 'test-access-token';
      
      const networkError = new Error('Stream API Error');
      mockAxios.get.mockRejectedValueOnce(networkError);
      
      await expect(twitchService.getChannelStats(username, accessToken))
        .rejects.toThrow('Failed to fetch Twitch data: Stream API Error');
    });
  });
});
