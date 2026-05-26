import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createFirestoreMocks,
  addMockDocs,
  clearMockDocs,
} from "../__mocks__/firebase";

// Extend base mocks with setDoc which addIpRestriction and logIpAccess need
vi.mock("firebase/firestore", () => ({
  ...createFirestoreMocks(),
  setDoc: vi.fn(async () => {}),
}));

import {
  fetchIpRestrictions,
  addIpRestriction,
  removeIpRestriction,
  isIpAllowed,
  parseCidr,
  formatIpAddress,
  getClientIp,
  logIpAccess,
  validateIpOnLogin,
} from "./ipRestriction";
import { getDocs, setDoc, updateDoc, where, query } from "firebase/firestore";
import type { UserAccount } from "../types";

const mockUser: UserAccount = {
  id: "user-1",
  email: "admin@example.com",
  username: "admin",
  displayName: "Admin User",
  isActive: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

beforeEach(() => {
  clearMockDocs();
  vi.clearAllMocks();
});

describe("fetchIpRestrictions", () => {
  it("should return restrictions for a company", async () => {
    addMockDocs("ip_restrictions", [
      {
        id: "r1",
        companyId: "company-1",
        type: "whitelist",
        ipAddress: "192.168.1.100",
        isActive: true,
        createdAt: new Date(),
        createdBy: "user-1",
      },
      {
        id: "r2",
        companyId: "company-1",
        type: "blacklist",
        ipAddress: "10.0.0.5",
        isActive: true,
        createdAt: new Date(),
        createdBy: "user-1",
      },
    ]);

    const restrictions = await fetchIpRestrictions("company-1");

    expect(restrictions).toHaveLength(2);
    expect(restrictions[0].id).toBe("r1");
    expect(restrictions[0].type).toBe("whitelist");
    expect(restrictions[1].id).toBe("r2");
    expect(restrictions[1].type).toBe("blacklist");
  });

  it("should return empty array when no restrictions exist", async () => {
    const restrictions = await fetchIpRestrictions("company-1");
    expect(restrictions).toEqual([]);
  });

  it("should query by companyId", async () => {
    addMockDocs("ip_restrictions", [
      {
        id: "r1",
        companyId: "company-1",
        type: "whitelist",
        ipAddress: "192.168.1.1",
        isActive: true,
        createdAt: new Date(),
        createdBy: "user-1",
      },
    ]);

    await fetchIpRestrictions("company-1");

    expect(where).toHaveBeenCalledWith("companyId", "==", "company-1");
    expect(query).toHaveBeenCalled();
    expect(getDocs).toHaveBeenCalledOnce();
  });

  it("should handle errors gracefully and return empty array", async () => {
    vi.mocked(getDocs).mockRejectedValueOnce(new Error("Permission denied"));

    const restrictions = await fetchIpRestrictions("company-1");

    expect(restrictions).toEqual([]);
  });
});

describe("addIpRestriction", () => {
  it("should create a new IP restriction", async () => {
    await addIpRestriction("company-1", "whitelist", "192.168.1.50", "user-1");

    expect(setDoc).toHaveBeenCalledTimes(1);
  });

  it("should include the required fields in the document", async () => {
    await addIpRestriction("company-1", "whitelist", "192.168.1.50", "user-1");

    const [docRef, data] = (setDoc as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(data).toMatchObject({
      companyId: "company-1",
      type: "whitelist",
      ipAddress: "192.168.1.50",
      isActive: true,
      createdBy: "user-1",
    });
  });

  it("should set the restriction as active by default", async () => {
    await addIpRestriction("company-1", "blacklist", "10.0.0.99", "user-1");

    const [, data] = (setDoc as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(data.isActive).toBe(true);
  });

  it("should include optional subnet and description when provided", async () => {
    await addIpRestriction("company-1", "whitelist", "192.168.1.0", "user-1", {
      subnet: 24,
      description: "Office network",
    });

    const [, data] = (setDoc as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(data.subnet).toBe(24);
    expect(data.description).toBe("Office network");
  });

  it("should include optional expiration date when provided", async () => {
    const expiresAt = new Date("2025-01-01");
    await addIpRestriction("company-1", "whitelist", "10.0.0.1", "user-1", {
      expiresAt,
    });

    const [, data] = (setDoc as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(data.expiresAt).toEqual(expiresAt);
  });

  it("should throw when setDoc fails", async () => {
    vi.mocked(setDoc).mockRejectedValueOnce(new Error("Permission denied"));

    await expect(
      addIpRestriction("company-1", "whitelist", "192.168.1.1", "user-1"),
    ).rejects.toThrow("Permission denied");
  });
});

describe("removeIpRestriction", () => {
  it("should deactivate the restriction using updateDoc", async () => {
    await removeIpRestriction("restriction-1");

    expect(updateDoc).toHaveBeenCalledWith("ip_restrictions/restriction-1", {
      isActive: false,
    });
  });

  it("should throw when updateDoc fails", async () => {
    vi.mocked(updateDoc).mockRejectedValueOnce(new Error("Not found"));

    await expect(removeIpRestriction("nonexistent")).rejects.toThrow(
      "Not found",
    );
  });
});

describe("isIpAllowed", () => {
  it("should allow IP when no restrictions exist", async () => {
    const result = await isIpAllowed("192.168.1.1", "company-1");

    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("should allow IP when only inactive restrictions exist", async () => {
    addMockDocs("ip_restrictions", [
      {
        id: "r1",
        companyId: "company-1",
        type: "whitelist",
        ipAddress: "192.168.1.0",
        subnet: 24,
        isActive: false,
        createdAt: new Date(),
        createdBy: "user-1",
      },
    ]);

    const result = await isIpAllowed("192.168.1.100", "company-1");

    expect(result.allowed).toBe(true);
  });

  it("should block blacklisted IPs", async () => {
    addMockDocs("ip_restrictions", [
      {
        id: "r1",
        companyId: "company-1",
        type: "blacklist",
        ipAddress: "10.0.0.5",
        isActive: true,
        createdAt: new Date(),
        createdBy: "user-1",
      },
    ]);

    const result = await isIpAllowed("10.0.0.5", "company-1");

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("IP address is blacklisted");
  });

  it("should block IPs in a blacklisted subnet", async () => {
    addMockDocs("ip_restrictions", [
      {
        id: "r1",
        companyId: "company-1",
        type: "blacklist",
        ipAddress: "10.0.0.0",
        subnet: 24,
        isActive: true,
        createdAt: new Date(),
        createdBy: "user-1",
      },
    ]);

    // IP within the blacklisted subnet
    const result = await isIpAllowed("10.0.0.50", "company-1");

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("IP address is blacklisted");
  });

  it("should allow IPs outside the blacklisted subnet", async () => {
    addMockDocs("ip_restrictions", [
      {
        id: "r1",
        companyId: "company-1",
        type: "blacklist",
        ipAddress: "10.0.0.0",
        subnet: 24,
        isActive: true,
        createdAt: new Date(),
        createdBy: "user-1",
      },
    ]);

    // IP outside the blacklisted subnet
    const result = await isIpAllowed("10.0.1.1", "company-1");

    expect(result.allowed).toBe(true);
  });

  it("should allow whitelisted IPs and block non-whitelisted", async () => {
    addMockDocs("ip_restrictions", [
      {
        id: "r1",
        companyId: "company-1",
        type: "whitelist",
        ipAddress: "192.168.1.100",
        isActive: true,
        createdAt: new Date(),
        createdBy: "user-1",
      },
    ]);

    const allowedResult = await isIpAllowed("192.168.1.100", "company-1");
    expect(allowedResult.allowed).toBe(true);

    const blockedResult = await isIpAllowed("192.168.1.200", "company-1");
    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.reason).toBe("IP address not in whitelist");
  });

  it("should allow IPs in a whitelisted subnet", async () => {
    addMockDocs("ip_restrictions", [
      {
        id: "r1",
        companyId: "company-1",
        type: "whitelist",
        ipAddress: "10.0.0.0",
        subnet: 24,
        isActive: true,
        createdAt: new Date(),
        createdBy: "user-1",
      },
    ]);

    const result = await isIpAllowed("10.0.0.77", "company-1");
    expect(result.allowed).toBe(true);
  });

  it("should block IPs that are both blacklisted and not whitelisted (blacklist takes priority)", async () => {
    addMockDocs("ip_restrictions", [
      {
        id: "r1",
        companyId: "company-1",
        type: "blacklist",
        ipAddress: "10.0.0.5",
        isActive: true,
        createdAt: new Date(),
        createdBy: "user-1",
      },
      {
        id: "r2",
        companyId: "company-1",
        type: "whitelist",
        ipAddress: "192.168.1.0",
        subnet: 24,
        isActive: true,
        createdAt: new Date(),
        createdBy: "user-1",
      },
    ]);

    // Blacklisted IP — should be blocked regardless of whitelist
    const result = await isIpAllowed("10.0.0.5", "company-1");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("IP address is blacklisted");
  });

  it("should handle errors gracefully and fail open", async () => {
    vi.mocked(getDocs).mockRejectedValueOnce(new Error("Network error"));

    const result = await isIpAllowed("192.168.1.1", "company-1");

    expect(result.allowed).toBe(true); // Fail open
  });
});

describe("parseCidr", () => {
  it("should parse a valid CIDR notation", () => {
    const result = parseCidr("192.168.1.0/24");
    expect(result).toEqual({ baseIp: "192.168.1.0", subnet: 24 });
  });

  it("should parse CIDR with /8 subnet", () => {
    const result = parseCidr("10.0.0.0/8");
    expect(result).toEqual({ baseIp: "10.0.0.0", subnet: 8 });
  });

  it("should parse CIDR with /32 subnet (single IP)", () => {
    const result = parseCidr("192.168.1.1/32");
    expect(result).toEqual({ baseIp: "192.168.1.1", subnet: 32 });
  });

  it("should parse CIDR with /0 subnet", () => {
    const result = parseCidr("0.0.0.0/0");
    expect(result).toEqual({ baseIp: "0.0.0.0", subnet: 0 });
  });

  it("should return null for an invalid CIDR string", () => {
    expect(parseCidr("192.168.1.0")).toBeNull();
  });

  it("should return null for a non-IP string", () => {
    expect(parseCidr("not-an-ip")).toBeNull();
  });

  it("should return null for an empty string", () => {
    expect(parseCidr("")).toBeNull();
  });

  it("should return null for CIDR with invalid IP format", () => {
    expect(parseCidr("192.168.1/24")).toBeNull();
    expect(parseCidr("abcd::/64")).toBeNull();
  });

  it("should return null for CIDR with missing subnet", () => {
    expect(parseCidr("192.168.1.0/")).toBeNull();
  });
});

describe("formatIpAddress", () => {
  it("should return the IP as-is when no subnet is provided", () => {
    expect(formatIpAddress("192.168.1.1")).toBe("192.168.1.1");
  });

  it("should format IP with subnet when subnet is provided", () => {
    expect(formatIpAddress("192.168.1.0", 24)).toBe("192.168.1.0/24");
  });

  it("should support /8 subnet formatting", () => {
    expect(formatIpAddress("10.0.0.0", 8)).toBe("10.0.0.0/8");
  });

  it("should support /32 subnet formatting", () => {
    expect(formatIpAddress("192.168.1.1", 32)).toBe("192.168.1.1/32");
  });

  it("should handle IPv6 addresses without subnet", () => {
    expect(formatIpAddress("::1")).toBe("::1");
  });
});

describe("CIDR subnet matching (via isIpAllowed)", () => {
  it("should match IPs within a /24 subnet", async () => {
    addMockDocs("ip_restrictions", [
      {
        id: "r1",
        companyId: "company-1",
        type: "whitelist",
        ipAddress: "192.168.1.0",
        subnet: 24,
        isActive: true,
        createdAt: new Date(),
        createdBy: "user-1",
      },
    ]);

    const inRange = await isIpAllowed("192.168.1.55", "company-1");
    expect(inRange.allowed).toBe(true);

    const outOfRange = await isIpAllowed("192.168.2.1", "company-1");
    expect(outOfRange.allowed).toBe(false);
  });

  it("should match IPs within a /16 subnet", async () => {
    addMockDocs("ip_restrictions", [
      {
        id: "r1",
        companyId: "company-1",
        type: "blacklist",
        ipAddress: "172.16.0.0",
        subnet: 16,
        isActive: true,
        createdAt: new Date(),
        createdBy: "user-1",
      },
    ]);

    const blocked = await isIpAllowed("172.16.50.1", "company-1");
    expect(blocked.allowed).toBe(false);

    const allowed = await isIpAllowed("172.17.0.1", "company-1");
    expect(allowed.allowed).toBe(true);
  });

  it("should match IPs within a /8 subnet", async () => {
    addMockDocs("ip_restrictions", [
      {
        id: "r1",
        companyId: "company-1",
        type: "whitelist",
        ipAddress: "10.0.0.0",
        subnet: 8,
        isActive: true,
        createdAt: new Date(),
        createdBy: "user-1",
      },
    ]);

    const inRange = await isIpAllowed("10.50.100.200", "company-1");
    expect(inRange.allowed).toBe(true);

    const outOfRange = await isIpAllowed("11.0.0.1", "company-1");
    expect(outOfRange.allowed).toBe(false);
  });
});

describe("exact IP matching (via isIpAllowed)", () => {
  it("should match exact IPs without a subnet", async () => {
    addMockDocs("ip_restrictions", [
      {
        id: "r1",
        companyId: "company-1",
        type: "blacklist",
        ipAddress: "203.0.113.42",
        isActive: true,
        createdAt: new Date(),
        createdBy: "user-1",
      },
    ]);

    const blocked = await isIpAllowed("203.0.113.42", "company-1");
    expect(blocked.allowed).toBe(false);

    const allowed = await isIpAllowed("203.0.113.43", "company-1");
    expect(allowed.allowed).toBe(true);
  });

  it("should not match similar IPs with different octets", async () => {
    addMockDocs("ip_restrictions", [
      {
        id: "r1",
        companyId: "company-1",
        type: "whitelist",
        ipAddress: "198.51.100.10",
        isActive: true,
        createdAt: new Date(),
        createdBy: "user-1",
      },
    ]);

    const result = await isIpAllowed("198.51.100.11", "company-1");
    expect(result.allowed).toBe(false);
  });
});

describe("getClientIp", () => {
  it("should fetch IP from ipify API", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ip: "203.0.113.1" }),
    });
    global.fetch = mockFetch;

    const ip = await getClientIp();

    expect(ip).toBe("203.0.113.1");
    expect(mockFetch).toHaveBeenCalledWith("https://api.ipify.org?format=json");
  });

  it("should return 'unknown' when the API call fails", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
    global.fetch = mockFetch;

    const ip = await getClientIp();

    expect(ip).toBe("unknown");
  });
});

