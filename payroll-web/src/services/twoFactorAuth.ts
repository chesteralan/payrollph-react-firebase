// Two-Factor Authentication service using TOTP (Time-based One-Time Password)
// Uses Firebase Phone Auth as the second factor

import { auth } from '../config/firebase'
import {
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  MultiFactorResolver,
  multiFactor,
  TotpMultiFactorGenerator,
  TotpSecret,
  type User,
  type MultiFactorError,
} from 'firebase/auth'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

export interface TwoFactorSetupResult {
  secret: TotpSecret
  otpAuthUri: string
  qrCodeUrl: string
}

export interface TwoFactorStatus {
  isEnabled: boolean
  enrollmentDate?: Date
  method?: 'totp' | 'phone'
}

// Check if 2FA is enabled for a user
export const getTwoFactorStatus = async (userId: string): Promise<TwoFactorStatus> => {
  try {
    const userDoc = await getDoc(doc(db, 'user_accounts', userId))
    if (!userDoc.exists()) return { isEnabled: false }

    const data = userDoc.data()
    return {
      isEnabled: data.twoFactorEnabled || false,
      enrollmentDate: data.twoFactorEnrolledAt?.toDate(),
      method: data.twoFactorMethod,
    }
  } catch (error) {
    console.error('Failed to get 2FA status:', error)
    return { isEnabled: false }
  }
}

// Enable TOTP-based 2FA
export const setupTotp2FA = async (user: User): Promise<TwoFactorSetupResult> => {
  try {
    const secret = await multiFactor(user).getSession()
    const totpSecret = await TotpMultiFactorGenerator.generateSecret(secret)

    return {
      secret: totpSecret,
      otpAuthUri: totpSecret.otpAuthUri,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpSecret.otpAuthUri)}`,
    }
  } catch (error) {
    console.error('Failed to setup TOTP 2FA:', error)
    throw error
  }
}

// Verify and enroll TOTP 2FA
export const enrollTotp2FA = async (user: User, secret: TotpSecret, verificationCode: string): Promise<void> => {
  try {
    const assertion = TotpMultiFactorGenerator.assertionForSignIn(secret, verificationCode)
    await multiFactor(user).enroll(assertion, {
      displayName: 'Authenticator App',
    })

    // Update user record
    await updateDoc(doc(db, 'user_accounts', user.uid), {
      twoFactorEnabled: true,
      twoFactorMethod: 'totp',
      twoFactorEnrolledAt: new Date(),
    })
  } catch (error) {
    console.error('Failed to enroll TOTP 2FA:', error)
    throw error
  }
}

// Setup Phone-based 2FA
export const setupPhone2FA = async (user: User, phoneNumber: string): Promise<string> => {
  try {
    const session = await multiFactor(user).getSession()
    const phoneProvider = new PhoneAuthProvider(auth)
    const verificationId = await phoneProvider.verifyPhoneNumber({
      phoneNumber,
      session,
    })

    return verificationId
  } catch (error) {
    console.error('Failed to setup phone 2FA:', error)
    throw error
  }
}

// Verify and enroll Phone 2FA
export const enrollPhone2FA = async (
  user: User,
  verificationId: string,
  verificationCode: string
): Promise<void> => {
  try {
    const phoneAuthCredential = PhoneAuthProvider.credential(verificationId, verificationCode)
    const assertion = PhoneMultiFactorGenerator.assertion(phoneAuthCredential)

    await multiFactor(user).enroll(assertion, {
      displayName: 'Phone Number',
    })

    // Update user record
    await updateDoc(doc(db, 'user_accounts', user.uid), {
      twoFactorEnabled: true,
      twoFactorMethod: 'phone',
      twoFactorEnrolledAt: new Date(),
    })
  } catch (error) {
    console.error('Failed to enroll phone 2FA:', error)
    throw error
  }
}

// Disable 2FA
export const disable2FA = async (user: User): Promise<void> => {
  try {
    const enrollments = multiFactor(user).enrollments
    if (enrollments.length > 0) {
      await multiFactor(user).unenroll(enrollments[0])
    }

    // Update user record
    await updateDoc(doc(db, 'user_accounts', user.uid), {
      twoFactorEnabled: false,
      twoFactorMethod: null,
      twoFactorEnrolledAt: null,
    })
  } catch (error) {
    console.error('Failed to disable 2FA:', error)
    throw error
  }
}

// Handle 2FA during sign-in (for resolver flow)
export const resolve2FAChallenge = async (
  resolver: MultiFactorResolver,
  verificationId: string,
  verificationCode: string
): Promise<User> => {
  try {
    const phoneAuthCredential = PhoneAuthProvider.credential(verificationId, verificationCode)
    const assertion = PhoneMultiFactorGenerator.assertion(phoneAuthCredential)

    const userCredential = await resolver.resolveSignIn(assertion)
    return userCredential.user
  } catch (error) {
    console.error('Failed to resolve 2FA challenge:', error)
    throw error
  }
}

// Check if error is a 2FA challenge
export const is2FAError = (error: unknown): error is MultiFactorError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'auth/multi-factor-auth-required'
  )
}

// Generate backup codes
export const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const code = Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
      .match(/.{1,4}/g)
      ?.join('-') || ''
    codes.push(code)
  }
  return codes
}

// Verify backup code
export const verifyBackupCode = async (userId: string, code: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'user_accounts', userId))
    if (!userDoc.exists()) return false

    const data = userDoc.data()
    const backupCodes: string[] = data.backupCodes || []

    const normalizedCode = code.replace(/-/g, '').toUpperCase()
    const codeIndex = backupCodes.findIndex(
      (c: string) => c.replace(/-/g, '').toUpperCase() === normalizedCode
    )

    if (codeIndex === -1) return false

    // Remove used backup code
    backupCodes.splice(codeIndex, 1)
    await updateDoc(doc(db, 'user_accounts', userId), {
      backupCodes,
    })

    return true
  } catch (error) {
    console.error('Failed to verify backup code:', error)
    return false
  }
}
