import { useState, useEffect, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";

interface EnvConfig {
  environment: string;
  version: string;
  lastDeployed: string;
  features: Record<string, boolean>;
}

export function useEnvironmentCheck() {
  const [config, setConfig] = useState<EnvConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "system_config"));
      if (!snap.empty) {
        const data = snap.docs[0].data() as EnvConfig;
        setConfig(data);
      } else {
        setConfig({
          environment: import.meta.env.MODE || "development",
          version: import.meta.env.VITE_APP_VERSION || "0.0.0",
          lastDeployed: new Date().toISOString(),
          features: {},
        });
      }
    } catch {
      setConfig({
        environment: "unknown",
        version: "0.0.0",
        lastDeployed: "",
        features: {},
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    check();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [check]);

  return { config, loading, refresh: check };
}
