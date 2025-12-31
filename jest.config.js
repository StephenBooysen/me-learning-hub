module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'electron/app/js/**/*.js',
    '!**/*.test.js',
    '!**/node_modules/**'
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/test/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/electron/node_modules/'
  ],
  coverageThreshold: {
    global: {
      statements: 15,
      branches: 10,
      functions: 15,
      lines: 15
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/electron/app/js/$1'
  },
  verbose: true
};
