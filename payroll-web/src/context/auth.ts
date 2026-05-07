import { createContext } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import type {
  UserAccount,
  UserRestriction,
  UserCompany,
  UserSettings,
  Department,
  Section,
} from "../types";

export interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: UserAccount | null;
  restrictions: UserRestriction[];
  userCompanies: UserCompany[];
  settings: UserSettings | null;
  currentCompanyId: string | null;
  loading: boolean;
  sessionExpiring: boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setCurrentCompanyId: (companyId: string) => void;
  hasPermission: (
    department: Department,
    section: Section,
    action: "view" | "add" | "edit" | "delete",
  ) => boolean;
  refreshSession: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
