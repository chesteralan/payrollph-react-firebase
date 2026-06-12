#!/usr/bin/env node
const REQUIRED_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_APP_ID",
];

const OPTIONAL_VARS = [
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_RECAPTCHA_SITE_KEY",
  "VITE_APP_VERSION",
];

let missing = false;
for (const v of REQUIRED_VARS) {
  if (!process.env[v]) {
    console.error(`❌ Missing required env var: ${v}`);
    missing = true;
  }
}

if (missing) {
  process.exit(1);
}

console.log("✅ All required environment variables are set");
process.exit(0);
