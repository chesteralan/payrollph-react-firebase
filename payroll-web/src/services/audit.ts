import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { UserAccount } from '../types'

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'lock'
  | 'unlock'
  | 'publish'
  | 'import'
  | 'export'
  | 'view'
  | 'change_password'
  | 'reset_password'
  | 'clone'
  | 'bulk_update'
  | 'bulk_delete'
  | 'restore'
  | 'session_timeout'
  | 'permission_denied'

export interface AuditEntry {
  id: string
  userId: string
  userName: string
  action: AuditAction
  module: string
  description: string
  entityId?: string
  entityType?: string
  metadata?: {
    companyId?: string
    companyName?: string
    previousValue?: unknown
    newValue?: unknown
    ipAddress?: string
    userAgent?: string
    requestId?: string
    [key: string]: unknown
  }
  timestamp: Date
}

export const logAudit = async (
  data: Omit<AuditEntry, 'id' | 'timestamp'>
): Promise<void> => {
  try {
    const metadata = {
      ...data.metadata,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp_ms: Date.now(),
    }

    await addDoc(collection(db, 'system_audit'), {
      ...data,
      metadata,
      timestamp: serverTimestamp(),
    })
  } catch (error) {
    console.error('Failed to log audit entry:', error)
  }
}

export const fetchAuditLogs = async (options?: {
  limit?: number
  module?: string
  userId?: string
  action?: AuditAction
  entityId?: string
  startDate?: Date
  endDate?: Date
}) => {
  const q = query(
    collection(db, 'system_audit'),
    orderBy('timestamp', 'desc'),
    limit(options?.limit || 100)
  )

  const snap = await getDocs(q)
  let logs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as unknown as AuditEntry[]

  if (options?.module) {
    logs = logs.filter(l => l.module === options.module)
  }
  if (options?.userId) {
    logs = logs.filter(l => l.userId === options.userId)
  }
  if (options?.action) {
    logs = logs.filter(l => l.action === options.action)
  }
  if (options?.entityId) {
    logs = logs.filter(l => l.entityId === options.entityId)
  }
  if (options?.startDate) {
    logs = logs.filter(l => new Date(l.timestamp) >= options.startDate!)
  }
  if (options?.endDate) {
    logs = logs.filter(l => new Date(l.timestamp) <= options.endDate!)
  }

  return logs
}

export const getAuditStats = async (module?: string): Promise<Record<AuditAction, number>> => {
  const logs = await fetchAuditLogs({ limit: 1000, module })
  const stats: Record<string, number> = {}

  logs.forEach(log => {
    stats[log.action] = (stats[log.action] || 0) + 1
  })

  return stats as Record<AuditAction, number>
}

// Helper functions for common audit actions
export const auditCreate = (user: UserAccount | null, module: string, entityId: string, entityType: string, details?: string, metadata?: Record<string, unknown>) =>
  logAudit({
    userId: user?.id || 'unknown',
    userName: user?.displayName || user?.email || 'Unknown',
    action: 'create',
    module,
    description: details || `Created ${entityType} (${entityId})`,
    entityId,
    entityType,
    metadata,
  })

export const auditUpdate = (user: UserAccount | null, module: string, entityId: string, entityType: string, previousValue: unknown, newValue: unknown, details?: string, metadata?: Record<string, unknown>) =>
  logAudit({
    userId: user?.id || 'unknown',
    userName: user?.displayName || user?.email || 'Unknown',
    action: 'update',
    module,
    description: details || `Updated ${entityType} (${entityId})`,
    entityId,
    entityType,
    metadata: {
      ...metadata,
      previousValue,
      newValue,
    },
  })

export const auditDelete = (user: UserAccount | null, module: string, entityId: string, entityType: string, details?: string, metadata?: Record<string, unknown>) =>
  logAudit({
    userId: user?.id || 'unknown',
    userName: user?.displayName || user?.email || 'Unknown',
    action: 'delete',
    module,
    description: details || `Deleted ${entityType} (${entityId})`,
    entityId,
    entityType,
    metadata,
  })

export const auditLogin = (user: UserAccount | null, method: string = 'email/password') =>
  logAudit({
    userId: user?.id || 'unknown',
    userName: user?.displayName || user?.email || 'Unknown',
    action: 'login',
    module: 'auth',
    description: `User logged in via ${method}`,
    metadata: { method },
  })

export const auditLogout = (user: UserAccount | null) =>
  logAudit({
    userId: user?.id || 'unknown',
    userName: user?.displayName || user?.email || 'Unknown',
    action: 'logout',
    module: 'auth',
    description: 'User logged out',
  })

export const auditSessionTimeout = (user: UserAccount | null) =>
  logAudit({
    userId: user?.id || 'unknown',
    userName: user?.displayName || user?.email || 'Unknown',
    action: 'session_timeout',
    module: 'auth',
    description: 'Session timed out due to inactivity',
  })

export const auditPermissionDenied = (user: UserAccount | null, module: string, action: string) =>
  logAudit({
    userId: user?.id || 'unknown',
    userName: user?.displayName || user?.email || 'Unknown',
    action: 'permission_denied',
    module,
    description: `Permission denied for ${action} in ${module}`,
    metadata: { attemptedAction: action },
  })

export const auditBulkOperation = (user: UserAccount | null, module: string, action: 'bulk_update' | 'bulk_delete', count: number, entityType: string, metadata?: Record<string, unknown>) =>
  logAudit({
    userId: user?.id || 'unknown',
    userName: user?.displayName || user?.email || 'Unknown',
    action,
    module,
    description: `${action === 'bulk_update' ? 'Updated' : 'Deleted'} ${count} ${entityType} records`,
    metadata: {
      ...metadata,
      count,
      entityType,
    },
  })
