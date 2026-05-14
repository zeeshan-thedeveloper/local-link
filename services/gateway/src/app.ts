import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import {
  apiKeyCreationSchema,
  resourceRegistrationSchema,
  resourceUpdateSchema
} from "@locallink/validators";
import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { fromNodeHeaders } from "better-auth/node";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import { auth } from "./lib/auth.js";
import { createApiKey, createHostToken, hashApiKey } from "./lib/keys.js";
import type { TunnelBroker } from "./lib/tunnel.js";

type AppOptions = {
  prisma: PrismaClient;
  tunnel: Pick<TunnelBroker, "connectedHosts" | "send">;
  jwtSecret: string;
};

type LoginBody = { email: string; password: string };
type ResourceParams = { id: string };
type KeyParams = { id: string };
type LogsQuery = { page?: string; limit?: string; resourceId?: string };

const sessionCookieName = "locallink_session";

export async function createApp({ prisma, tunnel, jwtSecret }: AppOptions) {
  const app = Fastify({ logger: true });
  const oauthCallbackUserCounts = new WeakMap<FastifyRequest, number>();
  await app.register(cors, { origin: true, credentials: true });
  await app.register(cookie);
  await app.register(jwt, {
    secret: jwtSecret,
    cookie: { cookieName: sessionCookieName, signed: false }
  });

  async function requireDashboardAuth(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ error: "Unauthorized" });
    }
  }

  // If a second Google account tries to sign in, reject it.
  // Only the first user to authenticate owns this instance.
  app.addHook("preHandler", async (request) => {
    if (!request.url.startsWith("/api/auth")) return;
    if (!request.url.includes("/callback/google")) return;

    oauthCallbackUserCounts.set(request, await prisma.user.count());
  });

  app.get("/api/auth/google", async (_request, reply) => {
    const frontendBaseUrl = process.env.FRONTEND_BASE_URL ?? "http://localhost:3000";
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Redirecting...</title></head><body>
<script>
(async () => {
  try {
    const res = await fetch('/api/auth/sign-in/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        provider: 'google',
        callbackURL: ${JSON.stringify(`${frontendBaseUrl}/dashboard`)},
        errorCallbackURL: ${JSON.stringify(`${frontendBaseUrl}/?error=single_user_instance`)}
      })
    });
    const data = await res.json();
    if (data.url) { window.location.href = data.url; }
    else { window.location.href = ${JSON.stringify(`${frontendBaseUrl}/?error=oauth_redirect_failed`)}; }
  } catch (e) {
    window.location.href = ${JSON.stringify(`${frontendBaseUrl}/?error=oauth_redirect_failed`)};
  }
})();
</script>
<p>Redirecting to Google...</p>
</body></html>`;
    return reply.type("text/html").send(html);
  });

  app.all("/api/auth/*", async (request, reply) => {
    const baseUrl = process.env.BACKEND_BASE_URL ?? `${request.protocol}://${request.headers.host}`;
    const url = new URL(request.raw.url ?? "/", baseUrl);
    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const body =
      hasBody && typeof request.body === "string"
        ? request.body
        : hasBody && request.body !== undefined
          ? JSON.stringify(request.body)
          : undefined;

    const response = await auth.handler(
      new Request(url, {
        method: request.method,
        headers: fromNodeHeaders(request.headers),
        body
      })
    );

    const beforeCallbackUserCount = oauthCallbackUserCounts.get(request);
    let oauthSessionUser: { email: string; id: string } | undefined;
    if (beforeCallbackUserCount !== undefined) {
      const users: Array<{ email: string; id: string }> = await prisma.user.findMany({
        orderBy: { createdAt: "asc" },
        select: { email: true, id: true }
      });
      if (beforeCallbackUserCount >= 1 && users.length > beforeCallbackUserCount) {
        const extraUserIds = users.slice(1).map((user) => user.id);
        await prisma.user.deleteMany({ where: { id: { in: extraUserIds } } });
        return reply.redirect(`${process.env.FRONTEND_BASE_URL ?? "http://localhost:3000"}/?error=single_user_instance`);
      }

      const user = users[0];
      if (user && response.status >= 300 && response.status < 400) {
        oauthSessionUser = user;
      }
    }

    reply.status(response.status);
    const responseHeaders = response.headers as Headers & { getSetCookie?: () => string[] };
    responseHeaders.forEach((value, key) => {
      if (key.toLowerCase() !== "set-cookie") {
        reply.header(key, value);
      }
    });
    for (const cookieHeader of responseHeaders.getSetCookie?.() ?? []) {
      reply.header("set-cookie", cookieHeader);
    }
    if (oauthSessionUser) {
      const token = app.jwt.sign({ sub: oauthSessionUser.id, email: oauthSessionUser.email }, { expiresIn: "7d" });
      reply.setCookie(sessionCookieName, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7
      });
    }

    return reply.send(Buffer.from(await response.arrayBuffer()));
  });

  app.post<{ Body: LoginBody }>("/auth/login", async (request, reply) => {
    const email = request.body.email.toLowerCase();
    const password = request.body.password;
    let user = await prisma.user.findUnique({ where: { email } });
    const userCount = await prisma.user.count();

    if (!user && userCount === 0) {
      user = await prisma.user.create({
        data: { email, passwordHash: await bcrypt.hash(password, 12) }
      });
    }

    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    const token = app.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: "7d" });
    reply.setCookie(sessionCookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
    return { user: { id: user.id, email: user.email } };
  });

  app.post("/auth/logout", async (_request, reply) => {
    reply.clearCookie(sessionCookieName, { path: "/" });
    return { ok: true };
  });

  app.get("/auth/me", { preHandler: requireDashboardAuth }, async (request) => {
    return { user: request.user };
  });

  app.get("/hosts/me", async (request, reply) => {
    const token = extractBearerToken(request);
    if (!token) return reply.code(401).send({ error: "Unauthorized" });

    const resource = await prisma.resource.findFirst({
      where: { tokenHash: hashApiKey(token), active: true }
    });
    if (!resource) return reply.code(401).send({ error: "Unauthorized" });

    return {
      resourceId: resource.id,
      name: resource.name,
      type: fromPrismaResourceType(resource.type),
      config: resource.config,
      gatewayUrl: process.env.BACKEND_BASE_URL
    };
  });

  app.get("/resources", { preHandler: requireDashboardAuth }, async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [resources, requestCounts] = await Promise.all([
      prisma.resource.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.requestLog.groupBy({
        by: ["resourceId"],
        where: { createdAt: { gte: since } },
        _count: { resourceId: true }
      })
    ]);
    const reqs24hByResource = new Map(requestCounts.map(count => [count.resourceId, count._count.resourceId]));
    const connectedIds = new Set(tunnel.connectedHosts().map(h => h.id));
    return resources.map(r => ({
      ...serializeResource(r),
      connected: connectedIds.has(r.id),
      reqs24h: reqs24hByResource.get(r.id) ?? 0
    }));
  });

  app.post("/resources", { preHandler: requireDashboardAuth }, async (request, reply) => {
    const parsed = resourceRegistrationSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const generated = createHostToken();
    const created = await prisma.resource.create({
      data: {
        name: parsed.data.name,
        type: toPrismaResourceType(parsed.data.type),
        config: parsed.data.config,
        hostId: parsed.data.hostId,
        tokenHash: generated.tokenHash,
        tokenPrefix: generated.prefix
      }
    });
    const resource = await prisma.resource.update({
      where: { id: created.id },
      data: { hostId: created.id }
    });
    return reply.code(201).send({ resource: serializeResource(resource), hostToken: generated.token });
  });

  app.get<{ Params: ResourceParams }>(
    "/resources/:id",
    { preHandler: requireDashboardAuth },
    async (request, reply) => {
      const resource = await prisma.resource.findUnique({ where: { id: request.params.id } });
      if (!resource) return reply.code(404).send({ error: "Resource not found" });
      return serializeResource(resource);
    }
  );

  app.patch<{ Params: ResourceParams }>(
    "/resources/:id",
    { preHandler: requireDashboardAuth },
    async (request, reply) => {
      const parsed = resourceUpdateSchema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
      const resource = await prisma.resource.update({
        where: { id: request.params.id },
        data: parsed.data
      });
      return serializeResource(resource);
    }
  );

  app.delete<{ Params: ResourceParams }>(
    "/resources/:id",
    { preHandler: requireDashboardAuth },
    async (request) => {
      await prisma.resource.delete({ where: { id: request.params.id } });
      return { ok: true };
    }
  );

  app.post<{ Params: ResourceParams }>(
    "/resources/:id/rotate-token",
    { preHandler: requireDashboardAuth },
    async (request, reply) => {
      const generated = createHostToken();
      const resource = await prisma.resource.update({
        where: { id: request.params.id },
        data: {
          tokenHash: generated.tokenHash,
          tokenPrefix: generated.prefix
        }
      });
      return reply.code(201).send({ resource: serializeResource(resource), hostToken: generated.token });
    }
  );

  app.post<{ Params: ResourceParams }>(
    "/resources/:id/keys",
    { preHandler: requireDashboardAuth },
    async (request, reply) => {
      const parsed = apiKeyCreationSchema.safeParse({
        ...(typeof request.body === "object" && request.body ? request.body : {}),
        resourceId: request.params.id
      });
      if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
      const generated = createApiKey();
      const apiKey = await prisma.apiKey.create({
        data: {
          name: parsed.data.name,
          resourceId: request.params.id,
          keyHash: generated.keyHash,
          prefix: generated.prefix
        }
      });
      return reply.code(201).send({ apiKey, key: generated.key });
    }
  );

  app.get<{ Params: ResourceParams }>(
    "/resources/:id/keys",
    { preHandler: requireDashboardAuth },
    async (request) => {
      return prisma.apiKey.findMany({
        where: { resourceId: request.params.id },
        orderBy: { createdAt: "desc" }
      });
    }
  );

  app.delete<{ Params: KeyParams }>("/keys/:id", { preHandler: requireDashboardAuth }, async (request) => {
    await prisma.apiKey.delete({ where: { id: request.params.id } });
    return { ok: true };
  });

  app.get("/logs/recent", { preHandler: requireDashboardAuth }, async () => {
    const items = await prisma.requestLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { resource: { select: { name: true } } }
    });

    return items.map(item => ({
      id: item.id,
      time: item.createdAt.toISOString(),
      res: item.resource.name,
      method: item.method,
      path: item.path,
      status: item.statusCode,
      dur: `${item.durationMs}ms`,
      key: item.apiKeyId ? item.apiKeyId.slice(0, 8) : "–"
    }));
  });

  app.get<{ Querystring: LogsQuery }>("/logs", { preHandler: requireDashboardAuth }, async (request) => {
    const page = Math.max(Number(request.query.page ?? "1"), 1);
    const limit = Math.min(Math.max(Number(request.query.limit ?? "50"), 1), 100);
    const where = request.query.resourceId ? { resourceId: request.query.resourceId } : {};
    const [items, total] = await Promise.all([
      prisma.requestLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.requestLog.count({ where })
    ]);
    return { items, page, limit, total };
  });

  app.get("/tunnel/status", { preHandler: requireDashboardAuth }, async () => {
    return { hosts: tunnel.connectedHosts() };
  });

  app.all<{ Params: { resourceId: string; "*": string } }>("/r/:resourceId/*", async (request, reply) => {
    const started = Date.now();
    const apiKeyValue = extractApiKey(request);
    if (!apiKeyValue) return reply.code(401).send({ error: "Missing API key" });

    const apiKey = await prisma.apiKey.findUnique({ where: { keyHash: hashApiKey(apiKeyValue) } });
    if (!apiKey || (apiKey.resourceId && apiKey.resourceId !== request.params.resourceId)) {
      return reply.code(403).send({ error: "Invalid API key" });
    }

    const resource = await prisma.resource.findUnique({ where: { id: request.params.resourceId } });
    if (!resource || !resource.active) return reply.code(404).send({ error: "Resource not found" });

    const targetPath = `/${request.params["*"] ?? ""}${request.url.includes("?") ? `?${request.url.split("?")[1]}` : ""}`;
    const response = await tunnel.send(resource.hostId, {
      requestId: randomUUID(),
      resourceId: resource.id,
      method: request.method,
      path: targetPath,
      headers: normalizeHeaders(request.headers),
      body: typeof request.body === "string" ? request.body : request.body ? JSON.stringify(request.body) : null
    });

    await Promise.all([
      prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsed: new Date() } }),
      prisma.requestLog.create({
        data: {
          resourceId: resource.id,
          apiKeyId: apiKey.id,
          method: request.method,
          path: targetPath,
          statusCode: response.statusCode,
          durationMs: Date.now() - started
        }
      })
    ]);

    for (const [key, value] of Object.entries(response.headers)) {
      reply.header(key, value);
    }
    return reply.code(response.statusCode).send(response.body);
  });

  return app;
}

