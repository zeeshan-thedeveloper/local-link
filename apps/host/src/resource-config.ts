import type { HostResourceConfig } from "./config.js";

export type ResourceKind = HostResourceConfig["type"];

/** Normalize dashboard/gateway JSON into the local host config shape. */
export function normalizeGatewayResourceConfig(
  type: ResourceKind,
  raw: unknown,
  fallbackName?: string,
): HostResourceConfig["config"] | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;

  if (type === "http-api") {
    const url = pickString(value.url);
    if (!url) return null;
    const headers = pickHeaders(value.headers);
    return {
      type: "http-api",
      url: trimTrailingSlash(url),
      ...(headers ? { headers } : {}),
    };
  }

  if (type === "database") {
    const connectionString = pickString(value.connectionString);
    const filePath = pickString(value.filePath);
    if (!connectionString && !filePath) return null;
    const engine = value.engine === "sqlite" ? "sqlite" : "postgres";
    return {
      type: "database",
      engine,
      ...(connectionString ? { connectionString } : {}),
      ...(filePath ? { filePath } : {}),
    };
  }

  const baseUrl = pickString(value.baseUrl);
  if (!baseUrl) return null;
  const provider = value.provider === "ollama" ? "ollama" : "openai-compatible";
  const model = pickString(value.model) ?? fallbackName ?? "local";
  return { type: "ai-model", provider, baseUrl: trimTrailingSlash(baseUrl), model };
}

export function describeResourceConfig(config: HostResourceConfig["config"]) {
  if (config.type === "http-api") return config.url;
  if (config.type === "database") return config.connectionString ?? config.filePath ?? "database";
  return `${config.baseUrl} (${config.model})`;
}

function pickString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function pickHeaders(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const headers = Object.fromEntries(
    Object.entries(value as Record<string, unknown>).flatMap(([key, headerValue]) => {
      if (typeof headerValue !== "string" || !headerValue.trim()) return [];
      return [[key, headerValue.trim()]];
    }),
  );
  return Object.keys(headers).length > 0 ? headers : undefined;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}
