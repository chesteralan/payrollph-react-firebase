import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  RateLimiter,
  authRateLimiter,
  apiRateLimiter,
  searchRateLimiter,
  importRateLimiter,
} from './rateLimiter'

describe('RateLimiter', () => {
  let limiter: RateLimiter

  beforeEach(() => {
    limiter = new RateLimiter(3, 1000) // 3 requests per second
  })

  it('should allow requests within limit', () => {
    expect(limiter.isAllowed('key1')).toBe(true)
    expect(limiter.isAllowed('key1')).toBe(true)
    expect(limiter.isAllowed('key1')).toBe(true)
  })

  it('should deny requests over limit', () => {
    limiter.isAllowed('key1')
    limiter.isAllowed('key1')
    limiter.isAllowed('key1')
    expect(limiter.isAllowed('key1')).toBe(false)
  })

  it('should track different keys separately', () => {
    limiter.isAllowed('key1')
    limiter.isAllowed('key1')
    limiter.isAllowed('key1')
    expect(limiter.isAllowed('key1')).toBe(false)
    expect(limiter.isAllowed('key2')).toBe(true)
  })

  it('should reset correctly', () => {
    limiter.isAllowed('key1')
    limiter.isAllowed('key1')
    limiter.isAllowed('key1')
    expect(limiter.isAllowed('key1')).toBe(false)

    limiter.reset('key1')
    expect(limiter.isAllowed('key1')).toBe(true)
  })

  it('should clear all entries', () => {
    limiter.isAllowed('key1')
    limiter.isAllowed('key2')
    limiter.clear()
    expect(limiter.isAllowed('key1')).toBe(true)
    expect(limiter.isAllowed('key2')).toBe(true)
  })

  it('should report remaining requests', () => {
    expect(limiter.getRemainingRequests('key1')).toBe(3)
    limiter.isAllowed('key1')
    expect(limiter.getRemainingRequests('key1')).toBe(2)
    limiter.isAllowed('key1')
    limiter.isAllowed('key1')
    expect(limiter.getRemainingRequests('key1')).toBe(0)
  })

  it('should reset after window expires', async () => {
    expect(limiter.isAllowed('key1')).toBe(true)
    expect(limiter.isAllowed('key1')).toBe(true)
    expect(limiter.isAllowed('key1')).toBe(true)
    expect(limiter.isAllowed('key1')).toBe(false)

    await new Promise(resolve => setTimeout(resolve, 1100))

    expect(limiter.isAllowed('key1')).toBe(true)
  })
})

describe('Pre-configured limiters', () => {
  it('should have correct auth limiter config', () => {
    // Auth limiter allows 5 requests per 60 seconds
    expect(authRateLimiter.isAllowed('test')).toBe(true)
  })

  it('should have correct API limiter config', () => {
    expect(apiRateLimiter.isAllowed('test')).toBe(true)
  })
})
