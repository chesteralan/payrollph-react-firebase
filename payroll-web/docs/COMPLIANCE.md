<!-- template-version: 0.0.0 -->

# Compliance & Regulatory — payroll-web

_Generated 2026-05-25 — v0.0.0_

This document outlines the compliance requirements, data handling policies, and regulatory considerations for **payroll-web**. As an SMB payroll management system, `payroll-web` handles highly sensitive employee and company financial data. Adherence to these guidelines is paramount to ensure data integrity, privacy, and legal compliance.

## 1. Data Protection & Privacy (🔐)

This section details how Personally Identifiable Information (PII) and sensitive financial data are handled within the `payroll-web` system, leveraging the Firebase ecosystem.

### 1.1 Personally Identifiable Information (PII) Handling

All PII, including employee names, addresses, Social Security Numbers (SSN) / Taxpayer Identification Numbers (TINs), bank details, and salary information, must be protected rigorously.

*   **Encryption at Rest**: Firestore automatically encrypts all data at rest. While this provides a strong baseline, sensitive fields within Firestore documents should still be treated with extreme caution. For any custom storage outside Firestore (e.g., Cloud Storage for document uploads), ensure encryption is enabled.
*   **Encryption in Transit**: All communication between the `payroll-web` frontend (React/Vite) and Firebase services (Firestore, Auth, Cloud Functions) is secured using HTTPS/TLS 1.2+. Firebase Hosting automatically enforces HTTPS for all served content.
*   **Data Minimization**: Only collect and store the minimum necessary PII required for payroll processing and regulatory reporting.
*   **Secure Storage Practices**:
    *   **Firebase Authentication**: User passwords are never stored directly. Firebase Auth handles user authentication securely, storing hashed and salted credentials.
    *   **Firestore Security Rules**: Implement strict security rules to ensure only authorized users (e.g., specific SMB administrators) can access sensitive employee data.
    *   **Avoid Client-Side Exposure**: Ensure sensitive data is not unnecessarily exposed or logged on the client-side (React app).

### 1.2 Data Retention Policy

User data is retained only for as long as necessary to fulfill its stated purpose and comply with legal and regulatory obligations specific to payroll and tax reporting (e.g., IRS, state labor laws).

*   **Payroll Records**: Payroll records, tax forms, and employee payment history must typically be retained for several years (e.g., 3-7 years) as mandated by tax authorities.
*   **Employee Data**: Data for active employees is retained indefinitely until an employee is terminated or a deletion request is made.
*   **Inactive Accounts**: Data for inactive SMBs or terminated employees will be retained according to regulatory requirements, then anonymized or securely deleted.

### 1.3 Right to Deletion (e.g., GDPR, CCPA)

Users (SMB administrators) may request the deletion of their company's data or specific employee data at any time, subject to legal and regulatory retention requirements.

*   **Process**:
    1.  A deletion request is typically initiated by an authorized SMB administrator through a designated interface within the `payroll-web` application or by contacting support.
    2.  A Firebase Cloud Function should be used to securely delete all associated data from Firestore and other Firebase services.
    3.  **Important**: Data that must be retained for legal/regulatory compliance (e.g., historical tax records) will be anonymized where possible or clearly flagged for necessary retention.
*   **Example Cloud Function (Conceptual for Firestore Document Deletion)**:
    ```javascript
    // functions/index.js
    const functions = require('firebase-functions');
    const admin = require('firebase-admin');
    admin.initializeApp();

    exports.deleteCompanyData = functions.https.onCall(async (data, context) => {
        // Ensure the user is authenticated and authorized (e.g., an admin with 'super_admin' role)
        if (!context.auth || !context.auth.token.super_admin) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'Only authorized super administrators can initiate company data deletion.'
            );
        }

        const companyId = data.companyId;
        if (!companyId) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'The function must be called with a companyId.'
            );
        }

        const db = admin.firestore();
        const companyRef = db.collection('companies').doc(companyId);

        try {
            // Firestore does not natively support recursive deletion of subcollections.
            // This example uses the Admin SDK's recursiveDelete, which is suitable for Cloud Functions.
            await db.recursiveDelete(companyRef);
            functions.logger.info(`Company data for ${companyId} deleted by ${context.auth.uid}`);
            return { status: 'success', message: `Company ${companyId} and all associated data have been deleted.` };
        } catch (error) {
            functions.logger.error(`Error deleting company data for ${companyId}:`, error);
            throw new functions.https.HttpsError('internal', 'Failed to delete company data.', error.message);
        }
    });
    ```

## 2. Regulatory & Legal Compliance (⚖️)

