import type {
  DatabaseResourceConfig,
  HttpResourceConfig,
  ResourceConfig,
  ResourceType,
  TunnelRequestPayload,
  TunnelResponsePayload
} from "@locallink/shared";
import { Client } from "pg";

export type LocalResource = {
  id: string;
  type: ResourceType;
  config: ResourceConfig;
};

export async function proxyRequest(
  resource: LocalResource,
  request: TunnelRequestPayload
): Promise<TunnelResponsePayload> {
  if (resource.type === "http-api") {
    return proxyHttp(resource.config as HttpResourceConfig, request);
  }
  if (resource.type === "database") {
    return queryPostgres(resource.config as DatabaseResourceConfig, request);
  }
  return proxyHttp({ url: (resource.config as { baseUrl: string }).baseUrl }, request);
}

async function proxyHttp(
  config: HttpResourceConfig,
  request: TunnelRequestPayload
): Promise<TunnelResponsePayload> {
  const target = new URL(request.path, ensureTrailingSlash(config.url));
  const response = await fetch(target, {
    method: request.method,
    headers: { ...config.headers, ...request.headers },
    body: request.body && !["GET", "HEAD"].includes(request.method) ? request.body : undefined
  });
  return {
    requestId: request.requestId,
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: await response.text()
  };
}

async function queryPostgres(
  config: DatabaseResourceConfig,
  request: TunnelRequestPayload
): Promise<TunnelResponsePayload> {
  if (config.engine !== "postgres" || !config.connectionString) {
    return jsonResponse(request.requestId, 400, { error: "Only Postgres database resources are supported" });
  }
  if (request.method !== "POST") {
    return jsonResponse(request.requestId, 405, { error: "Database resources accept POST requests" });
  }

  const payload = request.body ? (JSON.parse(request.body) as { sql?: string; params?: unknown[] }) : {};
  if (!payload.sql) return jsonResponse(request.requestId, 400, { error: "Missing sql" });

  const client = new Client({ connectionString: config.connectionString });
  await client.connect();
  try {
    const result = await client.query(payload.sql, payload.params ?? []);
    return jsonResponse(request.requestId, 200, { rows: result.rows, rowCount: result.rowCount });
  } finally {
    await client.end();
  }
}

function jsonResponse(requestId: string, statusCode: number, body: unknown): TunnelResponsePayload {
  return {
    requestId,
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  };
}

function ensureTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

