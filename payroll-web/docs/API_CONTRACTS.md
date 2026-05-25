<!-- template-version: 0.0.0 -->

# API Contracts — payroll-web

_Generated 2026-05-25 — v0.0.0_
This document details the communication contracts, response models, and conventions for interacting with the **payroll-web** backends, specifically leveraging Firebase services like Cloud Functions, Firestore, and Authentication.

---

## 1. Core Principles

### 1.1. Technology Stack Overview

The `payroll-web` project utilizes a serverless architecture primarily built on Firebase:

*   **Frontend**: React with Vite
*   **Backend**: Firebase Cloud Functions (Typescript)
*   **Database**: Firestore (NoSQL Document Database)
*   **Authentication**: Firebase Authentication
*   **State Management**: Zustand
*   **Testing**: Vitest
*   **Package Manager**: Yarn

### 1.2. Data Flow

Client applications (React frontend) primarily interact with the backend through two main channels:

1.  **Firebase Callable Functions**: For complex business logic, transactional operations, and operations requiring elevated server-side privileges (e.g., payroll computation, generating payslips). These functions act as our primary API endpoints.
2.  **Direct Firestore Access**: For simpler CRUD operations where data access can be safely governed by Firestore Security Rules (e.g., reading an employee's profile, updating user preferences).

---

## 2. Endpoint Protocols

### 2.1. Base URLs

*   **Firebase Functions (Local Emulator)**:
    When running the Firebase Emulators, the base URL for callable functions is `http://localhost:5001/<project-id>/<region>`.
    Example: `http://localhost:5001/payroll-web-dev/us-central1/`
    *Note*: The Firebase SDK (`firebase/functions`) automatically handles the full URL construction when initialized with `connectFunctionsEmulator`.

*   **Firebase Functions (Production)**:
    The production base URL follows the pattern: `https://<region>-<project-id>.cloudfunctions.net/`.
    Example: `https://us-central1-payroll-web-prod.cloudfunctions.net/`

### 2.2. Request/Response Format

All payloads for Firebase Callable Functions must adhere to the standard `application/json` format. The Firebase Functions SDK handles serialization and deserialization automatically.

### 2.3. Common Headers

*   `Content-Type: application/json`: Required for all API requests.
*   `Authorization: Bearer <ID_TOKEN>`: For authenticated requests. This ID token is obtained from Firebase Authentication after a user signs in. The Firebase Functions SDK automatically attaches this token for callable function calls if a user is signed in.

---

## 3. Authentication and Authorization

### 3.1. Firebase Authentication

Users authenticate via Firebase Auth. Upon successful login, an ID token is issued. This token is automatically sent with all Firebase SDK calls (Callable Functions, Firestore) for authenticated users.

**Client-Side (React) Example:**

```typescript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from './firebaseConfig'; // Your Firebase app initialization

const auth = getAuth(app);

async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    console.log('User logged in, ID Token:', idToken);
    // The SDK will automatically use this token for subsequent calls.
    return userCredential.user;
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
}
```

### 3.2. Firestore Security Rules

Firestore Security Rules enforce data access control at the document and collection levels. They are crucial for protecting sensitive payroll data.

**Example: `firestore.rules` for `employees` collection**

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users must be authenticated to access any data
    match /{document=**} {
      allow read, write: if request.auth != null;
    }

    // Employees collection:
    // - Only authenticated users can list employees (read)
    // - Only users with a specific role (e.g., 'admin', 'hr') can create, update, delete employees
    // - An employee can only read their own profile (with specific fields)
    match /companies/{companyId}/employees/{employeeId} {
      allow read: if request.auth != null; // Any authenticated user can read
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';

      // Example: Restrict an employee to only read their own non-sensitive details
      // allow read: if request.auth.uid == employeeId &&
      //               resource.data.keys().hasAll(['firstName', 'lastName', 'email']);
    }

    // Payslips collection:
    // - Only the employee themselves or an admin can read their payslip
    match /companies/{companyId}/employees/{employeeId}/payslips/{payslipId} {
      allow read: if request.auth.uid == employeeId ||
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 3.3. Firebase Functions Context

For Callable Functions, the `context` object provides authentication details (`context.auth`) and client app information. This is used for server-side authorization.

**Backend (Cloud Function) Example:**

```typescript
import * as functions from 'firebase-functions';

export const getEmployeeProfile = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The request requires authentication.');
  }

  const userId = context.auth.uid;
  const requestedEmployeeId = data.employeeId; // Data passed from client

  // Example: Only allow users to fetch their own profile, or admins to fetch any
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userRole = userDoc.data()?.role;

  if (userId !== requestedEmployeeId && userRole !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'You do not have permission to view this profile.');
  }

  // ... fetch employee data ...
  return { success: true, employeeData: { /* ... */ } };
});
```

---

## 4. Error Handling

### 4.1. Standard Error Payload

All API error responses from Firebase Callable Functions (when not using `HttpsError`) or custom error handling within functions must adhere to the following payload contract:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING", // e.g., "INVALID_INPUT", "PAYSLIP_NOT_FOUND", "PERMISSION_DENIED"
    "message": "Human readable error explanation.",
    "details": {
      // Optional: Additional context or validation errors
      "fieldErrors": {
        "email": "Invalid email format."
      }
    }
  }
}
```

### 4.2. Firebase Functions Error Handling

Firebase Callable Functions automatically wrap errors thrown as `functions.https.HttpsError` into a standardized format on the client-side.

**Backend (Cloud Function) Example:**

```typescript
import * as functions from 'firebase-functions';

