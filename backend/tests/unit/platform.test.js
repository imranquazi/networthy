import { jest } from '@jest/globals';
import PlatformManager from '../../services/platformManager.js';

// Mock external API calls
jest.mock('axios');
jest.mock('googleapis');

describe('Platform Manager', () => {
  let platformManager;

  beforeEach(() => {
    platformManager = new PlatformManager();
    jest.clearAllMocks();
  });

  describe('Platform Data Fetching', () => {
    test('should fetch YouTube platform data successfully', async () => {
      const mockData = {
        name: 'YouTube',
        subscribers: 1000,
        views: 50000,
        revenue: 250,
        growth: 5.2,
        channelId: 'test-channel-id',
        channelName: 'Test Channel'
      };

      // Mock the YouTube service
      platformManager.services.youtube.getChannelStats = jest.fn().mockResolvedValue(mockData);

      const result = await platformManager.getPlatformStats('youtube', 'test-channel-id');
      
      expect(platformManager.services.youtube.getChannelStats).toHaveBeenCalledWith('test-channel-id', null, null);
      expect(result).toEqual(mockData);
    });

    test('should fetch Twitch platform data successfully', async () => {
      const mockData = {
        name: 'Twitch',
        followers: 500,
        viewers: 25000,
        revenue: 150,
        growth: 3.8,
        channelId: 'test-user',
        channelName: 'Test User'
      };

      // Mock the Twitch service
      platformManager.services.twitch.getChannelStats = jest.fn().mockResolvedValue(mockData);

      const result = await platformManager.getPlatformStats('twitch', 'test-username');
      
      expect(platformManager.services.twitch.getChannelStats).toHaveBeenCalledWith('test-username', null, null);
      expect(result).toEqual(mockData);
    });

    test('should fetch TikTok platform data successfully', async () => {
      const mockData = {
        name: 'TikTok',
        followers: 2000,
        views: 150000,
        revenue: 300,
        growth: 7.5,
        channelId: 'test-user-id',
        channelName: 'Test Creator'
      };

      // Mock the TikTok service
      platformManager.services.tiktok.getCreatorStats = jest.fn().mockResolvedValue(mockData);

      const result = await platformManager.getPlatformStats('tiktok', 'test-username');
      
      expect(platformManager.services.tiktok.getCreatorStats).toHaveBeenCalledWith('test-username', null);
      expect(result).toEqual(mockData);
    });
  });

  describe('Error Handling', () => {
    test('should handle YouTube API errors gracefully', async () => {
      platformManager.services.youtube.getChannelStats = jest.fn().mockRejectedValue(new Error('API Error'));

      await expect(platformManager.getPlatformStats('youtube', 'invalid-channel-id'))
        .rejects.toThrow('API Error');
    });

    test('should handle Twitch API errors gracefully', async () => {
      platformManager.services.twitch.getChannelStats = jest.fn().mockRejectedValue(new Error('API Error'));

      await expect(platformManager.getPlatformStats('twitch', 'invalid-username'))
        .rejects.toThrow('API Error');
    });

    test('should handle TikTok API errors gracefully', async () => {
      platformManager.services.tiktok.getCreatorStats = jest.fn().mockRejectedValue(new Error('API Error'));

      await expect(platformManager.getPlatformStats('tiktok', 'invalid-username'))
        .rejects.toThrow('API Error');
    });

    test('should handle unsupported platform', async () => {
      await expect(platformManager.getPlatformStats('unsupported', 'test-id'))
        .rejects.toThrow('Unsupported platform: unsupported');
    });
  });

  describe('Caching', () => {
    test('should cache platform data and return cached results', async () => {
      const mockData = {
        name: 'YouTube',
        subscribers: 1000,
        views: 50000,
        revenue: 250
      };

      platformManager.services.youtube.getChannelStats = jest.fn().mockResolvedValue(mockData);

      // First call should hit the API
      const result1 = await platformManager.getPlatformStats('youtube', 'test-channel-id');
      
      // Second call should return cached data
      const result2 = await platformManager.getPlatformStats('youtube', 'test-channel-id');
      
      expect(result1).toEqual(result2);
      expect(platformManager.services.youtube.getChannelStats).toHaveBeenCalledTimes(1);
    });

    test('should refresh cache after cache duration expires', async () => {
      const mockData1 = { name: 'YouTube', subscribers: 1000, views: 50000, revenue: 250 };
      const mockData2 = { name: 'YouTube', subscribers: 1100, views: 55000, revenue: 275 };

      platformManager.services.youtube.getChannelStats = jest.fn()
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2);

      // First call
      await platformManager.getPlatformStats('youtube', 'test-channel-id');

      // Clear cache manually to simulate expiration
      platformManager.clearCache();

      // Second call should hit API again
      await platformManager.getPlatformStats('youtube', 'test-channel-id');
      
      expect(platformManager.services.youtube.getChannelStats).toHaveBeenCalledTimes(2);
    });
  });

  describe('Analytics Calculation', () => {
    test('should calculate analytics from platform stats', async () => {
      const platformStats = [
        {
          name: 'YouTube',
          subscribers: 1000,
          revenue: 250,
          growth: 5.2
        },
        {
          name: 'Twitch',
          followers: 500,
          revenue: 150,
          growth: 3.8
        }
      ];

      const analytics = await platformManager.calculateAnalytics(platformStats);
      
      expect(analytics).toHaveProperty('totalRevenue', 400);
      expect(analytics).toHaveProperty('totalGrowth');
      expect(analytics).toHaveProperty('topPlatform');
      expect(analytics).toHaveProperty('monthlyTrend');
      expect(analytics).toHaveProperty('platformBreakdown');
    });

    test('should handle zero revenue in analytics', async () => {
      const platformStats = [
        {
          name: 'YouTube',
          subscribers: 1000,
          revenue: 0,
          growth: 0
        },
        {
          name: 'Twitch',
          followers: 500,
          revenue: 0,
          growth: 0
        }
      ];

      const analytics = await platformManager.calculateAnalytics(platformStats);
      
      expect(analytics.totalRevenue).toBe(0);
      expect(analytics.platformBreakdown).toBeDefined();
    });
  });

  describe('Fallback Data', () => {
    test('should return fallback data for YouTube', () => {
      const fallbackData = platformManager.getFallbackData('youtube');
      
      expect(fallbackData).toHaveProperty('name', 'YouTube');
      expect(fallbackData).toHaveProperty('subscribers', 0);
      expect(fallbackData).toHaveProperty('revenue', 0);
    });

    test('should return fallback data for Twitch', () => {
      const fallbackData = platformManager.getFallbackData('twitch');
      
      expect(fallbackData).toHaveProperty('name', 'Twitch');
      expect(fallbackData).toHaveProperty('followers', 0);
      expect(fallbackData).toHaveProperty('revenue', 0);
    });

    test('should return fallback data for TikTok', () => {
      const fallbackData = platformManager.getFallbackData('tiktok');
      
      expect(fallbackData).toHaveProperty('name', 'TikTok');
      expect(fallbackData).toHaveProperty('followers', 0);
      expect(fallbackData).toHaveProperty('revenue', 0);
    });

    test('should return YouTube fallback for unknown platform', () => {
      const fallbackData = platformManager.getFallbackData('unknown');
      
      expect(fallbackData).toHaveProperty('name', 'YouTube');
    });
  });

  describe('Cache Management', () => {
    test('should clear cache', () => {
      // Add some data to cache
      platformManager.cache.set('test_key', { data: 'test', expiry: Date.now() + 1000 });
      expect(platformManager.cache.size).toBe(1);
      
      platformManager.clearCache();
      expect(platformManager.cache.size).toBe(0);
    });

    test('should get cache stats', () => {
      // Add some data to cache
      platformManager.cache.set('test_key1', { data: 'test1', expiry: Date.now() + 1000 });
      platformManager.cache.set('test_key2', { data: 'test2', expiry: Date.now() + 1000 });
      
      const stats = platformManager.getCacheStats();
      
      expect(stats.size).toBe(2);
      expect(stats.entries).toContain('test_key1');
      expect(stats.entries).toContain('test_key2');
    });
  });
});
