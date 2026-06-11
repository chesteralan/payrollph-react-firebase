import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  useSyncExternalStore,
  createContext,
  useContext,
} from "react";
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
} from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import type {
  UserAccount,
  UserRestriction,
  UserCompany,
  UserSettings,
  Department,
  Section,
} from "../types";
import type { Locale } from "@/i18n";
import { setHtmlLang } from "@/i18n";
import { AuthContext } from "@/context/auth";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"];

// ──────────────────────────────────────────────
// Minimal observable store for useSyncExternalStore
// ──────────────────────────────────────────────
class ValueStore<T> {
  private value: T;
  private listeners = new Set<() => void>();

  constructor(initial: T) {
    this.value = initial;
  }

  getSnapshot = (): T => this.value;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  set = (newValue: T): void => {
    if (!Object.is(this.value, newValue)) {
      this.value = newValue;
      this.listeners.forEach((l) => l());
    }
  };
}

// ──────────────────────────────────────────────
// Store context for subscription-based selector hooks
// ──────────────────────────────────────────────
export interface AuthStores {
  user: ValueStore<UserAccount | null>;
  currentCompanyId: ValueStore<string | null>;
  loading: ValueStore<boolean>;
  restrictions: ValueStore<UserRestriction[]>;
}

export const AuthStoreContext = createContext<AuthStores | null>(null);

