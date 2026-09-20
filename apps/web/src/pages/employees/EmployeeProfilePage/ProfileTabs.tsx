import { Briefcase, FileText, MapPin, Phone, Users } from "lucide-react";
import type { ProfileTab } from "./EmployeeProfilePage.types";

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

const TABS: { key: ProfileTab; label: string; icon: React.ReactNode }[] = [
  {
    key: "info",
    label: "Personal Info",
    icon: <Users className="w-4 h-4" />,
  },
  { key: "contact", label: "Contact", icon: <Phone className="w-4 h-4" /> },
  {
    key: "compensation",
    label: "Compensation",
    icon: <Briefcase className="w-4 h-4" />,
  },
  { key: "dtr", label: "DTR History", icon: <MapPin className="w-4 h-4" /> },
  {
    key: "documents",
    label: "Documents",
    icon: <FileText className="w-4 h-4" />,
  },
];

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === tab.key
              ? "border-primary-600 text-primary-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
