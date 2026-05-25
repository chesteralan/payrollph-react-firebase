<!-- template-version: 0.0.0 -->

# Codebase Map — payroll-web

This document provides a comprehensive map of the `payroll-web` project's directory structure, detailing the purpose and context of key folders and files. As a web-based payroll management system for small-to-medium businesses, it handles employee management, time tracking, payroll computation, government remittance reporting, and payslip generation. This map is crucial for onboarding new developers, understanding architectural decisions, and maintaining consistency across the codebase.

## 🌐 Overall Architecture Overview

`payroll-web` is a Single Page Application (SPA) built with the following core technologies:

*   **Frontend:** [React](https://react.dev/) with [Vite](https://vitejs.dev/) for a fast development experience and optimized builds.
*   **Backend & Database:** [Firebase](https://firebase.google.com/) serves as our primary backend, utilizing:
    *   **Firestore:** A NoSQL cloud database for storing all application data (employees, time entries, payroll records, users, etc.).
    *   **Firebase Authentication:** Handles user registration, login, and session management.
*   **State Management:** [Zustand](https://zustand-bear.github.io/blog/) for lightweight and flexible global state management.
*   **Testing:** [Vitest](https://vitest.dev/) for unit and integration testing of components, hooks, and utility functions.
*   **Package Management:** [yarn](https://yarnpkg.com/) for managing project dependencies.

This architecture provides a scalable, real-time, and secure foundation for managing payroll operations.

## 📂 Project Structure

The `payroll-web` project adheres to a clear, feature-sliced directory structure to promote maintainability and scalability. Below is an overview of the main folders and files:

```txt
payroll-web/
├── .firebase/                 # Firebase Emulators and local project configuration
├── .github/                   # GitHub Actions workflows for CI/CD
├── public/                    # Static assets served directly by Vite (e.g., favicon, robots.txt)
├── docs/                      # Project documentation, architectural decisions, and AI agent resources
├── src/                       # All application source code
│   ├── api/                   # Centralized modules for interacting with Firebase/Firestore
│   ├── assets/                # Static assets specific to components (e.g., local images, icons, CSS variables)
│   ├── components/            # Reusable React UI components
│   │   ├── auth/              # Authentication-related components (e.g., LoginForm, AuthProvider)
│   │   ├── forms/             # Generic and specific form elements
│   │   └── common/            # Highly reusable, generic UI components (e.g., Button, Modal)
│   ├── hooks/                 # Custom React hooks for encapsulating logic (e.g., useAuth, useFirestoreDoc)
│   ├── layouts/               # High-level layout components (e.g., DashboardLayout, AuthLayout)
│   ├── pages/                 # Route-specific components that define application views
│   │   ├── auth/              # Authentication-related pages (e.g., LoginPage, RegisterPage)
│   │   ├── dashboard/         # Main application dashboard and overview pages
│   │   └── employees/         # Employee management pages (e.g., EmployeeList, EmployeeDetails)
│   ├── store/                 # Zustand global state management modules
│   │   ├── authStore.ts       # Manages authentication state (user, token, login status)
│   │   └── payrollStore.ts    # Manages payroll-related data and computations
│   ├── types/                 # TypeScript type definitions and interfaces for data models
│   ├── utils/                 # General utility functions (e.g., date formatters, validators, helper functions)
│   ├── App.tsx                # Main application component, sets up routing (React Router)
│   └── main.tsx               # Client entry point for the Vite application
├── tests/                     # Vitest test files for components, hooks, and utilities
├── .env.development           # Environment variables for development
├── .env.production            # Environment variables for production
├── firebase.json              # Firebase project configuration (hosting, Firestore rules, functions, emulators)
├── vite.config.ts             # Vite build configuration (plugins, aliases, proxy)
├── package.json               # Project metadata, dependencies, and scripts (managed by yarn)
├── tsconfig.json              # TypeScript compiler configuration
└── yarn.lock                  # Exact dependency versions (managed by yarn)
```

## 🔍 Key Directories and Files

This section provides a more detailed explanation of the purpose and expected content for the most important directories and files within `payroll-web`.

### Top-Level Directories

#### `docs/`
This directory serves as the central repository for all project documentation. It includes architectural decisions, API specifications, onboarding guides, and any resources designed for both human developers and potential AI agents interacting with the codebase.
*   **Key Content:** READMEs, architectural decision records (ADRs), API documentation, glossary.
*   **Guidance:** Keep these files updated whenever significant changes are made to the codebase, architecture, or dependencies.

#### `public/`
Contains static assets that are served directly by Vite without being processed by the build pipeline. This is ideal for files like `favicon.ico`, `robots.txt`, and other assets that don't require bundling or transformation.
*   **Example:** `public/favicon.ico`
*   **Guidance:** Avoid placing large or frequently changing assets here if they could benefit from Vite's asset processing (e.g., image optimization, hashing).

#### `src/`
The core application source code. All frontend logic, UI components, state management, and Firebase interactions reside here.

##### `src/api/`
Houses modules responsible for interacting with Firebase services, primarily Firestore and Firebase Authentication. This layer abstracts away the direct Firebase SDK calls from UI components and business logic.
*   **Purpose:** Centralize data fetching, mutations, and authentication calls.
*   **Example (`src/api/employees.ts`):**
    ```typescript
    import { db } from '../firebaseConfig'; // Assuming firebaseConfig setup
    import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
    import { Employee } from '../types/employee';

    const employeesCollection = collection(db, 'employees');

    export const fetchEmployees = async (): Promise<Employee[]> => {
      const snapshot = await getDocs(employeesCollection);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
    };

    export const addEmployee = async (employee: Omit<Employee, 'id'>) => {
      await addDoc(employeesCollection, employee);
    };

    // ... other CRUD operations
    ```

##### `src/assets/`
For static assets that are referenced within components or processed by Vite's build pipeline. This includes images, icons, and global CSS files or variables.
*   **Example:** `src/assets/logo.svg`, `src/assets/styles/variables.css`

##### `src/components/`
Contains reusable UI components built with React. Components should be atomic, focused on a single responsibility, and ideally stateless or manage only their own internal state.
*   **Structure:** Each component typically resides in its own folder (e.g., `src/components/Button/`) containing `Button.tsx`, `Button.module.css` (or styled-components file), and potentially `index.ts` for export.
*   **Example (`src/components/common/Button/Button.tsx`):**
    ```tsx
    import React from 'react';
    import styles from './Button.module.css';

    interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
      variant?: 'primary' | 'secondary' | 'danger';
      children: React.ReactNode;
    }

    const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, ...props }) => {
      return (
        <button className={`${styles.button} ${styles[variant]}`} {...props}>
          {children}
        </button>
      );
    };

    export default Button;
    ```
*   **Guidance:** Strive for presentational components that receive data via props and emit events via callbacks.

##### `src/hooks/`
Houses custom React hooks to encapsulate reusable stateful logic or side effects. This promotes code reuse and separation of concerns, especially for interacting with Firebase Auth or Firestore.
*   **Example (`src/hooks/useAuth.ts`):**
    ```typescript
    import { useState, useEffect } from 'react';
    import { auth } from '../firebaseConfig'; // Assuming firebaseConfig setup
    import { User, onAuthStateChanged } from 'firebase/auth';

    export const useAuth = () => {
      const [user, setUser] = useState<User | null>(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });
        return () => unsubscribe(); // Cleanup subscription
      }, []);

      return { user, loading };
    };
    ```

##### `src/layouts/`
Components that define the overall structure and common UI elements for different sections of the application (e.g., a dashboard layout with a sidebar and header, or a simpler layout for authentication pages).
*   **Example:** `src/layouts/DashboardLayout.tsx`

##### `src/pages/`
Components that represent distinct views or routes in the application. These pages typically compose multiple `src/components/` and `src/layouts/` to form a complete UI.
*   **Structure:** Similar to components, pages can be organized into subfolders based on feature (e.g., `src/pages/employees/EmployeeListPage.tsx`).
*   **Guidance:** Pages often handle data fetching (via `src/api/` and `src/hooks/`) and orchestrate state updates (via `src/store/`).

##### `src/store/`
Contains Zustand store definitions for global application state. Each store should manage a specific domain of the application's state.
*   **Purpose:** Centralized, reactive state management for data shared across multiple components.
*   **Example (`src/store/authStore.ts`):**
    ```typescript
    import { create } from 'zustand';
    import { User } from 'firebase/auth';

    interface AuthState {
      user: User | null;
      isAuthenticated: boolean;
      setUser: (user: User | null) => void;
      clearUser: () => void;
    }

    export const useAuthStore = create<AuthState>((set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearUser: () => set({ user: null, isAuthenticated: false }),
    }));
    ```

##### `src/types/`
Dedicated to TypeScript type definitions and interfaces. This ensures strong typing across the application, improving code quality and maintainability.
*   **Example (`src/types/employee.ts`):**
    ```typescript
    export interface Employee {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      position: string;
      hireDate: Date;
      // ... other employee fields
    }
    ```

##### `src/utils/`
A collection of general-purpose utility functions that are not specific to any single component, hook, or store. This includes helpers for date formatting, input validation, data transformations, etc.
*   **Example:** `src/utils/dateUtils.ts`, `src/utils/validation.ts`

#### `src/App.tsx`
The main application component. This is where global providers (e.g., React Router, Zustand context if needed, Firebase Auth context), the primary routing logic, and potentially global error boundaries are set up.

#### `src/main.tsx`
The client-side entry point for the Vite application. It's responsible for rendering the root `App` component into the DOM.

### Testing Directory

#### `tests/`
Contains all unit and integration tests for the application, powered by Vitest. Tests should mirror the structure of `src/` to easily locate tests for specific modules.
*   **Structure:** `tests/components/Button.test.tsx`, `tests/hooks/useAuth.test.ts`, etc.
*   **Guidance:** Aim for comprehensive test coverage for critical components, hooks, and utility functions.
*   **Running Tests:**
    ```bash
    yarn test
    # Run tests in watch mode
    yarn test --watch
    # Run tests with UI for debugging
    yarn test --ui
    ```

### Root-Level Configuration Files

#### `.env.*` files
Environment variable files (e.g., `.env.development`, `.env.production`). These files store configuration specific to different deployment environments, such as Firebase API keys, project IDs, etc.
*   **Guidance:** **NEVER commit sensitive production credentials** directly into source control. Use environment variables and secure deployment practices.
*   **Example (`.env.development`):**
    ```
    VITE_FIREBASE_API_KEY=AIzaSy...
    VITE_FIREBASE_AUTH_DOMAIN=payroll-web-dev.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=payroll-web-dev
    ```

#### `firebase.json`
The main configuration file for Firebase projects. It defines hosting settings, Firestore security rules, Firebase Functions deployments (if applicable), emulator configurations, and more.
*   **Example (excerpt):**
    ```json
    {
      "hosting": {
        "public": "dist",
        "ignore": [
          "firebase.json",
          "**/.*",
          "**/node_modules/**"
        ],
        "rewrites": [
          {
            "source": "**",
            "destination": "/index.html"
          }
        ]
      },
      "firestore": {
        "rules": "firestore.rules",
        "indexes": "firestore.indexes.json"
      },
      "emulators": {
        "auth": { "port": 9099 },
        "firestore": { "port": 8080 },
        "ui": { "port": 4000 }
      }
    }
    ```

#### `package.json`
Defines the project's metadata, scripts, and dependencies. Managed by `yarn`.
*   **Key Scripts:**
    *   `"dev"`: Starts the Vite development server.
    *   `"build"`: Builds the application for production.
    *   `"preview"`: Serves the production build locally.
    *   `"test"`: Runs Vitest tests.
    *   `"lint"`: Runs ESLint for code quality checks.
*   **Example (excerpt):**
    ```json
    {
      "name": "payroll-web",
      "version": "0.1.0",
      "private": true,
      "scripts": {
        "dev": "vite",
        "build": "tsc && vite build",
        "preview": "vite preview",
        "test": "vitest",
        "lint": "eslint src/**/*.{js,jsx,ts,tsx}"
      },
      "dependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "firebase": "^10.0.0",
        "zustand": "^4.0.0",
        "react-router-dom": "^6.0.0"
      },
      "devDependencies": {
        "@types/react": "^18.2.15",
        "@types/react-dom": "^18.2.7",
        "@vitejs/plugin-react": "^4.0.3",
        "typescript": "^5.0.2",
        "vite": "^4.4.5",
        "vitest": "^0.34.0",
        "eslint": "^8.45.0"
      }
    }
    ```
*   **Running Commands:**
    ```bash
    yarn dev    # Start development server
    yarn build  # Build for production
    yarn test   # Run tests
    ```

#### `tsconfig.json`
TypeScript compiler configuration file. It defines how TypeScript files are compiled, including target ECMAScript version, module resolution, and strictness rules.
*   **Guidance:** Maintain strict type checking to leverage TypeScript's benefits.

#### `vite.config.ts`
Configuration file for Vite, the build tool. It handles plugins, aliases, build options, and development server settings.
*   **Example (basic):**
    ```typescript
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';

    export default defineConfig({
      plugins: [react()],
      resolve: {
        alias: {
          '@': '/src', // Example alias for easier imports
        },
      },
      server: {
        port: 3000,
      },
    });
    ```

### 🔒 Firebase Security and Data Access

While Firebase provides client-side SDKs that enable direct interaction with Firestore and Authentication from the frontend, it's critical to manage data access securely.

*   **Firestore Security Rules:** All data access (read, write, update, delete) to Firestore collections must be governed by [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started). These rules are defined in `firestore.rules` (referenced by `firebase.json`) and run on the Firebase server, preventing unauthorized data manipulation directly from the client.
    *   **Guidance:** Design rules to enforce user authentication, role-based access, and data ownership. For example, a user should only be able to read their own payroll data.
*   **Client-Side SDK Usage:** The `src/api/` and `src/hooks/` directories are responsible for orchestrating interactions with Firebase SDKs. While client-side, these interactions are constrained by the server-side security rules.
*   **Environment Variables:** Sensitive API keys and configuration should be stored in `.env` files and accessed via Vite's environment variable loading mechanism (e.g., `import.meta.env.VITE_FIREBASE_API_KEY`). These are exposed in the client bundle, but their purpose is to connect to a specific Firebase project which then enforces security via rules.
*   **No Server-Side Backend for Sensitive Logic (Currently):** As `payroll-web` currently relies solely on Firebase client SDKs and Firestore security rules, there isn't a custom Node.js/Python backend server. If complex, sensitive business logic (e.g., integrating with external payment gateways, highly confidential computations) were required, Firebase Cloud Functions would be the recommended approach to execute server-side code securely.