`payroll-web` must adhere to various national, state, and local regulations pertaining to payroll, employment, and data privacy.

*   **Tax & Labor Laws**: Compliance with IRS regulations (e.g., W-2, 1099, 941 forms), state income tax laws, unemployment insurance, and wage & hour laws is critical. The system must accurately compute taxes, deductions, and generate compliant reports.
*   **Data Privacy Regulations**:
    *   **GDPR (General Data Protection Regulation)**: If users or employees are located in the EU, GDPR principles (lawful processing, data subject rights, data protection by design) must be considered.
    *   **CCPA/CPRA (California Consumer Privacy Act/California Privacy Rights Act)**: For California residents, similar rights regarding data access and deletion apply.
    *   **Other Region-Specific Laws**: Be aware of and adapt to other regional data privacy laws relevant to the user base.
*   **Audit Trails**: The system must maintain sufficient audit trails for financial transactions and sensitive data access to demonstrate compliance during audits.

## 3. Security Best Practices (🛡️)

Implementing robust security measures across the tech stack is essential to protect sensitive payroll data.

### 3.1 Authentication and Authorization

*   **Firebase Authentication**: All user authentication is handled by Firebase Auth, providing industry-standard security for user accounts (e.g., email/password, Google sign-in).
*   **Role-Based Access Control (RBAC)**:
    *   **Custom Claims**: Firebase Auth Custom Claims are used to define user roles (e.g., `admin`, `employee`, `super_admin`) and associate users with their respective `companyId`.
    *   **Firestore Security Rules**: These rules enforce granular access control to data based on user roles and the data's ownership (e.g., an `admin` can only access data for their `companyId`).

    ```firestore
    // firestore.rules
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Ensure user is authenticated and belongs to the company
        function isAuthenticatedCompanyMember(companyId) {
          return request.auth != null && request.auth.token.companyId == companyId;
        }

        // Ensure user is an authenticated admin of the company
        function isAuthenticatedCompanyAdmin(companyId) {
          return isAuthenticatedCompanyMember(companyId) && request.auth.token.admin == true;
        }

        // Company data accessible only by authenticated users belonging to that company
        match /companies/{companyId} {
          allow read: if isAuthenticatedCompanyMember(companyId);
          allow update, delete: if isAuthenticatedCompanyAdmin(companyId);
          allow create: if request.auth != null && request.auth.token.super_admin == true; // Only super_admins can create new companies

          // Employees within a company
          match /employees/{employeeId} {
            allow read: if isAuthenticatedCompanyMember(companyId);
            allow create, update, delete: if isAuthenticatedCompanyAdmin(companyId);
          }

          // Payroll records for a company
          match /payrolls/{payrollId} {
            allow read: if isAuthenticatedCompanyMember(companyId);
            allow create, update, delete: if isAuthenticatedCompanyAdmin(companyId);
          }
        }
      }
    }
    ```

### 3.2 Input Validation & Sanitization

All user inputs must be rigorously validated and sanitized to prevent injection attacks and data integrity issues.

*   **Client-Side Validation (React/Vite)**: Implement initial validation in the React frontend (e.g., using libraries like Yup or Zod with React Hook Form) to improve user experience. This is for convenience, *not* security.
*   **Server-Side Validation (Firebase Cloud Functions / Firestore Security Rules)**: This is the critical security layer.
    *   **Firestore Security Rules**: Use rules to validate data types, formats, and ranges before data is written to Firestore.
    *   **Firebase Cloud Functions**: For complex business logic or data transformations, Cloud Functions must perform thorough validation and sanitization of all incoming data before interacting with Firestore or external APIs.

    ```javascript
    // Example: Cloud Function for creating an employee with validation
    const functions = require('firebase-functions');
    const admin = require('firebase-admin');
    const Joi = require('joi'); // A robust validation library for schema validation

    const employeeSchema = Joi.object({
        companyId: Joi.string().required(),
        firstName: Joi.string().min(2).max(50).required().label('First Name'),
        lastName: Joi.string().min(2).max(50).required().label('Last Name'),
        email: Joi.string().email().required().label('Email'),
        // ... more fields with specific validation rules
        salary: Joi.number().positive().required().label('Salary'),
        bankAccountNumber: Joi.string().pattern(/^[0-9]{5,17}$/).required().label('Bank Account Number'),
        // Note: For sensitive data like SSN/TIN, consider storing only a hashed version or using a secure vault service.
    });

    exports.createEmployee = functions.https.onCall(async (data, context) => {
        // Ensure the user is authenticated and an admin of the specified company
        if (!context.auth || !context.auth.token.admin || context.auth.token.companyId !== data.companyId) {
            throw new functions.https.HttpsError('permission-denied', 'Unauthorized access to create employee.');
        }

        const { error, value } = employeeSchema.validate(data, { abortEarly: false }); // Validate all fields
        if (error) {
            throw new functions.https.HttpsError('invalid-argument', error.details.map(d => d.message).join('; '));
        }

        // Proceed to create employee in Firestore with 'value' (sanitized and validated data)
        const db = admin.firestore();
        try {
            await db.collection(`companies/${value.companyId}/employees`).add(value);
            functions.logger.info(`Employee created for company ${value.companyId} by ${context.auth.uid}`);
            return { status: 'success', message: 'Employee created successfully.' };
        } catch (dbError) {
            functions.logger.error(`Error creating employee for company ${value.companyId}:`, dbError);
            throw new functions.https.HttpsError('internal', 'Failed to create employee.', dbError.message);
        }
    });
    ```

