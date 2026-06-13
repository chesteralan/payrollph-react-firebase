import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
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
} from "@/types";
import type { Locale } from "@/i18n";
import { setHtmlLang } from "@/i18n";
import { AuthContext } from "@/context/auth";
import { ValueStore } from "@/utils/valueStore";
import { AuthStoreContext } from "./hooks";
import type { AuthStores } from "./hooks";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"];

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
                companiesData[0]?.companyId ||
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

  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean = false) => {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence,
      );
      await signInWithEmailAndPassword(auth, email, password);
    },
    [],
  );

  const logout = useCallback(async () => {
    clearSessionTimers();
    await signOut(auth);
  }, [clearSessionTimers]);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!firebaseUser || !firebaseUser.email)
        throw new Error("No authenticated user");
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        currentPassword,
      );
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
    },
    [firebaseUser],
  );

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const setCurrentCompanyId = useCallback(
    (companyId: string) => {
      setCurrentCompanyIdState(companyId);
      resetIdleTimer();
    },
    [resetIdleTimer],
  );

  const hasPermission = useCallback(
    (
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
    },
    [restrictions],
  );

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
