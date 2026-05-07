import { auth, db } from "../config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

const DEPARTMENTS = [
  "payroll",
  "employees",
  "lists",
  "reports",
  "system",
] as const;
const SECTIONS: Record<string, string[]> = {
  payroll: ["payroll", "templates"],
  employees: ["employees", "calendar", "groups", "positions", "areas"],
  lists: ["names", "benefits", "earnings", "deductions"],
  reports: ["13month"],
  system: ["companies", "calendar", "terms", "users", "audit", "database"],
};

export async function setupAdminUser({
  email,
  password,
  displayName,
  companyName,
}: {
  email: string;
  password: string;
  displayName: string;
  companyName: string;
}) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const userId = userCredential.user.uid;

  await Promise.all([
    setDoc(doc(db, "user_accounts", userId), {
      email,
      username: email.split("@")[0],
      displayName,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),

    setDoc(doc(db, "user_settings", `${userId}_default`), {
      userId,
      theme: "light",
      itemsPerPage: 25,
    }),
  ]);

  const companyId = "initial_company";
  await setDoc(doc(db, "companies", companyId), {
    name: companyName,
    address: "",
    tin: "",
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, "user_companies", `${userId}_initial`), {
    userId,
    companyId: "initial_company",
    isPrimary: true,
  });

  for (const dept of DEPARTMENTS) {
    for (const section of SECTIONS[dept]) {
      await setDoc(
        doc(db, "user_restrictions", `${userId}_${dept}_${section}`),
        {
          userId,
          department: dept,
          section,
          canView: true,
          canAdd: true,
          canEdit: true,
          canDelete: true,
        },
      );
    }
  }

  return userCredential.user;
}

export async function checkSetupNeeded(): Promise<boolean> {
  const snap = await getDocs(collection(db, "user_accounts"));
  return snap.empty;
}
