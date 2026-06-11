/**
 * Database Seeding Script
 *
 * Generates test data for development and staging environments.
 *
 * Usage:
 *   node --experimental-vm-modules src/scripts/seed.ts
 *
 * Requires:
 *   - Firebase service account key
 *   - FIRESTORE_EMULATOR_HOST set (for local) or live Firestore access
 */

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ============================================================
// Configuration
// ============================================================

const SEED_CONFIG = {
  companies: 3,
  employeesPerCompany: 25,
  payrollRuns: 6, // Last 6 months
  usersPerCompany: 3, // Admin, Manager, User
  auditLogs: 100,
  dtrRecords: 180, // ~6 months of daily records
};

// ============================================================
// Data Generators
// ============================================================

const FIRST_NAMES = [
  "Juan", "Maria", "Jose", "Ana", "Pedro", "Rosa", "Carlos", "Elena",
  "Miguel", "Luisa", "Antonio", "Isabel", "Manuel", "Carmen", "Francisco",
  "Angela", "Ramon", "Teresa", "Fernando", "Gloria",
];

const LAST_NAMES = [
  "Santos", "Reyes", "Cruz", "Bautista", "Gonzales", "Mendoza", "Garcia",
  "Flores", "Rivera", "Lopez", "Martinez", "Dela Cruz", "Villanueva",
  "Fernandez", "Torres", "Castillo", "Domingo", "Ramos", "Aguilar",
  "Navarro",
];

const POSITIONS = [
  "Software Engineer", "HR Manager", "Accountant", "Office Clerk",
  "Sales Representative", "Marketing Specialist", "Operations Manager",
  "Customer Support", "IT Administrator", "Finance Analyst",
];

