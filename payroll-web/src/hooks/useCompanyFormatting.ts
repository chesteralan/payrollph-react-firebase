import { useState, useCallback } from "react";

interface CompanyFormatConfig {
  dateFormat: string;
  timeFormat: string;
  currencyCode: string;
  currencySymbol: string;
  locale: string;
}

export function useCompanyFormatting() {
  const [config, setConfig] = useState<CompanyFormatConfig>({
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    currencyCode: "PHP",
    currencySymbol: "₱",
    locale: "en-PH",
  });

  const updateConfig = useCallback((updates: Partial<CompanyFormatConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    localStorage.setItem("company-format", JSON.stringify({ ...config, ...updates }));
  }, [config]);

  const formatCurrency = useCallback(
    (amount: number): string => {
      return `${config.currencySymbol}${amount.toLocaleString(config.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    [config],
  );

  const formatDate = useCallback(
    (date: Date): string => {
      return date.toLocaleDateString(config.locale, {
        year: "numeric", month: "2-digit", day: "2-digit",
      });
    },
    [config],
  );

  return { config, updateConfig, formatCurrency, formatDate };
}
