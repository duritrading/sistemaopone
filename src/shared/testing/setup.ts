import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'

// Mock do crypto.randomUUID
beforeAll(() => {
  global.crypto = {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2, 11)
  } as any
})

// Cleanup after each test
afterEach(() => {
  // Reset all mocks
  vi.clearAllMocks()
})

// Global test utilities
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock do IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock do matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})