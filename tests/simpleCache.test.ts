// tests/simpleCache.test.ts
import { simpleCache } from '../src/lib/simpleCache'

// Mock básico para testes sem dependência externa
const mockTest = {
  describe: (name: string, fn: () => void) => {
    console.log(`\n--- ${name} ---`)
    fn()
  },
  it: (name: string, fn: () => void) => {
    console.log(`  ✓ ${name}`)
    try {
      fn()
      console.log(`    PASS`)
    } catch (error) {
      console.log(`    FAIL: ${error}`)
    }
  },
  expect: (actual: any) => ({
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`)
      }
    },
    toBeNull: () => {
      if (actual !== null) {
        throw new Error(`Expected null, got ${actual}`)
      }
    }
  }),
  beforeEach: (fn: () => void) => {
    console.log('  Setup...')
    fn()
  }
}

// Reset cache before each test
mockTest.beforeEach(() => {
  simpleCache.clear()
})

mockTest.describe('SimpleCache', () => {
  mockTest.it('set and get should store and return values', () => {
    simpleCache.set('key', 'value')
    mockTest.expect(simpleCache.get('key')).toBe('value')
  })

  mockTest.it('should respect TTL', () => {
    simpleCache.set('k', 'v', 1000)
    
    // Simulate time passing
    setTimeout(() => {
      mockTest.expect(simpleCache.get('k')).toBe('v')
    }, 500)
    
    setTimeout(() => {
      mockTest.expect(simpleCache.get('k')).toBeNull()
    }, 1500)
  })

  mockTest.it('delete should remove a single entry', () => {
    simpleCache.set('key', 'value')
    simpleCache.delete('key')
    mockTest.expect(simpleCache.get('key')).toBeNull()
  })
})