### 3.3 Audit Logging

Comprehensive logging of critical actions and access to sensitive data is crucial for compliance and incident response.

*   **Firebase Cloud Functions Logging**: All Cloud Function invocations and internal operations are automatically logged to Google Cloud Logging. Ensure meaningful logs are generated for:
    *   Successful and failed authentication attempts.
    *   Creation, update, or deletion of sensitive data (employees, payrolls, company financial details).
    *   Access to sensitive reports or endpoints.
*   **Monitoring**: Configure alerts in Google Cloud Logging for suspicious activities or errors related to sensitive operations.

### 3.4 Dependency Management & Security Audits

Regularly audit and update project dependencies to mitigate known vulnerabilities.

*   **`yarn audit`**: Run `yarn audit` frequently, especially before major releases or after dependency updates.
    ```bash
    yarn audit
    ```
    Address reported vulnerabilities by updating packages or implementing workarounds.
*   **CI/CD Integration**: Integrate `yarn audit --level critical` into your CI/CD pipeline (e.g., GitHub Actions, GitLab CI) to automatically check for critical vulnerabilities on every push or pull request. Consider failing builds if critical vulnerabilities are detected.
*   **Supply Chain Security**: Be cautious when adding new third-party libraries. Prefer well-maintained, reputable packages.

### 3.5 Secrets Management

*   **Client-Side (React/Vite)**: Use Vite's environment variables (`import.meta.env.VITE_SOME_KEY`) for non-sensitive public configuration (e.g., Firebase project ID). **Never store sensitive API keys or credentials directly in the frontend build.**
*   **Server-Side (Firebase Cloud Functions)**: Use Firebase Environment Configuration for sensitive secrets (e.g., API keys for external integrations like payment processors or tax services).

    ```bash
    # Example CLI command to set an environment variable for a Cloud Function
    firebase functions:config:set thirdparty.api_key="YOUR_SECRET_API_KEY"
    ```
    Access this secret in your Cloud Function using `functions.config().thirdparty.api_key`.

## 4. Incident Response (🚨)

A defined process for handling security incidents and data breaches is vital.

*   **Detection**: Monitor logs (Google Cloud Logging), system alerts, and user reports for unusual activity. Implement proactive threat detection where possible.
*   **Containment**: Immediately isolate affected systems or data to prevent further damage.
*   **Eradication**: Identify and fix the root cause of the incident. This may involve patching vulnerabilities, revoking compromised credentials, or cleaning infected systems.
*   **Recovery**: Restore affected systems and data from secure, verified backups. Ensure data integrity before bringing systems back online.
*   **Post-Incident Analysis**: Conduct a thorough review to understand how the incident occurred, what data was affected, and implement preventative measures to avoid recurrence.
*   **Notification**: Comply with all legal and regulatory requirements for notifying affected parties and regulatory bodies in the event of a data breach.

## 5. Regular Reviews & Updates (🔄)

Compliance and security are ongoing processes, not one-time tasks.

*   **Security Rule Reviews**: Regularly review and update Firestore Security Rules to reflect changes in application logic or access requirements.
*   **Dependency Updates**: Keep all project dependencies (React, Firebase SDKs, Node.js packages) up-to-date to benefit from security patches and performance improvements.
*   **Policy Review**: Periodically review this `COMPLIANCE.md` document and associated policies to ensure they remain current, effective, and align with evolving legal and business requirements.
*   **Team Training**: Ensure all team members are aware of compliance requirements, security best practices, and their roles in maintaining a secure system.

---

_Documentation generated by [create-agent-docs](https://github.com/chesteralan/create-agent-docs) v0.0.0 on 2026-05-25._
