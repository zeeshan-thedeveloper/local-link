import "./tracing.js";
import "dotenv/config.js";
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { shutdownTracing } from "./tracing.js";
import { TunnelBroker } from "./lib/tunnel.js";

const port = Number(process.env.PORT ?? "3003");
const jwtSecret = process.env.JWT_SECRET ?? "local-dev-secret";
const httpServer = createServer();
const tunnel = new TunnelBroker(httpServer, prisma);
const app = await createApp({ prisma, tunnel, jwtSecret });

httpServer.on("request", app.routing);

try {
  await app.ready();
  httpServer.listen(port, "0.0.0.0", () => {
    app.log.info(`LocalLink gateway listening on ${port}`);
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

async function shutdown() {
  await app.close();
  await prisma.$disconnect();
  httpServer.close();
  await shutdownTracing();
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
