import { ReactNode } from "react";

export interface NavItem {
  label: string;
  icon: ReactNode;
  path?: string;
  children?: NavItem[];
  department?: string;
  section?: string;
}

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}
