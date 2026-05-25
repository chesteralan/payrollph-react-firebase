<!-- template-version: 0.0.0 -->

# Features — payroll-web

This document provides a comprehensive overview of the **payroll-web** project, detailing its core technologies, application features, and development roadmap.

**Project Description:**
**payroll-web** is an SMB Payroll web-based management system designed for small-to-medium businesses. It streamlines essential HR and finance operations, including employee management, time tracking, payroll computation, government remittance reporting, and payslip generation.

## 🚀 Key Technologies & Implementation Details

This section outlines the primary technologies powering `payroll-web` and their specific roles within the project.

### Frontend: React & Vite
The user interface (UI) of `payroll-web` is built using **React**, a declarative JavaScript library for building interactive UIs, paired with **Vite**, a next-generation frontend tooling that provides an extremely fast development experience.

**Key Aspects:**
*   **Component-Based Architecture:** UI is structured into reusable React components, promoting modularity and maintainability.
*   **Rapid Development:** Vite offers lightning-fast Hot Module Replacement (HMR) and an optimized build process, significantly accelerating development cycles.
*   **Modern JavaScript:** Leverages ES modules and modern browser features.

**Example: Basic React Component (`src/components/Greeting.jsx`)**
```jsx
import React from 'react';

function Greeting({ name }) {
  return (
    <h1 className="text-2xl font-bold">Hello, {name}! Welcome to payroll-web.</h1>
  );
}

export default Greeting;
```

**Vite Configuration (`vite.config.js`):**
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
  },
});
```

### Backend & Database: Firebase & Firestore
**payroll-web** leverages **Firebase** as its comprehensive backend platform, providing scalable and managed services. **Firestore**, Firebase's NoSQL document database, handles all data persistence.

**Key Aspects:**
*   **Serverless Architecture:** Reduces operational overhead, allowing developers to focus on application logic.
*   **Real-time Data Sync:** Firestore offers real-time listeners, enabling responsive UI updates as data changes (e.g., updating timesheets, payroll status).
*   **Scalability:** Designed to scale automatically with user demand, handling various SMB sizes.
*   **Cloud Functions:** For server-side logic, such as complex payroll computations, scheduled tasks (e.g., monthly payroll runs), or integrations with external APIs, Firebase Cloud Functions will be utilized.

**Example: Initializing Firebase (`src/firebase.js`)**
```javascript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration (typically loaded from environment variables)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

**Example: Storing Employee Data in Firestore**
```javascript
import { collection, addDoc } from "firebase/firestore";
import { db } from './firebase'; // Assuming firebase.js is set up

const addEmployee = async (employeeData) => {
  try {
    const docRef = await addDoc(collection(db, "employees"), {
      name: employeeData.name,
      position: employeeData.position,
      salary: employeeData.salary,
      // ...other employee details
      createdAt: new Date()
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};
```

### Authentication: Firebase Authentication
User authentication and authorization are managed by **Firebase Authentication**. This service provides secure and easy-to-implement authentication methods.

**Key Aspects:**
*   **Multiple Providers:** Supports email/password, Google, and potentially other providers for flexible login options for administrators and employees.
*   **Secure User Management:** Handles user creation, session management, and password resets securely.
*   **Role-Based Access Control:** Firebase Security Rules for Firestore and Cloud Functions will be used to implement granular role-based access control (RBAC) to ensure users can only access data and perform actions relevant to their roles (e.g., admin vs. employee).

**Example: User Login with Email and Password**
```javascript
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from './firebase'; // Assuming firebase.js is set up

const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Signed in
    const user = userCredential.user;
    console.log("User logged in:", user);
    return user;
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("Login error:", errorCode, errorMessage);
    throw error;
  }
};
```

### State Management: Zustand
Application-wide state is managed using **Zustand**, a small, fast, and scalable state-management solution for React. Its hook-based API provides a simple yet powerful way to manage global state.

**Key Aspects:**
*   **Lightweight & Unopinionated:** Minimal boilerplate and highly flexible.
*   **React Hooks Integration:** Seamlessly integrates with React's functional components.
*   **Performance:** Optimized for re-renders, ensuring a smooth user experience.

**Example: Authentication Store (`src/stores/authStore.js`)**
```javascript
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, loading: false }),
  logout: () => set({ user: null, isAuthenticated: false, loading: false }),
  setLoading: (status) => set({ loading: status }),
}));
```

### Testing: Vitest
Unit and component testing is conducted using **Vitest**, a fast unit-test framework powered by Vite. It offers excellent compatibility with the existing Vite setup.

**Key Aspects:**
*   **Vite Native:** Shares Vite's configuration and transforms, leading to a consistent and fast testing environment.
*   **Jest Compatible API:** Familiar syntax for developers experienced with Jest.
*   **Watch Mode:** Provides instant feedback during development.

