import type { TunnelRequestPayload, TunnelResponsePayload } from "@locallink/shared";
import type { PrismaClient } from "@prisma/client";
import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { hashApiKey } from "../lib/keys.js";

type PendingRequest = {
  resolve: (response: TunnelResponsePayload) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
};

export class TunnelBroker {
  private readonly io: Server;
  private readonly socketsByHost = new Map<string, { socketId: string; lastSeen: string | null }>();
  private readonly pending = new Map<string, PendingRequest>();

  constructor(server: HttpServer, private readonly prisma: PrismaClient) {
    this.io = new Server(server, {
      cors: { origin: true, credentials: true }
    });
    this.io.on("connection", async (socket) => {
      const token = String(socket.handshake.auth.token ?? "");
      const resource = token
        ? await this.prisma.resource.findFirst({
            where: { tokenHash: hashApiKey(token), active: true }
          })
        : null;

      if (!resource) {
        socket.disconnect(true);
        return;
      }

      const hostId = resource.id;
      this.socketsByHost.set(hostId, { socketId: socket.id, lastSeen: null });
      socket.join(`host:${hostId}`);

      socket.on("proxy:response", (response: TunnelResponsePayload) => {
        const pending = this.pending.get(response.requestId);
        if (!pending) return;
        clearTimeout(pending.timeout);
        this.pending.delete(response.requestId);
        pending.resolve(response);
      });

      socket.on("host:heartbeat", () => {
        const lastSeen = new Date().toISOString();
        socket.data.lastSeen = lastSeen;
        if (this.socketsByHost.get(hostId)?.socketId === socket.id) {
          this.socketsByHost.set(hostId, { socketId: socket.id, lastSeen });
        }
      });

      socket.on("disconnect", () => {
        if (this.socketsByHost.get(hostId)?.socketId === socket.id) {
          this.socketsByHost.delete(hostId);
        }
      });
    });
  }

  connectedHosts() {
    return [...this.socketsByHost.entries()].map(([id, host]) => ({ id, ...host }));
  }

  isHostConnected(hostId: string) {
    return this.socketsByHost.has(hostId);
  }

  send(hostId: string, payload: TunnelRequestPayload, timeoutMs = 30_000) {
    if (!this.isHostConnected(hostId)) {
      throw new Error("Host is not connected");
    }

    return new Promise<TunnelResponsePayload>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(payload.requestId);
        reject(new Error("Tunnel request timed out"));
      }, timeoutMs);

      this.pending.set(payload.requestId, { resolve, reject, timeout });
      this.io.to(`host:${hostId}`).emit("proxy:request", payload);
    });
  }
}
