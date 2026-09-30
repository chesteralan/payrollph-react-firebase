import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  type AppCheck,
  getToken,
  initializeAppCheck,
  ReCaptchaV3Provider,
} from "firebase/app-check";

// Dummy fallbacks allow the app (and e2e) to boot when env vars are unset.
// Real deploys must provide valid VITE_FIREBASE_* values.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo-app-id",
};

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization failed:", error);
  throw error;
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize App Check with reCAPTCHA v3 (CSRF and abuse protection)
let appCheck: AppCheck | null = null;
if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

// CSRF token utility for custom API calls
export const getCSRFToken = async (): Promise<string> => {
  try {
    if (!appCheck) {
      return generateFallbackToken();
    }
    const appCheckToken = await getToken(appCheck);
    return appCheckToken.token;
  } catch {
    if (import.meta.env.DEV) {
      console.warn("App Check not available, using fallback CSRF token");
    }
    return generateFallbackToken();
  }
};

const generateFallbackToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
};

export default app;
