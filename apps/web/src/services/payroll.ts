import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { Employee, EmployeeSalary, PayrollEmployee } from "../types";

export async function fetchPayrollEmployees(
  payrollId: string,
): Promise<PayrollEmployee[]> {
  const snap = await getDocs(
    query(
      collection(db, "payroll_employees"),
      where("payrollId", "==", payrollId),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as PayrollEmployee[];
}

const CHUNK_SIZE = 30;

export async function fetchEmployeeDetails(
  nameIds: string[],
): Promise<Map<string, Employee>> {
  const map = new Map<string, Employee>();
  for (let i = 0; i < nameIds.length; i += CHUNK_SIZE) {
    const chunk = nameIds.slice(i, i + CHUNK_SIZE);
    const snap = await getDocs(
      query(collection(db, "employees"), where("nameId", "in", chunk)),
    );
    for (const emp of snap.docs) {
      if (!emp) continue;
      const nameId = emp.data().nameId as string | undefined;
      if (!nameId) continue;
      map.set(nameId, { id: emp.id, ...emp.data() } as Employee);
    }
  }
  return map;
}

export async function fetchEmployeeSalaries(
  employeeIds: string[],
): Promise<Map<string, EmployeeSalary>> {
  const map = new Map<string, EmployeeSalary>();
  for (let i = 0; i < employeeIds.length; i += CHUNK_SIZE) {
    const chunk = employeeIds.slice(i, i + CHUNK_SIZE);
    const snap = await getDocs(
      query(
        collection(db, "employee_salaries"),
        where("employeeId", "in", chunk),
        where("isPrimary", "==", true),
        where("isActive", "==", true),
      ),
    );
    for (const sal of snap.docs) {
      if (!sal) continue;
      const empId = sal.data().employeeId as string | undefined;
      if (!empId) continue;
      map.set(empId, { id: sal.id, ...sal.data() } as EmployeeSalary);
    }
  }
  return map;
}

export async function fetchListItems<T>(
  collectionName: string,
  isActive = true,
): Promise<T[]> {
  const q = isActive
    ? query(collection(db, collectionName), where("isActive", "==", true))
    : collection(db, collectionName);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as T[];
}

export async function updatePayrollDTR(
  payrollId: string,
  nameId: string,
  data: {
    daysWorked: number;
    absences: number;
    lateHours: number;
    overtimeHours: number;
  },
): Promise<void> {
  const snap = await getDocs(
    query(
      collection(db, "payroll_employees"),
      where("payrollId", "==", payrollId),
      where("nameId", "==", nameId),
    ),
  );
  if (!snap.empty) {
    const dtrDoc = snap.docs[0];
    if (!dtrDoc) return;
    await updateDoc(doc(db, "payroll_employees", dtrDoc.id), data);
  }
}

export async function savePayrollEarning(
  payrollId: string,
  nameId: string,
  earningId: string,
  amount: number,
): Promise<void> {
  const snap = await getDocs(
    query(
      collection(db, "payroll_employees_earnings"),
      where("payrollId", "==", payrollId),
      where("nameId", "==", nameId),
      where("earningId", "==", earningId),
    ),
  );
  if (!snap.empty) {
    const earningDoc = snap.docs[0];
    if (!earningDoc) return;
    await updateDoc(doc(db, "payroll_employees_earnings", earningDoc.id), {
      amount,
    });
  } else {
    await addDoc(collection(db, "payroll_employees_earnings"), {
      payrollId,
      nameId,
      earningId,
      amount,
      createdAt: serverTimestamp(),
    });
  }
}

export async function savePayrollDeduction(
  payrollId: string,
  nameId: string,
  deductionId: string,
  amount: number,
): Promise<void> {
  const snap = await getDocs(
    query(
      collection(db, "payroll_employees_deductions"),
      where("payrollId", "==", payrollId),
      where("nameId", "==", nameId),
      where("deductionId", "==", deductionId),
    ),
  );
  if (!snap.empty) {
    const deductionDoc = snap.docs[0];
    if (!deductionDoc) return;
    await updateDoc(doc(db, "payroll_employees_deductions", deductionDoc.id), {
      amount,
    });
  } else {
    await addDoc(collection(db, "payroll_employees_deductions"), {
      payrollId,
      nameId,
      deductionId,
      amount,
      createdAt: serverTimestamp(),
    });
  }
}

export async function savePayrollBenefit(
  payrollId: string,
  nameId: string,
  benefitId: string,
  employeeShare: number,
  employerShare: number,
): Promise<void> {
  const snap = await getDocs(
    query(
      collection(db, "payroll_employees_benefits"),
      where("payrollId", "==", payrollId),
      where("nameId", "==", nameId),
      where("benefitId", "==", benefitId),
    ),
  );
  if (!snap.empty) {
    const benefitDoc = snap.docs[0];
    if (!benefitDoc) return;
    await updateDoc(doc(db, "payroll_employees_benefits", benefitDoc.id), {
      employeeShare,
      employerShare,
    });
  } else {
    await addDoc(collection(db, "payroll_employees_benefits"), {
      payrollId,
      nameId,
      benefitId,
      employeeShare,
      employerShare,
      createdAt: serverTimestamp(),
    });
  }
}

export function computeGrossPay(
  salaryAmount: number,
  earnings: number[],
): number {
  return salaryAmount + earnings.reduce((sum, v) => sum + v, 0);
}

export function computeNetPay(
  grossPay: number,
  deductions: number[],
  benefitShares: number[],
): number {
  const totalDeductions = deductions.reduce((sum, v) => sum + v, 0);
  const totalBenefits = benefitShares.reduce((sum, v) => sum + v, 0);
  return grossPay - totalDeductions - totalBenefits;
}

export function sumEarnings(earningMap: Map<string, number>): number {
  return Array.from(earningMap.values()).reduce((s, v) => s + v, 0);
}

export function sumDeductions(deductionMap: Map<string, number>): number {
  return Array.from(deductionMap.values()).reduce((s, v) => s + v, 0);
}

export function sumBenefits(
  benefitMap: Map<string, { employeeShare: number }>,
): number {
  return Array.from(benefitMap.values()).reduce(
    (s, v) => s + v.employeeShare,
    0,
  );
}

export function computeOvertimePay(
  hourlyRate: number,
  overtimeHours: number,
  multiplier = 1.5,
): number {
  return hourlyRate * multiplier * overtimeHours;
}

export function computeHourlyRate(
  monthlySalary: number,
  workDaysPerMonth = 22,
  hoursPerDay = 8,
): number {
  return monthlySalary / (workDaysPerMonth * hoursPerDay);
}

export function computeDailyRate(
  monthlySalary: number,
  workDaysPerMonth = 22,
): number {
  return monthlySalary / workDaysPerMonth;
}

export interface PayrollProcessingRow {
  nameId: string;
  employeeCode: string;
  daysWorked: number;
  absences: number;
  lateHours: number;
  overtimeHours: number;
  basicSalary: number;
  grossPay: number;
  netPay: number;
  earnings: Map<string, number>;
  deductions: Map<string, number>;
  benefits: Map<string, { employeeShare: number; employerShare: number }>;
}
