import type { ResourceType } from "@/lib/types";
import { Icon } from "./Icon";

export function TypeIcon({ type, size = 14 }: { type: ResourceType; size?: number }) {
  return <Icon name={type === "database" ? "database" : type === "ai-model" ? "ai" : "http"} size={size} />;
}
