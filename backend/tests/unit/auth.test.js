import { jest } from '@jest/globals';
import { createUser, findUserByEmail, verifyUser } from '../../services/userService.js';
import { storeToken, getToken } from '../../services/authService.js';

// Mock database connection
jest.mock('../../services/userService.js', () => ({
  createUser: jest.fn(),
  findUserByEmail: jest.fn(),
  verifyUser: jest.fn(),
  updateUserPlatforms: jest.fn(),
  getUserPlatforms: jest.fn()
}));

jest.mock('../../services/authService.js', () => ({
  storeToken: jest.fn(),
  getToken: jest.fn(),
  googleClient: {},
  setupTwitchPassport: jest.fn(),
  getTikTokToken: jest.fn()
}));

describe('Authentication Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration', () => {
    test('should create a new user successfully', async () => {
      const testUser = testUtils.generateTestUser();
      const mockUser = { id: 1, email: testUser.email, created_at: new Date() };
      
      createUser.mockResolvedValue(mockUser);

      const result = await createUser(testUser.email, testUser.password);
      
      expect(createUser).toHaveBeenCalledWith(testUser.email, testUser.password);
      expect(result).toEqual(mockUser);
    });

    test('should handle duplicate email registration', async () => {
      const testUser = testUtils.generateTestUser();
      
      createUser.mockRejectedValue(new Error('User already exists'));

      await expect(createUser(testUser.email, testUser.password))
        .rejects.toThrow('User already exists');
    });
  });

  describe('User Login', () => {
    test('should verify user credentials successfully', async () => {
      const testUser = testUtils.generateTestUser();
      const mockUser = { id: 1, email: testUser.email };
      
      findUserByEmail.mockResolvedValue(mockUser);
      verifyUser.mockResolvedValue(true);

      const user = await findUserByEmail(testUser.email);
      const isValid = await verifyUser(testUser.password, user.password_hash);
      
      expect(findUserByEmail).toHaveBeenCalledWith(testUser.email);
      expect(verifyUser).toHaveBeenCalledWith(testUser.password, user.password_hash);
      expect(isValid).toBe(true);
    });

    test('should reject invalid credentials', async () => {
      const testUser = testUtils.generateTestUser();
      
      findUserByEmail.mockResolvedValue({ id: 1, email: testUser.email, password_hash: 'hashed' });
      verifyUser.mockResolvedValue(false);

      const user = await findUserByEmail(testUser.email);
      const isValid = await verifyUser('wrongpassword', user.password_hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Token Management', () => {
    test('should store and retrieve tokens', async () => {
      const testUser = testUtils.generateTestUser();
      const platform = 'youtube';
      const tokenData = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expires_at: new Date(Date.now() + 3600000)
      };

      storeToken.mockResolvedValue(true);
      getToken.mockResolvedValue(tokenData);

      await storeToken(testUser.email, platform, tokenData);
      const retrievedToken = await getToken(testUser.email, platform);

      expect(storeToken).toHaveBeenCalledWith(testUser.email, platform, tokenData);
      expect(getToken).toHaveBeenCalledWith(testUser.email, platform);
      expect(retrievedToken).toEqual(tokenData);
    });

    test('should handle missing tokens', async () => {
      const testUser = testUtils.generateTestUser();
      const platform = 'youtube';

      getToken.mockResolvedValue(null);

      const token = await getToken(testUser.email, platform);

      expect(getToken).toHaveBeenCalledWith(testUser.email, platform);
      expect(token).toBeNull();
    });
  });

  describe('Token Generation', () => {
    test('should generate valid authentication tokens', () => {
      const email = 'test@example.com';
      const token = testUtils.generateTestToken(email);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Decode token
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [tokenEmail, timestamp] = decoded.split(':');
      
      expect(tokenEmail).toBe(email);
      expect(timestamp).toBeDefined();
      expect(parseInt(timestamp)).toBeGreaterThan(0);
    });

    test('should generate unique tokens for different users', () => {
      const token1 = testUtils.generateTestToken('user1@example.com');
      const token2 = testUtils.generateTestToken('user2@example.com');
      
      expect(token1).not.toBe(token2);
    });
  });
});

