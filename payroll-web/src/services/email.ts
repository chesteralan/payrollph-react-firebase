// Email Notification Service
// Note: Actual email sending should be handled by Firebase Cloud Functions
// This provides the frontend interface and Cloud Function definitions

export type EmailTemplate =
  | "approval_required"
  | "approval_approved"
  | "approval_rejected"
  | "payroll_published"
  | "leave_approved"
  | "leave_rejected"
  | "password_reset"
  | "welcome"
  | "deadline_reminder"
  | "system_alert";

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: EmailAttachment[];
  customVariables?: Record<string, string>;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  encoding: "base64";
  type: string;
}

export interface EmailRequest {
  template: EmailTemplate;
  to: string | string[];
  subject: string;
  variables: Record<string, string | number | boolean>;
  options?: EmailOptions;
}

// Email template definitions
export const EmailTemplates = {
  approval_required: {
    subject: "Approval Required: {{entityType}} {{entityId}}",
    htmlBody: `
      <h2>Approval Required</h2>
      <p>Dear {{approverName}},</p>
      <p>A new {{entityType}} requires your approval:</p>
      <ul>
        <li><strong>Entity:</strong> {{entityType}} #{{entityId}}</li>
        <li><strong>Requested by:</strong> {{requesterName}}</li>
        <li><strong>Date:</strong> {{requestDate}}</li>
      </ul>
      <p>
        <a href="{{actionUrl}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Review Now
        </a>
      </p>
      <p><small>This is an automated message from Payroll v2.</small></p>
    `,
    textBody: `
Approval Required

A new {{entityType}} requires your approval:
- Entity: {{entityType}} #{{entityId}}
- Requested by: {{requesterName}}
- Date: {{requestDate}}

Review here: {{actionUrl}}

This is an automated message from Payroll v2.
    `,
  },

  approval_approved: {
    subject: "Approved: {{entityType}} {{entityId}}",
    htmlBody: `
      <h2 style="color: green;">Approval Approved ✓</h2>
      <p>Dear {{requesterName}},</p>
      <p>Your {{entityType}} has been approved!</p>
      <ul>
        <li><strong>{{entityType}}:</strong> #{{entityId}}</li>
        <li><strong>Approved by:</strong> {{approverName}}</li>
        <li><strong>Comments:</strong> {{comments}}</li>
      </ul>
      <p><a href="{{actionUrl}}">View Details</a></p>
    `,
    textBody: `
Approval Approved ✓

Your {{entityType}} has been approved!
- {{entityType}}: #{{entityId}}
- Approved by: {{approverName}}
- Comments: {{comments}}

View details: {{actionUrl}}
    `,
  },

  payroll_published: {
    subject: "Payroll Published: {{payrollName}}",
    htmlBody: `
      <h2>Payroll Published</h2>
      <p>Dear {{employeeName}},</p>
      <p>Your payslip for {{payrollName}} is now available.</p>
      <p>
        <strong>Net Pay:</strong> {{netPay}} {{currency}}<br>
        <strong>Pay Period:</strong> {{payPeriod}}
      </p>
      <p>
        <a href="{{payslipUrl}}">View Payslip</a>
      </p>
    `,
    textBody: `
Payroll Published

Your payslip for {{payrollName}} is now available.
Net Pay: {{netPay}} {{currency}}
Pay Period: {{payPeriod}}

View payslip: {{payslipUrl}}
    `,
  },

  password_reset: {
    subject: "Reset Your Password",
    htmlBody: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <p>
        <a href="{{resetUrl}}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
      </p>
      <p><small>This link expires in 1 hour. If you didn't request this, ignore this email.</small></p>
    `,
    textBody: `
Password Reset Request

Reset your password: {{resetUrl}}

This link expires in 1 hour. If you didn't request this, ignore this email.
    `,
  },

  welcome: {
    subject: "Welcome to Payroll v2",
    htmlBody: `
      <h2>Welcome to Payroll v2!</h2>
      <p>Dear {{userName}},</p>
      <p>Your account has been created successfully.</p>
      <p>
        <strong>Email:</strong> {{email}}<br>
        <strong>Company:</strong> {{companyName}}
      </p>
      <p>
        <a href="{{loginUrl}}">Login Now</a>
      </p>
    `,
    textBody: `
Welcome to Payroll v2!

Your account has been created successfully.
Email: {{email}}
Company: {{companyName}}

Login: {{loginUrl}}
    `,
  },

  deadline_reminder: {
    subject: "Reminder: {{entityType}} Due Soon",
    htmlBody: `
      <h2 style="color: orange;">Deadline Reminder</h2>
      <p>Dear {{userName}},</p>
      <p>This is a reminder that <strong>{{entityType}} "{{entityName}}"</strong> is due in {{daysLeft}} day(s).</p>
      <p>
        <a href="{{actionUrl}}">Take Action Now</a>
      </p>
    `,
    textBody: `
Deadline Reminder

{{entityType}} "{{entityName}}" is due in {{daysLeft}} day(s).

Take action: {{actionUrl}}
    `,
  },

  system_alert: {
    subject: "System Alert: {{alertType}}",
    htmlBody: `
      <h2 style="color: red;">System Alert</h2>
      <p><strong>Alert Type:</strong> {{alertType}}</p>
      <p><strong>Message:</strong> {{message}}</p>
      <p><strong>Time:</strong> {{timestamp}}</p>
      <p><a href="{{detailsUrl}}">View Details</a></p>
    `,
    textBody: `
System Alert: {{alertType}}

Message: {{message}}
Time: {{timestamp}}

View details: {{detailsUrl}}
    `,
  },
};

// Process template variables
const processTemplate = (
  template: string,
  variables: Record<string, string | number | boolean>,
): string => {
  let processed = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    processed = processed.replace(regex, String(value));
  }
  return processed;
};

// Send email via Cloud Function
export const sendEmail = async (request: EmailRequest): Promise<void> => {
  try {
    const template = EmailTemplates[request.template];
    if (!template) {
      throw new Error(`Email template "${request.template}" not found`);
    }

    const htmlBody = processTemplate(template.htmlBody, request.variables);
    const textBody = processTemplate(template.textBody, request.variables);
    const subject = processTemplate(request.subject, request.variables);

    // Call Firebase Cloud Function
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: request.to,
        subject,
        htmlBody,
        textBody,
        ...request.options,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};

// Convenience functions for common email types
export const sendApprovalEmail = async (
  to: string,
  data: {
    approverName: string;
    entityType: string;
    entityId: string;
    requesterName: string;
    requestDate: string;
    actionUrl: string;
  },
) => {
  await sendEmail({
    template: "approval_required",
    to,
    subject: `Approval Required: ${data.entityType} ${data.entityId}`,
    variables: data as unknown as Record<string, string | number | boolean>,
  });
};

export const sendWelcomeEmail = async (
  to: string,
  data: {
    userName: string;
    email: string;
    companyName: string;
    loginUrl: string;
  },
) => {
  await sendEmail({
    template: "welcome",
    to,
    subject: "Welcome to Payroll v2",
    variables: data as unknown as Record<string, string | number | boolean>,
  });
};

export const sendPasswordResetEmail = async (
  to: string,
  data: {
    resetUrl: string;
  },
) => {
  await sendEmail({
    template: "password_reset",
    to,
    subject: "Reset Your Password",
    variables: data as unknown as Record<string, string | number | boolean>,
  });
};

// Firebase Cloud Function code (to be deployed separately)
export const CLOUD_FUNCTION_CODE = `
// This code goes in your Firebase Cloud Functions project
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as nodemailer from 'nodemailer'

admin.initializeApp()

const transporter = nodemailer.createTransporter({
  service: 'gmail', // or your SMTP provider
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass,
  },
})

export const sendEmail = functions.https.onRequest(async (req, res) => {
  try {
    const { to, subject, htmlBody, textBody, cc, bcc, attachments } = req.body

    const mailOptions = {
      from: functions.config().email.from,
      to: Array.isArray(to) ? to.join(',') : to,
      cc: cc ? (Array.isArray(cc) ? cc.join(',') : cc) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc.join(',') : bcc) : undefined,
      subject,
      html: htmlBody,
      text: textBody,
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        encoding: att.encoding,
        contentType: att.type,
      })),
    }

    await transporter.sendMail(mailOptions)

    res.json({ success: true })
  } catch (error) {
    console.error('Email sending failed:', error)
    res.status(500).json({ error: (error as Error).message })
  }
})
`;

export default {
  sendEmail,
  sendApprovalEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  EmailTemplates,
  CLOUD_FUNCTION_CODE,
};
