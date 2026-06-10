/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface TranslationEntry {
  key: string;
  translations: Record<string, string>;
}

interface TranslationContextValue {
  entries: TranslationEntry[];
  addEntry: (key: string, translations: Record<string, string>) => void;
  updateTranslation: (key: string, locale: string, value: string) => void;
  exportTranslations: () => string;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<TranslationEntry[]>([]);

  const addEntry = useCallback((key: string, translations: Record<string, string>) => {
    setEntries((prev) => [...prev, { key, translations }]);
  }, []);

  const updateTranslation = useCallback((key: string, locale: string, value: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.key === key ? { ...e, translations: { ...e.translations, [locale]: value } } : e,
      ),
    );
  }, []);

  const exportTranslations = useCallback(() => {
    return JSON.stringify(entries, null, 2);
  }, [entries]);

  return (
    <TranslationContext.Provider value={{ entries, addEntry, updateTranslation, exportTranslations }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslationManagement() {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error("useTranslationManagement must be used within TranslationProvider");
  return ctx;
}
