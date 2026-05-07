import type { ResourceType } from "@/lib/types";
import { Icon } from "./Icon";

export function ResIcon({ type, size = 14 }: { type: ResourceType; size?: number }) {
  const className = type === "ai-model" ? "ai" : type === "http-api" ? "http" : type;
  return (
    <div className={"res-icon " + className}>
      <Icon name={type === "database" ? "database" : type === "ai-model" ? "ai" : "http"} size={size} />
    </div>
  );
}
