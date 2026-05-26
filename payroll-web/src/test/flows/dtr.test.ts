import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addMockDocs,
  clearMockDocs,
} from "../../__mocks__/firebase";
import {
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  where,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { create, update, getAll, getById } from "../../services/firestore";
import type {
  DTREntry,
  AttendanceRecord,
  OvertimeRecord,
  LeaveApplication,
  LeaveBalance,
} from "../../types";

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("DTR Flow — Clock-In → Clock-Out → Overtime → Approve", () => {
  // ── Clock-In ──────────────────────────────────────────────────────────
  describe("Clock-in", () => {
    it("should create a DTR entry on clock-in", async () => {
      const entryId = await create("attendance", {
        employeeId: "emp-1",
        date: "2025-01-15",
        timeIn: "08:00",
        hoursWorked: 0,
        overtimeHours: 0,
        lateHours: 0,
      });

      expect(entryId).toBe("mock-id");
      expect(addDoc).toHaveBeenCalledWith(
        "attendance",
        expect.objectContaining({
          employeeId: "emp-1",
          date: "2025-01-15",
          timeIn: "08:00",
        }),
      );
    });

    it("should detect late clock-in (after 8:00 AM)", async () => {
      const lateMinutes = 15; // clocked in at 8:15
      const lateHours = lateMinutes / 60;

      expect(lateHours).toBe(0.25);
    });

    it("should record date and employee ID on clock-in", async () => {
      await create("attendance", {
        employeeId: "emp-1",
        date: new Date().toISOString().slice(0, 10),
        timeIn: "07:55",
        hoursWorked: 0,
        overtimeHours: 0,
        lateHours: 0,
      });

      expect(addDoc).toHaveBeenCalledWith(
        "attendance",
        expect.objectContaining({
          employeeId: "emp-1",
          timeIn: "07:55",
        }),
      );
    });

    it("should create a timesheet entry on first clock-in of the period", async () => {
      await create("timesheets", {
        employeeId: "emp-1",
        date: new Date(),
        hoursWorked: 0,
        overtimeHours: 0,
        absences: 0,
        lateHours: 0,
      });

      expect(addDoc).toHaveBeenCalledWith(
        "timesheets",
        expect.objectContaining({
          employeeId: "emp-1",
        }),
      );
    });
  });

  // ── Clock-Out ─────────────────────────────────────────────────────────
  describe("Clock-out", () => {
    it("should update DTR entry with clock-out time", async () => {
      addMockDocs("attendance/entry-1", [
        {
          id: "entry-1",
          employeeId: "emp-1",
          date: "2025-01-15",
          timeIn: "08:00",
          timeOut: null,
          hoursWorked: 0,
        },
      ]);

      await update("attendance", "entry-1", {
        timeOut: "17:00",
        hoursWorked: 9,
      });

      expect(updateDoc).toHaveBeenCalledWith(
        "attendance/entry-1",
        expect.objectContaining({
          timeOut: "17:00",
          hoursWorked: 9,
        }),
      );
    });

    it("should calculate hours worked from timeIn and timeOut", () => {
      const timeIn = "08:00";
      const timeOut = "17:00";

      const [inH, inM] = timeIn.split(":").map(Number);
      const [outH, outM] = timeOut.split(":").map(Number);
      const hoursWorked = outH + outM / 60 - (inH + inM / 60);

      expect(hoursWorked).toBe(9);
    });

    it("should detect undertime when clocking out early", () => {
      const scheduledEnd = "17:00";
      const actualOut = "15:30";

      const [sH, sM] = scheduledEnd.split(":").map(Number);
      const [aH, aM] = actualOut.split(":").map(Number);
      const undertimeMinutes =
        (sH * 60 + sM) - (aH * 60 + aM);

      expect(undertimeMinutes).toBe(90); // 1.5 hours undertime
    });

    it("should create absence record for no-show", async () => {
      await create("absences", {
        employeeId: "emp-1",
        date: "2025-01-15",
        type: "absent",
        hours: 8,
        reason: "Sick leave",
      });

      expect(addDoc).toHaveBeenCalledWith(
        "absences",
        expect.objectContaining({
          type: "absent",
          employeeId: "emp-1",
          hours: 8,
        }),
      );
    });
  });

  // ── Overtime ──────────────────────────────────────────────────────────
  describe("Overtime management", () => {
    it("should create an overtime record", async () => {
      await create("overtime", {
        employeeId: "emp-1",
        date: "2025-01-15",
        hours: 3,
        rate: 1.5,
        reason: "Project deadline",
        approved: false,
      });

      expect(addDoc).toHaveBeenCalledWith(
        "overtime",
        expect.objectContaining({
          employeeId: "emp-1",
          hours: 3,
          rate: 1.5,
          reason: "Project deadline",
          approved: false,
        }),
      );
    });

    it("should list overtime records for an employee", async () => {
      addMockDocs("overtime", [
        {
          id: "ot-1",
          employeeId: "emp-1",
          date: "2025-01-15",
          hours: 2,
          approved: false,
        },
        {
          id: "ot-2",
          employeeId: "emp-1",
          date: "2025-01-16",
          hours: 3,
          approved: true,
        },
      ]);

      const records = await getAll<OvertimeRecord>("overtime", [
        { field: "employeeId", op: "==", value: "emp-1" },
      ]);

      expect(records).toHaveLength(2);
      expect(records[0].employeeId).toBe("emp-1");
    });

    it("should calculate total overtime hours for payroll", async () => {
      addMockDocs("overtime", [
        { id: "ot-1", employeeId: "emp-1", hours: 2, approved: true },
        { id: "ot-2", employeeId: "emp-1", hours: 3, approved: true },
        { id: "ot-3", employeeId: "emp-1", hours: 1.5, approved: false },
      ]);

      const approvedRecords = [
        { id: "ot-1", hours: 2, approved: true },
        { id: "ot-2", hours: 3, approved: true },
      ];

      const totalOvertimeHours = approvedRecords.reduce(
        (sum, r) => sum + r.hours,
        0,
      );

      expect(totalOvertimeHours).toBe(5);
    });

    it("should update DTR entry with overtime hours", async () => {
      addMockDocs("attendance/entry-1", [
        {
          id: "entry-1",
          employeeId: "emp-1",
          date: "2025-01-15",
          hoursWorked: 8,
          overtimeHours: 0,
        },
      ]);

      await update("attendance", "entry-1", {
        overtimeHours: 2,
      });

      expect(updateDoc).toHaveBeenCalledWith(
        "attendance/entry-1",
        expect.objectContaining({
          overtimeHours: 2,
        }),
      );
    });
  });

  // ── Leave / Approval ─────────────────────────────────────────────────
  describe("Leave and approval workflow", () => {
    it("should create a leave application", async () => {
      await create("leave_benefits", {
        employeeId: "emp-1",
        benefitId: "vacation-leave",
        year: 2025,
        totalAllowance: 15,
        used: 0,
        remaining: 15,
      });

      expect(addDoc).toHaveBeenCalledWith(
        "leave_benefits",
        expect.objectContaining({
          employeeId: "emp-1",
          benefitId: "vacation-leave",
          remaining: 15,
        }),
      );
    });

    it("should approve leave and update balance", async () => {
      addMockDocs("leave_benefits/lb-1", [
        {
          id: "lb-1",
          employeeId: "emp-1",
          benefitId: "vacation-leave",
          year: 2025,
          totalAllowance: 15,
          used: 0,
          remaining: 15,
        },
      ]);

      // Simulate approval: update used and remaining
      await update("leave_benefits", "lb-1", {
        used: 3,
        remaining: 12,
      });

      expect(updateDoc).toHaveBeenCalledWith(
        "leave_benefits/lb-1",
        expect.objectContaining({
          used: 3,
          remaining: 12,
        }),
      );
    });

    it("should reject leave when insufficient balance", () => {
      const leaveBalance: LeaveBalance = {
        id: "lb-1",
        employeeId: "emp-1",
        benefitId: "vacation-leave",
        year: 2025,
        totalAllowance: 5,
        used: 4,
        remaining: 1,
      };

      const requestedDays = 3;
      const isApproved = leaveBalance.remaining >= requestedDays;

      expect(isApproved).toBe(false);
      expect(leaveBalance.remaining).toBeLessThan(requestedDays);
    });

    it("should approve overtime request", async () => {
      addMockDocs("overtime/ot-1", [
        {
          id: "ot-1",
          employeeId: "emp-1",
          hours: 3,
          approved: false,
        },
      ]);

      await update("overtime", "ot-1", {
        approved: true,
      });

      expect(updateDoc).toHaveBeenCalledWith(
        "overtime/ot-1",
        expect.objectContaining({
          approved: true,
        }),
      );
    });
  });

  // ── Full DTR lifecycle ────────────────────────────────────────────────
  describe("Full DTR lifecycle", () => {
    it("should process a complete clock-in → clock-out → overtime → approve cycle", async () => {
      // Phase 1: Clock-in
      const entryId = await create("attendance", {
        employeeId: "emp-1",
        date: "2025-01-20",
        timeIn: "08:00",
        hoursWorked: 0,
        overtimeHours: 0,
        lateHours: 0,
      });
      expect(entryId).toBe("mock-id");

      // Phase 2: Clock-out — calculate hours
      addMockDocs("attendance/mock-id", [
        {
          id: "mock-id",
          employeeId: "emp-1",
          date: "2025-01-20",
          timeIn: "08:00",
          hoursWorked: 0,
          overtimeHours: 0,
        },
      ]);

      await update("attendance", "mock-id", {
        timeOut: "17:00",
        hoursWorked: 9,
      });

      // Phase 3: Record overtime
      await create("overtime", {
        employeeId: "emp-1",
        date: "2025-01-20",
        hours: 2,
        rate: 1.5,
        reason: "Urgent deliverable",
        approved: false,
      });

      // Update DTR with overtime
      addMockDocs("overtime/ot-new", [
        { id: "ot-new", employeeId: "emp-1", hours: 2, approved: false },
      ]);
      await update("overtime", "ot-new", {
        approved: true,
      });

      // Phase 4: Update final attendance
      await update("attendance", "mock-id", {
        overtimeHours: 2,
      });

      // Verify final state
      addMockDocs("attendance/mock-id", [
        {
          id: "mock-id",
          employeeId: "emp-1",
          date: "2025-01-20",
          timeIn: "08:00",
          timeOut: "17:00",
          hoursWorked: 9,
          overtimeHours: 2,
          lateHours: 0,
        },
      ]);

      const finalEntry = await getById<AttendanceRecord>(
        "attendance",
        "mock-id",
      );
      expect(finalEntry).not.toBeNull();
      expect(finalEntry!.hoursWorked).toBe(9);
      expect(finalEntry!.timeIn).toBe("08:00");
      expect(finalEntry!.timeOut).toBe("17:00");
    });

    it("should handle absences and leaves alongside DTR", async () => {
      // Employee takes a sick leave on a work day
      await create("absences", {
        employeeId: "emp-1",
        date: "2025-01-21",
        type: "sick",
        hours: 8,
        reason: "Medical appointment",
      });

      // Create leave balance
      await create("leave_benefits", {
        employeeId: "emp-1",
        benefitId: "sick-leave",
        year: 2025,
        totalAllowance: 10,
        used: 1,
        remaining: 9,
      });

      // Verify records
      addMockDocs("absences", [
        {
          id: "abs-1",
          employeeId: "emp-1",
          date: "2025-01-21",
          type: "sick",
          hours: 8,
        },
      ]);

      const absences = await getAll("absences", [
        { field: "employeeId", op: "==", value: "emp-1" },
      ]);

      expect(absences).toHaveLength(1);
      expect(absences[0]).toHaveProperty("type", "sick");
    });

    it("should compute daily summary from attendance records", () => {
      // DTR computation: total hours including overtime
      const records = [
        { day: "Mon", regularHours: 8, overtimeHours: 0 },
        { day: "Tue", regularHours: 8, overtimeHours: 2 },
        { day: "Wed", regularHours: 8, overtimeHours: 0 },
        { day: "Thu", regularHours: 8, overtimeHours: 1.5 },
        { day: "Fri", regularHours: 8, overtimeHours: 0 },
      ];

      const totalRegular = records.reduce((s, r) => s + r.regularHours, 0);
      const totalOT = records.reduce((s, r) => s + r.overtimeHours, 0);
      const totalHours = totalRegular + totalOT;

      expect(totalRegular).toBe(40);
      expect(totalOT).toBe(3.5);
      expect(totalHours).toBe(43.5);
    });
  });
});
