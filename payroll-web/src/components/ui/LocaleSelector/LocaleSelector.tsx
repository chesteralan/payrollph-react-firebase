import { clsx } from "clsx";
import { Globe } from "lucide-react";
import type { Locale } from "@/i18n";

interface LocaleSelectorProps {
  value: Locale;
  onChange: (locale: Locale) => void;
  className?: string;
}

const LOCALES: { value: Locale; label: string }[] = [
  { value: "en-US", label: "English (US)" },
  { value: "en-PH", label: "English (PH)" },
  { value: "fil-PH", label: "Filipino" },
];

export function LocaleSelector({
  value,
  onChange,
  className,
}: LocaleSelectorProps) {
  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <Globe className="w-4 h-4 text-gray-400" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Locale)}
        className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
      >
        {LOCALES.map((loc) => (
          <option key={loc.value} value={loc.value}>
            {loc.label}
          </option>
        ))}
      </select>
    </div>
  );
}
