export const resourceTypes = ["database", "ai-model", "http-api"] as const;

export type ResourceType = (typeof resourceTypes)[number];

export type HttpResourceConfig = {
  type: "http-api";
  url: string;
  headers?: Record<string, string>;
};

export type DatabaseResourceConfig = {
  type: "database";
  engine: "postgres" | "sqlite";
  connectionString?: string;
  filePath?: string;
};

export type AiModelResourceConfig = {
  type: "ai-model";
  provider: "ollama" | "openai-compatible";
  baseUrl: string;
  model: string;
};

export type ResourceConfig =
  | HttpResourceConfig
  | DatabaseResourceConfig
  | AiModelResourceConfig;

type ResourceBase = {
  id: string;
  name: string;
  hostId: string;
  active: boolean;
  createdAt: string;
};

export type Resource =
  | (ResourceBase & {
      type: "database";
      config: DatabaseResourceConfig;
    })
  | (ResourceBase & {
      type: "http-api";
      config: HttpResourceConfig;
    })
  | (ResourceBase & {
      type: "ai-model";
      config: AiModelResourceConfig;
    });

export type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  resourceId: string | null;
  lastUsed: string | null;
  createdAt: string;
};

export type RequestLog = {
  id: string;
  resourceId: string;
  apiKeyId: string | null;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  createdAt: string;
};

export type TunnelRequestPayload = {
  requestId: string;
  resourceId: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  body: string | null;
};

export type TunnelResponsePayload = {
  requestId: string;
  statusCode: number;
  headers: Record<string, string>;
  body: string | null;
};

export type TunnelMessage =
  | {
      type: "proxy:request";
      payload: TunnelRequestPayload;
    }
  | {
      type: "proxy:response";
      payload: TunnelResponsePayload;
    }
  | {
      type: "host:heartbeat";
      payload: { hostId: string; timestamp: string };
    };

export type ConnectedHost = {
  id: string;
  socketId: string;
  connectedAt: string;
  lastSeen: string;
};
