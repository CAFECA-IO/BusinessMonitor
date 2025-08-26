import type { Config } from 'jest';

const transformConfig: [string, unknown] = ['ts-jest', { useESM: true }];

const common: Config = {
  transform: { '^.+\\.(ts|tsx)$': transformConfig },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coveragePathIgnorePatterns: ['/node_modules/', '/src/types/', '/src/config/'],
};

const config: Config = {
  projects: [
    {
      displayName: 'server',
      testEnvironment: 'node',
      globalSetup: '<rootDir>/jest.global-setup.ts',
      globalTeardown: '<rootDir>/jest.global-teardown.ts',
      testMatch: ['**/__tests__/**/*.server.test.ts', '**/__tests__/lib/**/*.test.ts'],
      ...common,
      coverageThreshold: {
        global: { branches: 70, functions: 80, lines: 85, statements: 85 },
      },
    },
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/**/*.client.test.tsx'],
      ...common,
      coverageThreshold: {
        global: { branches: 50, functions: 60, lines: 70, statements: 70 },
      },
    },
  ],
};

export default config;
