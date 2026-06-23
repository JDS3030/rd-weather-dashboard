/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/utils/logger.js',
  ],
  testMatch: ['**/__tests__/**/*.test.js'],
  clearMocks: true,
  testTimeout: 10000,
};
