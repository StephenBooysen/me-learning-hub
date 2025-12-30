module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'electron/app/js/**/*.js',
    'extension/utils/**/*.js',
    '!**/*.test.js',
    '!**/node_modules/**'
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/electron/node_modules/'
  ],
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 50,
      functions: 50,
      lines: 50
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/electron/app/js/$1'
  },
  verbose: true
};
