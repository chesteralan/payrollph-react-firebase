import { type ReactNode } from "react";

function createIcon(name: string) {
  return function MockIcon({ className, "aria-hidden": ariaHidden }: { className?: string; "aria-hidden"?: boolean }) {
    return (
      <svg
        data-testid={`lucide-${name.toLowerCase()}`}
        className={className}
        aria-hidden={ariaHidden ?? true}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
      </svg>
    ) as unknown as ReactNode;
  };
}

export const Activity = createIcon("Activity");
export const AlertCircle = createIcon("AlertCircle");
export const AlertTriangle = createIcon("AlertTriangle");
export const ArrowDownToLine = createIcon("ArrowDownToLine");
export const ArrowLeft = createIcon("ArrowLeft");
export const ArrowRight = createIcon("ArrowRight");
export const ArrowUpFromLine = createIcon("ArrowUpFromLine");
export const Banknote = createIcon("Banknote");
export const BarChart3 = createIcon("BarChart3");
export const Bell = createIcon("Bell");
export const Briefcase = createIcon("Briefcase");
export const Building2 = createIcon("Building2");
export const Calculator = createIcon("Calculator");
export const Calendar = createIcon("Calendar");
export const CalendarDays = createIcon("CalendarDays");
export const Check = createIcon("Check");
export const CheckCircle = createIcon("CheckCircle");
export const CheckCircle2 = createIcon("CheckCircle2");
export const CheckSquare = createIcon("CheckSquare");
export const ChevronDown = createIcon("ChevronDown");
export const ChevronLeft = createIcon("ChevronLeft");
export const ChevronRight = createIcon("ChevronRight");
export const ChevronsUpDown = createIcon("ChevronsUpDown");
export const ChevronUp = createIcon("ChevronUp");
export const Clock = createIcon("Clock");
export const Copy = createIcon("Copy");
export const CopyPlus = createIcon("CopyPlus");
export const CreditCard = createIcon("CreditCard");
export const Database = createIcon("Database");
export const DollarSign = createIcon("DollarSign");
export const Download = createIcon("Download");
export const Edit = createIcon("Edit");
export const Eye = createIcon("Eye");
export const File = createIcon("File");
export const FileSpreadsheet = createIcon("FileSpreadsheet");
export const FileText = createIcon("FileText");
export const Filter = createIcon("Filter");
export const FolderOpen = createIcon("FolderOpen");
export const Funnel = createIcon("Funnel");
export const HardDrive = createIcon("HardDrive");
export const Home = createIcon("Home");
export const Info = createIcon("Info");
export const Layers = createIcon("Layers");
export const LayoutDashboard = createIcon("LayoutDashboard");
export const ListChecks = createIcon("ListChecks");
export const Lock = createIcon("Lock");
export const LockOpen = createIcon("LockOpen");
export const LogOut = createIcon("LogOut");
export const Mail = createIcon("Mail");
export const MapPin = createIcon("MapPin");
export const Monitor = createIcon("Monitor");
export const Palette = createIcon("Palette");
export const Phone = createIcon("Phone");
export const Plus = createIcon("Plus");
export const Printer = createIcon("Printer");
export const RefreshCw = createIcon("RefreshCw");
export const RotateCcw = createIcon("RotateCcw");
export const Save = createIcon("Save");
export const Search = createIcon("Search");
export const Server = createIcon("Server");
export const Settings = createIcon("Settings");
export const Shield = createIcon("Shield");
export const ShieldCheck = createIcon("ShieldCheck");
export const Square = createIcon("Square");
export const SquarePen = createIcon("SquarePen");
export const Table = createIcon("Table");
export const Trash2 = createIcon("Trash2");
export const TrendingUp = createIcon("TrendingUp");
export const Upload = createIcon("Upload");
export const User = createIcon("User");
export const UserCog = createIcon("UserCog");
export const UserCheck = createIcon("UserCheck");
export const UserX = createIcon("UserX");
export const Users = createIcon("Users");
export const WifiOff = createIcon("WifiOff");
export const Wrench = createIcon("Wrench");
export const X = createIcon("X");
export const XCircle = createIcon("XCircle");
