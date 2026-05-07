import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { PayrollEmployee, Employee, EmployeeSalary } from "../types";

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

export async function fetchEmployeeDetails(
  nameIds: string[],
): Promise<Map<string, Employee>> {
  const map = new Map<string, Employee>();
  for (const nameId of nameIds) {
    const snap = await getDocs(
      query(collection(db, "employees"), where("nameId", "==", nameId)),
    );
    if (!snap.empty) {
      const emp = snap.docs[0];
      map.set(nameId, { id: emp.id, ...emp.data() } as Employee);
    }
  }
  return map;
}

export async function fetchEmployeeSalaries(
  employeeIds: string[],
): Promise<Map<string, EmployeeSalary>> {
  const map = new Map<string, EmployeeSalary>();
  for (const empId of employeeIds) {
    const snap = await getDocs(
      query(
        collection(db, "employee_salaries"),
        where("employeeId", "==", empId),
        where("isPrimary", "==", true),
        where("isActive", "==", true),
      ),
    );
    if (!snap.empty) {
      const sal = snap.docs[0];
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
    await updateDoc(doc(db, "payroll_employees", snap.docs[0].id), data);
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
    await updateDoc(doc(db, "payroll_employees_earnings", snap.docs[0].id), {
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
    await updateDoc(doc(db, "payroll_employees_deductions", snap.docs[0].id), {
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
    await updateDoc(doc(db, "payroll_employees_benefits", snap.docs[0].id), {
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
