import { jest } from '@jest/globals';

// Mock pg before importing the service
jest.doMock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn()
  }))
}));

// Mock crypto
jest.doMock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue(Buffer.from('test-salt')),
  pbkdf2Sync: jest.fn().mockReturnValue(Buffer.from('test-hash'))
}));

// Reset modules to ensure mocks are applied
jest.resetModules();

// Import after mocking
import { 
  createUser, 
  findUserByEmail, 
  findUserById, 
  verifyUser, 
  updateUserPlatforms, 
  getUserPlatforms 
} from '../../services/userService.js';

describe('User Service', () => {
  let mockPool;
  let consoleSpy;

  beforeEach(() => {
    // Get the mocked Pool instance that was created when the module loaded
    const { Pool } = require('pg');
    mockPool = Pool.mock.results[0]?.value || new Pool();
    
    // Reset all mocks
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('User Creation', () => {
    test('should create user successfully', async () => {
      const mockUser = {
        id: '1234567890',
        email: 'test@example.com',
        created_at: new Date()
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockUser]
      });

      const result = await createUser('test@example.com', 'password123');

      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email, created_at',
        [expect.any(String), 'test@example.com', '746573742d73616c74:746573742d68617368'] // Hashed password
      );
      expect(result).toEqual(mockUser);
    });

    test('should handle duplicate email error', async () => {
      const duplicateError = new Error('Duplicate email');
      duplicateError.code = '23505';

      mockPool.query.mockRejectedValueOnce(duplicateError);

      await expect(createUser('existing@example.com', 'password123'))
        .rejects.toThrow('User already exists');
    });

    test('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPool.query.mockRejectedValueOnce(dbError);

      await expect(createUser('test@example.com', 'password123'))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('User Lookup', () => {
    test('should find user by email successfully', async () => {
      const mockUser = {
        id: '1234567890',
        email: 'test@example.com',
        password_hash: 'test-salt:test-hash',
        created_at: new Date(),
        connected_platforms: ['youtube', 'twitch']
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockUser]
      });

      const result = await findUserByEmail('test@example.com');

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT id, email, password_hash, created_at, connected_platforms FROM users WHERE email = $1',
        ['test@example.com']
      );
      expect(result).toEqual(mockUser);
    });

    test('should return null for non-existent email', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: []
      });

      const result = await findUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    test('should handle database errors in findUserByEmail', async () => {
      const dbError = new Error('Database error');
      mockPool.query.mockRejectedValueOnce(dbError);

      const result = await findUserByEmail('test@example.com');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error finding user:',
        'Database error'
      );
      expect(result).toBeNull();
    });

    test('should find user by ID successfully', async () => {
      const mockUser = {
        id: '1234567890',
        email: 'test@example.com',
        password_hash: 'test-salt:test-hash',
        created_at: new Date(),
        connected_platforms: ['youtube', 'twitch']
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockUser]
      });

      const result = await findUserById('1234567890');

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT id, email, password_hash, created_at, connected_platforms FROM users WHERE id = $1',
        ['1234567890']
      );
      expect(result).toEqual(mockUser);
    });

    test('should return null for non-existent ID', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: []
      });

      const result = await findUserById('nonexistent-id');

      expect(result).toBeNull();
    });

    test('should handle database errors in findUserById', async () => {
      const dbError = new Error('Database error');
      mockPool.query.mockRejectedValueOnce(dbError);

      const result = await findUserById('1234567890');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error finding user by ID:',
        'Database error'
      );
      expect(result).toBeNull();
    });
  });

  describe('User Verification', () => {
    test('should verify valid credentials', async () => {
      const mockUser = {
        id: '1234567890',
        email: 'test@example.com',
        password_hash: 'test-salt:test-hash'
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockUser]
      });

      // Mock the verifyPassword function to return true
      const originalVerifyPassword = require('../../services/userService.js').verifyPassword;
      require('../../services/userService.js').verifyPassword = jest.fn().mockReturnValue(true);

      const result = await verifyUser('test@example.com', 'password123');

      expect(result).toEqual(mockUser);

      // Restore original function
      require('../../services/userService.js').verifyPassword = originalVerifyPassword;
    });

    test('should reject invalid password', async () => {
      const mockUser = {
        id: '1234567890',
        email: 'test@example.com',
        password_hash: 'test-salt:test-hash'
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockUser]
      });

      // Mock the verifyPassword function to return false
      const originalVerifyPassword = require('../../services/userService.js').verifyPassword;
      require('../../services/userService.js').verifyPassword = jest.fn().mockReturnValue(false);

      const result = await verifyUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();

      // Restore original function
      require('../../services/userService.js').verifyPassword = originalVerifyPassword;
    });

    test('should return null for non-existent user', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: []
      });

      const result = await verifyUser('nonexistent@example.com', 'password123');

      expect(result).toBeNull();
    });

    test('should handle database errors in verification', async () => {
      const dbError = new Error('Database error');
      mockPool.query.mockRejectedValueOnce(dbError);

      const result = await verifyUser('test@example.com', 'password123');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error verifying user:',
        'Database error'
      );
      expect(result).toBeNull();
    });
  });

  describe('Platform Management', () => {
    test('should update user platforms successfully', async () => {
      const platforms = ['youtube', 'twitch', 'tiktok'];

      mockPool.query.mockResolvedValueOnce({
        rows: []
      });

      const result = await updateUserPlatforms('1234567890', platforms);

      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE users SET connected_platforms = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [JSON.stringify(platforms), '1234567890']
      );
      expect(result).toBe(true);
    });

    test('should handle database errors in platform update', async () => {
      const dbError = new Error('Database error');
      mockPool.query.mockRejectedValueOnce(dbError);

      const result = await updateUserPlatforms('1234567890', ['youtube']);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error updating user platforms:',
        'Database error'
      );
      expect(result).toBe(false);
    });

    test('should get user platforms successfully', async () => {
      const platforms = ['youtube', 'twitch'];

      mockPool.query.mockResolvedValueOnce({
        rows: [{ connected_platforms: JSON.stringify(platforms) }]
      });

      const result = await getUserPlatforms('1234567890');

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT connected_platforms FROM users WHERE id = $1',
        ['1234567890']
      );
      expect(result).toEqual(platforms);
    });

    test('should return empty array for user with no platforms', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ connected_platforms: null }]
      });

      const result = await getUserPlatforms('1234567890');

      expect(result).toEqual([]);
    });

    test('should handle database errors in get user platforms', async () => {
      const dbError = new Error('Database error');
      mockPool.query.mockRejectedValueOnce(dbError);

      const result = await getUserPlatforms('1234567890');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error getting user platforms:',
        'Database error'
      );
      expect(result).toEqual([]);
    });
  });
});
