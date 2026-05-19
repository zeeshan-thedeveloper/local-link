"use server";

import { gatewayFetch } from "@/lib/gateway";
import type { ResourceType } from "@/lib/types";

type GatewayResource = {
  id: string;
  name: string;
  type: ResourceType | "ai_model" | "http_api";
  hostId: string;
  active: boolean;
  tokenPrefix?: string | null;
};

export async function createResource(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "database") as ResourceType;
  const localUrl = String(formData.get("localUrl") ?? "").trim();
  const connectionString = String(formData.get("connectionString") ?? "").trim();
  if (type !== "database" && type !== "http-api") {
    throw new Error("Unsupported resource type");
  }

  const config =
    type === "database"
      ? {
          engine: "postgres",
          connectionString: connectionString || "postgresql://localhost:5432/app",
        }
      : { url: localUrl || "http://localhost:3000" };

  const created = await gatewayFetch<{ resource: GatewayResource; hostToken: string }>(
    "/resources",
    {
      method: "POST",
      body: JSON.stringify({ name, type, hostId: "pending", config }),
    },
  );
  return {
    ...created,
    resource: {
      ...created.resource,
      type: normalizeResourceType(created.resource.type),
    },
  };
}

function normalizeResourceType(type: GatewayResource["type"]): ResourceType {
  if (type === "ai_model") return "ai-model";
  if (type === "http_api") return "http-api";
  return type;
}