export const createPayslip = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to create a payslip.');
  }

  const { employeeId, periodStart, periodEnd } = data;

  if (!employeeId || !periodStart || !periodEnd) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields for payslip creation.',
      {
        missingFields: ['employeeId', 'periodStart', 'periodEnd']
      }
    );
  }

  // ... business logic for payslip creation ...

  if (errorCondition) {
    throw new functions.https.HttpsError('internal', 'Failed to compute payslip due to an internal error.');
  }

  return { success: true, payslipId: 'new-payslip-id' };
});
```

### 4.3. Client-Side Error Mapping

Client-side code (React) should wrap API calls in `try/catch` blocks and map `HttpsError` codes or custom error payloads to user-friendly messages.

**Frontend (React) Example:**

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebaseConfig';

const functions = getFunctions(app, 'us-central1'); // Specify region

export const usePayslipActions = () => {
  const createPayslip = httpsCallable(functions, 'createPayslip');

  const handleCreatePayslip = async (payslipData) => {
    try {
      const result = await createPayslip(payslipData);
      console.log('Payslip created:', result.data);
      return result.data;
    } catch (error: any) {
      console.error('Error creating payslip:', error);

      let errorMessage = 'An unexpected error occurred.';
      if (error.code) {
        switch (error.code) {
          case 'unauthenticated':
            errorMessage = 'Please log in to perform this action.';
            break;
          case 'invalid-argument':
            errorMessage = `Invalid input: ${error.details?.missingFields?.join(', ') || error.message}`;
            break;
          case 'permission-denied':
            errorMessage = 'You do not have permission to create payslips.';
            break;
          default:
            errorMessage = `API Error (${error.code}): ${error.message}`;
        }
      }
      // You might use a toast library or update a state variable here
      alert(errorMessage);
      throw new Error(errorMessage); // Re-throw for further handling in components
    }
  };

  return { handleCreatePayslip };
};
```

---

## 5. Backend API: Firebase Callable Functions

### 5.1. Overview

Firebase Callable Functions are the recommended way to expose backend APIs for `payroll-web`. They offer:
*   Automatic authentication context (`context.auth`).
*   Built-in serialization/deserialization.
*   Simplified client-side invocation.
*   Strong typing with TypeScript.

### 5.2. Function Definition Example

**File: `functions/src/payslip.ts`**

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { PayslipData, PayslipCreationRequest } from './types'; // Define your types