function extractApiKey(request: FastifyRequest) {
  const authToken = extractBearerToken(request);
  if (authToken) return authToken;
  const header = request.headers["x-api-key"];
  return Array.isArray(header) ? header[0] : header;
}

function extractBearerToken(request: FastifyRequest) {
  const auth = request.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice("Bearer ".length);
  return null;
}

function normalizeHeaders(headers: FastifyRequest["headers"]) {
  return Object.fromEntries(
    Object.entries(headers).flatMap(([key, value]) => {
      if (!value) return [];
      return [[key, Array.isArray(value) ? value.join(",") : String(value)]];
    })
  );
}

function toPrismaResourceType(type: "database" | "ai-model" | "http-api") {
  if (type === "ai-model") return "ai_model";
  if (type === "http-api") return "http_api";
  return "database";
}

function fromPrismaResourceType(type: "database" | "ai_model" | "http_api") {
  if (type === "ai_model") return "ai-model";
  if (type === "http_api") return "http-api";
  return "database";
}

function serializeResource<T extends { tokenHash?: string | null; type: "database" | "ai_model" | "http_api" }>(resource: T) {
  const sanitized = { ...resource };
  delete sanitized.tokenHash;
  return { ...sanitized, type: fromPrismaResourceType(resource.type) };
}
