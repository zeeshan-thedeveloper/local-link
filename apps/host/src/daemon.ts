import { io, type Socket } from "socket.io-client";
import type { HostConfig, HostResourceConfig } from "./config.js";
import { proxyRequest } from "./proxy.js";

export function startDaemon(config: HostConfig): Socket[] {
  return config.resources.map((resource) => startResourceDaemon(config.gatewayUrl, resource));
}

function startResourceDaemon(gatewayUrl: string, resource: HostResourceConfig): Socket {
  const socket = io(gatewayUrl, {
    auth: { token: resource.token },
    transports: ["websocket"]
  });

  socket.on("connect", () => {
    process.stdout.write(`[${resource.name}] connected\n`);
  });

  socket.on("connect_error", (error) => {
    process.stderr.write(`[${resource.name}] connection failed: ${error.message}\n`);
  });

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

    try {
      socket.emit("proxy:response", await proxyRequest(resource, request));
    } catch (error) {
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

  socket.on("disconnect", () => {
    process.stdout.write(`[${resource.name}] disconnected\n`);
  });
  return socket;
}
