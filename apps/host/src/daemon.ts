import { io, type Socket } from "socket.io-client";
import type { HostConfig, HostResourceConfig } from "./config.js";
import { proxyRequest } from "./proxy.js";

export type DaemonEvent =
  | { type: "connected"; resource: HostResourceConfig }
  | { type: "disconnected"; resource: HostResourceConfig }
  | { type: "connect_error"; resource: HostResourceConfig; message: string }
  | { type: "request"; resource: HostResourceConfig; method: string; path: string; statusCode: number; durationMs: number };

export function startDaemon(config: HostConfig, onEvent: (event: DaemonEvent) => void): Socket[] {
  return config.resources.map((resource) => startResourceDaemon(config.gatewayUrl, resource, onEvent));
}

async function fetchLatestConfig(gatewayUrl: string, token: string): Promise<{ config: unknown } | null> {
  try {
    const res = await fetch(`${gatewayUrl}/hosts/me`, {
      headers: { authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    return res.json() as Promise<{ config: unknown }>;
  } catch {
    return null;
  }
}

function startResourceDaemon(gatewayUrl: string, resource: HostResourceConfig, onEvent: (event: DaemonEvent) => void): Socket {
  let liveResource = resource;

  const socket = io(gatewayUrl, {
    auth: { token: resource.token },
    transports: ["websocket"]
  });

  socket.on("connect", () => {
    void fetchLatestConfig(gatewayUrl, resource.token).then((latest) => {
      if (latest?.config) {
        liveResource = { ...resource, config: latest.config as typeof resource.config };
      }
      onEvent({ type: "connected", resource });
    });
  });
  socket.on("connect_error", (error) => onEvent({ type: "connect_error", resource, message: error.message }));
  socket.on("disconnect", () => onEvent({ type: "disconnected", resource }));

  socket.on("proxy:request", async (request) => {
    if (request.resourceId !== resource.id) {
      socket.emit("proxy:response", {
        requestId: request.requestId,
        statusCode: 404,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Local resource is not registered on this host" })
      });
      return;
    }

    const start = Date.now();
    try {
      const response = await proxyRequest(liveResource, request);
      onEvent({
        type: "request",
        resource,
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        durationMs: Date.now() - start
      });
      socket.emit("proxy:response", response);
    } catch (error) {
      onEvent({
        type: "request",
        resource,
        method: request.method,
        path: request.path,
        statusCode: 502,
        durationMs: Date.now() - start
      });
      socket.emit("proxy:response", {
        requestId: request.requestId,
        statusCode: 502,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: error instanceof Error ? error.message : "Proxy failed" })
      });
    }
  });

  setInterval(() => {
    socket.emit("host:heartbeat");
  }, 15_000);

  return socket;
}
