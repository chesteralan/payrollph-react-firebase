<!-- template-version: 0.0.0 -->

# Business Rules — payroll-web

_Generated 2026-05-25 — v1.0.0_
This document serves as the single source of truth for the core domain rules, validations, and constraints governing the **payroll-web** codebase. It is critical for maintaining data integrity, ensuring compliance with payroll regulations, and guiding both human developers and AI agents in implementing and modifying core domain logic.

**Project Context:**
`payroll-web` is an SMB Payroll management system built with **React** (frontend), **Firebase Functions** (backend logic), and **Firestore** (database). Authentication is handled by **Firebase Auth**, client-side state management uses **Zustand**, and **Vitest** is used for testing. **Yarn** is the package manager.

---

## 🎯 Domain Principles

These principles guide the design and implementation of business logic within `payroll-web`, ensuring maintainability, scalability, and correctness.

1.  **Separation of Concerns**:
    *   **UI (React)**: Primarily responsible for presenting data and capturing user input. It should not contain complex business calculations or direct database mutations. Components should leverage Zustand for local state and interact with Firebase Functions for core operations.
    *   **Backend (Firebase Functions)**: The definitive home for complex business logic, calculations (e.g., payroll computation, tax deductions), external API integrations, and data mutations requiring elevated privileges or atomic operations.
    *   **Data Access (Firestore Security Rules)**: Enforces access control, basic data validation, and ensures users only interact with data they are authorized to see or modify, directly at the database level.
    *   **Client-Side State (Zustand)**: Manages UI-specific state and cached data. Business logic executed client-side should be minimal, primarily focused on immediate user feedback or data formatting, and should always assume backend validation will occur.

2.  **Fail Fast with Robust Validation**:
    *   Inputs must be validated at the earliest possible point to prevent invalid data from reaching core business logic or the database.
    *   **Frontend Validation**: Use `Zod` schemas with `react-hook-form` to provide immediate user feedback on form inputs. This improves user experience but is *not* a security measure.
    *   **Backend Validation (Firebase Functions)**: All incoming data to Callable Functions or HTTP Functions *must* be validated using `Zod` schemas, acting as a critical security and data integrity layer.
    *   **Database Validation (Firestore Security Rules)**: Implement comprehensive rules to enforce data types, required fields, field formats, and access permissions directly at the database level. This is the ultimate gatekeeper for data integrity and prevents unauthorized/malformed writes.

3.  **Data Integrity & Atomicity**:
    *   Complex data mutations involving multiple Firestore documents (e.g., updating employee status and related time entries) must be performed using **Firestore Transactions** within Firebase Functions to ensure atomicity (all or nothing).
    *   Data consistency across related documents (e.g., `employee` status and `timeEntries`) must be maintained through carefully designed update patterns and potentially triggered Cloud Functions.

---

## 📋 Core Business Rules & Enforcement

This table outlines key business rules, their constraints, and where they are enforced within the `payroll-web` stack.

| Feature Area         | Rule Description                                                      | Enforcement Mechanism & Location                                                                                                          |
| :------------------- | :-------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication**   | Users must be authenticated to access any company-specific data.      | **Firebase Auth**: `onAuthStateChanged` in React app; **Firestore Security Rules**: `request.auth != null`                                  |
| **User Roles**       | Only `admin` users can invite new employees or finalize payrolls.     | **Firebase Auth Custom Claims**: `request.auth.token.role == 'admin'`; **Firebase Functions**: Role check before executing sensitive logic. |
| **Employee ID**      | Each employee must have a unique ID within a company.                 | **Firestore Security Rules**: `allow create: if !exists(/databases/$(database)/documents/companies/$(companyId)/employees/$(employeeId))`; **Firebase Function**: On employee creation, verify uniqueness. |
| **Time Entry Limits**| Employees can only log time for the current or previous unclosed pay period. | **Firebase Function**: `logTimeEntry` checks `payPeriod.status` and date range. **Firestore Security Rules**: `request.resource.data.date >= get(/databases/$(database)/documents/companies/$(companyId)/settings/general).data.currentPayPeriod.startDate && request.resource.data.date <= get(/databases/$(database)/documents/companies/$(companyId)/settings/general).data.currentPayPeriod.endDate && get(/databases/$(database)/documents/companies/$(companyId)/settings/general).data.currentPayPeriod.status == 'open'` |
| **Payroll Finalization** | A payroll period must be finalized before payslips can be generated. | **Firebase Function**: `finalizePayroll` function sets `payroll.status = 'finalized'`. `generatePayslip` function checks this status.      |
| **Payslip Immutability** | Once generated, a payslip document cannot be modified.              | **Firestore Security Rules**: `allow update, delete: if false` on `payslips` collection after creation.                                  |
| **Minimum Wage**     | Hourly rates for employees must meet the configured minimum wage.     | **Firebase Function**: On employee update/create, validate `hourlyRate` against company settings. **Firestore Security Rules**: `request.resource.data.hourlyRate >= get(/databases/$(database)/documents/companies/$(companyId)/settings/general).data.minWage`|

