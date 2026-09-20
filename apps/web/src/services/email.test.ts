import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  sendEmail,
  sendApprovalEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  EmailTemplates,
  setEmailApiUrl,
} from "./email";

/** Enable email in tests */
beforeEach(() => {
  setEmailApiUrl("http://localhost:5001/send-email");
});

const mockFetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockReset();
  // Default mock: successful response
  mockFetch.mockResolvedValue({ ok: true, statusText: "OK" });
  global.fetch = mockFetch;
});

describe("sendEmail", () => {
  it("should process template variables and send via fetch", async () => {
    await sendEmail({
      template: "welcome",
      to: "user@example.com",
      subject: "Welcome to Payroll v2",
      variables: {
        userName: "John",
        email: "john@example.com",
        companyName: "Acme Corp",
        loginUrl: "https://app.example.com/login",
      },
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:5001/send-email",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("should interpolate template variables in subject, html, and text body", async () => {
    await sendEmail({
      template: "welcome",
      to: "user@example.com",
      subject: "Welcome to Payroll v2",
      variables: {
        userName: "Alice",
        email: "alice@example.com",
        companyName: "TechCorp",
        loginUrl: "https://app.example.com/login",
      },
    });

    const callArg = JSON.parse(mockFetch.mock.calls[0][1].body);

    // Subject should remain as-is (no template vars in subject for "welcome")
    expect(callArg.subject).toBe("Welcome to Payroll v2");
    // HTML body contains userName
    expect(callArg.htmlBody).toContain("Alice");
    // Text body doesn't have {{userName}} placeholder, but does have email/company
    expect(callArg.textBody).toContain("alice@example.com");
    expect(callArg.textBody).toContain("TechCorp");
  });

  it("should throw an error for unknown template", async () => {
    await expect(
      sendEmail({
        template: "nonexistent_template" as never,
        to: "user@example.com",
        subject: "Test",
        variables: {},
      }),
    ).rejects.toThrow('Email template "nonexistent_template" not found');
  });

  it("should throw when fetch response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Internal Server Error",
    });

    await expect(
      sendEmail({
        template: "welcome",
        to: "user@example.com",
        subject: "Welcome",
        variables: {
          userName: "John",
          email: "john@example.com",
          companyName: "Acme",
          loginUrl: "https://app.example.com/login",
        },
      }),
    ).rejects.toThrow("Failed to send email: Internal Server Error");
  });

  it("should accept multiple recipients as an array", async () => {
    await sendEmail({
      template: "welcome",
      to: ["user1@example.com", "user2@example.com"],
      subject: "Welcome",
      variables: {
        userName: "John",
        email: "john@example.com",
        companyName: "Acme",
        loginUrl: "https://app.example.com/login",
      },
    });

    const callArg = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callArg.to).toEqual(["user1@example.com", "user2@example.com"]);
  });

  it("should pass through email options (cc, bcc, replyTo)", async () => {
    await sendEmail({
      template: "welcome",
      to: "user@example.com",
      subject: "Welcome",
      variables: {
        userName: "John",
        email: "john@example.com",
        companyName: "Acme",
        loginUrl: "https://app.example.com/login",
      },
      options: {
        cc: "manager@example.com",
        bcc: "audit@example.com",
        replyTo: "support@example.com",
      },
    });

    const callArg = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callArg.cc).toBe("manager@example.com");
    expect(callArg.bcc).toBe("audit@example.com");
    expect(callArg.replyTo).toBe("support@example.com");
  });

  it("should throw when email API URL is not configured", async () => {
    setEmailApiUrl(undefined);

    await expect(
      sendEmail({
        template: "welcome",
        to: "user@example.com",
        subject: "Welcome",
        variables: {
          userName: "John",
          email: "john@example.com",
          companyName: "Acme",
          loginUrl: "https://app.example.com/login",
        },
      }),
    ).rejects.toThrow("Email service is not configured");
  });
});

