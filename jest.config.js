const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
  },
  // Allow ESM modules to be transformed (add @hubspot/api-client and its deps)
  transformIgnorePatterns: [
    '/node_modules/(?!(p-limit|yocto-queue|@hubspot/api-client)/)',
  ],
  transform: {
    '^.+\\.(ts|tsx|js)$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
};

module.exports = {
  projects: [
    {
      displayName: 'backend',
      testMatch: ['<rootDir>/__tests__/(lib|api)/**/*.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleNameMapper: {
        '^@/lib/(.*)$': '<rootDir>/lib/$1',
        '^@/components/(.*)$': '<rootDir>/components/$1',
      },
      transform: {
        '^.+\\.(ts|tsx|js)$': 'babel-jest',
      },
      transformIgnorePatterns: [
        '/node_modules/(?!(p-limit|yocto-queue|@hubspot/api-client)/)',
      ],
      moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
    },
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/__tests__/components/**/*.tsx'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleNameMapper: {
        '^@/lib/(.*)$': '<rootDir>/lib/$1',
        '^@/components/(.*)$': '<rootDir>/components/$1',
      },
      transform: {
        '^.+\\.(ts|tsx|js)$': 'babel-jest',
      },
      transformIgnorePatterns: [
        '/node_modules/(?!(p-limit|yocto-queue|@hubspot/api-client)/)',
      ],
      moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
    },
  ],
};