---

## 🛡️ Validation & Invariants

Robust validation is crucial for `payroll-web` due to the sensitive nature of payroll data. We employ a layered approach to validation.

### 1. Frontend Validation (React & Zod)

Client-side validation provides immediate feedback to users but is *never* a substitute for backend or database validation.

*   **Tooling**: `react-hook-form` integrated with `Zod` for schema-based form validation.
*   **Purpose**: User experience, preventing obviously invalid input, and guiding users to correct formats.
*   **Example (Zod Schema for Employee Profile Update)**:

    ```typescript
    // src/features/employees/schemas/employeeSchema.ts
    import { z } from 'zod';

    // Helper function to get company-specific minimum wage (would fetch from Zustand store or context)
    const getMinWageForCompany = () => {
      // In a real application, this would fetch from a Zustand store or React Context
      // For this example, we'll return a placeholder.
      return 15.00; // Example minimum wage
    };

    export const employeeProfileSchema = z.object({
      firstName: z.string().trim().min(1, "First name is required.").max(50, "First name too long."),
      lastName: z.string().trim().min(1, "Last name is required.").max(50, "Last name too long."),
      email: z.string().trim().email("Invalid email address.").min(1, "Email is required.").toLowerCase(),
      phoneNumber: z.string().trim().optional().refine(
        (val) => !val || /^\+?[1-9]\d{1,14}$/.test(val), // E.164 format
        "Invalid phone number format. Must start with '+' and be 10-15 digits."
      ),
      hourlyRate: z.number().min(0, "Hourly rate cannot be negative.").optional() // Backend will enforce minimum wage
        .refine(
            (val) => val === undefined || val >= getMinWageForCompany(),
            `Hourly rate must meet minimum wage of $${getMinWageForCompany().toFixed(2)}.`
        ),
      dateOfBirth: z.string().optional().refine(
        (val) => !val || !isNaN(new Date(val).getTime()),
        "Invalid date format for Date of Birth."
      ),
      address: z.object({
        street: z.string().trim().optional().max(100),
        city: z.string().trim().optional().max(50),
        state: z.string().trim().optional().max(50),
        zipCode: z.string().trim().optional().max(10),
      }).optional(),
      status: z.enum(['active', 'inactive', 'on-leave']).default('active'),
    });

    // Usage example with React Hook Form:
    // import { useForm } from 'react-hook-form';
    // import { zodResolver } from '@hookform/resolvers/zod';
    //
    // type EmployeeProfileForm = z.infer<typeof employeeProfileSchema>;
    //
    // const { register, handleSubmit, formState: { errors } } = useForm<EmployeeProfileForm>({
    //   resolver: zodResolver(employeeProfileSchema),
    // });
    ```

### 2. Backend Validation (Firebase Functions & Zod)

All data received by Firebase Functions (especially Callable Functions) must be validated to ensure data integrity before processing or writing to Firestore. This is a critical security and data integrity layer.

