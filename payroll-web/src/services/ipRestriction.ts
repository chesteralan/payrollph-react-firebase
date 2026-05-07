// IP-based access restriction service
// Note: For production use, IP validation should be done on the backend (Firebase Functions)
// This provides the client-side configuration and validation structure

import { doc, setDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { UserAccount } from '../types'

export type IpRestrictionType = 'whitelist' | 'blacklist'
export type IpAddress = string // IPv4 or IPv6

export interface IpRestriction {
  id: string
  companyId: string
  type: IpRestrictionType
  ipAddress: IpAddress
  subnet?: number // CIDR notation (e.g., /24)
  description?: string
  isActive: boolean
  createdAt: Date
  createdBy: string
  expiresAt?: Date
}

export interface IpAccessLog {
  id: string
  userId: string
  ipAddress: string
  userAgent: string
  timestamp: Date
  allowed: boolean
  reason?: string
  path: string
}

// Fetch IP restrictions for a company
export const fetchIpRestrictions = async (companyId: string): Promise<IpRestriction[]> => {
  try {
    const q = query(
      collection(db, 'ip_restrictions'),
      where('companyId', '==', companyId)
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as IpRestriction))
  } catch (error) {
    console.error('Failed to fetch IP restrictions:', error)
    return []
  }
}

// Add IP restriction
export const addIpRestriction = async (
  companyId: string,
  type: IpRestrictionType,
  ipAddress: IpAddress,
  userId: string,
  options?: {
    subnet?: number
    description?: string
    expiresAt?: Date
  }
): Promise<void> => {
  try {
    await setDoc(doc(collection(db, 'ip_restrictions')), {
      companyId,
      type,
      ipAddress,
      subnet: options?.subnet,
      description: options?.description,
      isActive: true,
      createdAt: new Date(),
      createdBy: userId,
      expiresAt: options?.expiresAt,
    })
  } catch (error) {
    console.error('Failed to add IP restriction:', error)
    throw error
  }
}

// Remove IP restriction
export const removeIpRestriction = async (restrictionId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'ip_restrictions', restrictionId), {
      isActive: false,
      // Alternatively, delete the document: await deleteDoc(doc(db, 'ip_restrictions', restrictionId))
    })
  } catch (error) {
    console.error('Failed to remove IP restriction:', error)
    throw error
  }
}

// Get client IP address (requires backend API for accurate results)
export const getClientIp = async (): Promise<string> => {
  try {
    // Using a public IP API - replace with your own backend endpoint in production
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip || 'unknown'
  } catch {
    // Fallback: use connection API if available
    const connection = (navigator as { connection?: { rtt?: number } })?.connection
    if (connection) {
      return 'client-ip-unavailable'
    }
    return 'unknown'
  }
}

// Validate IP against restrictions (client-side preliminary check)
// Note: This should be validated server-side for security
export const isIpAllowed = async (
  ipAddress: string,
  companyId: string
): Promise<{ allowed: boolean; reason?: string }> => {
  try {
    const restrictions = await fetchIpRestrictions(companyId)
    const activeRestrictions = restrictions.filter(r => r.isActive)

    if (activeRestrictions.length === 0) {
      return { allowed: true }
    }

    const whitelist = activeRestrictions.filter(r => r.type === 'whitelist')
    const blacklist = activeRestrictions.filter(r => r.type === 'blacklist')

    // Check blacklist first
    const isBlacklisted = blacklist.some(r => matchesIp(ipAddress, r.ipAddress, r.subnet))
    if (isBlacklisted) {
      return { allowed: false, reason: 'IP address is blacklisted' }
    }

    // If whitelist exists, IP must be in it
    if (whitelist.length > 0) {
      const isWhitelisted = whitelist.some(r => matchesIp(ipAddress, r.ipAddress, r.subnet))
      if (!isWhitelisted) {
        return { allowed: false, reason: 'IP address not in whitelist' }
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error('Failed to validate IP:', error)
    return { allowed: true } // Fail open by default
  }
}

// Check if IP matches a restriction (supports CIDR notation)
const matchesIp = (clientIp: string, restrictedIp: string, subnet?: number): boolean => {
  // Simple exact match
  if (!subnet) {
    return clientIp === restrictedIp
  }

  // CIDR matching for IPv4
  if (restrictedIp.includes('/')) {
    const [baseIp, cidrStr] = restrictedIp.split('/')
    const cidr = parseInt(cidrStr, 10)
    return isInSubnet(clientIp, baseIp, cidr)
  }

  // Subnet parameter provided
  if (subnet) {
    return isInSubnet(clientIp, restrictedIp, subnet)
  }

  return clientIp === restrictedIp
}

// Check if IP is in subnet (IPv4 only)
const isInSubnet = (ip: string, subnetBase: string, subnetMask: number): boolean => {
  const ipParts = ip.split('.').map(Number)
  const baseParts = subnetBase.split('.').map(Number)

  if (ipParts.length !== 4 || baseParts.length !== 4) return false

  // Convert to 32-bit integers
  const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3]
  const baseInt = (baseParts[0] << 24) | (baseParts[1] << 16) | (baseParts[2] << 8) | baseParts[3]

  // Create mask
  const mask = subnetMask === 0 ? 0 : (0xFFFFFFFF << (32 - subnetMask)) >>> 0

  return (ipInt & mask) === (baseInt & mask)
}

// Log IP access attempt
export const logIpAccess = async (
  userId: string,
  ipAddress: string,
  allowed: boolean,
  reason?: string,
  path: string = window.location.pathname
): Promise<void> => {
  try {
    await setDoc(doc(collection(db, 'ip_access_logs')), {
      userId,
      ipAddress,
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      allowed,
      reason,
      path,
    })
  } catch (error) {
    console.error('Failed to log IP access:', error)
  }
}

// Validate IP on login (call this during authentication)
export const validateIpOnLogin = async (
  user: UserAccount | null,
  companyId: string
): Promise<boolean> => {
  if (!user) return false

  try {
    const clientIp = await getClientIp()
    const { allowed, reason } = await isIpAllowed(clientIp, companyId)

    await logIpAccess(user.id, clientIp, allowed, reason)

    return allowed
  } catch (error) {
    console.error('IP validation failed:', error)
    return true // Fail open
  }
}

// Helper: Parse IP range from CIDR notation
export const parseCidr = (cidr: string): { baseIp: string; subnet: number } | null => {
  const match = cidr.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/)
  if (!match) return null

  return {
    baseIp: match[1],
    subnet: parseInt(match[2], 10),
  }
}

// Format IP for display
export const formatIpAddress = (ip: string, subnet?: number): string => {
  if (subnet) {
    return `${ip}/${subnet}`
  }
  return ip
}