**Example: Simple Utility Function Test (`src/utils/payroll.test.js`)**
```javascript
// src/utils/payroll.js
export const calculateGrossPay = (hourlyRate, hoursWorked) => {
  if (hourlyRate < 0 || hoursWorked < 0) {
    throw new Error("Inputs must be non-negative.");
  }
  return hourlyRate * hoursWorked;
};

// src/utils/payroll.test.js
import { describe, it, expect } from 'vitest';
import { calculateGrossPay } from './payroll';

describe('calculateGrossPay', () => {
  it('should calculate gross pay correctly for positive inputs', () => {
    expect(calculateGrossPay(10, 40)).toBe(400);
  });

  it('should return 0 if hours worked is 0', () => {
    expect(calculateGrossPay(15, 0)).toBe(0);
  });

  it('should throw an error for negative hourly rate', () => {
    expect(() => calculateGrossPay(-10, 40)).toThrow("Inputs must be non-negative.");
  });

  it('should throw an error for negative hours worked', () => {
    expect(() => calculateGrossPay(10, -5)).toThrow("Inputs must be non-negative.");
  });
});
```

### Package Management: Yarn
**Yarn** is used as the package manager for `payroll-web`, ensuring consistent dependency management and efficient installation.

**Common Commands:**
*   `yarn install`: Installs all project dependencies.
*   `yarn dev`: Starts the development server (configured via Vite).
*   `yarn build`: Builds the project for production.
*   `yarn test`: Runs the test suite (configured via Vitest).
*   `yarn add [package]`: Adds a new dependency.
*   `yarn remove [package]`: Removes a dependency.

## ✨ Core Application Features

**payroll-web** is designed to provide a comprehensive payroll management solution for SMBs, encompassing the following key functionalities:

*   **Employee Management:**
    *   Secure creation, viewing, updating, and deactivation of employee profiles.
    *   Storage of essential employee data: personal details, contact information, employment history, salary information, tax identifiers, and bank details for direct deposit.
    *   Role assignment (e.g., Administrator, Employee) for access control.

*   **Time Tracking:**
    *   Employees can log their daily work hours, including clock-in/clock-out times and breaks.
    *   Support for different work schedules and overtime calculation.
    *   Administrator approval workflow for submitted timesheets.

*   **Payroll Computation:**
    *   Automated calculation of gross pay based on recorded time and salary/hourly rates.
    *   Computation of deductions: taxes (federal, state, local), social security, Medicare, and other voluntary deductions (e.g., health insurance premiums, retirement contributions).
    *   Support for various pay frequencies (weekly, bi-weekly, semi-monthly, monthly).
    *   Generation of payroll registers and reports for audit and review.

*   **Government Remittance Reporting:**
    *   Generation of reports required for government remittances (e.g., tax forms like W-2, 940, 941, state unemployment insurance).
    *   Tracking of employer contributions (e.g., FICA, unemployment).

*   **Payslip Generation:**
    *   Automated generation of detailed payslips for each employee.
    *   Payslips will include gross pay, itemized deductions, net pay, and year-to-date totals.
    *   Secure distribution of payslips to employees (e.g., via a portal or email).

## 🛠️ Development Workflow & Setup

To get started with `payroll-web` development:

1.  **Clone the Repository:**
    ```bash
    git clone [repository-url]
    cd payroll-web
    ```
2.  **Install Dependencies:**
    ```bash
    yarn install
    ```
3.  **Firebase Project Setup:**
    *   Create a new Firebase project in the [Firebase Console](https://console.firebase.google.com/).
    *   Enable Firebase Authentication (Email/Password provider).
    *   Enable Firestore in Native mode.
    *   Register a web app in your Firebase project settings and copy its configuration.
    *   Create a `.env` file in the project root and add your Firebase configuration, prefixed with `VITE_`:
        ```env
        VITE_FIREBASE_API_KEY="YOUR_API_KEY"
        VITE_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
        VITE_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
        VITE_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
        VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
        VITE_FIREBASE_APP_ID="YOUR_APP_ID"
        ```
    *   Ensure `src/firebase.js` uses these environment variables via `import.meta.env`.
    *   Install Firebase CLI globally: `npm install -g firebase-tools`
    *   Login to Firebase via CLI: `firebase login`

4.  **Start Development Server:**
    ```bash
    yarn dev
    ```
    This will typically open the application in your browser at `http://localhost:3000`.

5.  **Run Tests:**
    ```bash
    yarn test
    ```

## 🗺️ Feature Roadmap

This roadmap outlines the planned and in-progress development items for `payroll-web`.

| Feature                  | Priority | Status         | Description                                                               |
| :----------------------- | :------- | :------------- | :------------------------------------------------------------------------ |
| Project scaffolding      | P0       | ✅ Done        | Initial setup of the repository, basic file structure, and configuration. |
| Core documentation       | P0       | ✅ Done        | Establishment of foundational documentation like this file.               |
| React + Vite integration | P1       | 🚧 In Progress | Setting up the frontend development environment and core UI components.   |
| Firebase API setup       | P1       | ⬜ Planned     | Configuration of Firebase services and initial backend logic.             |
| Firestore integration    | P1       | ⬜ Planned     | Designing the database schema and implementing basic CRUD operations.     |
| User Authentication      | P1       | ⬜ Planned     | Implementing user login, registration, and session management.            |
| Employee Profile Module  | P2       | ⬜ Planned     | UI and backend for managing employee records.                             |
| Basic Time Tracking      | P2       | ⬜ Planned     | Core functionality for employees to log hours.                            |

---

_This document is regularly updated to reflect the current state of the project's features and roadmap._