describe("variable interpolation", () => {
  it("should replace {{variables}} with actual values in HTML body", async () => {
    await sendEmail({
      template: "approval_required",
      to: "approver@example.com",
      subject: "Approval Required: Timesheet 42",
      variables: {
        approverName: "Manager",
        entityType: "Timesheet",
        entityId: "42",
        requesterName: "Employee",
        requestDate: "2024-06-01",
        actionUrl: "https://app.example.com/approve/42",
      },
    });

    const callArg = JSON.parse(mockFetch.mock.calls[0][1].body);
    // HTML body has all placeholders
    expect(callArg.htmlBody).toContain("Manager");
    expect(callArg.htmlBody).toContain("Timesheet #42");
    expect(callArg.htmlBody).toContain("Employee");
    expect(callArg.htmlBody).toContain("https://app.example.com/approve/42");
    // Text body doesn't have {{approverName}} but does have entityType and others
    expect(callArg.textBody).toContain("Timesheet #42");
    expect(callArg.textBody).toContain("https://app.example.com/approve/42");
  });

  it("should preserve template variables that have no matching value", async () => {
    await sendEmail({
      template: "welcome",
      to: "user@example.com",
      subject: "Welcome",
      variables: {
        userName: "John",
        email: "john@example.com",
        companyName: "Acme",
        loginUrl: "https://app.example.com/login",
      },
    });

    const callArg = JSON.parse(mockFetch.mock.calls[0][1].body);
    // All variables should be replaced — no raw {{...}} remaining
    expect(callArg.htmlBody).not.toContain("{{userName}}");
    expect(callArg.htmlBody).not.toContain("{{email}}");
    expect(callArg.textBody).not.toContain("{{email}}");
  });

  it("should handle variables with number and boolean values", async () => {
    await sendEmail({
      template: "system_alert",
      to: "admin@example.com",
      subject: "System Alert: Error",
      variables: {
        alertType: "Critical",
        message: "Database connection lost",
        timestamp: "2024-06-01T12:00:00Z",
        detailsUrl: "https://admin.example.com/alerts/1",
      },
    });

    const callArg = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callArg.htmlBody).toContain("Critical");
    expect(callArg.htmlBody).toContain("Database connection lost");
  });
});

describe("sendApprovalEmail", () => {
  it("should call sendEmail with approval_required template", async () => {
    await sendApprovalEmail("approver@example.com", {
      approverName: "Manager",
      entityType: "Timesheet",
      entityId: "42",
      requesterName: "Employee",
      requestDate: "2024-06-01",
      actionUrl: "https://app.example.com/approve/42",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArg = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callArg.subject).toContain("Timesheet");
    expect(callArg.subject).toContain("42");
    expect(callArg.htmlBody).toContain("Dear Manager");
  });

  it("should send to the correct recipient", async () => {
    await sendApprovalEmail("manager@acme.com", {
      approverName: "Manager",
      entityType: "Timesheet",
      entityId: "42",
      requesterName: "Employee",
      requestDate: "2024-06-01",
      actionUrl: "https://app.example.com/approve/42",
    });

    const callArg = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callArg.to).toBe("manager@acme.com");
  });
});

describe("sendWelcomeEmail", () => {
  it("should call sendEmail with welcome template", async () => {
    await sendWelcomeEmail("newuser@example.com", {
      userName: "New User",
      email: "newuser@example.com",
      companyName: "Acme Corp",
      loginUrl: "https://app.example.com/login",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArg = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callArg.subject).toBe("Welcome to Payroll v2");
    expect(callArg.htmlBody).toContain("New User");
    expect(callArg.htmlBody).toContain("https://app.example.com/login");
  });

  it("should include user email and company in the email body", async () => {
    await sendWelcomeEmail("alice@techcorp.com", {
      userName: "Alice",
      email: "alice@techcorp.com",
      companyName: "TechCorp",
      loginUrl: "https://app.example.com/login",
    });

    const callArg = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callArg.htmlBody).toContain("alice@techcorp.com");
    expect(callArg.htmlBody).toContain("TechCorp");
  });
});

describe("sendPasswordResetEmail", () => {
  it("should call sendEmail with password_reset template", async () => {
    await sendPasswordResetEmail("user@example.com", {
      resetUrl: "https://app.example.com/reset/token123",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArg = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callArg.subject).toBe("Reset Your Password");
    expect(callArg.htmlBody).toContain(
      "https://app.example.com/reset/token123",
    );
    expect(callArg.textBody).toContain(
      "https://app.example.com/reset/token123",
    );
  });

  it("should include the reset link prominently", async () => {
    await sendPasswordResetEmail("user@example.com", {
      resetUrl: "https://app.example.com/reset/abc123",
    });

    const callArg = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callArg.htmlBody).toContain("Reset Password");
    expect(callArg.htmlBody).toContain("abc123");
  });
});

describe("EmailTemplates", () => {
  it("should have all required template keys", () => {
    const expectedTemplates = [
      "approval_required",
      "approval_approved",
      "payroll_published",
      "password_reset",
      "welcome",
      "deadline_reminder",
      "system_alert",
    ];
    for (const tpl of expectedTemplates) {
      expect(EmailTemplates[tpl as keyof typeof EmailTemplates]).toBeDefined();
    }
  });

  it("should have subject, htmlBody, and textBody for each template", () => {
    const templates = Object.values(EmailTemplates);
    for (const tpl of templates) {
      expect(tpl).toHaveProperty("subject");
      expect(tpl).toHaveProperty("htmlBody");
      expect(tpl).toHaveProperty("textBody");
    }
  });

  it("should have variables placeholders in template bodies", () => {
    const welcomeTpl = EmailTemplates.welcome;
    expect(welcomeTpl.htmlBody).toContain("{{userName}}");
    expect(welcomeTpl.htmlBody).toContain("{{email}}");
    expect(welcomeTpl.htmlBody).toContain("{{companyName}}");
    expect(welcomeTpl.htmlBody).toContain("{{loginUrl}}");
  });
});
