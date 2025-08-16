import dotenv from 'dotenv';
import path from 'path';
import { spawn } from 'child_process';

// Load test environment variables
dotenv.config({ path: path.join(process.cwd(), 'env.test') });

// Set test environment
process.env.NODE_ENV = 'test';

// Global variables for E2E tests
global.e2eUtils = {
  serverProcess: null,
  baseUrl: 'http://localhost:4001', // Different port for E2E tests
  
  // Start test server
  startServer: async () => {
    return new Promise((resolve, reject) => {
      global.e2eUtils.serverProcess = spawn('node', ['server.js'], {
        cwd: process.cwd(),
        env: { ...process.env, PORT: '4001' },
        stdio: 'pipe'
      });

      let output = '';
      
      global.e2eUtils.serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('Creator Dashboard Backend running')) {
          resolve();
        }
      });

      global.e2eUtils.serverProcess.stderr.on('data', (data) => {
        console.error('Server error:', data.toString());
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!output.includes('Creator Dashboard Backend running')) {
          reject(new Error('Server failed to start within 10 seconds'));
        }
      }, 10000);
    });
  },

  // Stop test server
  stopServer: async () => {
    if (global.e2eUtils.serverProcess) {
      global.e2eUtils.serverProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 1000));
      global.e2eUtils.serverProcess = null;
    }
  },

  // Wait for server to be ready
  waitForServer: async () => {
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${global.e2eUtils.baseUrl}/api/health`);
        if (response.ok) {
          return true;
        }
      } catch (error) {
        // Server not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Server not ready after 30 seconds');
  },

  // Generate test data
  generateTestUser: () => ({
    email: `e2e-test-${Date.now()}@example.com`,
    password: 'e2etestpassword123'
  }),

  // Clean up test data
  cleanupTestData: async () => {
    // This would clean up any test data created during tests
    // Implementation depends on your database setup
  }
};

// Global setup and teardown
beforeAll(async () => {
  await global.e2eUtils.startServer();
  await global.e2eUtils.waitForServer();
});

afterAll(async () => {
  await global.e2eUtils.cleanupTestData();
  await global.e2eUtils.stopServer();
});

// Suppress console logs during E2E tests
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
