export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: [
    '**/tests/e2e/**/*.js',
    '**/e2e/**/*.js'
  ],
  collectCoverageFrom: [
    'services/**/*.js',
    'server.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage/e2e',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.e2e.js'],
  testTimeout: 30000,
  verbose: true,
  maxWorkers: 1
};
