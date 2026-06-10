import { useMemo } from "react";

const LUCIDE_ICONS_USED = [
  "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Check", "ChevronDown",
  "ChevronLeft", "ChevronRight", "ChevronUp", "X", "Search", "Menu",
  "MoreVertical", "Plus", "Minus", "Download", "Upload", "FileText",
  "FileSpreadsheet", "FileJson", "Printer", "Eye", "EyeOff",
  "Lock", "Unlock", "Clock", "Calendar", "Users", "UserCheck",
  "UserX", "Settings", "Bell", "Trash2", "Copy", "Save", "Send",
  "RefreshCw", "AlertTriangle", "AlertCircle", "CheckCircle", "XCircle",
  "Info", "HelpCircle", "Filter", "Globe", "Sun", "Moon", "Monitor",
  "Smartphone", "Tablet", "TrendingUp", "DollarSign", "Folder", "File",
  "Camera", "GripVertical", "Inbox", "SearchX", "Cake",
];

export function useTreeShakingCheck() {
  const report = useMemo(() => {
    const totalAvailable = 500;
    const used = LUCIDE_ICONS_USED.length;
    const unused = totalAvailable - used;
    const savingsEstimate = unused * 0.2; // ~0.2KB per unused icon
    return {
      used,
      unused,
      totalAvailable,
      usageRate: `${Math.round((used / totalAvailable) * 100)}%`,
      potentialSavings: `${savingsEstimate.toFixed(0)}KB`,
      suggestion: `Only import individual icons: import { ${LUCIDE_ICONS_USED.slice(0, 3).join(", ")} } from "lucide-react"`,
    };
  }, []);

  return report;
}
