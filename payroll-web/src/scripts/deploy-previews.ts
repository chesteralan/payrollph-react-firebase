/**
 * Deploy Previews Configuration
 *
 * Firebase Hosting deploy previews allow testing PR changes
 * before merging. Each PR gets a unique preview URL.
 *
 * Setup:
 *   1. Update firebase.json to enable previews
 *   2. Configure GitHub Actions for PR preview deployment
 *   3. Preview URL is posted as PR comment
 *
 * Manual preview:
 *   firebase hosting:channel:deploy pr-123 --expires 7d
 *
 * Access:
 *   https://pr-123--payrollph-{project}.web.app
 */

/**
 * Creates a deploy preview channel for a PR branch
 * @param channelName - Typically "pr-{number}"
 * @param expiresIn - Expiration (e.g., "7d", "30d")
 */
export async function createDeployPreview(channelName: string, expiresIn = "7d") {
  console.log(`Creating deploy preview: ${channelName} (expires in ${expiresIn})`);

  // This would shell out to:
  // firebase hosting:channel:deploy ${channelName} --expires ${expiresIn}

  const previewUrl = `https://${channelName}--payrollph-${process.env.VITE_FIREBASE_PROJECT_ID || "project"}.web.app`;
  console.log(`Preview URL: ${previewUrl}`);

  return { channelName, previewUrl, expiresIn };
}