describe("logIpAccess", () => {
  it("should log the access attempt to Firestore", async () => {
    await logIpAccess("user-1", "192.168.1.1", true);

    expect(setDoc).toHaveBeenCalledTimes(1);
  });

  it("should include all required fields", async () => {
    await logIpAccess(
      "user-1",
      "192.168.1.1",
      false,
      "Blacklisted IP",
      "/admin",
    );

    const [, data] = (setDoc as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(data.userId).toBe("user-1");
    expect(data.ipAddress).toBe("192.168.1.1");
    expect(data.allowed).toBe(false);
    expect(data.reason).toBe("Blacklisted IP");
    expect(data.path).toBe("/admin");
  });
});

describe("validateIpOnLogin", () => {
  it("should return false when no user is provided", async () => {
    const result = await validateIpOnLogin(null, "company-1");
    expect(result).toBe(false);
  });

  it("should fetch IP, check restrictions, and log access", async () => {
    addMockDocs("ip_restrictions", []); // No restrictions = allowed
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ip: "192.168.1.1" }),
    });
    global.fetch = mockFetch;

    const result = await validateIpOnLogin(mockUser, "company-1");

    expect(result).toBe(true);
    expect(setDoc).toHaveBeenCalledTimes(1); // logIpAccess was called
  });

  it("should return false when IP is blacklisted", async () => {
    addMockDocs("ip_restrictions", [
      {
        id: "r1",
        companyId: "company-1",
        type: "blacklist",
        ipAddress: "10.0.0.5",
        isActive: true,
        createdAt: new Date(),
        createdBy: "user-1",
      },
    ]);
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ip: "10.0.0.5" }),
    });
    global.fetch = mockFetch;

    const result = await validateIpOnLogin(mockUser, "company-1");

    expect(result).toBe(false);
  });

  it("should fail open when an error occurs", async () => {
    vi.mocked(getDocs).mockRejectedValueOnce(new Error("Firestore error"));
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ ip: "192.168.1.1" }),
    });
    global.fetch = mockFetch;

    const result = await validateIpOnLogin(mockUser, "company-1");

    expect(result).toBe(true); // fail open
  });
});
