import { jest } from '@jest/globals';

// Mock pg Pool before importing the service
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
    end: jest.fn()
  }))
}));

// Mock googleapis
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn(),
        refreshAccessToken: jest.fn()
      }))
    }
  }
}));

// Mock axios
jest.mock('axios');

// Import after mocking
import TokenManager from '../../services/tokenManager.js';

describe('Token Manager', () => {
  let tokenManager;
  let mockPool;
  let mockGoogle;
  let mockAxios;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked pool instance
    const { Pool } = require('pg');
    mockPool = new Pool();
    
    // Mock googleapis
    mockGoogle = require('googleapis').google;
    
    // Mock axios
    mockAxios = require('axios');
    
    // Create token manager instance
    tokenManager = new TokenManager();
    tokenManager.pool = mockPool;
  });

  describe('Token Validation', () => {
    test('should validate non-expired token', () => {
      const tokenData = {
        expires_at: new Date(Date.now() + 3600000) // 1 hour from now
      };
      
      const result = tokenManager.isTokenExpired(tokenData);
      
      expect(result).toBe(false);
    });

    test('should reject expired token', () => {
      const tokenData = {
        expires_at: new Date(Date.now() - 3600000) // 1 hour ago
      };
      
      const result = tokenManager.isTokenExpired(tokenData);
      
      expect(result).toBe(true);
    });

    test('should reject null token data', () => {
      const tokenData = null;
      
      const result = tokenManager.isTokenExpired(tokenData);
      
      expect(result).toBe(true);
    });

    test('should reject token without expires_at', () => {
      const tokenData = {};
      
      const result = tokenManager.isTokenExpired(tokenData);
      
      expect(result).toBe(true);
    });
  });

  describe('Token Retrieval', () => {
    test('should retrieve valid token successfully', async () => {
      const userId = '1234567890';
      const platform = 'youtube';
      const mockToken = {
        user_id: userId,
        platform: platform,
        token_data: JSON.stringify({
          access_token: 'test-token',
          expires_at: new Date(Date.now() + 3600000) // 1 hour from now
        }),
        expires_at: new Date(Date.now() + 3600000) // 1 hour from now
      };
      
      mockPool.query.mockResolvedValueOnce({
        rows: [mockToken]
      });
      
      const result = await tokenManager.getValidToken(userId, platform);
      
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM user_tokens WHERE user_id = $1 AND platform = $2',
        [userId, platform]
      );
      expect(result).toEqual(mockToken);
    });

    test('should return null for expired token', async () => {
      const userId = '1234567890';
      const platform = 'youtube';
      const mockToken = {
        user_id: userId,
        platform: platform,
        token_data: JSON.stringify({
          access_token: 'test-token',
          expires_at: new Date(Date.now() - 3600000) // 1 hour ago
        }),
        expires_at: new Date(Date.now() - 3600000) // 1 hour ago
      };
      
      mockPool.query.mockResolvedValueOnce({
        rows: [mockToken]
      });
      
      const result = await tokenManager.getValidToken(userId, platform);
      
      expect(result).toBeNull();
    });

    test('should return null for non-existent token', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: []
      });
      
      const result = await tokenManager.getValidToken('1234567890', 'youtube');
      
      expect(result).toBeNull();
    });

    test('should handle database errors in token retrieval', async () => {
      const dbError = new Error('Database error');
      mockPool.query.mockRejectedValueOnce(dbError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await tokenManager.getValidToken('1234567890', 'youtube');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error getting token:',
        dbError
      );
      expect(result).toBeNull();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Token Storage', () => {
    test('should update token successfully', async () => {
      const userId = '1234567890';
      const platform = 'youtube';
      const tokenData = {
        access_token: 'test-token',
        expires_at: new Date()
      };
      
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1
      });

      await tokenManager.updateToken(userId, platform, tokenData);
      
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_tokens'),
        [userId, platform, JSON.stringify(tokenData)]
      );
    });

    test('should handle database errors in token update', async () => {
      const dbError = new Error('Database error');
      mockPool.query.mockRejectedValueOnce(dbError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await expect(tokenManager.updateToken('1234567890', 'youtube', {})).rejects.toThrow('Database error');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error updating token:',
        dbError
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Token Removal', () => {
    test('should remove token successfully', async () => {
      const userId = '1234567890';
      const platform = 'youtube';
      
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1
      });

      await tokenManager.removeToken(userId, platform);
      
      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM user_tokens WHERE user_id = $1 AND platform = $2',
        [userId, platform]
      );
    });

    test('should handle database errors in token removal', async () => {
      const dbError = new Error('Database error');
      mockPool.query.mockRejectedValueOnce(dbError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await tokenManager.removeToken('1234567890', 'youtube');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error removing token:',
        dbError
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('YouTube Token Refresh', () => {
    test('should refresh YouTube token successfully', async () => {
      const userId = '1234567890';
      const tokenData = {
        refresh_token: 'test-refresh-token',
        expires_at: new Date(Date.now() - 3600000) // Expired
      };
      
      const mockCredentials = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        scope: 'https://www.googleapis.com/auth/youtube.readonly',
        token_type: 'Bearer'
      };
      
      const mockOAuth2 = {
        setCredentials: jest.fn(),
        refreshAccessToken: jest.fn().mockResolvedValueOnce({
          credentials: mockCredentials
        })
      };
      
      mockGoogle.auth.OAuth2.mockReturnValueOnce(mockOAuth2);
      
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1
      });
      
      const result = await tokenManager.validateAndRefreshYouTubeToken(userId, tokenData);
      
      expect(mockOAuth2.refreshAccessToken).toHaveBeenCalled();
      expect(result).toEqual({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: expect.any(Date),
        scope: 'https://www.googleapis.com/auth/youtube.readonly',
        token_type: 'Bearer'
      });
    });

    test('should handle YouTube token refresh errors', async () => {
      const userId = '1234567890';
      const tokenData = {
        refresh_token: 'invalid-refresh-token',
        expires_at: new Date(Date.now() - 3600000) // Expired
      };
      
      const refreshError = new Error('Invalid refresh token');
      const mockOAuth2 = {
        setCredentials: jest.fn(),
        refreshAccessToken: jest.fn().mockRejectedValueOnce(refreshError)
      };
      
      mockGoogle.auth.OAuth2.mockReturnValueOnce(mockOAuth2);
      
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1
      });
      
      await expect(tokenManager.validateAndRefreshYouTubeToken(userId, tokenData))
        .rejects.toThrow('Token refresh failed - re-authentication required');
    });
  });

  describe('Twitch Token Refresh', () => {
    test('should refresh Twitch token successfully', async () => {
      const userId = '1234567890';
      const tokenData = {
        refresh_token: 'test-refresh-token',
        expires_at: new Date(Date.now() - 3600000) // Expired
      };
      
      const mockResponse = {
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600
        }
      };
      
      mockAxios.post.mockResolvedValueOnce(mockResponse);
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1
      });
      
      const result = await tokenManager.validateAndRefreshTwitchToken(userId, tokenData);
      
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://id.twitch.tv/oauth2/token',
        {
          grant_type: 'refresh_token',
          refresh_token: 'test-refresh-token',
          client_id: process.env.TWITCH_CLIENT_ID,
          client_secret: process.env.TWITCH_CLIENT_SECRET
        }
      );
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: expect.any(Date)
      });
    });

    test('should handle Twitch token refresh errors', async () => {
      const userId = '1234567890';
      const tokenData = {
        refresh_token: 'invalid-refresh-token',
        expires_at: new Date(Date.now() - 3600000) // Expired
      };
      
      const refreshError = new Error('Invalid refresh token');
      mockAxios.post.mockRejectedValueOnce(refreshError);
      
      mockPool.query.mockResolvedValueOnce({
        rowCount: 1
      });
      
      await expect(tokenManager.validateAndRefreshTwitchToken(userId, tokenData))
        .rejects.toThrow('Token refresh failed - re-authentication required');
    });
  });

  describe('Token Cleanup', () => {
    test('should cleanup expired tokens successfully', async () => {
      const mockTokens = [
        {
          user_id: 'user1',
          platform: 'youtube',
          token_data: JSON.stringify({
            expires_at: new Date(Date.now() - 3600000) // Expired
          })
        },
        {
          user_id: 'user2',
          platform: 'twitch',
          token_data: JSON.stringify({
            expires_at: new Date(Date.now() + 3600000) // Valid
          })
        }
      ];
      
      mockPool.query
        .mockResolvedValueOnce({ rows: mockTokens }) // First call for getting all tokens
        .mockResolvedValueOnce({ rowCount: 1 }) // Second call for removing expired token
        .mockResolvedValueOnce({ rowCount: 1 }); // Third call for removing expired token
      
      const result = await tokenManager.cleanupExpiredTokens();
      
      expect(result).toBe(1); // One expired token removed
    });

    test('should handle database errors in token cleanup', async () => {
      const dbError = new Error('Database error');
      mockPool.query.mockRejectedValueOnce(dbError);
      
      await expect(tokenManager.cleanupExpiredTokens()).rejects.toThrow('Database error');
    });
  });

  describe('Connected Platforms Update', () => {
    test('should update connected platforms successfully', async () => {
      const userId = '1234567890';
      
      // Mock getValidToken to return valid tokens for YouTube and Twitch
      jest.spyOn(tokenManager, 'getValidToken')
        .mockResolvedValueOnce({ platform: 'youtube' }) // YouTube token
        .mockResolvedValueOnce({ platform: 'twitch' }) // Twitch token
        .mockResolvedValueOnce(null); // TikTok token
      
      mockPool.query.mockResolvedValueOnce({ rowCount: 1 }); // Update user platforms
      
      const result = await tokenManager.updateConnectedPlatforms(userId);
      
      expect(result).toEqual(['youtube', 'twitch']);
      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE users SET connected_platforms = $1 WHERE id = $2',
        [JSON.stringify(['youtube', 'twitch']), userId]
      );
    });

    test('should handle errors in connected platforms update', async () => {
      const userId = '1234567890';
      const dbError = new Error('Database error');
      
      // Mock getValidToken to return valid tokens
      jest.spyOn(tokenManager, 'getValidToken')
        .mockResolvedValueOnce({ platform: 'youtube' })
        .mockResolvedValueOnce({ platform: 'twitch' })
        .mockResolvedValueOnce(null);
      
      mockPool.query.mockRejectedValueOnce(dbError);
      
      await expect(tokenManager.updateConnectedPlatforms(userId)).rejects.toThrow('Database error');
    });
  });

  describe('Database Connection', () => {
    test('should close database connection', async () => {
      await tokenManager.close();
      
      expect(mockPool.end).toHaveBeenCalled();
    });
  });
});
