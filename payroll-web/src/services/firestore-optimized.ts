// Optimized Firestore service with caching and query optimization
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  type QueryConstraint,
  type Query,
  type DocumentData,
  type FirestoreError,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import type { CollectionName } from './firestore'

// In-memory cache with TTL
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class FirestoreCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  invalidate(keyPattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

export const cache = new FirestoreCache()

// Optimized query builder with automatic caching
export async function optimizedQuery<T>(
  collectionName: CollectionName,
  constraints: QueryConstraint[] = [],
  options?: {
    useCache?: boolean
    cacheTTL?: number
    cacheKey?: string
  }
): Promise<T[]> {
  const {
    useCache = true,
    cacheTTL,
    cacheKey = `${collectionName}:${JSON.stringify(constraints)}`,
  } = options || {}

  // Check cache first
  if (useCache) {
    const cached = cache.get<T[]>(cacheKey)
    if (cached) return cached
  }

  // Build and execute query
  const q = constraints.length > 0
    ? query(collection(db, collectionName), ...constraints)
    : collection(db, collectionName)

  const snapshot = await getDocs(q)
  const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as T[]

  // Cache results
  if (useCache) {
    cache.set(cacheKey, results, cacheTTL)
  }

  return results
}

// Optimized single document fetch with caching
export async function optimizedGetById<T>(
  collectionName: CollectionName,
  id: string,
  useCache: boolean = true
): Promise<T | null> {
  const cacheKey = `${collectionName}:${id}`

  if (useCache) {
    const cached = cache.get<T>(cacheKey)
    if (cached) return cached
  }

  const docRef = doc(db, collectionName, id)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) return null

  const data = { id: docSnap.id, ...docSnap.data() } as T

  if (useCache) {
    cache.set(cacheKey, data)
  }

  return data
}

// Batch operations with cache invalidation
export async function optimizedCreate<T extends Record<string, unknown>>(
  collectionName: CollectionName,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Invalidate collection cache
  cache.invalidate(collectionName)

  return docRef.id
}

export async function optimizedUpdate<T extends Record<string, unknown>>(
  collectionName: CollectionName,
  id: string,
  data: Partial<Omit<T, 'id' | 'createdAt'>>,
): Promise<void> {
  const docRef = doc(db, collectionName, id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })

  // Invalidate specific caches
  cache.invalidate(collectionName)
  cache.invalidate(`${collectionName}:${id}`)
}

export async function optimizedDelete(
  collectionName: CollectionName,
  id: string,
): Promise<void> {
  const docRef = doc(db, collectionName, id)
  await deleteDoc(docRef)

  // Invalidate caches
  cache.invalidate(collectionName)
  cache.invalidate(`${collectionName}:${id}`)
}

// Query optimization helpers
export const QueryOptimizer = {
  // Create compound queries with proper indexing hints
  withCompanyAndStatus: (
    companyId: string,
    isActive: boolean = true
  ): QueryConstraint[] => [
    where('companyId', '==', companyId),
    where('isActive', '==', isActive),
  ],

  // Optimize date range queries
  withDateRange: (
    field: string,
    startDate?: Date,
    endDate?: Date
  ): QueryConstraint[] => {
    const constraints: QueryConstraint[] = []
    if (startDate) {
      constraints.push(where(field, '>=', startDate))
    }
    if (endDate) {
      constraints.push(where(field, '<=', endDate))
    }
    return constraints
  },

  // Optimize with pagination
  withPagination: (
    page: number,
    pageSize: number,
    orderField: string = 'createdAt'
  ): QueryConstraint[] => [
    orderBy(orderField, 'desc'),
    limit(pageSize),
  ],

  // Batch fetch by IDs (reduces number of queries)
  batchFetchByIds: async <T>(
    collectionName: CollectionName,
    ids: string[]
  ): Promise<T[]> => {
    if (ids.length === 0) return []

    // Firestore 'in' queries limited to 30 items
    const batches: T[][] = []
    for (let i = 0; i < ids.length; i += 30) {
      const batchIds = ids.slice(i, i + 30)

      // Note: Firestore doesn't support 'in' with document IDs directly
      // We need to fetch each document individually or use a different approach
      const promises = batchIds.map(id =>
        optimizedGetById<T>(collectionName, id)
      )
      const results = await Promise.all(promises)
      batches.push(results.filter((r): r is T => r !== null))
    }

    return batches.flat()
  },
}

// Index management helper
export const FirestoreIndexes = {
  // These composite indexes need to be created in Firebase Console
  requiredIndexes: [
    {
      collection: 'employees',
      fields: [
        { field: 'companyId', order: 'ASCENDING' },
        { field: 'isActive', order: 'ASCENDING' },
        { field: 'createdAt', order: 'DESCENDING' },
      ],
    },
    {
      collection: 'payrolls',
      fields: [
        { field: 'companyId', order: 'ASCENDING' },
        { field: 'month', order: 'ASCENDING' },
        { field: 'year', order: 'ASCENDING' },
      ],
    },
    {
      collection: 'payroll_employees',
      fields: [
        { field: 'payrollId', order: 'ASCENDING' },
        { field: 'nameId', order: 'ASCENDING' },
      ],
    },
    {
      collection: 'system_audit',
      fields: [
        { field: 'userId', order: 'ASCENDING' },
        { field: 'timestamp', order: 'DESCENDING' },
      ],
    },
    {
      collection: 'user_restrictions',
      fields: [
        { field: 'userId', order: 'ASCENDING' },
      ],
    },
  ],

  // Generate firebase-indexes.json content
  generateIndexesJSON: (): string => {
    return JSON.stringify(
      {
        indexes: FirestoreIndexes.requiredIndexes.map(idx => ({
          collectionGroup: idx.collection,
          queryScope: 'COLLECTION',
          fields: idx.fields,
        })),
        fieldOverrides: [],
      },
      null,
      2
    )
  },
}

// Export optimized versions alongside original functions
export {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
}

export default {
  optimizedQuery,
  optimizedGetById,
  optimizedCreate,
  optimizedUpdate,
  optimizedDelete,
  QueryOptimizer,
  FirestoreIndexes,
  cache,
}
