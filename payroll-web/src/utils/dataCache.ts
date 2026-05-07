import { useState, useCallback, useRef, useEffect } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface CacheOptions {
  ttl?: number
  maxEntries?: number
}

class DataCache {
  private store = new Map<string, CacheEntry<unknown>>()
  private defaultTTL: number
  private maxEntries: number

  constructor(options?: CacheOptions) {
    this.defaultTTL = options?.ttl ?? 5 * 60 * 1000
    this.maxEntries = options?.maxEntries ?? 100
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }

    return entry.data as T
  }

  set<T>(key: string, data: T, ttl?: number): void {
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value
      if (oldestKey) this.store.delete(oldestKey)
    }

    const expiresAt = Date.now() + (ttl ?? this.defaultTTL)
    this.store.set(key, { data, timestamp: Date.now(), expiresAt })
  }

  delete(key: string): boolean {
    return this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  has(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return false
    }
    return true
  }

  keys(): string[] {
    return Array.from(this.store.keys())
  }

  size(): number {
    return this.store.size
  }
}

export const cache = new DataCache()

export function useCache<T>(key: string, fetchFn: () => Promise<T>, options?: CacheOptions) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const fetchRef = useRef(fetchFn)

  useEffect(() => {
    fetchRef.current = fetchFn
  }, [fetchFn])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    const cached = cache.get<T>(key)
    if (cached) {
      setData(cached)
      setLoading(false)
      return cached
    }

    try {
      const result = await fetchRef.current()
      cache.set(key, result, options?.ttl)
      setData(result)
      return result
    } catch (e) {
      setError(e as Error)
      throw e
    } finally {
      setLoading(false)
    }
  }, [key, options?.ttl])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, loading, error, refresh }
}

export function useMultiCache<T>(keys: string[], fetchFn: (key: string) => Promise<T>, options?: CacheOptions) {
  const [results, setResults] = useState<Record<string, T | null>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      const newResults: Record<string, T | null> = {}

      await Promise.all(
        keys.map(async (key) => {
          const cached = cache.get<T>(key)
          if (cached) {
            newResults[key] = cached
          } else {
            try {
              const result = await fetchFn(key)
              cache.set(key, result, options?.ttl)
              newResults[key] = result
            } catch {
              newResults[key] = null
            }
          }
        })
      )

      setResults(newResults)
      setLoading(false)
    }

    fetchAll()
  }, [keys.join(','), fetchFn, options?.ttl])

  return { results, loading }
}
