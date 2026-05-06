import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import type { User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import type { UserAccount, UserRestriction, UserCompany, UserSettings, Department, Section } from '../types'

interface AuthContextType {
  firebaseUser: FirebaseUser | null
  user: UserAccount | null
  restrictions: UserRestriction[]
  userCompanies: UserCompany[]
  settings: UserSettings | null
  currentCompanyId: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setCurrentCompanyId: (companyId: string) => void
  hasPermission: (department: Department, section: Section, action: 'view' | 'add' | 'edit' | 'delete') => boolean
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

          if (companiesData.length > 0) {
            const primary = companiesData.find((c) => c.isPrimary)
            setCurrentCompanyIdState(
              settingsData?.defaultCompanyId || primary?.companyId || companiesData[0].companyId || null
            )
          }
        }
      } else {
        setUser(null)
        setRestrictions([])
        setUserCompanies([])
        setSettings(null)
        setCurrentCompanyIdState(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    await signOut(auth)
  }

  const setCurrentCompanyId = (companyId: string) => {
    setCurrentCompanyIdState(companyId)
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
        login,
        logout,
        setCurrentCompanyId,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
