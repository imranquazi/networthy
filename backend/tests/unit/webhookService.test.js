import { jest } from '@jest/globals';

// Mock pg before importing the service
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn()
  }))
}));

// Mock crypto
jest.mock('crypto', () => ({
  createHmac: jest.fn(),
  timingSafeEqual: jest.fn()
}));

// Import after mocking
import { WebhookService } from '../../services/webhookService.js';

describe('Webhook Service', () => {
  let webhookService;
  let mockPool;
  let mockCrypto;

  beforeEach(() => {
    // Get the mocked Pool instance that was created when the module loaded
    const { Pool } = require('pg');
    mockPool = Pool.mock.results[0]?.value || new Pool();
    
    // Create a new instance of WebhookService
    webhookService = new WebhookService();
    
    // Replace the pool in the webhookService instance
    webhookService.pool = mockPool;
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock crypto functions
    mockCrypto = require('crypto');
  });

  describe('Signature Verification', () => {
    test('should verify valid signature', () => {
      const platform = 'youtube';
      const payload = 'test-payload';
      const timestamp = '1234567890';
      const signature = 'valid-signature';

      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid-signature')
      };
      mockCrypto.createHmac.mockReturnValue(mockHmac);
      mockCrypto.timingSafeEqual.mockReturnValue(true);

      const result = webhookService.verifySignature(platform, payload, signature, timestamp);

      expect(mockCrypto.createHmac).toHaveBeenCalledWith('sha256', webhookService.webhookSecrets[platform]);
      expect(mockHmac.update).toHaveBeenCalledWith(`${timestamp}.${payload}`);
      expect(mockHmac.digest).toHaveBeenCalledWith('hex');
      expect(mockCrypto.timingSafeEqual).toHaveBeenCalledWith(
        Buffer.from(signature, 'hex'),
        Buffer.from('valid-signature', 'hex')
      );
      expect(result).toBe(true);
    });

    test('should reject invalid signature', () => {
      const platform = 'youtube';
      const payload = 'test-payload';
      const timestamp = '1234567890';
      const signature = 'invalid-signature';

      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid-signature')
      };
      mockCrypto.createHmac.mockReturnValue(mockHmac);
      mockCrypto.timingSafeEqual.mockReturnValue(false);

      const result = webhookService.verifySignature(platform, payload, signature, timestamp);

      expect(result).toBe(false);
    });

    test('should handle missing webhook secret', () => {
      const platform = 'unknown';
      const payload = 'test-payload';
      const timestamp = '1234567890';
      const signature = 'test-signature';

      const result = webhookService.verifySignature(platform, payload, signature, timestamp);

      expect(result).toBe(false);
    });
  });

  describe('YouTube Webhook Processing', () => {
    test('should process YouTube webhook successfully', async () => {
      const payload = {
        channelId: 'test-channel-id',
        subscriberCount: 1000,
        viewCount: 50000,
        videoCount: 25
      };

      const mockUsers = [
        { id: 'user1', email: 'user1@example.com' },
        { id: 'user2', email: 'user2@example.com' }
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockUsers
      });

      const result = await webhookService.processYouTubeWebhook(payload);

      expect(mockPool.query).toHaveBeenCalledWith(
        `SELECT id, email FROM users 
         WHERE connected_platforms @> $1::jsonb`,
        [JSON.stringify([{"name": "youtube", "identifier": payload.channelId}])]
      );
      expect(result.success).toBe(true);
      expect(result.usersUpdated).toBe(2);
    });

    test('should handle YouTube webhook with no users', async () => {
      const payload = {
        channelId: 'test-channel-id',
        subscriberCount: 1000,
        viewCount: 50000,
        videoCount: 25
      };

      mockPool.query.mockResolvedValueOnce({
        rows: []
      });

      const result = await webhookService.processYouTubeWebhook(payload);

      expect(result.success).toBe(true);
      expect(result.usersUpdated).toBe(0);
    });

    test('should handle YouTube webhook processing errors', async () => {
      const payload = {
        channelId: 'test-channel-id',
        subscriberCount: 1000,
        viewCount: 50000,
        videoCount: 25
      };

      mockPool.query.mockRejectedValueOnce(new Error('Database error'));

      const result = await webhookService.processYouTubeWebhook(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('Twitch Webhook Processing', () => {
    test('should process Twitch webhook successfully', async () => {
      const payload = {
        broadcasterUserId: 'test-broadcaster-id',
        followerCount: 500,
        viewerCount: 100,
        isLive: true
      };

      const mockUsers = [
        { id: 'user1', email: 'user1@example.com' }
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockUsers
      });

      const result = await webhookService.processTwitchWebhook(payload);

      expect(mockPool.query).toHaveBeenCalledWith(
        `SELECT id, email FROM users 
         WHERE connected_platforms @> $1::jsonb`,
        [JSON.stringify([{"name": "twitch", "identifier": payload.broadcasterUserId}])]
      );
      expect(result.success).toBe(true);
      expect(result.usersUpdated).toBe(1);
    });

    test('should handle Twitch webhook processing errors', async () => {
      const payload = {
        broadcasterUserId: 'test-broadcaster-id',
        followerCount: 500,
        viewerCount: 100,
        isLive: true
      };

      mockPool.query.mockRejectedValueOnce(new Error('Database error'));

      const result = await webhookService.processTwitchWebhook(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('TikTok Webhook Processing', () => {
    test('should process TikTok webhook successfully', async () => {
      const payload = {
        userId: 'test-user-id',
        followerCount: 2000,
        videoCount: 50,
        likeCount: 10000
      };

      const mockUsers = [
        { id: 'user1', email: 'user1@example.com' }
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockUsers
      });

      const result = await webhookService.processTikTokWebhook(payload);

      expect(mockPool.query).toHaveBeenCalledWith(
        `SELECT id, email FROM users 
         WHERE connected_platforms @> $1::jsonb`,
        [JSON.stringify([{"name": "tiktok", "identifier": payload.userId}])]
      );
      expect(result.success).toBe(true);
      expect(result.usersUpdated).toBe(1);
    });

    test('should handle TikTok webhook processing errors', async () => {
      const payload = {
        userId: 'test-user-id',
        followerCount: 2000,
        videoCount: 50,
        likeCount: 10000
      };

      mockPool.query.mockRejectedValueOnce(new Error('Database error'));

      const result = await webhookService.processTikTokWebhook(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('WebSocket Management', () => {
    test('should add subscriber successfully', () => {
      const userId = 'test-user-id';
      const mockConnection = { 
        send: jest.fn(),
        readyState: 1 // WebSocket.OPEN
      };

      webhookService.addSubscriber(userId, mockConnection);

      expect(webhookService.subscribers.has(userId)).toBe(true);
      expect(webhookService.subscribers.get(userId).has(mockConnection)).toBe(true);
    });

    test('should remove subscriber successfully', () => {
      const userId = 'test-user-id';
      const mockConnection = { 
        send: jest.fn(),
        readyState: 1
      };

      webhookService.addSubscriber(userId, mockConnection);
      webhookService.removeSubscriber(userId, mockConnection);

      expect(webhookService.subscribers.has(userId)).toBe(false);
    });

    test('should broadcast updates to subscribers', () => {
      const userId = 'test-user-id';
      const mockConnection = { 
        send: jest.fn(),
        readyState: 1
      };
      const updates = [
        { userId, email: 'test@example.com', platform: 'youtube', data: { subscribers: 1000 } }
      ];

      webhookService.addSubscriber(userId, mockConnection);
      webhookService.broadcastUpdates(updates);

      expect(mockConnection.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'platform_update',
          userId: userId,
          platform: 'youtube',
          data: { subscribers: 1000 },
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Webhook Endpoints', () => {
    test('should get webhook endpoints', () => {
      const endpoints = webhookService.getWebhookEndpoints();

      expect(endpoints).toEqual({
        youtube: '/api/webhooks/youtube',
        twitch: '/api/webhooks/twitch',
        tiktok: '/api/webhooks/tiktok'
      });
    });

    test('should generate webhook URLs', () => {
      const baseUrl = 'https://example.com';
      const urls = webhookService.generateWebhookUrls(baseUrl);

      expect(urls).toEqual({
        youtube: `${baseUrl}/api/webhooks/youtube`,
        twitch: `${baseUrl}/api/webhooks/twitch`,
        tiktok: `${baseUrl}/api/webhooks/tiktok`
      });
    });
  });

  describe('Cache Management', () => {
    test('should update platform cache', () => {
      const updates = [
        { userId: 'user1', platform: 'youtube', data: { subscribers: 1000 } }
      ];

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      webhookService.updatePlatformCache(updates);

      expect(consoleSpy).toHaveBeenCalledWith('🔄 Updating platform cache with webhook data');
      
      consoleSpy.mockRestore();
    });
  });
});
