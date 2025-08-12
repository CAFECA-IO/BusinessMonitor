import type { Config } from 'jest';

const transformConfig: [string, unknown] = ['ts-jest', { useESM: true }];

const common: Config = {
  transform: { '^.+\\.(ts|tsx)$': transformConfig },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  setupFiles: ['dotenv/config'],
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
      testMatch: [
        '**/__tests__/unit/**/*.server.test.ts', // Info: (20250812 - Tzuhan) 單元（不連 DB）
        '**/__tests__/integration/**/*.server.test.ts', // Info: (20250812 - Tzuhan) 整合（Supertest + DB）
        '**/__tests__/lib/**/*.test.ts',
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.server.ts'],
      ...common,
      coverageThreshold: {
        global: { branches: 70, functions: 80, lines: 85, statements: 85 },
      },
    },
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/**/*.client.test.tsx'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.client.ts'],
      ...common,
      coverageThreshold: {
        global: { branches: 50, functions: 60, lines: 70, statements: 70 },
      },
    },
  ],
};

export default config;
