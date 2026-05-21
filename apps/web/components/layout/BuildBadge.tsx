"use client";

import { useEffect, useState } from "react";
import type { BuildInfo } from "@/lib/build-info";

const fallback: BuildInfo = {
  sha: (process.env.NEXT_PUBLIC_BUILD_SHA ?? "dev").slice(0, 7),
  branch: process.env.NEXT_PUBLIC_BUILD_BRANCH ?? "local",
  builtAt: process.env.NEXT_PUBLIC_BUILD_TIME ?? "",
  label: (process.env.NEXT_PUBLIC_BUILD_SHA ?? "dev").slice(0, 7),
};

type BuildBadgeProps = {
  className?: string;
  titlePrefix?: string;
};

export function BuildBadge({ className, titlePrefix = "Deployed build" }: BuildBadgeProps) {
  const [build, setBuild] = useState<BuildInfo>(fallback);

  useEffect(() => {
    fetch("/api/build-info", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: BuildInfo | null) => {
        if (data?.sha) setBuild(data);
      })
      .catch(() => {});
  }, []);

  const title = [
    titlePrefix,
    `commit ${build.sha}`,
    build.branch ? `branch ${build.branch}` : null,
    build.builtAt ? `built ${build.builtAt}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <span className={className} title={title}>
      build · {build.label}
    </span>
  );
}
