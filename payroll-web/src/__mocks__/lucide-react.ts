import React from "react";

type IconProps = {
  size?: number;
  className?: string;
  "aria-hidden"?: boolean;
};

function createIcon(name: string): React.FC<IconProps> {
  const IconComponent: React.FC<IconProps> = (props: IconProps) =>
    React.createElement("svg", {
      "data-testid": `lucide-${name.toLowerCase()}`,
      width: props.size ?? 24,
      height: props.size ?? 24,
      className: props.className ?? "",
      "aria-hidden": props["aria-hidden"] ?? true,
    });
  IconComponent.displayName = name;
  return IconComponent;
}

// Alphabetical list of all icons used across the codebase
export const Activity = createIcon("Activity");
export const AlertCircle = createIcon("AlertCircle");
export const AlertTriangle = createIcon("AlertTriangle");
export const Archive = createIcon("Archive");
export const ArrowDown = createIcon("ArrowDown");
export const ArrowDownToLine = createIcon("ArrowDownToLine");
export const ArrowLeft = createIcon("ArrowLeft");
export const ArrowRight = createIcon("ArrowRight");
export const ArrowUp = createIcon("ArrowUp");
export const ArrowUpDown = createIcon("ArrowUpDown");
export const ArrowUpFromLine = createIcon("ArrowUpFromLine");
export const BadgeCheck = createIcon("BadgeCheck");
export const Banknote = createIcon("Banknote");
export const BarChart3 = createIcon("BarChart3");
export const Bell = createIcon("Bell");
export const BookOpen = createIcon("BookOpen");
export const Briefcase = createIcon("Briefcase");
export const Building2 = createIcon("Building2");
export const Cake = createIcon("Cake");
export const Calculator = createIcon("Calculator");
export const Calendar = createIcon("Calendar");
export const CalendarDays = createIcon("CalendarDays");
export const CalendarRange = createIcon("CalendarRange");
export const Camera = createIcon("Camera");
export const Check = createIcon("Check");
export const CheckCircle = createIcon("CheckCircle");
export const CheckCircle2 = createIcon("CheckCircle2");
export const CheckSquare = createIcon("CheckSquare");
export const ChevronDown = createIcon("ChevronDown");
export const ChevronLeft = createIcon("ChevronLeft");
export const ChevronRight = createIcon("ChevronRight");
export const ChevronUp = createIcon("ChevronUp");
export const ChevronsLeft = createIcon("ChevronsLeft");
export const ChevronsRight = createIcon("ChevronsRight");
export const ChevronsUpDown = createIcon("ChevronsUpDown");
export const Circle = createIcon("Circle");
export const ClipboardList = createIcon("ClipboardList");
export const Clock = createIcon("Clock");
export const CloudOff = createIcon("CloudOff");
export const Cog = createIcon("Cog");
export const Columns = createIcon("Columns");
export const Command = createIcon("Command");
export const Copy = createIcon("Copy");
export const CopyPlus = createIcon("CopyPlus");
export const CreditCard = createIcon("CreditCard");
export const Database = createIcon("Database");
export const DollarSign = createIcon("DollarSign");
export const Download = createIcon("Download");
export const Dumbbell = createIcon("Dumbbell");
export const Edit = createIcon("Edit");
export const Edit3 = createIcon("Edit3");
export const ExternalLink = createIcon("ExternalLink");
export const Eye = createIcon("Eye");
export const EyeOff = createIcon("EyeOff");
export const File = createIcon("File");
export const FileJson = createIcon("FileJson");
export const FileSpreadsheet = createIcon("FileSpreadsheet");
export const FileText = createIcon("FileText");
export const Filter = createIcon("Filter");
export const Flag = createIcon("Flag");
export const Folder = createIcon("Folder");
export const FolderOpen = createIcon("FolderOpen");
export const Gauge = createIcon("Gauge");
export const Globe = createIcon("Globe");
export const GripVertical = createIcon("GripVertical");
export const HardDrive = createIcon("HardDrive");
export const Heart = createIcon("Heart");
export const HelpCircle = createIcon("HelpCircle");
export const Home = createIcon("Home");
export const Image = createIcon("Image");
export const Inbox = createIcon("Inbox");
export const Info = createIcon("Info");
export const Key = createIcon("Key");
export const Laptop = createIcon("Laptop");
export const Layers = createIcon("Layers");
export const Layout = createIcon("Layout");
export const LayoutDashboard = createIcon("LayoutDashboard");
export const LayoutGrid = createIcon("LayoutGrid");
export const Link = createIcon("Link");
export const List = createIcon("List");
export const ListChecks = createIcon("ListChecks");
export const Loader2 = createIcon("Loader2");
export const Lock = createIcon("Lock");
export const LogOut = createIcon("LogOut");
export const Mail = createIcon("Mail");
export const MapPin = createIcon("MapPin");
export const Maximize2 = createIcon("Maximize2");
export const Menu = createIcon("Menu");
export const Minimize2 = createIcon("Minimize2");
export const Minus = createIcon("Minus");
export const Monitor = createIcon("Monitor");
export const Moon = createIcon("Moon");
export const MoreHorizontal = createIcon("MoreHorizontal");
export const MoreVertical = createIcon("MoreVertical");
export const Move = createIcon("Move");
export const Music = createIcon("Music");
export const Palette = createIcon("Palette");
export const Pause = createIcon("Pause");
export const Pencil = createIcon("Pencil");
export const Phone = createIcon("Phone");
export const PieChart = createIcon("PieChart");
export const Play = createIcon("Play");
export const Plus = createIcon("Plus");
export const PlusCircle = createIcon("PlusCircle");
export const Printer = createIcon("Printer");
export const RefreshCw = createIcon("RefreshCw");
export const RotateCcw = createIcon("RotateCcw");
export const Save = createIcon("Save");
export const Scan = createIcon("Scan");
export const Search = createIcon("Search");
export const SearchX = createIcon("SearchX");
export const Send = createIcon("Send");
export const Server = createIcon("Server");
export const Settings = createIcon("Settings");
export const Share2 = createIcon("Share2");
export const Shield = createIcon("Shield");
export const ShieldAlert = createIcon("ShieldAlert");
export const ShieldCheck = createIcon("ShieldCheck");
export const ShoppingCart = createIcon("ShoppingCart");
export const SlidersHorizontal = createIcon("SlidersHorizontal");
export const Smartphone = createIcon("Smartphone");
export const SortAsc = createIcon("SortAsc");
export const Square = createIcon("Square");
export const SortDesc = createIcon("SortDesc");
export const Star = createIcon("Star");
export const Sun = createIcon("Sun");
export const Table = createIcon("Table");
export const Tablet = createIcon("Tablet");
export const Tag = createIcon("Tag");
export const Target = createIcon("Target");
export const Terminal = createIcon("Terminal");
export const Trash2 = createIcon("Trash2");
export const TrendingUp = createIcon("TrendingUp");
export const TriangleAlert = createIcon("TriangleAlert");
export const Truck = createIcon("Truck");
export const Unlock = createIcon("Unlock");
export const Upload = createIcon("Upload");
export const User = createIcon("User");
export const UserCheck = createIcon("UserCheck");
export const UserCog = createIcon("UserCog");
export const UserMinus = createIcon("UserMinus");
export const UserPlus = createIcon("UserPlus");
export const UserX = createIcon("UserX");
export const Users = createIcon("Users");
export const Video = createIcon("Video");
export const Wallet = createIcon("Wallet");
export const Wifi = createIcon("Wifi");
export const WifiOff = createIcon("WifiOff");
export const Wrench = createIcon("Wrench");
export const X = createIcon("X");
export const XCircle = createIcon("XCircle");
export const ZoomIn = createIcon("ZoomIn");
export const ZoomOut = createIcon("ZoomOut");

// Type export for LucideIcon
export type LucideIcon = React.FC<IconProps>;

// Default export fallback
export default { Activity };
