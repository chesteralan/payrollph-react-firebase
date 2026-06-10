import { useMemo } from "react";

interface BundleSizeReport {
  name: string;
  size: number;
  gzip: number;
}

const KNOWN_BUNDLES: BundleSizeReport[] = [
  { name: "xlsx", size: 283200, gzip: 94340 },
  { name: "lucide-react", size: 120000, gzip: 35000 },
  { name: "react-router-dom", size: 85000, gzip: 28000 },
  { name: "firebase/app", size: 95000, gzip: 31000 },
  { name: "firebase/firestore", size: 180000, gzip: 55000 },
  { name: "firebase/auth", size: 65000, gzip: 20000 },
];

export function useBundleAnalysis() {
  const totalSize = useMemo(
    () => KNOWN_BUNDLES.reduce((s, b) => s + b.size, 0),
    [],
  );

  const largeBundles = useMemo(
    () => KNOWN_BUNDLES.filter((b) => b.size > 100000).sort((a, b) => b.size - a.size),
    [],
  );

  const suggestOptimizations = useMemo(() => {
    const suggestions: string[] = [];
    if (KNOWN_BUNDLES.some((b) => b.name === "xlsx")) {
      suggestions.push("Dynamically import xlsx library (only needed for exports)");
    }
    if (KNOWN_BUNDLES.some((b) => b.name === "lucide-react")) {
      suggestions.push("Use individual icon imports instead of barrel import");
    }
    return suggestions;
  }, []);

  return { bundles: KNOWN_BUNDLES, totalSize, largeBundles, suggestOptimizations };
}
