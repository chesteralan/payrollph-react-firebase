import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

export interface AuditEntry {
  id: string
  userId: string
  userName: string
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'lock' | 'unlock' | 'publish' | 'import' | 'export'
  module: string
  description: string
  entityId?: string
  entityType?: string
  metadata?: Record<string, unknown>
  timestamp: Date
}

export const logAudit = async (data: Omit<AuditEntry, 'id' | 'timestamp'>) => {
  try {
    await addDoc(collection(db, 'system_audit'), {
      ...data,
      timestamp: serverTimestamp()
    })
  } catch (error) {
    console.error('Failed to log audit entry:', error)
  }
}

export const fetchAuditLogs = async (options?: { limit?: number; module?: string; userId?: string }) => {
  const q = query(
    collection(db, 'system_audit'),
    orderBy('timestamp', 'desc'),
    limit(options?.limit || 100)
  )
  const snap = await getDocs(q)
  const logs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as AuditEntry[]

  if (options?.module) {
    return logs.filter(l => l.module === options.module)
  }
  if (options?.userId) {
    return logs.filter(l => l.userId === options.userId)
  }
  return logs
}
