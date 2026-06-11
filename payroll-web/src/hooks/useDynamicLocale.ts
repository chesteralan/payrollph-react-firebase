import { useEffect, useState } from "react";

export function useDynamicLocale(locale: string) {
  const [messages, setMessages] = useState<Record<string, Record<string, string>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    /* eslint-enable react-hooks/set-state-in-effect */

    const loadLocale = async () => {
      try {
        const mod = await import(`@/i18n/locales/${locale}`);
        if (!cancelled) {
          setMessages(mod.default || mod[locale] || mod);
          setLoading(false);
        }
      } catch {
        // Fallback to English
        try {
          const mod = await import(`@/i18n/locales/en`);
          if (!cancelled) {
            setMessages(mod.default || mod.en);
            setLoading(false);
          }
        } catch {
          if (!cancelled) setLoading(false);
        }
      }
    };

    loadLocale();
    return () => { cancelled = true; };
  }, [locale]);

  return { messages, loading };
}
