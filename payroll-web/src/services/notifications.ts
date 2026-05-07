// Approval Workflow & Notification Service
import { collection, addDoc, getDocs, query, where, updateDoc, orderBy, limit, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { UserAccount } from '../types'
import { auditCreate } from './audit'

export type NotificationType =
  | 'approval_required'
  | 'approval_approved'
  | 'approval_rejected'
  | 'payroll_ready'
  | 'payroll_published'
  | 'leave_applied'
  | 'leave_approved'
  | 'leave_rejected'
  | 'system_alert'
  | 'deadline_reminder'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Notification {
  id: string
  recipientId: string
  senderId?: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  entityType?: string
  entityId?: string
  isRead: boolean
  isArchived: boolean
  actionUrl?: string
  metadata?: Record<string, unknown>
  createdAt: Date
  readAt?: Date
  archivedAt?: Date
}

export interface ApprovalWorkflow {
  id: string
  entityType: 'payroll' | 'leave' | 'employee' | 'expense'
  entityId: string
  requestedBy: string
  approvedBy?: string
  status: 'pending' | 'approved' | 'rejected'
  currentLevel: number
  maxLevel: number
  approvals: ApprovalStep[]
  createdAt: Date
  resolvedAt?: Date
  comments?: string
}

export interface ApprovalStep {
  level: number
  approverId: string
  status: 'pending' | 'approved' | 'rejected'
  timestamp?: Date
  comments?: string
}

// Create a notification
export const createNotification = async (
  data: Omit<Notification, 'id' | 'createdAt' | 'isRead' | 'isArchived'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'notifications'), {
    ...data,
    isRead: false,
    isArchived: false,
    createdAt: serverTimestamp(),
  })

  return docRef.id
}

// Get notifications for a user
export const getNotifications = async (
  userId: string,
  options?: {
    unreadOnly?: boolean
    limit?: number
    includeArchived?: boolean
  }
): Promise<Notification[]> => {
  let constraints: Parameters<typeof query>[1][] = [
    where('recipientId', '==', userId),
  ]

  if (options?.unreadOnly) {
    constraints.push(where('isRead', '==', false))
  }

  if (!options?.includeArchived) {
    constraints.push(where('isArchived', '==', false))
  }

  constraints.push(orderBy('createdAt', 'desc'))

  if (options?.limit) {
    constraints.push(limit(options.limit))
  }

  const q = query(collection(db, 'notifications'), ...constraints)
  const snap = await getDocs(q)

  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as unknown as Notification[]
}

// Mark notification as read
export const markAsRead = async (notificationId: string): Promise<void> => {
  await updateDoc(doc(db, 'notifications', notificationId), {
    isRead: true,
    readAt: serverTimestamp(),
  })
}

// Mark all as read
export const markAllAsRead = async (userId: string): Promise<void> => {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    where('isRead', '==', false)
  )

  const snap = await getDocs(q)
  const batch = writeBatch(db)

  snap.docs.forEach(d => {
    batch.update(d.ref, {
      isRead: true,
      readAt: serverTimestamp(),
    })
  })

  await batch.commit()
}

// Archive notification
export const archiveNotification = async (notificationId: string): Promise<void> => {
  await updateDoc(doc(db, 'notifications', notificationId), {
    isArchived: true,
    archivedAt: serverTimestamp(),
  })
}

// Create approval workflow
export const createApprovalWorkflow = async (
  data: Omit<ApprovalWorkflow, 'id' | 'createdAt' | 'status' | 'currentLevel' | 'approvals'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'approval_works'), {
    ...data,
    status: 'pending',
    currentLevel: 0,
    approvals: [],
    createdAt: serverTimestamp(),
  })

  return docRef.id
}

