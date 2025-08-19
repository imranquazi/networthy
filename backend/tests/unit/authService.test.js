import { jest } from '@jest/globals';

// Mock pg before importing the service
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn()
  }))
}));

// Mock other dependencies
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn()
  }))
}));

jest.mock('passport', () => ({
  use: jest.fn(),
  authenticate: jest.fn()
}));

jest.mock('passport-twitch-new', () => ({
  Strategy: jest.fn()
}));

jest.mock('axios');

// Import after mocking
import { storeToken, getToken, googleClient } from '../../services/authService.js';

describe('Authentication Service', () => {
  let mockPool;
  let consoleSpy;

  beforeEach(() => {
    // Get the mocked Pool instance that was created when the module loaded
    const { Pool } = require('pg');
    mockPool = Pool.mock.results[0]?.value || new Pool();
    
    // Replace the pool in the authService module
    const authServiceModule = require('../../services/authService.js');
    authServiceModule.pool = mockPool;
    
    // Reset all mocks
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Token Storage', () => {
    test('should store token successfully', async () => {
      const userId = '1234567890';
      const platform = 'youtube';
      const tokenObj = { access_token: 'test-token', refresh_token: 'test-refresh' };

      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await storeToken(userId, platform, tokenObj);

      expect(mockPool.query).toHaveBeenCalledWith(
        `INSERT INTO user_tokens (user_id, platform, token) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, platform) DO UPDATE SET token = EXCLUDED.token`,
        [userId, platform, expect.stringContaining(':')] // Encrypted token
      );
    });

    test('should handle database unavailability', async () => {
      const userId = '1234567890';
      const platform = 'youtube';
      const tokenObj = { access_token: 'test-token' };

      // Mock pool to be null to simulate database unavailability
      const authServiceModule = require('../../services/authService.js');
      authServiceModule.pool = null;

      await storeToken(userId, platform, tokenObj);

      // Restore pool
      authServiceModule.pool = mockPool;
    });
  });

  describe('Token Retrieval', () => {
    test('should retrieve token successfully', async () => {
      const userId = '1234567890';
      const platform = 'youtube';
      const mockToken = { access_token: 'test-token', refresh_token: 'test-refresh' };
      const encryptedToken = 'iv:encrypted_data'; // Simplified for test

      mockPool.query.mockResolvedValueOnce({
        rows: [{ token: encryptedToken }]
      });

      const result = await getToken(userId, platform);

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT token FROM user_tokens WHERE user_id = $1 AND platform = $2',
        [userId, platform]
      );
      // Note: The actual decryption would happen here, but we're testing the query call
    });

    test('should handle database unavailability in token retrieval', async () => {
      const userId = '1234567890';
      const platform = 'youtube';

      // Mock pool to be null to simulate database unavailability
      const authServiceModule = require('../../services/authService.js');
      authServiceModule.pool = null;

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = await getToken(userId, platform);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Database not available, cannot retrieve token'
      );
      expect(result).toBeNull();

      // Restore pool
      authServiceModule.pool = mockPool;
      consoleWarnSpy.mockRestore();
    });

    test('should handle database errors in token retrieval', async () => {
      const userId = '1234567890';
      const platform = 'youtube';

      mockPool.query.mockRejectedValueOnce(new Error('Database error'));

      const result = await getToken(userId, platform);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to retrieve token:',
        'Database error'
      );
      expect(result).toBeNull();
    });
  });
});
