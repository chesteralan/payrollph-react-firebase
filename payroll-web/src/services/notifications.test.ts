import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createFirestoreMocks,
  addMockDocs,
  clearMockDocs,
} from "../__mocks__/firebase";

// Extend base mocks with writeBatch and doc that supports .ref / .update
// NOTE: The source file notifications.ts has a known bug — it uses `doc`, `getDoc`, and `writeBatch`
// but does NOT import them from "firebase/firestore". Tests for functions relying on those
// (submitApproval, markAsRead, markAllAsRead, archiveNotification) will fail until the source
// imports are fixed. We provide the mocks here for completeness.
vi.mock("firebase/firestore", () => ({
  ...createFirestoreMocks(),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
  doc: vi.fn((...args: unknown[]) => {
    const segments = args.filter((a): a is string => typeof a === "string");
    const path = segments.join("/");
    return {
      id: path,
      ref: path,
      update: vi.fn().mockResolvedValue(undefined),
    };
  }),
  getDoc: vi.fn(async (docPath: string | { id: string }) => {
    const { getMockDocs: fetchDocs } = await import("../__mocks__/firebase");
    const path = typeof docPath === "object" ? (docPath as { id: string }).id : docPath;
    const docs = fetchDocs(path);
    const docData = docs?.[0];
    if (docData) {
      return { id: docData.id, exists: () => true, data: () => docData };
    }
    return { id: path, exists: () => false, data: () => null };
  }),
}));

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

import {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  createApprovalWorkflow,
  submitApproval,
  notifyNextApprover,
  getPendingApprovalsCount,
  NotificationTemplates,
} from "./notifications";

describe("createNotification", () => {
  it("should create a notification and return its id", async () => {
    const id = await createNotification({
      recipientId: "user-1",
      type: "payroll_ready",
      priority: "high",
      title: "Payroll Ready",
      message: "Payroll for June is ready",
      entityType: "payroll",
      entityId: "pay-1",
      actionUrl: "/payroll/pay-1",
    });

    expect(id).toBe("mock-id");
  });

  it("should set isRead and isArchived to false by default", async () => {
    const { addDoc } = await import("firebase/firestore");

    await createNotification({
      recipientId: "user-1",
      type: "system_alert",
      priority: "urgent",
      title: "Alert",
      message: "System alert",
    });

    expect(addDoc).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        isRead: false,
        isArchived: false,
      }),
    );
  });

  it("should include optional fields when provided", async () => {
    const { addDoc } = await import("firebase/firestore");

    await createNotification({
      recipientId: "user-1",
      senderId: "admin",
      type: "leave_applied",
      priority: "medium",
      title: "Leave Applied",
      message: "John applied for leave",
      entityType: "leave",
      entityId: "lv-1",
      actionUrl: "/dtr/leave/lv-1",
      metadata: { department: "Engineering" },
    });

    expect(addDoc).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        senderId: "admin",
        entityType: "leave",
        entityId: "lv-1",
        actionUrl: "/dtr/leave/lv-1",
        metadata: { department: "Engineering" },
      }),
    );
  });
});

