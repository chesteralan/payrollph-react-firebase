#!/usr/bin/env node
/**
 * Deployment Rollback Automation
 *
 * Usage:
 *   node rollback.mjs <environment> [version]
 *
 * Environments: staging, production
 * Version: git commit SHA or tag (defaults to previous deployment)
 *
 * Examples:
 *   node rollback.mjs staging              # Rollback staging to previous deployment
 *   node rollback.mjs production abc1234   # Rollback production to specific commit
 */

const { execSync } = require("child_process");
const path = require("path");

const ROLLBACK_MAP = {
  staging: {
    aliases: ["staging"],
    projectAlias: "staging",
  },
  production: {
    aliases: ["production", "prod", "live"],
    projectAlias: "production",
  },
};

function resolveEnvironment(input) {
  const normalized = input.toLowerCase();
  for (const [key, config] of Object.entries(ROLLBACK_MAP)) {
    if (config.aliases.includes(normalized)) {
      return key;
    }
  }
  throw new Error(
    `Unknown environment: ${input}. Options: ${Object.keys(ROLLBACK_MAP).join(", ")}`
  );
}

function run(cmd, opts = {}) {
  console.log(`$ ${cmd}`);
  return execSync(cmd, { stdio: "inherit", ...opts });
}

function getPreviousDeployedSha() {
  try {
    // Get the previous commit that was deployed (via git tag or reflog)
    const tags = execSync("git tag --list 'deploy-*' --sort=-creatordate", {
      encoding: "utf-8",
    })
      .trim()
      .split("\n")
      .filter(Boolean);

    if (tags.length >= 2) {
      const tag = tags[1]; // second most recent = previous deploy
      const sha = execSync(`git rev-list -n 1 "${tag}"`, { encoding: "utf-8" }).trim();
      return { sha, tag };
    }

    // Fallback: use HEAD~1
    return {
      sha: execSync("git rev-parse HEAD~1", { encoding: "utf-8" }).trim(),
      tag: null,
    };
  } catch {
    return {
      sha: execSync("git rev-parse HEAD~1", { encoding: "utf-8" }).trim(),
      tag: null,
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: node rollback.mjs <environment> [version]");
    console.error("  environment: staging, production");
    console.error("  version:     git SHA or tag (optional, defaults to previous deploy)");
    process.exit(1);
  }

  const env = resolveEnvironment(args[0]);
  const targetVersion = args[1];

  const versionInfo = targetVersion
    ? { sha: targetVersion, tag: null }
    : getPreviousDeployedSha();

  const appDir = path.resolve(__dirname, "..");

  console.log(`\n=== Rollback initiated ===`);
  console.log(`Environment: ${env}`);
  console.log(`Target version: ${versionInfo.sha}${versionInfo.tag ? ` (tag: ${versionInfo.tag})` : ""}`);
  console.log(`Working directory: ${appDir}\n`);

  // 1. Verify the target SHA exists
  try {
    execSync(`git cat-file -e ${versionInfo.sha}^`, { stdio: "ignore" });
  } catch {
    console.error(`Error: Commit ${versionInfo.sha} does not exist locally.`);
    console.error("Fetching from origin...");
    run("git fetch --tags origin main");
  }

  // 2. Checkout the target version
  console.log(`\nStep 1: Checking out ${versionInfo.sha}...`);
  run(`git checkout ${versionInfo.sha}`);

  // 3. Install deps
  console.log(`\nStep 2: Installing dependencies...`);
  run("yarn install --frozen-lockfile", { cwd: appDir });

  // 4. Build
  console.log(`\nStep 3: Building...`);
  run("node node_modules/.bin/vite build", { cwd: appDir });

  // 5. Run smoke tests
  console.log(`\nStep 4: Running smoke tests...`);
  run(`node ${path.join(appDir, "src", "scripts", "smoke-test.ts")}`, {
    cwd: appDir,
  });

  // 6. Deploy
  console.log(`\nStep 5: Deploying to ${env}...`);
  const deployCommand =
    env === "production"
      ? `firebase deploy --only hosting --project ${env}`
      : `firebase deploy --only hosting --project ${env}`;
  run(deployCommand, { cwd: appDir });

  // 7. Tag the rollback
  const rollbackTag = `rollback-${env}-${new Date().toISOString().split("T")[0]}-${versionInfo.sha.substring(0, 7)}`;
  run(`git tag ${rollbackTag}`);

  // 8. Return to previous branch
  console.log(`\nStep 6: Returning to previous branch...`);
  run("git checkout -");

  console.log(`\n=== Rollback complete ===`);
  console.log(`Rollback tag: ${rollbackTag}`);
  console.log(`Deployed: ${versionInfo.sha.substring(0, 7)} → ${env}`);
}

main().catch((err) => {
  console.error(`\nRollback failed: ${err.message}`);
  process.exit(1);
});
