export function getTestStatusSummary(
  total: number,
  passed: number,
  failed: number,
  skipped: number,
) {
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
  return { total, passed, failed, skipped, pct };
}

export function formatTestDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function groupTestsByFile(
  tests: { file: string; name: string; status: "passed" | "failed" | "skipped" }[],
) {
  return tests.reduce<
    Record<string, { passed: number; failed: number; skipped: number }>
  >((acc, t) => {
    if (!acc[t.file]) acc[t.file] = { passed: 0, failed: 0, skipped: 0 };
    const entry = acc[t.file]!;
    entry[t.status]++;
    return acc;
  }, {});
}
