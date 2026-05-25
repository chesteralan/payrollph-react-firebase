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
export const ArrowRight = createIcon("ArrowRight");
export const CheckCircle = createIcon("CheckCircle");
export const ChevronLeft = createIcon("ChevronLeft");
export const ChevronUp = createIcon("ChevronUp");
export const Clock = createIcon("Clock");
export const Copy = createIcon("Copy");
export const Database = createIcon("Database");
export const Download = createIcon("Download");
export const FileSpreadsheet = createIcon("FileSpreadsheet");
export const FileText = createIcon("FileText");
export const Funnel = createIcon("Funnel");
export const HardDrive = createIcon("HardDrive");
export const Home = createIcon("Home");
export const Info = createIcon("Info");
export const LockOpen = createIcon("LockOpen");
export const Printer = createIcon("Printer");
export const RefreshCw = createIcon("RefreshCw");
export const RotateCcw = createIcon("RotateCcw");
export const Search = createIcon("Search");
export const Server = createIcon("Server");
export const Shield = createIcon("Shield");
export const Square = createIcon("Square");
export const SquarePen = createIcon("SquarePen");
export const Upload = createIcon("Upload");
export const Users = createIcon("Users");
export const WifiOff = createIcon("WifiOff");
export const X = createIcon("X");