*   **Tooling**: `Zod` schemas applied to incoming request bodies.
*   **Purpose**: Enforcing business logic, data integrity, and security at the API boundary, regardless of client-side input.
*   **Example (Firebase Callable Function for Time Entry Submission)**:

    ```typescript
    // functions/src/callable/timeEntries.ts
    import * as functions from 'firebase-functions';
    import { z } from 'zod';
    import { db } from '../config/firebase'; // Firestore instance

    // Define the schema for a time entry request payload
    const timeEntrySchema = z.object({
      companyId: z.string().min(1, "Company ID is required."),
      employeeId: z.string().min(1, "Employee ID is required."),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format."),
      hours: z.number().min(0.5, "Minimum 0.5 hours per entry.").max(24, "Maximum 24 hours per day."),
      description: z.string().optional().max(200, "Description too long."),
    });

    export const logTimeEntry = functions.https.onCall(async (data, context) => {
      // 1. Authentication Check
      if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
      }
      const userId = context.auth.uid; // The Firebase Auth UID of the user making the request

      // 2. Input Validation (using Zod)
      const parsedData = timeEntrySchema.safeParse(data);
      if (!parsedData.success) {
        // Return detailed validation errors
        throw new functions.https.HttpsError('invalid-argument', 'Invalid time entry data provided.', parsedData.error.flatten());
      }
      const { companyId, employeeId, date, hours, description } = parsedData.data;

      // 3. Authorization Check (e.g., user can only log time for themselves or their company as an admin)
      const employeeRef = db.collection('companies').doc(companyId).collection('employees').doc(employeeId);
      const employeeDoc = await employeeRef.get();

      if (!employeeDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Employee not found for the specified company.');
      }

      const employeeData = employeeDoc.data();
      const isEmployeeSelf = employeeData?.userId === userId;
      const isAdmin = context.auth.token.role === 'admin'; // Assuming custom claim for admin role

      if (!isEmployeeSelf && !isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'You do not have permission to log time for this employee.');
      }

      // 4. Business Logic Validation (e.g., check pay period status and date range)
      const companySettingsRef = db.collection('companies').doc(companyId).collection('settings').doc('general');
      const settingsDoc = await companySettingsRef.get();
      const currentPayPeriod = settingsDoc.data()?.currentPayPeriod; // { id, startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD', status: 'open' }

      if (!currentPayPeriod || currentPayPeriod.status !== 'open' || date < currentPayPeriod.startDate || date > currentPayPeriod.endDate) {
        throw new functions.https.HttpsError('failed-precondition', 'Time can only be logged for the current, open pay period.');
      }

      // 5. Write to Firestore (using a transaction for atomicity if multiple writes are involved)
      await db.collection('companies').doc(companyId).collection('employees').doc(employeeId).collection('timeEntries').add({
        date,
        hours,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
        employeeId, // Redundant but useful for queries
      });

      return { status: 'success', message: 'Time entry logged successfully.' };
    });
    ```

### 3. Database Validation (Firestore Security Rules)

Firestore Security Rules are the final and most critical line of defense for data integrity and access control. They run *before* any write operation is committed to the database, ensuring no unauthorized or malformed data enters the system.

