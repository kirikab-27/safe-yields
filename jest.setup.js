// Jest Setup File

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods in test environment
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  debug: jest.fn()
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Cleanup after all tests
afterAll(() => {
  jest.restoreAllMocks();
});