// ──────────────────────────────────────────────
// Selector hooks (useSyncExternalStore-based)
// ──────────────────────────────────────────────
function useStoreValue<T>(store: ValueStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

/**
 * Returns only the currentCompanyId — component re-renders ONLY when
 * this specific value changes, not when any other auth state changes.
 */
export function useCurrentCompanyId(): string | null {
  const stores = useContext(AuthStoreContext);
  if (!stores) {
    throw new Error("useCurrentCompanyId must be used within AuthProvider");
  }
  return useStoreValue(stores.currentCompanyId);
}

/**
 * Returns only the current user — component re-renders ONLY when
 * the user object changes.
 */
export function useCurrentUser(): UserAccount | null {
  const stores = useContext(AuthStoreContext);
  if (!stores) {
    throw new Error("useCurrentUser must be used within AuthProvider");
  }
  return useStoreValue(stores.user);
}

/**
 * Returns only the loading state — component re-renders ONLY when
 * loading status changes.
 */
export function useAuthLoading(): boolean {
  const stores = useContext(AuthStoreContext);
  if (!stores) {
    throw new Error("useAuthLoading must be used within AuthProvider");
  }
  return useStoreValue(stores.loading);
}

/**
 * Returns restrictions and a hasPermission checker — component re-renders
 * ONLY when restrictions change.
 */
export function useUserPermissions(): {
  restrictions: UserRestriction[];
  hasPermission: (
    department: Department,
    section: Section,
    action: "view" | "add" | "edit" | "delete",
  ) => boolean;
} {
  const stores = useContext(AuthStoreContext);
  if (!stores) {
    throw new Error("useUserPermissions must be used within AuthProvider");
  }
  const restrictions = useStoreValue(stores.restrictions);

  const hasPermission = useCallback(
    (
      department: Department,
      section: Section,
      action: "view" | "add" | "edit" | "delete",
    ): boolean => {
      const restriction = restrictions.find(
        (r) => r.department === department && r.section === section,
      );
      if (!restriction) return false;
      if (action === "view") return restriction.canView;
      if (action === "add") return restriction.canAdd;
      if (action === "edit") return restriction.canEdit;
      if (action === "delete") return restriction.canDelete;
      return false;
    },
    [restrictions],
  );

  return useMemo(
    () => ({ restrictions, hasPermission }),
    [restrictions, hasPermission],
  );
}

// ──────────────────────────────────────────────
// AuthProvider component
// ──────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserAccount | null>(null);
  const [restrictions, setRestrictions] = useState<UserRestriction[]>([]);
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [currentCompanyId, setCurrentCompanyIdState] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [sessionExpiring, setSessionExpiring] = useState(false);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expiryWarningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastActivityRef = useRef<number>(0);

  // Initialize observable stores for selector hooks
  const storesRef = useRef<AuthStores | null>(null);
  if (!storesRef.current) {
    storesRef.current = {
      user: new ValueStore<UserAccount | null>(null),
      currentCompanyId: new ValueStore<string | null>(null),
      loading: new ValueStore<boolean>(true),
      restrictions: new ValueStore<UserRestriction[]>([]),
    };
  }

  // Sync observable stores when state changes
  const stores = storesRef.current;
  stores.user.set(user);
  stores.currentCompanyId.set(currentCompanyId);
  stores.loading.set(loading);
  stores.restrictions.set(restrictions);

  const clearSessionTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (expiryWarningTimerRef.current) {
      clearTimeout(expiryWarningTimerRef.current);
      expiryWarningTimerRef.current = null;
    }
  }, []);

  const handleSessionExpired = useCallback(async () => {
    clearSessionTimers();
    setSessionExpiring(false);
    await signOut(auth);
  }, [clearSessionTimers]);

  const resetIdleTimer = useCallback(() => {
    if (!firebaseUser) return;

    lastActivityRef.current = Date.now();
    setSessionExpiring(false);
    clearSessionTimers();

    expiryWarningTimerRef.current = setTimeout(() => {
      setSessionExpiring(true);
    }, SESSION_TIMEOUT_MS - 60000);

    idleTimerRef.current = setTimeout(() => {
      handleSessionExpired();
    }, SESSION_TIMEOUT_MS);
  }, [firebaseUser, clearSessionTimers, handleSessionExpired]);

  const refreshSession = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  useEffect(() => {
    const handleActivity = () => {
      if (firebaseUser) {
        resetIdleTimer();
      }
    };

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [firebaseUser, resetIdleTimer]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        const userDoc = await getDoc(doc(db, "user_accounts", fbUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            id: fbUser.uid,
            email: fbUser.email || "",
            username: userData.username,
            displayName: userData.displayName,
            avatarUrl: userData.avatarUrl,
            isActive: userData.isActive ?? true,
            createdAt: userData.createdAt?.toDate(),
            updatedAt: userData.updatedAt?.toDate(),
          });

          const [restrictionsSnap, companiesSnap, settingsSnap] =
            await Promise.all([
              getDocs(
                query(
                  collection(db, "user_restrictions"),
                  where("userId", "==", fbUser.uid),
                ),
              ),
              getDocs(
                query(
                  collection(db, "user_companies"),
                  where("userId", "==", fbUser.uid),
                ),
              ),
              getDocs(
                query(
                  collection(db, "user_settings"),
                  where("userId", "==", fbUser.uid),
                ),
              ),
            ]);

          const restrictionsData = restrictionsSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as UserRestriction[];
          const companiesData = companiesSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as UserCompany[];
          const settingsDoc = settingsSnap.docs[0];
          const settingsData = settingsDoc
            ? ({ id: settingsDoc.id, ...settingsDoc.data() } as UserSettings)
            : null;

          setRestrictions(restrictionsData);
          setUserCompanies(companiesData);
          setSettings(settingsData);

          if (settingsData?.locale) {
            setHtmlLang(settingsData.locale as Locale);
          }

          if (companiesData.length > 0) {
            const primary = companiesData.find((c) => c.isPrimary);
            setCurrentCompanyIdState(
              settingsData?.defaultCompanyId ||
                primary?.companyId ||
                companiesData[0].companyId ||
                null,
            );
          }

          resetIdleTimer();
        }
      } else {
        setUser(null);
        setRestrictions([]);
        setUserCompanies([]);
        setSettings(null);
        setCurrentCompanyIdState(null);
        setSessionExpiring(false);
        clearSessionTimers();
      }

      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearSessionTimers();
    };
  }, [resetIdleTimer, clearSessionTimers]);

  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false,
  ) => {
    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence,
    );
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    clearSessionTimers();
    await signOut(auth);
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    if (!firebaseUser || !firebaseUser.email)
      throw new Error("No authenticated user");
    const credential = EmailAuthProvider.credential(
      firebaseUser.email,
      currentPassword,
    );
    await reauthenticateWithCredential(firebaseUser, credential);
    await updatePassword(firebaseUser, newPassword);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const setCurrentCompanyId = (companyId: string) => {
    setCurrentCompanyIdState(companyId);
    resetIdleTimer();
  };

  const hasPermission = (
    department: Department,
    section: Section,
    action: "view" | "add" | "edit" | "delete",
  ) => {
    const restriction = restrictions.find(
      (r) => r.department === department && r.section === section,
    );
    if (!restriction) return false;
    if (action === "view") return restriction.canView;
    if (action === "add") return restriction.canAdd;
    if (action === "edit") return restriction.canEdit;
    if (action === "delete") return restriction.canDelete;
    return false;
  };

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(
    () => ({
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
    }),
    [
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
    ],
  );

  return (
    <AuthStoreContext.Provider value={stores}>
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    </AuthStoreContext.Provider>
  );
}