const DEPARTMENTS = [
  "Engineering", "Human Resources", "Finance", "Operations",
  "Sales", "Marketing", "IT Support", "Administration",
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEmployeeCode(index: number, companyCode: string): string {
  return `${companyCode}${String(index).padStart(4, "0")}`;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// ============================================================
// Main Seed Function
// ============================================================

async function seedDatabase() {
  // Initialize Firebase Admin
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? (JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) as ServiceAccount)
    : undefined;

  const app = initializeApp(
    serviceAccount
      ? { credential: cert(serviceAccount) }
      : { projectId: "payroll-test" },
  );

  const db = getFirestore(app);

  console.log("🌱 Starting database seeding...\n");

  // Create companies
  const companyIds: string[] = [];
  const companyCodes = ["PH", "MG", "AL"];

  for (let i = 0; i < SEED_CONFIG.companies; i++) {
    const companyRef = db.collection("companies").doc();
    const companyData = {
      code: companyCodes[i],
      name: `PayrollPH ${["Demo Corp", "Sample Inc", "Test LLC"][i]}`,
      isActive: true,
      address: `${[100, 200, 300][i]} ${["Ayala Ave", "Makati Ave", "EDSA"][i]}, Makati City`,
      contactEmail: `info@${companyCodes[i].toLowerCase()}corp.com`,
      contactPhone: `+63${String(randomInt(9000000000, 9999999999))}`,
      settings: {
        workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        payrollPeriod: "semi-monthly",
        taxRegion: "PH",
        currency: "PHP",
        timezone: "Asia/Manila",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await companyRef.set(companyData);
    companyIds.push(companyRef.id);
    console.log(`  ✓ Company "${companyData.name}" created (${companyRef.id})`);
  }

  // Create employees per company
  for (const companyId of companyIds) {
    for (let i = 0; i < SEED_CONFIG.employeesPerCompany; i++) {
      const firstName = randomElement(FIRST_NAMES);
      const lastName = randomElement(LAST_NAMES);
      const position = randomElement(POSITIONS);
      const department = randomElement(DEPARTMENTS);
      const salary = randomInt(15000, 80000) * 100; // Round to hundreds

      const employeeRef = db.collection("employees").doc();
      await employeeRef.set({
        companyId,
        employeeCode: generateEmployeeCode(i + 1, companyCodes[companyIds.indexOf(companyId)]),
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        position,
        department,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        phone: `+63${String(randomInt(9000000000, 9999999999))}`,
        salary: {
          basic: salary,
          type: "monthly",
          allowances: {
            transportation: randomInt(500, 2000),
            meal: randomInt(500, 1500),
            clothing: randomInt(200, 500),
          },
        },
        sssNumber: `${String(randomInt(10, 99))}-${String(randomInt(1000000, 9999999))}-${String(randomInt(1, 9))}`,
        philHealthNumber: `${String(randomInt(10, 99))}-${String(randomInt(1000000, 9999999))}-${String(randomInt(1, 9))}`,
        hdmfNumber: `${String(randomInt(1000, 9999))}-${String(randomInt(1000, 9999))}-${String(randomInt(1000, 9999))}`,
        tinNumber: `${String(randomInt(100, 999))}-${String(randomInt(100, 999))}-${String(randomInt(100, 999))}-${String(randomInt(1, 9))}${String(randomInt(0, 9))}${String(randomInt(0, 9))}`,
        status: "active",
        hireDate: randomDate(new Date("2015-01-01"), new Date("2025-12-31")),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if ((i + 1) % 10 === 0) {
        console.log(`  ✓ ${i + 1}/${SEED_CONFIG.employeesPerCompany} employees created for company ${companyCodes[companyIds.indexOf(companyId)]}`);
      }
    }
    console.log(`  ✓ All ${SEED_CONFIG.employeesPerCompany} employees created for company ${companyCodes[companyIds.indexOf(companyId)]}`);
  }

  // Create users
  const USER_ROLES = ["admin", "manager", "user"];
  for (const companyId of companyIds) {
    for (let i = 0; i < SEED_CONFIG.usersPerCompany; i++) {
      const role = USER_ROLES[i];
      const userRef = db.collection("user_accounts").doc();
      await userRef.set({
        email: `${role}@${companyCodes[companyIds.indexOf(companyId)].toLowerCase()}corp.com`,
        displayName: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
        role,
        companyIds: [companyId],
        isActive: true,
        permissions: {
          employees: { view: true, create: role !== "user", edit: role !== "user", delete: role === "admin" },
          payroll: { view: true, create: role !== "user", process: role === "admin", lock: role === "admin" },
          reports: { view: true, export: true },
          settings: { view: role === "admin", edit: role === "admin" },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    console.log(`  ✓ Users created for company ${companyCodes[companyIds.indexOf(companyId)]}`);
  }

  // Create sample payroll runs
  const now = new Date();
  for (const companyId of companyIds) {
    for (let m = 0; m < SEED_CONFIG.payrollRuns; m++) {
      const payrollDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const payrollRef = db.collection("payrolls").doc();
      await payrollRef.set({
        companyId,
        period: {
          start: new Date(payrollDate.getFullYear(), payrollDate.getMonth(), 1),
          end: new Date(payrollDate.getFullYear(), payrollDate.getMonth() + 1, 0),
        },
        status: m === 0 ? "draft" : "published",
        totalEmployees: SEED_CONFIG.employeesPerCompany,
        totalGrossPay: randomInt(500000, 2000000) * 100,
        totalDeductions: randomInt(100000, 500000) * 100,
        totalNetPay: randomInt(400000, 1500000) * 100,
        processedBy: "admin",
        processedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    console.log(`  ✓ ${SEED_CONFIG.payrollRuns} payroll runs created for company ${companyCodes[companyIds.indexOf(companyId)]}`);
  }

  // Create audit logs
  const AUDIT_ACTIONS = ["login", "logout", "create_employee", "update_employee", "process_payroll", "lock_payroll", "export_report"];
  for (let i = 0; i < SEED_CONFIG.auditLogs; i++) {
    const auditRef = db.collection("system_audit").doc();
    await auditRef.set({
      userId: "seed-user",
      userName: "Seed Script",
      action: randomElement(AUDIT_ACTIONS),
      module: randomElement(["auth", "employees", "payroll", "reports", "settings"]),
      description: `Seed action: ${randomElement(["created", "updated", "processed", "viewed", "exported"])}`,
      companyId: randomElement(companyIds),
      ipAddress: `192.168.${randomInt(0, 255)}.${randomInt(1, 254)}`,
      userAgent: "Seed-Script/1.0",
      timestamp: randomDate(new Date("2026-01-01"), now),
      createdAt: new Date(),
    });
  }
  console.log(`  ✓ ${SEED_CONFIG.auditLogs} audit log entries created`);

  console.log("\n✅ Database seeding complete!");
  console.log(`   Companies: ${SEED_CONFIG.companies}`);
  console.log(`   Employees: ${SEED_CONFIG.companies * SEED_CONFIG.employeesPerCompany}`);
  console.log(`   Users: ${SEED_CONFIG.companies * SEED_CONFIG.usersPerCompany}`);
  console.log(`   Payroll runs: ${SEED_CONFIG.companies * SEED_CONFIG.payrollRuns}`);
  console.log(`   Audit logs: ${SEED_CONFIG.auditLogs}`);
}

// Run seed
seedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });
