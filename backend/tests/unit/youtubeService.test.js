import { jest } from '@jest/globals';

// Ensure HistoryService mock is a constructor returning an object
jest.mock('../../services/historyService.js', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      storePlatformMetrics: jest.fn(),
      calculateGrowthRate: jest.fn()
    }))
  };
});

// Mock googleapis before importing the service
jest.mock('googleapis', () => ({
  google: {
    youtube: jest.fn().mockReturnValue({
      channels: {
        list: jest.fn()
      },
      search: {
        list: jest.fn()
      },
      videos: {
        list: jest.fn()
      }
    }),
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn()
      }))
    }
  }
}));

// Mock axios before importing the service
jest.mock('axios');

// (above) HistoryService is already mocked as a constructor

// Import after mocking
import YouTubeService from '../../services/youtubeService.js';

describe('YouTube Service', () => {
  let youtubeService;
  let mockGoogle;
  let mockAxios;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGoogle = require('googleapis').google;
    mockAxios = require('axios');
    
    // Create service instance without HistoryService
    youtubeService = new YouTubeService();
    // Mock the historyService property to avoid constructor issues
    youtubeService.historyService = {
      storePlatformMetrics: jest.fn(),
      calculateGrowthRate: jest.fn()
    };
  });

  describe('Revenue Calculation', () => {
    test('should calculate estimated revenue correctly', () => {
      const views = 10000;
      const revenue = youtubeService.calculateEstimatedRevenue(views);
      
      // Expected: (10000 / 1000) * 3.5 = 35
      expect(revenue).toBe(35);
    });

    test('should handle zero views', () => {
      const views = 0;
      const revenue = youtubeService.calculateEstimatedRevenue(views);
      
      expect(revenue).toBe(0);
    });
  });

  describe('Channel ID from Username', () => {
    test('should get channel ID from username successfully', async () => {
      const username = 'testuser';
      
      const mockChannelData = {
        data: {
          items: [{ id: 'test-channel-id' }]
        }
      };
      
      mockGoogle.youtube().channels.list.mockResolvedValueOnce(mockChannelData);
      
      const result = await youtubeService.getChannelIdFromUsername(username);
      
      expect(mockGoogle.youtube().channels.list).toHaveBeenCalledWith({
        key: process.env.YOUTUBE_API_KEY,
        part: 'id',
        forUsername: username
      });
      expect(result).toBe('test-channel-id');
    });

    test('should handle channel not found', async () => {
      const username = 'testuser';
      
      const mockChannelData = {
        data: {
          items: []
        }
      };
      
      mockGoogle.youtube().channels.list.mockResolvedValueOnce(mockChannelData);
      
      await expect(youtubeService.getChannelIdFromUsername(username))
        .rejects.toThrow('Failed to get channel ID: Channel not found');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid channel ID', async () => {
      const channelId = '';
      const accessToken = 'test-access-token';
      
      const apiError = new Error('Invalid channel ID');
      mockGoogle.youtube().channels.list.mockRejectedValueOnce(apiError);
      
      await expect(youtubeService.getChannelStats(channelId, accessToken))
        .rejects.toThrow('Failed to fetch YouTube data: Invalid channel ID');
    });
  });

  describe('Rate Limiting', () => {
    test('should handle rate limit errors', async () => {
      const channelId = 'test-channel-id';
      const accessToken = 'test-access-token';
      
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.response = { status: 429 };
      mockGoogle.youtube().channels.list.mockRejectedValueOnce(rateLimitError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await expect(youtubeService.getChannelStats(channelId, accessToken))
        .rejects.toThrow('Failed to fetch YouTube data: Rate limit exceeded');
      consoleSpy.mockRestore();
    });
  });
});
