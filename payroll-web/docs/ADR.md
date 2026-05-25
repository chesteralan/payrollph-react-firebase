<!-- template-version: 0.0.0 -->

# Architecture Decision Records — payroll-web

_Generated 2026-05-25 — v0.0.0_
This document tracks architectural decisions made for **payroll-web**, an SMB Payroll management system.

---

## ADR-001: Project Setup

*   **Date**: 2026-05-25
*   **Status**: Accepted
*   **Context**: The `payroll-web` project requires a modern, scalable, and maintainable foundation for developing an SMB Payroll management system. Key considerations include rapid development, efficient data management, secure authentication, and a responsive user interface capable of handling features like employee management, time tracking, payroll computation, government remittance reporting, and payslip generation. The goal is to minimize infrastructure overhead and accelerate feature delivery.
*   **Decision**:
    *   **Frontend**: React.js with Vite for development and bundling.
    *   **Backend & Authentication**: Firebase (leveraging Firebase Authentication for user management and Firebase Cloud Functions for serverless logic).
    *   **Database**: Firestore (NoSQL, real-time document database).
    *   **Package Manager**: Yarn.
    *   **Testing**: Vitest for unit and component testing.
*   **Rationale**:
    *   **React + Vite**: Chosen for its modern component-based architecture, extensive community support, and excellent developer experience. Vite provides incredibly fast hot module reloading and build times, significantly accelerating the frontend development cycle. This combination is ideal for building the interactive and complex UIs required for a comprehensive payroll system.
    *   **Firebase**: Offers a comprehensive suite of backend services that are fully managed and scale automatically. This significantly reduces the operational overhead and allows the development team to focus on application features rather than infrastructure. Firebase Auth provides secure, ready-to-use authentication, and Cloud Functions allow for serverless execution of backend logic (e.g., complex payroll computations, scheduled remittance reports).
    *   **Firestore**: A highly scalable, flexible NoSQL database that offers real-time data synchronization. This is crucial for features like live time tracking updates, immediate reflection of payroll adjustments, or real-time status updates. Its document-based model is well-suited for storing diverse data like employee profiles, time entries, payroll records, and company settings.
    *   **Yarn**: Preferred for its speed, reliability, and consistent dependency management, ensuring reproducible builds across development environments.
    *   **Vitest**: Chosen for its speed, compatibility with Vite projects, and Jest-like API, making it easy to write and run tests for React components and utility functions.
