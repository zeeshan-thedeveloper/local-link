export type BuildInfo = {
  sha: string;
  branch: string;
  builtAt: string;
  label: string;
};

/** Prefer Vercel runtime env so the badge matches the deployment even when the Next build is cached. */
function resolveBuildSha() {
  const full =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.NEXT_PUBLIC_BUILD_SHA ??
    process.env.GITHUB_SHA ??
    process.env.GIT_COMMIT_SHA ??
    "dev";
  return full.slice(0, 7);
}

function resolveBuildBranch() {
  return (
    process.env.VERCEL_GIT_COMMIT_REF ??
    process.env.NEXT_PUBLIC_BUILD_BRANCH ??
    process.env.GITHUB_REF_NAME ??
    "local"
  );
}

export function getBuildInfo(): BuildInfo {
  const sha = resolveBuildSha();
  const branch = resolveBuildBranch();
  // Build-time stamp is stale when Vercel reuses a cached .next output; omit unless local.
  const builtAt = process.env.VERCEL_GIT_COMMIT_SHA
    ? ""
    : (process.env.NEXT_PUBLIC_BUILD_TIME ?? "");
  const label = builtAt ? `${sha} · ${formatBuildTime(builtAt)}` : sha;
  return { sha, branch, builtAt, label };
}

function formatBuildTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toISOString().replace("T", " ").slice(0, 16);
}
