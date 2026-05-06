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
  type Query,
} from 'firebase/firestore'
import { db } from '../config/firebase'

type CollectionName =
  | 'companies'
  | 'company_periods'
  | 'company_options'
  | 'employees'
  | 'employee_contacts'
  | 'employee_profiles'
  | 'employee_groups'
  | 'employee_positions'
  | 'employee_areas'
  | 'employee_statuses'
  | 'names'
  | 'earnings'
  | 'deductions'
  | 'benefits'
  | 'terms'
  | 'employee_earnings'
  | 'employee_deductions'
  | 'employee_benefits'
  | 'employee_salaries'
  | 'payroll'
  | 'payroll_inclusive_dates'
  | 'payroll_groups'
  | 'payroll_employees'
  | 'payroll_dtr'
  | 'payroll_earnings'
  | 'payroll_deductions'
  | 'payroll_benefits'
  | 'payroll_print_columns'
  | 'payroll_templates'
  | 'attendance'
  | 'absences'
  | 'overtime'
  | 'leave_benefits'
  | 'timesheets'
  | 'calendar'
  | 'audit'
  | 'user_accounts'
  | 'user_restrictions'
  | 'user_companies'
  | 'user_settings'

export async function getById<T>(collectionName: CollectionName, id: string): Promise<T | null> {
  const docRef = doc(db, collectionName, id)
  const docSnap = await getDoc(docRef)
  if (!docSnap.exists()) return null
  return { id: docSnap.id, ...docSnap.data() } as T
}

export async function getAll<T>(
  collectionName: CollectionName,
  filters?: Array<{ field: string; op: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'array-contains'; value: unknown }>,
  order?: { field: string; direction: 'asc' | 'desc' },
  maxLimit?: number
): Promise<T[]> {
  let q: Query = collection(db, collectionName)

  const queryConstraints = []

  if (filters) {
    for (const f of filters) {
      queryConstraints.push(where(f.field, f.op, f.value))
    }
  }

  if (order) {
    queryConstraints.push(orderBy(order.field, order.direction))
  }

  if (maxLimit) {
    queryConstraints.push(limit(maxLimit))
  }

  if (queryConstraints.length > 0) {
    q = query(q, ...queryConstraints)
  }

  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as T[]
}

export async function create<T extends Record<string, unknown>>(
  collectionName: CollectionName,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function update<T extends Record<string, unknown>>(
  collectionName: CollectionName,
  id: string,
  data: Partial<Omit<T, 'id' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(db, collectionName, id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function remove(collectionName: CollectionName, id: string): Promise<void> {
  const docRef = doc(db, collectionName, id)
  await deleteDoc(docRef)
}
