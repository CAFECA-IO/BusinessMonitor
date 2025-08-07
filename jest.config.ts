import type { Config } from 'jest';

const transformConfig: [string, unknown] = ['ts-jest', { useESM: true }];

const common: Config = {
  transform: { '^.+\\.(ts|tsx)$': transformConfig },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
};

const config: Config = {
  projects: [
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/**/*.server.test.ts', '**/__tests__/lib/**/*.test.ts'],
      ...common,
    },
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/**/*.client.test.tsx'],
      ...common,
    },
  ],
};

export default config;
