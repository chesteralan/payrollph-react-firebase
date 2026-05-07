// Report Scheduling Service
// Schedule reports to be generated and sent automatically

import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { UserAccount } from '../types'
import { sendEmail } from './email'
import { generateReportData } from './reportGenerator'

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly'

export type DeliveryMethod = 'email' | 'dashboard' | 'both'

export interface ScheduledReport {
  id: string
  name: string
  description?: string
  reportType: 'payroll_summary' | 'employee_report' | 'earnings_breakdown' | 'attendance' | 'benefits' | 'custom'
  frequency: ScheduleFrequency
  dayOfWeek?: number // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number // 1-31 for monthly
  time: string // HH:MM format
  recipients: string[] // User IDs or email addresses
  deliveryMethod: DeliveryMethod
  format: 'xlsx' | 'csv' | 'pdf'
  filters?: Record<string, unknown>
  fields?: string[]
  isActive: boolean
  lastRun?: Date
  nextRun: Date
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ReportRun {
  id: string
  scheduleId: string
  runAt: Date
  status: 'success' | 'failed' | 'running'
  downloadUrl?: string
  errorMessage?: string
  recipientsNotified: number
}

// Create a scheduled report
export const createScheduledReport = async (
  data: Omit<ScheduledReport, 'id' | 'createdAt' | 'updatedAt' | 'nextRun'>
): Promise<string> => {
  const now = new Date()
  const nextRun = calculateNextRun(data.frequency, data.dayOfWeek, data.dayOfMonth, data.time)

  const docRef = await addDoc(collection(db, 'scheduled_reports'), {
    ...data,
    nextRun,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return docRef.id
}

// Get all scheduled reports for a company
export const getScheduledReports = async (companyId: string): Promise<ScheduledReport[]> => {
  const q = query(
    collection(db, 'scheduled_reports'),
    where('companyId', '==', companyId)
  )

  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as unknown as ScheduledReport[]
}

// Update a scheduled report
export const updateScheduledReport = async (
  id: string,
  data: Partial<Omit<ScheduledReport, 'id' | 'createdAt'>>
): Promise<void> => {
  const nextRun = data.frequency
    ? calculateNextRun(data.frequency, data.dayOfWeek, data.dayOfMonth, data.time)
    : undefined

  await updateDoc(doc(db, 'scheduled_reports', id), {
    ...data,
    ...(nextRun && { nextRun }),
    updatedAt: serverTimestamp(),
  })
}

// Delete a scheduled report
export const deleteScheduledReport = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'scheduled_reports', id))
}

// Toggle active status
export const toggleScheduleStatus = async (id: string, isActive: boolean): Promise<void> => {
  await updateDoc(doc(db, 'scheduled_reports', id), {
    isActive,
    updatedAt: serverTimestamp(),
  })
}

// Calculate next run time
export const calculateNextRun = (
  frequency: ScheduleFrequency,
  dayOfWeek?: number,
  dayOfMonth?: number,
  time?: string
): Date => {
  const now = new Date()
  const [hours = 0, minutes = 0] = (time || '08:00').split(':').map(Number)

  let next = new Date(now)

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      break

    case 'weekly':
      const targetDay = dayOfWeek || 1 // Default to Monday
      const daysUntil = (targetDay + 7 - now.getDay()) % 7 || 7
      next.setDate(next.getDate() + daysUntil)
      break

    case 'monthly':
      const targetDate = dayOfMonth || 1
      next.setMonth(next.getMonth() + 1)
      next.setDate(targetDate)
      break

    case 'quarterly':
      const currentQuarter = Math.floor(now.getMonth() / 3)
      next = new Date(now.getFullYear(), (currentQuarter + 1) * 3, dayOfMonth || 1)
      if (next <= now) {
        next = new Date(now.getFullYear(), (currentQuarter + 2) * 3, dayOfMonth || 1)
      }
      break
  }

  next.setHours(hours, minutes, 0, 0)
  return next
}

// Process due reports (called by Cloud Function)
export const processDueReports = async (): Promise<void> => {
  const now = new Date()
  const q = query(
    collection(db, 'scheduled_reports'),
    where('isActive', '==', true),
    where('nextRun', '<=', now)
  )

  const snap = await getDocs(q)

  for (const docSnap of snap.docs) {
    const report = { id: docSnap.id, ...docSnap.data() } as ScheduledReport

    try {
      // Generate report
      const reportData = await generateReportData(report.reportType, report.filters, report.fields)

      // Export to format
      let downloadUrl = ''
      if (report.format === 'xlsx') {
        downloadUrl = await exportToXlsx(reportData, report.name)
      } else if (report.format === 'csv') {
        downloadUrl = await exportToCsv(reportData, report.name)
      }

      // Notify recipients
      if (report.deliveryMethod === 'email' || report.deliveryMethod === 'both') {
        for (const recipient of report.recipients) {
          await sendEmail({
            template: 'report_ready',
            to: recipient,
            subject: `Scheduled Report: ${report.name}`,
            variables: {
              reportName: report.name,
              downloadUrl,
              reportType: report.reportType,
              frequency: report.frequency,
            },
          })
        }
      }

      // Log the run
      await addDoc(collection(db, 'report_runs'), {
        scheduleId: report.id,
        runAt: serverTimestamp(),
        status: 'success',
        downloadUrl,
        recipientsNotified: report.recipients.length,
        createdAt: serverTimestamp(),
      })

      // Update last run and calculate next run
      const nextRun = calculateNextRun(
        report.frequency,
        report.dayOfWeek,
        report.dayOfMonth,
        report.time
      )

      await updateDoc(doc(db, 'scheduled_reports', report.id), {
        lastRun: serverTimestamp(),
        nextRun,
      })
    } catch (error) {
      // Log failure
      await addDoc(collection(db, 'report_runs'), {
        scheduleId: report.id,
        runAt: serverTimestamp(),
        status: 'failed',
        errorMessage: (error as Error).message,
        recipientsNotified: 0,
        createdAt: serverTimestamp(),
      })
    }
  }
}

// Placeholder export functions (implement based on your export utilties)
const exportToXlsx = async (data: unknown[], name: string): Promise<string> => {
  // Implement using your xlsx utility
  console.log('Exporting to XLSX:', name, data)
  return `https://storage.googleapis.com/bucket/reports/${name}.xlsx`
}

const exportToCsv = async (data: unknown[], name: string): Promise<string> => {
  // Implement using your CSV utility
  console.log('Exporting to CSV:', name, data)
  return `https://storage.googleapis.com/bucket/reports/${name}.csv`
}

// Cloud Function code (deploy separately)
export const CLOUD_FUNCTION = `
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

export const processScheduledReports = functions.pubsub
  .schedule('every 1 hour')
  .onRun(async () => {
    const snapshot = await admin.firestore()
      .collection('scheduled_reports')
      .where('isActive', '==', true)
      .where('nextRun', '<=', new Date())
      .get()

    for (const doc of snapshot.docs) {
      await admin.firestore()
        .collection('jobs')
        .add({
          type: 'process_report',
          scheduleId: doc.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
    }

    return null
  })
`

export default {
  createScheduledReport,
  getScheduledReports,
  updateScheduledReport,
  deleteScheduledReport,
  toggleScheduleStatus,
  calculateNextRun,
  processDueReports,
}