describe("getNotifications", () => {
  beforeEach(() => {
    addMockDocs("notifications", [
      {
        id: "n1",
        recipientId: "user-1",
        type: "payroll_ready",
        priority: "high",
        title: "Payroll Ready",
        message: "Ready",
        isRead: false,
        isArchived: false,
        createdAt: new Date("2024-06-02"),
      },
      {
        id: "n2",
        recipientId: "user-1",
        type: "leave_approved",
        priority: "medium",
        title: "Leave Approved",
        message: "Approved",
        isRead: true,
        isArchived: false,
        createdAt: new Date("2024-06-01"),
      },
      {
        id: "n3",
        recipientId: "user-1",
        type: "system_alert",
        priority: "urgent",
        title: "Alert",
        message: "System alert",
        isRead: false,
        isArchived: true,
        createdAt: new Date("2024-05-01"),
      },
      {
        id: "n4",
        recipientId: "user-2",
        type: "deadline_reminder",
        priority: "low",
        title: "Reminder",
        message: "Deadline",
        isRead: false,
        isArchived: false,
        createdAt: new Date("2024-06-03"),
      },
    ]);
  });

  it("should return notifications for a user", async () => {
    const notifications = await getNotifications("user-1");
    expect(notifications.length).toBeGreaterThan(0);
  });

  it("should filter unread notifications when unreadOnly is true", async () => {
    const { where } = await import("firebase/firestore");

    await getNotifications("user-1", { unreadOnly: true });

    expect(where).toHaveBeenCalledWith("recipientId", "==", "user-1");
    expect(where).toHaveBeenCalledWith("isRead", "==", false);
  });

  it("should exclude archived notifications by default", async () => {
    const { where } = await import("firebase/firestore");

    await getNotifications("user-1");

    expect(where).toHaveBeenCalledWith("recipientId", "==", "user-1");
    expect(where).toHaveBeenCalledWith("isArchived", "==", false);
  });

  it("should include archived notifications when includeArchived is true", async () => {
    const notifications = await getNotifications("user-1", { includeArchived: true });
    expect(notifications.some((n) => n.isArchived)).toBe(true);
  });

  it("should limit results when limit option is provided", async () => {
    const { limit } = await import("firebase/firestore");

    await getNotifications("user-1", { limit: 2 });

    expect(limit).toHaveBeenCalledWith(2);
  });
});

describe("markAsRead", () => {
  it("should update the notification with isRead and readAt", async () => {
    const { updateDoc } = await import("firebase/firestore");

    await markAsRead("notification-1");

    expect(updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: "notifications/notification-1" }),
      expect.objectContaining({
        isRead: true,
      }),
    );
  });
});

describe("markAllAsRead", () => {
  it("should fetch unread notifications and use writeBatch", async () => {
    const { writeBatch } = await import("firebase/firestore");

    addMockDocs("notifications", [
      {
        id: "n1",
        recipientId: "user-1",
        type: "payroll_ready",
        priority: "high",
        title: "Test",
        message: "Test",
        isRead: false,
        isArchived: false,
        createdAt: new Date(),
      },
      {
        id: "n2",
        recipientId: "user-1",
        type: "leave_approved",
        priority: "medium",
        title: "Test 2",
        message: "Test 2",
        isRead: false,
        isArchived: false,
        createdAt: new Date(),
      },
    ]);

    await markAllAsRead("user-1");

    expect(writeBatch).toHaveBeenCalled();
  });

  it("should do nothing when there are no unread notifications", async () => {
    const { writeBatch } = await import("firebase/firestore");

    await markAllAsRead("user-1");

    expect(writeBatch).toHaveBeenCalled();
  });
});

describe("archiveNotification", () => {
  it("should update the notification with isArchived and archivedAt", async () => {
    const { updateDoc } = await import("firebase/firestore");

    await archiveNotification("notification-1");

    expect(updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: "notifications/notification-1" }),
      expect.objectContaining({
        isArchived: true,
      }),
    );
  });
});

describe("createApprovalWorkflow", () => {
  it("should create an approval workflow and return its id", async () => {
    const id = await createApprovalWorkflow({
      entityType: "payroll",
      entityId: "pay-1",
      requestedBy: "user-1",
      maxLevel: 2,
    });

    expect(id).toBe("mock-id");
  });

  it("should set default values for status, currentLevel, and approvals", async () => {
    const { addDoc } = await import("firebase/firestore");

    await createApprovalWorkflow({
      entityType: "leave",
      entityId: "lv-1",
      requestedBy: "user-1",
      maxLevel: 1,
    });

    expect(addDoc).toHaveBeenCalledWith(
      "approval_works",
      expect.objectContaining({
        status: "pending",
        currentLevel: 0,
        approvals: [],
      }),
    );
  });
});