*   **Purpose**: Enforce data schema, types, required fields, value ranges, and access permissions directly at the database level.
*   **Location**: `firestore.rules` file in the `functions` directory.
*   **Example (Firestore Security Rules for an `employee` document and nested `timeEntries`)**:

    ```firestore
    // firestore.rules
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {

        // Helper function to check if user has 'admin' role for the given company
        function isAdmin(companyId) {
          return request.auth != null && get(/databases/$(database)/documents/companies/$(companyId)/members/$(request.auth.uid)).data.role == 'admin';
        }

        // Helper function to check if user is an employee for the given company
        function isEmployee(companyId) {
          return request.auth != null && exists(/databases/$(database)/documents/companies/$(companyId)/employees/$(request.auth.uid));
        }

        // Company-level access (e.g., general company info, settings)
        match /companies/{companyId} {
          allow read: if request.auth != null && (isEmployee(companyId) || isAdmin(companyId)); // Any authenticated employee/admin can read company general data
          allow create, update, delete: if isAdmin(companyId); // Only admins can manage company details
        }

        // Employee collection rules
        match /companies/{companyId}/employees/{employeeId} {
          // Data schema validation for employee documents
          function isValidEmployee(data) {
            return data.firstName is string && data.firstName.size() > 0 && data.firstName.size() <= 50 &&
                   data.lastName is string && data.lastName.size() > 0 && data.lastName.size() <= 50 &&
                   data.email is string && data.email.matches(/^[^@]+@[^@]+\.[^@]+$/) && // Basic email regex
                   data.status is string && data.status in ['active', 'inactive', 'on-leave'] &&
                   data.hourlyRate is number && data.hourlyRate >= get(/databases/$(database)/documents/companies/$(companyId)/settings/general).data.minWage && // Enforce min wage
                   data.userId is string; // Link to Firebase Auth UID
          }

          // Read access: Employees can read their own profile; Admins can read all employee profiles.
          allow read: if request.auth.uid == employeeId || isAdmin(companyId);

          // Create access: Only admins can create new employee profiles.
          allow create: if isAdmin(companyId) && isValidEmployee(request.resource.data) &&
                          !exists(/databases/$(database)/documents/companies/$(companyId)/employees/$(employeeId)) && // Ensure ID uniqueness
                          request.resource.data.userId == employeeId; // Ensure employeeId matches userId for self-registration or pre-assignment

          // Update access: Employees can update *some* of their own profile fields; Admins can update all.
          // This ensures employees can manage their contact info, but not sensitive payroll data.
          allow update: if (request.auth.uid == employeeId &&
                             request.resource.data.diff(resource.data).affectedKeys().hasOnly(['phoneNumber', 'address.street', 'address.city', 'address.state', 'address.zipCode'])) ||
                            (isAdmin(companyId) && isValidEmployee(request.resource.data)); // Admin can update all valid fields

          allow delete: if isAdmin(companyId); // Only admins can delete employees

          // Nested timeEntries collection for a specific employee
          match /timeEntries/{timeEntryId} {
            // Only the employee or an admin can create time entries for this employee
            allow create: if (request.auth.uid == employeeId || isAdmin(companyId)) &&
                            request.resource.data.date is timestamp &&
                            request.resource.data.hours is number && request.resource.data.hours >= 0.5 && request.resource.data.hours <= 24 &&
                            // Business rule: only log for open, current pay period.
                            request.resource.data.date >= get(/databases/$(database)/documents/companies/$(companyId)/settings/general).data.currentPayPeriod.startDate &&
                            request.resource.data.date <= get(/databases/$(database)/documents/companies/$(companyId)/settings/general).data.currentPayPeriod.endDate &&
                            get(/databases/$(database)/documents/companies/$(companyId)/settings/general).data.currentPayPeriod.status == 'open';

            // Read access: Employee can read their own time entries; Admin can read all.
            allow read: if request.auth.uid == employeeId || isAdmin(companyId);
            // Update/Delete: Only admins can modify/delete time entries (or within a very short grace period by employee, if implemented).
            allow update, delete: if isAdmin(companyId);
          }
        }
      }
    }
    ```

### 4. Atomic Operations (Firestore Transactions)

For operations that involve reading and writing multiple documents, or require conditional updates based on current document states, use Firestore Transactions within Firebase Functions to guarantee atomicity. This prevents race conditions and ensures data consistency.

*   **Purpose**: Guarantee all-or-nothing operations across multiple document reads/writes.
*   **Example (Finalizing a Payroll Period and Advancing Current Period)**:

    ```typescript
    // functions/src/callable/payroll.ts
    import * as functions from 'firebase-functions';
    import { db } from '../config/firebase'; // Firestore instance

    interface PayPeriod {
        id: string;
        startDate: string; // YYYY-MM-DD
        endDate: string;   // YYYY-MM-DD
        status: 'open' | 'finalized';
    }

    // Helper function (example, actual logic would be more complex)
    const calculateNextPayPeriod = (current: PayPeriod): PayPeriod => {
        const currentEndDate = new Date(current.endDate);
        const nextStartDate = new Date(currentEndDate);
        nextStartDate.setDate(currentEndDate.getDate() + 1); // Day after current end date

        const nextEndDate = new Date(nextStartDate);
        // Assuming bi-weekly payroll: add 13 days (14 day period)
        nextEndDate.setDate(nextStartDate.getDate() + 13);

        return {
            id: `pp-${nextStartDate.toISOString().slice(0, 10)}`, // Example ID
            startDate: nextStartDate.toISOString().slice(0, 10),
            endDate: nextEndDate.toISOString().slice(0, 10),
            status: 'open',
        };
    };

    export const finalizePayrollPeriod = functions.https.onCall(async (data, context) => {
      if (!context.auth || context.auth.token.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only admin users can finalize payrolls.');
      }

      // Assume data validation (e.g., using Zod) has already occurred for companyId and payPeriodId
      const { companyId, payPeriodId } = data;

      const companyRef = db.collection('companies').doc(companyId);
      const payrollRef = companyRef.collection('payrolls').doc(payPeriodId);
      const settingsRef = companyRef.collection('settings').doc('general');

      return db.runTransaction(async (transaction) => {
        const payrollDoc = await transaction.get(payrollRef);
        const settingsDoc = await transaction.get(settingsRef);

        if (!payrollDoc.exists) {
          throw new functions.https.HttpsError('not-found', 'Payroll period not found.');
        }
        if (payrollDoc.data()?.status === 'finalized') {
          throw new functions.https.HttpsError('failed-precondition', 'Payroll period is already finalized.');
        }
        if (!settingsDoc.exists) {
            throw new functions.https.HttpsError('internal', 'Company settings not found.');
        }

        // Update payroll status to 'finalized'
        transaction.update(payrollRef, { status: 'finalized', finalizedAt: new Date(), finalizedBy: context.auth.uid });

        // Update company settings to advance the current pay period
        // This ensures new time entries cannot be logged against the old, now finalized, period.
        const currentPayPeriod: PayPeriod | undefined = settingsDoc.data()?.currentPayPeriod;
        if (currentPayPeriod && currentPayPeriod.id === payPeriodId) {
            const nextPayPeriod = calculateNextPayPeriod(currentPayPeriod);
            transaction.update(settingsRef, { currentPayPeriod: nextPayPeriod });
        } else {
            // Handle case where the finalized payroll isn't the 'current' one in settings,
            // or if the settings structure is unexpected.
            functions.logger.warn(`Finalized payroll ${payPeriodId} is not the current active pay period for company ${companyId}.`);
        }

        return { status: 'success', message: `Payroll period ${payPeriodId} finalized.` };
      });
    });
    ```

