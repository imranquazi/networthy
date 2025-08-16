import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.join(process.cwd(), 'env.test') });

// Set test environment
process.env.NODE_ENV = 'test';

// Global test utilities
global.testUtils = {
  // Generate test user data
  generateTestUser: () => ({
    email: `test-${Date.now()}@example.com`,
    password: 'testpassword123',
    platforms: []
  }),

  // Generate test platform data
  generateTestPlatform: (platform = 'youtube') => ({
    name: platform,
    identifier: `test-${platform}-${Date.now()}`,
    stats: {
      followers: Math.floor(Math.random() * 10000),
      views: Math.floor(Math.random() * 100000),
      revenue: Math.floor(Math.random() * 1000)
    }
  }),

  // Generate test token
  generateTestToken: (email = 'test@example.com') => {
    const timestamp = Date.now();
    const tokenData = `${email}:${timestamp}`;
    return Buffer.from(tokenData).toString('base64');
  },

  // Wait utility
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Suppress console logs during tests unless explicitly enabled
const originalLog = console.log;
const originalError = console.error;

beforeAll(() => {
  if (process.env.TEST_VERBOSE !== 'true') {
    console.log = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  console.log = originalLog;
  console.error = originalError;
});