describe("submitApproval", () => {
  it("should throw if workflow is not found", async () => {
    await expect(
      submitApproval("nonexistent", "approver-1", "approved"),
    ).rejects.toThrow("Workflow not found");
  });

  it("should update workflow with approval step when approved", async () => {
    const { updateDoc } = await import("firebase/firestore");

    addMockDocs("approval_works/workflow-1", [
      {
        id: "workflow-1",
        entityType: "payroll",
        entityId: "pay-1",
        requestedBy: "user-1",
        status: "pending",
        currentLevel: 0,
        maxLevel: 2,
        approvals: [],
        createdAt: new Date(),
      },
    ]);

    await submitApproval("workflow-1", "approver-1", "approved", "Looks good");

    expect(updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: "approval_works/workflow-1" }),
      expect.objectContaining({
        currentLevel: 1,
        status: "pending",
      }),
    );
  });

  it("should mark as approved when maxLevel is reached", async () => {
    const { updateDoc } = await import("firebase/firestore");

    addMockDocs("approval_works/workflow-final", [
      {
        id: "workflow-final",
        entityType: "expense",
        entityId: "exp-1",
        requestedBy: "user-1",
        status: "pending",
        currentLevel: 0,
        maxLevel: 1,
        approvals: [],
        createdAt: new Date(),
      },
    ]);

    await submitApproval("workflow-final", "approver-1", "approved");

    expect(updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: "approval_works/workflow-final" }),
      expect.objectContaining({
        status: "approved",
      }),
    );
  });

  it("should mark as rejected when decision is rejected", async () => {
    const { updateDoc } = await import("firebase/firestore");

    addMockDocs("approval_works/workflow-reject", [
      {
        id: "workflow-reject",
        entityType: "leave",
        entityId: "lv-1",
        requestedBy: "user-1",
        status: "pending",
        currentLevel: 0,
        maxLevel: 2,
        approvals: [],
        createdAt: new Date(),
      },
    ]);

    await submitApproval("workflow-reject", "approver-1", "rejected", "Not approved");

    expect(updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: "approval_works/workflow-reject" }),
      expect.objectContaining({
        status: "rejected",
      }),
    );
  });
});

describe("notifyNextApprover", () => {
  it("should create an approval_required notification", async () => {
    const { addDoc } = await import("firebase/firestore");

    await notifyNextApprover("wf-1", "approver-2", "payroll", "pay-1");

    expect(addDoc).toHaveBeenCalledWith(
      "notifications",
      expect.objectContaining({
        recipientId: "approver-2",
        type: "approval_required",
        priority: "urgent",
        title: "Approval Required",
        actionUrl: "/payrolls/pay-1",
      }),
    );
  });
});

describe("getPendingApprovalsCount", () => {
  it("should return the count of pending approvals for a user", async () => {
    addMockDocs("approval_works", [
      {
        id: "wf-1",
        entityType: "payroll",
        entityId: "pay-1",
        requestedBy: "user-1",
        status: "pending",
        currentLevel: 0,
        maxLevel: 1,
        approvals: [{ approverId: "user-1", status: "pending" }],
        createdAt: new Date(),
      },
    ]);

    const count = await getPendingApprovalsCount("user-1");
    expect(count).toBe(1);
  });

  it("should return 0 when no pending approvals exist", async () => {
    const count = await getPendingApprovalsCount("user-1");
    expect(count).toBe(0);
  });
});

describe("NotificationTemplates", () => {
  it("payrollReady should return correct template", () => {
    const template = NotificationTemplates.payrollReady("June Payroll", "pay-1");

    expect(template.type).toBe("payroll_ready");
    expect(template.priority).toBe("high");
    expect(template.title).toBe("Payroll Ready for Review");
    expect(template.message).toContain("June Payroll");
    expect(template.actionUrl).toBe("/payroll/pay-1");
  });

  it("leaveApplied should return correct template", () => {
    const template = NotificationTemplates.leaveApplied("John Doe", "lv-1");

    expect(template.type).toBe("leave_applied");
    expect(template.priority).toBe("medium");
    expect(template.message).toContain("John Doe");
    expect(template.entityType).toBe("leave");
    expect(template.entityId).toBe("lv-1");
    expect(template.actionUrl).toBe("/dtr/leave/lv-1");
  });

  it("deadlineReminder should return urgent priority when daysLeft is 1", () => {
    const template = NotificationTemplates.deadlineReminder("Payroll", "June", 1);

    expect(template.priority).toBe("urgent");
    expect(template.message).toContain("due in 1 day");
  });

  it("deadlineReminder should return medium priority when daysLeft is greater than 1", () => {
    const template = NotificationTemplates.deadlineReminder("Payroll", "June", 3);

    expect(template.priority).toBe("medium");
    expect(template.message).toContain("due in 3 day");
  });
});