---

## 🧪 Testing Business Rules (Vitest)

All core business rules, especially those enforced in Firebase Functions and through Zod schemas, must have corresponding unit or integration tests using **Vitest**.

*   **Purpose**: Ensure rules are correctly implemented, edge cases are handled, and functionality remains stable after code changes.
*   **Strategy**:
    *   **Unit Tests**: For isolated functions, Zod schemas, and utility functions that encapsulate specific business logic.
    *   **Integration Tests**: For Firebase Functions, mocking Firestore interactions or using the Firebase Test SDK (if applicable for more complex scenarios) to simulate real-world data flow and rule enforcement.
*   **CLI Command**: Run tests using `yarn vitest`.
*   **Example (Testing a Zod Schema)**:

    ```typescript
    // src/features/employees/schemas/employeeSchema.test.ts
    import { describe, it, expect, vi } from 'vitest';
    import { employeeProfileSchema } from './employeeSchema';

    // Mock the getMinWageForCompany for consistent test results
    vi.mock('./employeeSchema', async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        getMinWageForCompany: vi.fn(() => 15.00), // Always return 15 for tests
      };
    });

    describe('employeeProfileSchema', () => {
      it('should validate a correct employee profile', () => {
        const validEmployee = {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phoneNumber: '+15551234567',
          hourlyRate: 25.50,
          status: 'active',
        };
        expect(() => employeeProfileSchema.parse(validEmployee)).not.toThrow();
      });

      it('should reject an invalid email format', () => {
        const invalidEmployee = {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'invalid-email',
          status: 'active',
        };
        expect(() => employeeProfileSchema.parse(invalidEmployee)).toThrowError('Invalid email address.');
      });

      it('should reject an empty first name', () => {
        const invalidEmployee = {
          firstName: '',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          status: 'active',
        };
        expect(() => employeeProfileSchema.parse(invalidEmployee)).toThrowError('First name is required.');
      });

      it('should reject hourly rate below the mocked minimum wage', () => {
        const invalidEmployee = {
          firstName: 'Bob',
          lastName: 'Builder',
          email: 'bob@example.com',
          hourlyRate: 14.99, // Below mocked $15.00
          status: 'active',
        };
        expect(() => employeeProfileSchema.parse(invalidEmployee)).toThrowError('Hourly rate must meet minimum wage of $15.00.');
      });

      it('should allow hourly rate equal to minimum wage', () => {
        const validEmployee = {
          firstName: 'Alice',
          lastName: 'Wonder',
          email: 'alice@example.com',
          hourlyRate: 15.00, // Equal to mocked $15.00
          status: 'active',
        };
        expect(() => employeeProfileSchema.parse(validEmployee)).not.toThrow();
      });
    });
    ```

---

_Documentation generated by [create-agent-docs](https://github.com/chesteralan/create-agent-docs) v0.0.0 on 2026-05-25._
