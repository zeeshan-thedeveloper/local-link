export type ResourceType = "database" | "ai-model" | "http-api" | "web-app" | "api";
export type ResourceStatus = "active" | "inactive" | "idle";
export type HostStatus = "connected" | "disconnected";

export interface Resource {
  id: string;
  name: string;
  slug?: string;
  type: ResourceType;
  subtype: string;
  endpoint: string;
  local: string;
  status: ResourceStatus;
  keys: number;
  lastActive: string;
  reqs24h: number;
  active?: boolean;
  hostId?: string;
  tokenPrefix?: string | null;
  config?: unknown;
  createdAt?: string;
}

export interface ApiKey {
  id?: string;
  name: string;
  prefix: string;
  created?: string;
  createdAt?: string;
  lastUsed: string | null;
}

export interface RequestLog {
  id?: string;
  time: string;
  res: string;
  method: "GET" | "POST" | "DELETE" | "PATCH" | "PUT";
  path: string;
  status: number;
  statusCode?: number;
  dur: string;
  durationMs?: number;
  key: string;
  createdAt?: string;
}
