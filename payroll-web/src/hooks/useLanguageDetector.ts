import { useEffect, useState } from "react";

export function useLanguageDetector() {
  const [detectedLang, setDetectedLang] = useState<string>("en-US");

  useEffect(() => {
    const browserLang = navigator.language || (navigator as unknown as Record<string, string>).userLanguage || "en-US";
    const supported = ["en-US", "en-PH", "fil-PH"];
    const match = supported.find((l) => browserLang.startsWith(l.split("-")[0]));
    /* eslint-disable react-hooks/set-state-in-effect */
    setDetectedLang(match || "en-US");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  return { detectedLang };
}
