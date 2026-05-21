export type BuildInfo = {
  sha: string;
  branch: string;
  builtAt: string;
  label: string;
};

export function getBuildInfo(): BuildInfo {
  const sha = (process.env.NEXT_PUBLIC_BUILD_SHA ?? "dev").slice(0, 7);
  const branch = process.env.NEXT_PUBLIC_BUILD_BRANCH ?? "local";
  const builtAt = process.env.NEXT_PUBLIC_BUILD_TIME ?? "";
  const label = builtAt ? `${sha} · ${formatBuildTime(builtAt)}` : sha;
  return { sha, branch, builtAt, label };
}

function formatBuildTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toISOString().replace("T", " ").slice(0, 16);
}