*   **Alternatives Considered**:
    *   **Frontend**: Next.js (considered overkill for initial Single Page Application needs, though could be revisited for SEO-heavy marketing pages). Vue.js (less team familiarity compared to React).
    *   **Backend**: Node.js/Express with PostgreSQL (higher operational overhead, slower initial setup). AWS Amplify (similar benefits but Firebase offers more streamlined integration for this project's specific needs and existing Google ecosystem preferences).
    *   **Database**: PostgreSQL/MySQL (relational databases, higher setup/management complexity for initial phases). MongoDB Atlas (similar to Firestore but Firebase integration is tighter).
*   **Consequences**:
    *   **Positive**: Rapid prototyping and development due to integrated services and excellent developer experience. Serverless architecture reduces infrastructure management and scales automatically. Real-time capabilities enhance user experience for critical data. Strong community support for all chosen technologies.
    *   **Negative**: Vendor lock-in with Firebase. Potential cost implications at very high scale (though Firebase's free tier and initial pricing are generous). NoSQL database design requires careful schema planning to avoid denormalization issues and ensure data integrity, especially for financial data.
*   **Implementation Notes**:
    *   **Project Initialization**:
        ```bash
        # Initialize a new React + TypeScript project with Vite
        yarn create vite payroll-web --template react-ts
        cd payroll-web
        yarn install
        ```
    *   **Firebase Initialization**:
        1.  Install Firebase CLI: `npm install -g firebase-tools`
        2.  Log in to Google account: `firebase login`
        3.  Initialize project in the root directory: `firebase init`
            *   Select features: Firestore, Functions, Hosting, Emulators.
            *   Choose an existing Firebase project or create a new one.
            *   Configure `firestore.rules`, `firestore.indexes.json`, `firebase.json` as prompted.
    *   **Firebase Configuration (`src/firebase.ts`)**:
        ```typescript
        // src/firebase.ts
        import { initializeApp } from 'firebase/app';
        import { getAuth } from 'firebase/auth';
        import { getFirestore } from 'firebase/firestore';
        import { getFunctions } from 'firebase/functions';

        // Your web app's Firebase configuration
        // Use environment variables for production deployments
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
        export const auth = getAuth(app);
        export const db = getFirestore(app);
        export const functions = getFunctions(app); // For calling Cloud Functions
        // Export other services as needed (e.g., storage, performance, analytics)
        ```
    *   **Environment Variables (`.env` file in project root)**:
        ```
        VITE_FIREBASE_API_KEY="your_api_key_here"
        VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
        VITE_FIREBASE_PROJECT_ID="your-project-id"
        VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
        VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
        VITE_FIREBASE_APP_ID="your_app_id"
        ```
    *   **Recommended Project Structure**:
        ```
        payroll-web/
        ├── public/
        ├── src/
        │   ├── assets/           // Images, icons, static files
        │   ├── components/       // Reusable UI components (e.g., Button, Modal, DataTable)
        │   ├── features/         // Feature-centric modules (e.g., employee-management, time-tracking)
        │   │   ├── employee-management/
        │   │   │   ├── components/
        │   │   │   ├── hooks/
        │   │   │   ├── services/
        │   │   │   ├── stores/
        │   │   │   └── index.ts  // Feature entry point
        │   ├── pages/            // Top-level page components (e.g., Dashboard, Employees, Payroll)
        │   ├── services/         // Global API interactions, Firebase helpers
        │   ├── stores/           // Global Zustand stores (e.g., authStore)
        │   ├── hooks/            // Global custom React hooks
        │   ├── utils/            // Utility functions, helpers (e.g., date formatting, validators)
        │   ├── types/            // TypeScript type definitions
        │   ├── firebase.ts       // Firebase initialization and service exports
        │   ├── App.tsx           // Main application component, routing
        │   ├── main.tsx          // Entry point for React app
        │   └── index.css         // Global styles
        ├── .env                  // Environment variables
        ├── firebase.json         // Firebase project configuration
        ├── package.json
        ├── tsconfig.json
        ├── vite.config.ts
        ├── vitest.config.ts      // Vitest configuration
        └── ...
        ```

---

## ADR-002: State Management

*   **Date**: 2026-05-25
*   **Status**: Accepted
*   **Context**: The `payroll-web` application requires a robust yet simple solution for managing global and shared application state. This includes user authentication status, employee data, time entries, payroll computation parameters, UI flags (e.g., loading states, modals), and form data. The chosen solution must integrate seamlessly with React, be performant, and minimize boilerplate to accelerate development of complex features.
*   **Decision**: Utilize **Zustand** for all global and shared state management within the React application.
*   **Rationale**:
    *   **Simplicity & Minimal Boilerplate**: Zustand provides a lean, hooks-based API that is easy to learn and use. It avoids the complexity and boilerplate often associated with Redux, making development faster and codebases cleaner.
    *   **Performance**: Zustand is designed to be highly performant. It re-renders only components that subscribe to specific state changes, minimizing unnecessary updates and ensuring a smooth user experience even with frequent data changes (e.g., time tracking).
    *   **Flexibility & Modularity**: It allows for creating multiple, independent stores, which helps in organizing state logically by feature or domain (e.g., `useAuthStore`, `useEmployeeStore`, `useTimeTrackingStore`). This promotes modularity and easier maintenance.
    *   **Developer Experience**: Its API is intuitive and feels natural for React developers familiar with hooks, reducing the learning curve.
    *   **Integration with React**: Zustand integrates effortlessly with React functional components and hooks.
*   **Alternatives Considered**:
    *   **React Context API**: While suitable for simpler, localized state, it can lead to performance issues with frequent updates to large contexts and can become cumbersome for deeply nested state or complex actions. It also lacks built-in memoization for selectors.
    *   **Redux Toolkit**: A powerful and mature solution, but considered overkill for the initial phase of `payroll-web` given its added complexity, boilerplate (even with RTK's abstractions), and larger bundle size compared to Zustand.
    *   **Jotai / Recoil**: Similar to Zustand in philosophy (atom-based), but Zustand's API was perceived as slightly more straightforward for the team's initial needs and mental model.
*   **Consequences**:
    *   **Positive**: Faster development of stateful features. Reduced bundle size compared to heavier alternatives. Easier to test individual stores. Clear separation of concerns for different parts of the application state. Promotes a functional approach to state updates.
    *   **Negative**: Less opinionated structure than Redux, requiring developers to establish and adhere to conventions for actions and state updates to maintain consistency across the project. For extremely complex, highly interconnected global state graphs, a more opinionated library might offer more guardrails (though Zustand's middleware can address many such needs).
*   **Implementation Notes**:
    *   **Installation**:
        ```bash
        yarn add zustand
        ```
    *   **Example Authentication Store (`src/stores/authStore.ts`)**:
        ```typescript
        // src/stores/authStore.ts
        import { create } from 'zustand';
        import { User } from 'firebase/auth'; // Firebase User type

        interface AuthState {
          user: User | null;
          isLoading: boolean;
          error: string | null;
          setUser: (user: User | null) => void;
          setLoading: (loading: boolean) => void;
          setError: (error: string | null) => void;
          // You might add login/logout actions here or delegate to a service
        }

        export const useAuthStore = create<AuthState>((set) => ({
          user: null,
          isLoading: true, // Initial state: loading to check auth status
          error: null,
          setUser: (user) => set({ user, isLoading: false, error: null }),
          setLoading: (loading) => set({ isLoading: loading }),
          setError: (error) => set({ error, isLoading: false }),
        }));
        ```
    *   **Consuming State in a Component**:
        ```typescript jsx
        // src/components/AuthStatusDisplay.tsx
        import { useEffect } from 'react';
        import { useAuthStore } from '../stores/authStore';
        import { auth } from '../firebase'; // Import Firebase auth instance

        const AuthStatusDisplay: React.FC = () => {
          const { user, isLoading, error, setUser, setLoading, setError } = useAuthStore();

          useEffect(() => {
            // Subscribe to Firebase auth state changes
            const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
              setLoading(true); // Indicate auth status is being checked
              if (firebaseUser) {
                // User is signed in.
                setUser(firebaseUser);
              } else {
                // User is signed out.
                setUser(null);
              }
              setLoading(false); // Done checking auth status
            }, (authError) => {
              // Handle authentication errors
              setError(authError.message);
              setLoading(false);
            });

            return () => unsubscribe(); // Clean up the subscription on unmount
          }, [setUser, setLoading, setError]); // Dependencies for useEffect

          if (isLoading) {
            return <p>Checking authentication status...</p>;
          }

          if (error) {
            return <p style={{ color: 'red' }}>Authentication Error: {error}</p>;
          }

          return (
            <div className="auth-status">
              {user ? (
                <p>Logged in as: <strong>{user.email}</strong></p>
              ) : (
                <p>Not logged in. Please sign in.</p>
              )}
            </div>
          );
        };

        export default AuthStatusDisplay;
        ```
    *   **Store Organization**: Stores should be organized logically, either in a central `src/stores/` directory for global, cross-cutting concerns (like authentication) or co-located within `src/features/[feature-name]/stores/` for feature-specific state. This promotes modularity and makes it easier to find and manage related state.

---

_Documentation generated by [create-agent-docs](https://github.com/chesteralan/create-agent-docs) v0.0.0 on 2026-05-25._
