import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Security headers for development server
const securityHeaders = {
  "Content-Security-Policy": `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.googleapis.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https://*.googleusercontent.com https://*.firebaseapp.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com wss://*.firebaseio.com;
    frame-src 'self' https://*.firebaseapp.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
  `
    .replace(/\s+/g, " ")
    .trim(),
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    target: "es2020",
    outDir: "dist",
    assetsDir: "assets",
    minify: true,
    chunkSizeWarningLimit: 1000,
  },
  server: {
    headers: securityHeaders,
    port: 5173,
    host: true,
  },
  preview: {
    headers: securityHeaders,
    port: 4173,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    exclude: ["node_modules", "dist", ".idea", "coverage"],
    testTimeout: 30000,
    hookTimeout: 15000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/test/**",
        "src/types/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/*.types.ts",
        "**/index.ts",
        "src/config/**",
        "src/App.tsx",
        "src/App.routes.tsx",
        "src/main.tsx",
        "src/__mocks__/**",
        "src/i18n/locales/**",
        "src/services/offline.ts",
        "src/services/twoFactorAuth.ts",
        "**/*.stories.*",
        "**/*.fixture.*",
        "**/*.graphql.*",
        "**/__generated__/**",
        "src/generated/**",
      ],
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
