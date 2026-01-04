/**
 * Vitest Setup File
 * Global setup for all tests
 */

import { afterEach, beforeAll, vi } from 'vitest';

// Mock Firebase
vi.mock('../firebase/config', () => ({
  db: {},
  auth: {},
  storage: {},
}));

// Setup globals
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks();
});

// Global test utilities
global.testTimeout = 30000;