// Submit approval decision
export const submitApproval = async (
  workflowId: string,
  approverId: string,
  decision: 'approved' | 'rejected',
  comments?: string
): Promise<void> => {
  const workflowRef = doc(db, 'approval_works', workflowId)
  const workflowSnap = await getDoc(workflowRef)

  if (!workflowSnap.exists()) {
    throw new Error('Workflow not found')
  }

  const workflow = workflowSnap.data() as ApprovalWorkflow
  const newStep: ApprovalStep = {
    level: workflow.currentLevel,
    approverId,
    status: decision,
    timestamp: serverTimestamp(),
    comments,
  }

  const updatedApprovals = [...workflow.approvals, newStep]
  const isComplete = decision === 'approved' && workflow.currentLevel + 1 >= workflow.maxLevel
  const isRejected = decision === 'rejected'

  await updateDoc(workflowRef, {
    approvals: updatedApprovals,
    currentLevel: isRejected ? workflow.currentLevel : workflow.currentLevel + 1,
    status: isComplete ? 'approved' : isRejected ? 'rejected' : 'pending',
    resolvedAt: isComplete || isRejected ? serverTimestamp() : null,
  })

  // Notify requester
  if (isComplete || isRejected) {
    await createNotification({
      recipientId: workflow.requestedBy,
      type: isComplete ? 'approval_approved' : 'approval_rejected',
      priority: 'high',
      title: `Approval ${isComplete ? 'Approved' : 'Rejected'}`,
      message: `${workflow.entityType} ${workflow.entityId} has been ${isComplete ? 'approved' : 'rejected'}`,
      entityType: workflow.entityType,
      entityId: workflow.entityId,
      actionUrl: `/${workflow.entityType}s/${workflow.entityId}`,
      metadata: { workflowId, decision, comments },
    })
  }
}

// Notify next approver
export const notifyNextApprover = async (
  workflowId: string,
  approverId: string,
  entityType: string,
  entityId: string
): Promise<void> => {
  await createNotification({
    recipientId: approverId,
    type: 'approval_required',
    priority: 'urgent',
    title: 'Approval Required',
    message: `A new ${entityType} (${entityId}) requires your approval.`,
    entityType,
    entityId,
    actionUrl: `/${entityType}s/${entityId}`,
    metadata: { workflowId },
  })
}

// Check pending approvals count
export const getPendingApprovalsCount = async (userId: string): Promise<number> => {
  const q = query(
    collection(db, 'approval_works'),
    where('status', '==', 'pending'),
    where('approvals', 'array-contains', { approverId: userId, status: 'pending' })
  )

  const snap = await getDocs(q)
  return snap.size
}

// Predefined notification templates
export const NotificationTemplates = {
  payrollReady: (payrollName: string, payrollId: string) => ({
    type: 'payroll_ready' as const,
    priority: 'high' as const,
    title: 'Payroll Ready for Review',
    message: `Payroll "${payrollName}" is ready for review and approval.`,
    actionUrl: `/payroll/${payrollId}`,
  }),

  leaveApplied: (employeeName: string, leaveId: string) => ({
    type: 'leave_applied' as const,
    priority: 'medium' as const,
    title: 'Leave Application',
    message: `${employeeName} has applied for leave.`,
    entityType: 'leave',
    entityId: leaveId,
    actionUrl: `/dtr/leave/${leaveId}`,
  }),

  deadlineReminder: (entityType: string, entityName: string, daysLeft: number) => ({
    type: 'deadline_reminder' as const,
    priority: daysLeft <= 1 ? 'urgent' as const : 'medium' as const,
    title: 'Deadline Reminder',
    message: `${entityType} "${entityName}" is due in ${daysLeft} day(s).`,
    actionUrl: `/${entityType.toLowerCase()}s`,
  }),
}

// Initialize default approval workflows
export const DEFAULT_APPROVAL_WORKFLOWS = {
  payroll: {
    maxLevel: 2,
    levels: [
      { level: 0, role: 'supervisor' },
      { level: 1, role: 'manager' },
    ],
  },
  leave: {
    maxLevel: 1,
    levels: [
      { level: 0, role: 'supervisor' },
    ],
  },
}

export default {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  createApprovalWorkflow,
  submitApproval,
  notifyNextApprover,
  getPendingApprovalsCount,
  NotificationTemplates,
  DEFAULT_APPROVAL_WORKFLOWS,
}