admin.initializeApp();
const db = admin.firestore();

export const generatePayslip = functions.https.onCall(async (data: PayslipCreationRequest, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  // Basic authorization check (e.g., only admins can generate payslips for others)
  const userRef = db.collection('users').doc(context.auth.uid);
  const userDoc = await userRef.get();
  const userRole = userDoc.data()?.role;

  if (userRole !== 'admin' && data.employeeId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'You do not have permission to generate this payslip.');
  }

  // Input validation
  if (!data.employeeId || !data.periodStart || !data.periodEnd || typeof data.grossPay !== 'number') {
    throw new functions.https.HttpsError('invalid-argument', 'Missing or invalid payslip data.', {
      expected: ['employeeId', 'periodStart', 'periodEnd', 'grossPay']
    });
  }

  try {
    // 1. Fetch employee details
    const employeeRef = db.collection('companies').doc(data.companyId).collection('employees').doc(data.employeeId);
    const employeeDoc = await employeeRef.get();
    if (!employeeDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Employee not found.');
    }
    const employeeData = employeeDoc.data();

    // 2. Perform complex payroll computation (taxes, deductions, etc.)
    // This would involve more detailed logic, potentially calling external APIs or complex calculations.
    const netPay = data.grossPay * 0.8; // Simplified example
    const taxes = data.grossPay * 0.15;
    const deductions = data.grossPay * 0.05;

    const newPayslip: PayslipData = {
      employeeId: data.employeeId,
      companyId: data.companyId,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      grossPay: data.grossPay,
      netPay: netPay,
      taxes: taxes,
      deductions: deductions,
      status: 'generated',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      generatedBy: context.auth.uid,
    };

    // 3. Save payslip to Firestore
    const payslipCollectionRef = db.collection('companies').doc(data.companyId)
                                  .collection('employees').doc(data.employeeId).collection('payslips');
    const docRef = await payslipCollectionRef.add(newPayslip);

    return { success: true, payslipId: docRef.id, message: 'Payslip generated successfully.' };

  } catch (error: any) {
    functions.logger.error('Error generating payslip:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error; // Re-throw HttpsError directly
    }
    throw new functions.https.HttpsError('internal', 'Failed to generate payslip.', error.message);
  }
});
```

**File: `functions/src/index.ts` (Entry point)**

```typescript
export { generatePayslip } from './payslip';
export { createTimeEntry } from './timeTracking'; // Another example function
```

### 5.3. Client-Side Invocation (React/Zustand)

Leverage Zustand for managing loading states, errors, and data from API calls.

```typescript
// src/store/payslipStore.ts
import { create } from 'zustand';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebaseConfig'; // Your Firebase app initialization

const functions = getFunctions(app, 'us-central1'); // Initialize with your function region
const generatePayslipFunction = httpsCallable<PayslipCreationRequest, PayslipGenerationResponse>(functions, 'generatePayslip');

interface PayslipCreationRequest {
  companyId: string;
  employeeId: string;
  periodStart: string; // ISO date string
  periodEnd: string;   // ISO date string
  grossPay: number;
}

interface PayslipGenerationResponse {
  success: boolean;
  payslipId?: string;
  message?: string;
  error?: { code: string; message: string; details?: any };
}

interface PayslipState {
  isLoading: boolean;
  error: string | null;
  lastGeneratedPayslipId: string | null;
  generatePayslip: (data: PayslipCreationRequest) => Promise<PayslipGenerationResponse | undefined>;
}

