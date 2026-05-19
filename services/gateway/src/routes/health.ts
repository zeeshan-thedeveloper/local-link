import type { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";

type HealthRouteOptions = {
  prisma: Pick<PrismaClient, "$queryRaw">;
};

export async function healthRoutes(app: FastifyInstance, { prisma }: HealthRouteOptions) {
  app.get("/health", async (_request, reply) => {
    return reply.status(200).send({
      status: "ok",
      uptime: process.uptime(),
      timestamp: Date.now(),
    });
  });

  app.get("/ready", async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return reply.status(200).send({
        status: "ready",
        database: "connected",
      });
    } catch {
      return reply.status(503).send({
        status: "not ready",
        database: "unreachable",
      });
    }
  });
}
