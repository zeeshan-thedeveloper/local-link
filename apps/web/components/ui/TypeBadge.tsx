import type { ResourceType } from "@/lib/types";

export function TypeBadge({ type }: { type: ResourceType }) {
  const labels: Record<ResourceType, string> = {
    database: "Database",
    "ai-model": "AI Model",
    "http-api": "Legacy HTTP",
    "web-app": "Web App",
    api: "API",
  };
  const className = type === "ai-model" ? "ai" : type === "http-api" ? "http" : type;
  return (
    <span className={"type-badge " + className}>
      <span className="dot" />
      {labels[type]}
    </span>
  );
}
