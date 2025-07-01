import { describe, it, expect, beforeEach, vi } from 'vitest'
import { simpleCache } from '../src/lib/simpleCache'

// Reset cache before each test
beforeEach(() => {
  simpleCache.clear()
  vi.useRealTimers()
  vi.setSystemTime(0)
})

describe('SimpleCache', () => {
  it('set and get should store and return values', () => {
    simpleCache.set('key', 'value')
    expect(simpleCache.get('key')).toBe('value')
  })

  it('should respect TTL', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    simpleCache.set('k', 'v', 1000)
    vi.setSystemTime(500)
    expect(simpleCache.get('k')).toBe('v')
    vi.setSystemTime(1500)
    expect(simpleCache.get('k')).toBeNull()
    vi.useRealTimers()
  })

  it('delete should remove a single entry', () => {
    simpleCache.set('key', 'value')
    simpleCache.delete('key')
    expect(simpleCache.get('key')).toBeNull()
  })

  it('clear should remove entries by pattern and completely', () => {
    simpleCache.set('a:1', 1)
    simpleCache.set('a:2', 2)
    simpleCache.set('b:1', 3)

    simpleCache.clear('a:')
    expect(simpleCache.get('a:1')).toBeNull()
    expect(simpleCache.get('a:2')).toBeNull()
    expect(simpleCache.get('b:1')).toBe(3)

    simpleCache.clear()
    expect(simpleCache.get('b:1')).toBeNull()
  })
})