export const usePayslipStore = create<PayslipState>((set) => ({
  isLoading: false,
  error: null,
  lastGeneratedPayslipId: null,

  generatePayslip: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const result = await generatePayslipFunction(data);
      if (result.data.success) {
        set({
          isLoading: false,
          lastGeneratedPayslipId: result.data.payslipId,
          error: null,
        });
        return result.data;
      } else {
        set({
          isLoading: false,
          error: result.data.error?.message || 'Failed to generate payslip.',
        });
        return result.data;
      }
    } catch (error: any) {
      console.error('API Error (generatePayslip):', error);
      let errorMessage = 'An unexpected error occurred.';
      if (error.code) {
        errorMessage = `Error: ${error.message} (${error.code})`;
        if (error.details) {
          errorMessage += ` Details: ${JSON.stringify(error.details)}`;
        }
      }
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: { code: error.code || 'unknown', message: errorMessage } };
    }
  },
}));

// src/components/GeneratePayslipForm.tsx
import React, { useState } from 'react';
import { usePayslipStore } from '../store/payslipStore';

function GeneratePayslipForm() {
  const [employeeId, setEmployeeId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [grossPay, setGrossPay] = useState(0);

  const { isLoading, error, lastGeneratedPayslipId, generatePayslip } = usePayslipStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await generatePayslip({
      companyId,
      employeeId,
      periodStart,
      periodEnd,
      grossPay,
    });
    if (result?.success) {
      alert(`Payslip ${result.payslipId} generated successfully!`);
      // Clear form or redirect
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Generate Payslip</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {lastGeneratedPayslipId && <p style={{ color: 'green' }}>Last Payslip ID: {lastGeneratedPayslipId}</p>}

      <input type="text" placeholder="Company ID" value={companyId} onChange={(e) => setCompanyId(e.target.value)} required />
      <input type="text" placeholder="Employee ID" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required />
      <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
      <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
      <input type="number" placeholder="Gross Pay" value={grossPay} onChange={(e) => setGrossPay(parseFloat(e.target.value))} required />

      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Generating...' : 'Generate Payslip'}
      </button>
    </form>
  );
}

export default GeneratePayslipForm;
```

### 5.4. Best Practices for Callable Functions

*   **Input Validation**: Always validate `data` received from the client.
*   **Authorization**: Always check `context.auth` and perform granular role-based access control.
*   **Error Handling**: Use `functions.https.HttpsError` for client-facing errors.
*   **Idempotency**: Design functions to be idempotent where possible, especially for actions that might be retried.
*   **Logging**: Use `functions.logger` for debugging and monitoring.
*   **Environment Variables**: Use `functions.config()` for sensitive configuration.

---

## 6. Backend API: Firestore Database Interactions

### 6.1. Direct Client Access (via Security Rules)

For simple data retrieval and updates where complex business logic is not required, the frontend can directly interact with Firestore. This is governed entirely by Firestore Security Rules.

**Client-Side (React) Example: Fetching employee list (read-only)**

```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Your Firestore instance

export const useEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError(null);
      try {
        // Assuming 'companies/companyId/employees' is accessible by authenticated users
        const q = query(collection(db, 'companies', 'your-company-id', 'employees'));
        const querySnapshot = await getDocs(q);
        const employeeList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEmployees(employeeList);
      } catch (err: any) {
        console.error('Error fetching employees:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  return { employees, loading, error };
};
```

### 6.2. Server-Side Firestore Operations (via Functions)

When Firestore operations require elevated permissions (e.g., creating a user, modifying sensitive data bypassing client rules) or need to be part of a larger transaction, they should be performed within a Firebase Cloud Function using the Admin SDK.

**Backend (Cloud Function) Example: Creating a new company record**

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const createCompany = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  // Example: Only allow users with 'super-admin' role to create new companies
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (userDoc.data()?.role !== 'super-admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only super-admins can create companies.');
  }

  const { companyName, address } = data;
  if (!companyName) {
    throw new functions.https.HttpsError('invalid-argument', 'Company name is required.');
  }

  try {
    const newCompanyRef = await db.collection('companies').add({
      companyName,
      address,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
    });
    return { success: true, companyId: newCompanyRef.id };
  } catch (error: any) {
    functions.logger.error('Error creating company:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create company.', error.message);
  }
});
```

### 6.3. Batch Operations

For atomic updates involving multiple Firestore documents, use batched writes within Firebase Cloud Functions. This ensures that all operations succeed or fail together.

**Backend (Cloud Function) Example: Archiving multiple employee records**

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const archiveEmployees = functions.https.onCall(async (data: { companyId: string, employeeIds: string[] }, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  // Authorization check (e.g., only HR/Admin can archive employees)
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!['admin', 'hr'].includes(userDoc.data()?.role)) {
    throw new functions.https.HttpsError('permission-denied', 'You do not have permission to archive employees.');
  }

  const { companyId, employeeIds } = data;
  if (!companyId || !Array.isArray(employeeIds) || employeeIds.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Company ID and a list of employee IDs are required.');
  }

  const batch = db.batch();
  const companyRef = db.collection('companies').doc(companyId);

  for (const employeeId of employeeIds) {
    const employeeRef = companyRef.collection('employees').doc(employeeId);
    batch.update(employeeRef, {
      status: 'archived',
      archivedAt: admin.firestore.FieldValue.serverTimestamp(),
      archivedBy: context.auth.uid,
    });
  }

  try {
    await batch.commit();
    return { success: true, message: `Successfully archived ${employeeIds.length} employees.` };
  } catch (error: any) {
    functions.logger.error('Error archiving employees:', error);
    throw new functions.https.HttpsError('internal', 'Failed to archive employees in batch.', error.message);
  }
});
```

---

## 7. Frontend Integration Guidelines

### 7.1. State Management with Zustand

Zustand is used for managing application state, including API call states (loading, error) and fetched data.

*   **Store Structure**: Create dedicated stores for different feature domains (e.g., `useEmployeeStore`, `usePayslipStore`).
*   **Async Actions**: Encapsulate API calls within async actions in your Zustand stores.
*   **Loading/Error States**: Update `isLoading` and `error` states within the store actions to provide feedback to UI components.

### 7.2. Error Handling in React Components

*   **Centralized Error Mapping**: As shown in section 4.3, map raw API errors to user-friendly messages within your store actions or dedicated API utility functions.
*   **UI Feedback**: Display error messages clearly to the user (e.g., using toast notifications, inline error messages, or dedicated error pages).
*   **Retry Mechanisms**: For transient errors, consider implementing simple retry logic for API calls.

### 7.3. CORS Configuration

Firebase Cloud Functions automatically handle CORS with sensible defaults. For specific needs, you can configure CORS directly in your function, though this is often not necessary for Callable Functions.

**Example (if direct HTTP functions were used, not typically for `payroll-web`):**

```typescript
import * as functions from 'firebase-functions';
import * as cors from 'cors';

const corsHandler = cors({ origin: true }); // Allows all origins (for dev), restrict in production

export const myHttpFunction = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    // Your function logic here
    res.status(200).send('Hello from CORS enabled function!');
  });
});
```
For Callable functions, the Firebase SDK manages the necessary headers. You generally do not need to manually configure CORS for them.

---

## 8. Testing Considerations

### 8.1. Mocking API Calls with Vitest

For frontend unit and integration tests with Vitest, mock Firebase SDK functions (like `httpsCallable`, Firestore methods) to control their behavior and prevent actual network requests.

**Example: Mocking `generatePayslip` callable function**

```typescript
// src/store/payslipStore.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePayslipStore } from './payslipStore';
import { httpsCallable } from 'firebase/functions';

