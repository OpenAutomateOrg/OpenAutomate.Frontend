// Jest setup file

// Mock window.location for tests
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'location', {
    value: {
      pathname: '/test-tenant/dashboard',
    },
    writable: true,
    configurable: true,
  })
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock