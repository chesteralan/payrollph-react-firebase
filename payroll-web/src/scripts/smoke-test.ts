/**
 * Post-Deployment Smoke Test Suite
 *
 * Verifies critical paths work after deployment.
 * Run via: node --experimental-vm-modules src/scripts/smoke-test.ts
 */

interface SmokeCheck {
  name: string;
  check: () => Promise<boolean>;
  critical: boolean;
}

const checks: SmokeCheck[] = [];

function addCheck(name: string, check: () => Promise<boolean>, critical = true) {
  checks.push({ name, check, critical });
}

// ============================================================
// Smoke Checks
// ============================================================

// Check 1: Health endpoint
addCheck("Health endpoint returns 200", async () => {
  const baseUrl = process.env.BASE_URL || "http://localhost:5173";
  const response = await fetch(`${baseUrl}/api/health`);
  const data = await response.json();
  return response.status === 200 && data.status === "healthy";
});

// Check 2: Page loads without JS errors
addCheck("App loads without errors", async () => {
  // This requires a browser — run separately via Playwright
  // For CLI smoke test, just check the HTML is served
  const baseUrl = process.env.BASE_URL || "http://localhost:5173";
  const response = await fetch(baseUrl);
  const html = await response.text();
  return response.status === 200 && html.includes("root");
});

// Check 3: Firebase Auth config is present
addCheck("Firebase Auth config is available", async () => {
  // Check env vars are loaded
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  return !!apiKey;
});

// Check 4: Bundle size within limits
addCheck("Bundle size is within limits", async () => {
  // Check that JS bundles load within reasonable size
  const baseUrl = process.env.BASE_URL || "http://localhost:5173";
  const response = await fetch(baseUrl);
  const html = await response.text();

  // Extract script tags pointing to assets
  const scriptRegex = /src="\/assets\/([^"]+\.js)"/g;
  let match;
  let totalSize = 0;
  while ((match = scriptRegex.exec(html)) !== null) {
    const scriptResponse = await fetch(`${baseUrl}/assets/${match[1]}`);
    totalSize += parseInt(scriptResponse.headers.get("content-length") || "0", 10);
  }

  // Warn if total bundle > 2MB
  const maxSize = 2 * 1024 * 1024; // 2MB
  console.log(`  Total JS bundle size: ${(totalSize / 1024 / 1024).toFixed(2)}MB (limit: ${(maxSize / 1024 / 1024).toFixed(0)}MB)`);
  return totalSize <= maxSize;
}, false); // Non-critical — just a warning

// Check 5: CSP headers present
addCheck("CSP security headers present", async () => {
  const baseUrl = process.env.BASE_URL || "http://localhost:5173";
  const response = await fetch(baseUrl);
  const csp = response.headers.get("content-security-policy");
  return !!csp;
});

// ============================================================
// Runner
// ============================================================

interface SmokeResult {
  name: string;
  passed: boolean;
  error?: string;
}

async function runSmokeChecks(): Promise<{ results: SmokeResult[]; passed: boolean }> {
  const results: SmokeResult[] = [];
  let allPassed = true;

  console.log("🔍 Running post-deployment smoke tests...\n");

  for (const { name, check, critical } of checks) {
    process.stdout.write(`  ${name}... `);
    try {
      const passed = await check();
      results.push({ name, passed });
      if (passed) {
        console.log("✅ PASS");
      } else {
        console.log("❌ FAIL");
        if (critical) allPassed = false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ FAIL (${errorMessage})`);
      results.push({ name, passed: false, error: errorMessage });
      if (critical) allPassed = false;
    }
  }

  console.log("\n" + "=".repeat(40));
  console.log(`Results: ${results.filter((r) => r.passed).length}/${results.length} passed`);
  console.log(allPassed ? "✅ All smoke tests passed!" : "❌ Some smoke tests failed!");
  console.log("=".repeat(40));

  return { results, passed: allPassed };
}

// Run if executed directly
const isMainModule = process.argv[1]?.endsWith("smoke-test.ts") || process.argv[1]?.endsWith("smoke-test.js");
if (isMainModule) {
  runSmokeChecks()
    .then(({ passed }) => process.exit(passed ? 0 : 1))
    .catch((err) => {
      console.error("Smoke test runner error:", err);
      process.exit(1);
    });
}

export { runSmokeChecks, addCheck };