// Mock Firebase functions
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(() => vi.fn()), // Mock httpsCallable to return a mock function
}));

describe('usePayslipStore', () => {
  beforeEach(() => {
    // Reset Zustand state and all mocks before each test
    usePayslipStore.setState({
      isLoading: false,
      error: null,
      lastGeneratedPayslipId: null,
    });
    vi.clearAllMocks();
  });

  it('should successfully generate a payslip', async () => {
    const mockGeneratePayslip = vi.fn(() =>
      Promise.resolve({
        data: { success: true, payslipId: 'newPayslip123', message: 'Payslip generated.' },
      })
    );
    (httpsCallable as vi.Mock).mockReturnValue(mockGeneratePayslip); // Make httpsCallable return our mock

    const { generatePayslip } = usePayslipStore.getState();

    const payslipData = {
      companyId: 'comp1',
      employeeId: 'emp1',
      periodStart: '2023-01-01',
      periodEnd: '2023-01-31',
      grossPay: 5000,
    };

    const result = await generatePayslip(payslipData);

    expect(mockGeneratePayslip).toHaveBeenCalledWith(payslipData);
    expect(usePayslipStore.getState().isLoading).toBe(false);
    expect(usePayslipStore.getState().error).toBeNull();
    expect(usePayslipStore.getState().lastGeneratedPayslipId).toBe('newPayslip123');
    expect(result?.success).toBe(true);
  });

  it('should handle API error when generating payslip', async () => {
    const mockError = {
      code: 'invalid-argument',
      message: 'Missing required fields',
      details: { missingFields: ['grossPay'] },
    };
    const mockGeneratePayslip = vi.fn(() =>
      Promise.reject({
        code: mockError.code,
        message: mockError.message,
        details: mockError.details,
      })
    );
    (httpsCallable as vi.Mock).mockReturnValue(mockGeneratePayslip);

    const { generatePayslip } = usePayslipStore.getState();

    const payslipData = {
      companyId: 'comp1',
      employeeId: 'emp1',
      periodStart: '2023-01-01',
      periodEnd: '2023-01-31',
      grossPay: 0, // Invalid input
    };

    const result = await generatePayslip(payslipData);

    expect(mockGeneratePayslip).toHaveBeenCalledWith(payslipData);
    expect(usePayslipStore.getState().isLoading).toBe(false);
    expect(usePayslipStore.getState().error).toContain('Missing required fields');
    expect(usePayslipStore.getState().lastGeneratedPayslipId).toBeNull();
    expect(result?.success).toBe(false);
    expect(result?.error?.code).toBe('invalid-argument');
  });
});
```

---

## 9. Appendix

### 9.1. Key Collections and Data Models (Conceptual)

This section outlines the primary Firestore collections and their expected structure.

*   **`/users/{userId}`**: User profiles, linked to Firebase Auth `uid`.
    *   `email`: string
    *   `displayName`: string
    *   `role`: 'admin' | 'hr' | 'employee' | 'super-admin'
    *   `companyId`: string (reference to the company the user belongs to)
    *   `createdAt`: Timestamp
*   **`/companies/{companyId}`**: Company-specific information.
    *   `name`: string
    *   `address`: string
    *   `contactEmail`: string
    *   `createdAt`: Timestamp
*   **`/companies/{companyId}/employees/{employeeId}`**: Employee details.
    *   `userId`: string (optional, if employee is also a user)
    *   `firstName`: string
    *   `lastName`: string
    *   `email`: string
    *   `hireDate`: Timestamp
    *   `jobTitle`: string
    *   `salary`: number
    *   `status`: 'active' | 'archived'
    *   `createdAt`: Timestamp
*   **`/companies/{companyId}/employees/{employeeId}/timeEntries/{timeEntryId}`**: Records of employee work hours.
    *   `clockIn`: Timestamp
    *   `clockOut`: Timestamp | null
    *   `durationMinutes`: number | null
    *   `status`: 'open' | 'closed'
    *   `createdAt`: Timestamp
*   **`/companies/{companyId}/employees/{employeeId}/payslips/{payslipId}`**: Generated payslips.
    *   `periodStart`: Timestamp
    *   `periodEnd`: Timestamp
    *   `grossPay`: number
    *   `netPay`: number
    *   `taxes`: number
    *   `deductions`: number
    *   `status`: 'generated' | 'paid' | 'void'
    *   `generatedAt`: Timestamp
    *   `generatedBy`: string (userId)

---

_Documentation generated by [create-agent-docs](https://github.com/chesteralan/create-agent-docs) v0.0.0 on 2026-05-25._
