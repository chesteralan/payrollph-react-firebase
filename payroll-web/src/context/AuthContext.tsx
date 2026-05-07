import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
} from 'firebase/auth'
import type { User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import type { UserAccount, UserRestriction, UserCompany, UserSettings, Department, Section } from '../types'
import { setHtmlLang } from '../i18n'

const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll']

interface AuthContextType {
  firebaseUser: FirebaseUser | null
  user: UserAccount | null
  restrictions: UserRestriction[]
  userCompanies: UserCompany[]
  settings: UserSettings | null
  currentCompanyId: string | null
  loading: boolean
  sessionExpiring: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  setCurrentCompanyId: (companyId: string) => void
  hasPermission: (department: Department, section: Section, action: 'view' | 'add' | 'edit' | 'delete') => boolean
  refreshSession: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<UserAccount | null>(null)
  const [restrictions, setRestrictions] = useState<UserRestriction[]>([])
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>([])
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [currentCompanyId, setCurrentCompanyIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionExpiring, setSessionExpiring] = useState(false)

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expiryWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef<number>(0)

  const clearSessionTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
    if (expiryWarningTimerRef.current) {
      clearTimeout(expiryWarningTimerRef.current)
      expiryWarningTimerRef.current = null
    }
  }, [])

  const handleSessionExpired = useCallback(async () => {
    clearSessionTimers()
    setSessionExpiring(false)
    await signOut(auth)
  }, [clearSessionTimers])

  const resetIdleTimer = useCallback(() => {
    if (!firebaseUser) return

    lastActivityRef.current = Date.now()
    setSessionExpiring(false)
    clearSessionTimers()

    expiryWarningTimerRef.current = setTimeout(() => {
      setSessionExpiring(true)
    }, SESSION_TIMEOUT_MS - 60000) // Warning 1 minute before

    idleTimerRef.current = setTimeout(() => {
      handleSessionExpired()
    }, SESSION_TIMEOUT_MS)
  }, [firebaseUser, clearSessionTimers, handleSessionExpired])

  const refreshSession = useCallback(() => {
    resetIdleTimer()
  }, [resetIdleTimer])

  useEffect(() => {
    const handleActivity = () => {
      if (firebaseUser) {
        resetIdleTimer()
      }
    }

    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, handleActivity)
    })

    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [firebaseUser, resetIdleTimer])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser)

      if (fbUser) {
        const userDoc = await getDoc(doc(db, 'user_accounts', fbUser.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setUser({
            id: fbUser.uid,
            email: fbUser.email || '',
            username: userData.username,
            displayName: userData.displayName,
            avatarUrl: userData.avatarUrl,
            isActive: userData.isActive ?? true,
            createdAt: userData.createdAt?.toDate(),
            updatedAt: userData.updatedAt?.toDate(),
          })

          const [restrictionsSnap, companiesSnap, settingsSnap] = await Promise.all([
            getDocs(query(collection(db, 'user_restrictions'), where('userId', '==', fbUser.uid))),
            getDocs(query(collection(db, 'user_companies'), where('userId', '==', fbUser.uid))),
            getDocs(query(collection(db, 'user_settings'), where('userId', '==', fbUser.uid))),
          ])

          const restrictionsData = restrictionsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as UserRestriction[]
          const companiesData = companiesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as UserCompany[]
          const settingsDoc = settingsSnap.docs[0]
          const settingsData = settingsDoc ? ({ id: settingsDoc.id, ...settingsDoc.data() } as UserSettings) : null

          setRestrictions(restrictionsData)
          setUserCompanies(companiesData)
          setSettings(settingsData)

          if (settingsData?.locale) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setHtmlLang(settingsData.locale as any)
          }

          if (companiesData.length > 0) {
            const primary = companiesData.find((c) => c.isPrimary)
            setCurrentCompanyIdState(
              settingsData?.defaultCompanyId || primary?.companyId || companiesData[0].companyId || null
            )
          }

          resetIdleTimer()
        }
      } else {
        setUser(null)
        setRestrictions([])
        setUserCompanies([])
        setSettings(null)
        setCurrentCompanyIdState(null)
        setSessionExpiring(false)
        clearSessionTimers()
      }

      setLoading(false)
    })

    return () => {
      unsubscribe()
      clearSessionTimers()
    }
  }, [resetIdleTimer, clearSessionTimers])

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    clearSessionTimers()
    await signOut(auth)
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!firebaseUser || !firebaseUser.email) throw new Error('No authenticated user')
    const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword)
    await reauthenticateWithCredential(firebaseUser, credential)
    await updatePassword(firebaseUser, newPassword)
  }

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

  const setCurrentCompanyId = (companyId: string) => {
    setCurrentCompanyIdState(companyId)
    resetIdleTimer()
  }

  const hasPermission = (
    department: Department,
    section: Section,
    action: 'view' | 'add' | 'edit' | 'delete'
  ) => {
    const restriction = restrictions.find(
      (r) => r.department === department && r.section === section
    )
    if (!restriction) return false
    if (action === 'view') return restriction.canView
    if (action === 'add') return restriction.canAdd
    if (action === 'edit') return restriction.canEdit
    if (action === 'delete') return restriction.canDelete
    return false
  }

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        restrictions,
        userCompanies,
        settings,
        currentCompanyId,
        loading,
        sessionExpiring,
        login,
        logout,
        changePassword,
        resetPassword,
        setCurrentCompanyId,
        hasPermission,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
