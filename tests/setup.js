// Jest setup file
global.console = {
  ...console
  // Uncomment to ignore specific log levels
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Clean up temp files after tests
afterEach(() => {
  // Add any cleanup logic here if needed
});
