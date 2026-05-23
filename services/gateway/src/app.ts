import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import {
  apiKeyCreationSchema,
  resourceRegistrationSchema,
  resourceUpdateSchema,
} from "@locallink/validators";
import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signJWT } from "better-auth/crypto";
import { fromNodeHeaders } from "better-auth/node";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import { auth } from "./lib/auth.js";
import { sendVerificationEmail } from "./lib/email.js";
import { createApiKey, createHostToken, hashApiKey } from "./lib/keys.js";
import type { TunnelBroker } from "./lib/tunnel.js";
import { rewriteProxiedHttpResponse } from "./lib/proxy-rewrite.js";
import { healthRoutes } from "./routes/health.js";

type AppOptions = {
  prisma: PrismaClient;
  tunnel: Pick<TunnelBroker, "connectedHosts" | "send">;
  jwtSecret: string;
};

type LoginBody = { email: string; password: string };
type UpdateCurrentUserBody = { name?: string };
type ResourceParams = { id: string };
type KeyParams = { id: string };
type LogsQuery = { page?: string; limit?: string; resourceId?: string };

const sessionCookieName = "locallink_session";
const cookieDomain = process.env.COOKIE_DOMAIN ?? undefined;

export async function createApp({ prisma, tunnel, jwtSecret }: AppOptions) {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      ...(process.env.NODE_ENV !== "production"
        ? {
            transport: {
              target: "pino-pretty",
              options: { colorize: true, translateTime: "HH:MM:ss" },
            },
          }
        : {}),
    },
    genReqId: () => randomUUID(),
  });
  const oauthCallbackTimestamps = new WeakMap<FastifyRequest, Date>();
  await app.register(cors, { origin: true, credentials: true });
  await app.register(cookie);
  await app.register(jwt, {
    secret: jwtSecret,
    cookie: { cookieName: sessionCookieName, signed: false },
  });
  await app.register(healthRoutes, { prisma });

  app.addHook("onRequest", async (request, reply) => {
    const slug = extractSubdomainSlug(request.headers.host);
    if (!slug) return;

    const resource = await prisma.resource.findUnique({ where: { slug } });
    if (!resource || !resource.active) {
      await reply.code(404).send({ error: "Resource not found" });
      return;
    }

    await proxyResolvedResource(resource, request, reply, buildSubdomainTargetPath(request));
  });

  async function requireDashboardAuth(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ error: "Unauthorized" });
    }
  }

  app.addHook("preHandler", async (request) => {
    if (!request.url.startsWith("/api/auth")) return;
    if (!request.url.includes("/callback/google") && !request.url.includes("/callback/github"))
      return;

    oauthCallbackTimestamps.set(request, new Date());
  });

  async function sendDashboardVerificationEmail(email: string, request: FastifyRequest) {
    const baseUrl = process.env.BACKEND_BASE_URL ?? `${request.protocol}://${request.headers.host}`;
    const frontendBaseUrl = process.env.FRONTEND_BASE_URL ?? "http://localhost:3000";
    const secret = process.env.BETTER_AUTH_SECRET ?? "locallink-dev-secret";
    const token = await signJWT({ email: email.toLowerCase() }, secret, 60 * 60 * 24);
    const callbackURL = encodeURIComponent(`${frontendBaseUrl}/login?verified=1`);
    await sendVerificationEmail(
      email,
      `${baseUrl}/api/auth/verify-email?token=${token}&callbackURL=${callbackURL}`,
      request.log,
    );
  }

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
        errorCallbackURL: ${JSON.stringify(`${frontendBaseUrl}/?error=auth_failed`)}
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

  app.get("/api/auth/github", async (_request, reply) => {
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
        provider: 'github',
        callbackURL: ${JSON.stringify(`${frontendBaseUrl}/dashboard`)},
        errorCallbackURL: ${JSON.stringify(`${frontendBaseUrl}/?error=auth_failed`)}
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
<p>Redirecting to GitHub...</p>
</body></html>`;
    return reply.type("text/html").send(html);
  });

  app.all("/api/auth/*", async (request, reply) => {
    const baseUrl = process.env.BACKEND_BASE_URL ?? `${request.protocol}://${request.headers.host}`;
    const url = new URL(request.raw.url ?? "/", baseUrl);
    if (request.method === "POST" && url.pathname === "/api/auth/forget-password") {
      url.pathname = "/api/auth/request-password-reset";
    }
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
        body,
      }),
    );

    const callbackStartedAt = oauthCallbackTimestamps.get(request);
    let oauthSessionUser: { email: string; id: string } | undefined;
    if (callbackStartedAt !== undefined && response.status >= 300 && response.status < 400) {
      const session = await prisma.session.findFirst({
        where: { createdAt: { gte: callbackStartedAt } },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, email: true } } },
      });
      if (session?.user) {
        oauthSessionUser = session.user;
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
      const token = app.jwt.sign(
        { sub: oauthSessionUser.id, email: oauthSessionUser.email },
        { expiresIn: "7d" },
      );
      reply.setCookie(sessionCookieName, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        domain: cookieDomain,
        maxAge: 60 * 60 * 24 * 7,
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
      const passwordHash = await bcrypt.hash(password, 12);
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          accounts: {
            create: {
              accountId: email,
              providerId: "credential",
              password: passwordHash,
            },
          },
        },
      });
      await sendDashboardVerificationEmail(user.email, request);
    }

    const credentialAccount = user
      ? await prisma.account.findFirst({
          where: { userId: user.id, providerId: "credential", password: { not: null } },
          select: { password: true },
        })
      : null;
    const storedPassword = credentialAccount?.password ?? user?.passwordHash;
    if (!user || !storedPassword || !(await bcrypt.compare(password, storedPassword))) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }
    if (!user.emailVerified) {
      await sendDashboardVerificationEmail(user.email, request);
      return reply.code(403).send({ error: "Email verification required" });
    }

    const token = app.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: "7d" });
    reply.setCookie(sessionCookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      domain: cookieDomain,
      maxAge: 60 * 60 * 24 * 7,
    });
    return { user: { id: user.id, email: user.email }, token };
  });

  app.post("/auth/logout", async (_request, reply) => {
    reply.clearCookie(sessionCookieName, { path: "/", domain: cookieDomain });
    return { ok: true };
  });

  app.get("/auth/me", { preHandler: requireDashboardAuth }, async (request, reply) => {
    const authUser = request.user as { sub?: string; id?: string; email?: string };
    const userId = authUser.sub ?? authUser.id;
    if (!userId) return reply.code(401).send({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) return reply.code(404).send({ error: "User not found" });

    return { user: { ...user, sub: user.id } };
  });

  app.patch<{ Body: UpdateCurrentUserBody }>(
    "/auth/me",
    { preHandler: requireDashboardAuth },
    async (request, reply) => {
      const authUser = request.user as { sub?: string; id?: string };
      const userId = authUser.sub ?? authUser.id;
      if (!userId) return reply.code(401).send({ error: "Unauthorized" });

      const name = typeof request.body?.name === "string" ? request.body.name.trim() : "";
      if (!name) return reply.code(400).send({ error: "Display name is required" });

      const user = await prisma.user.update({
        where: { id: userId },
        data: { name },
        select: { id: true, email: true, name: true },
      });

      return { user: { ...user, sub: user.id } };
    },
  );

  app.get("/hosts/me", async (request, reply) => {
    const token = extractBearerToken(request);
    if (!token) return reply.code(401).send({ error: "Unauthorized" });

    const resource = await prisma.resource.findFirst({
      where: { tokenHash: hashApiKey(token), active: true },
    });
    if (!resource) return reply.code(401).send({ error: "Unauthorized" });

    return {
      resourceId: resource.id,
      name: resource.name,
      type: fromPrismaResourceType(resource.type),
      config: resource.config,
      gatewayUrl: process.env.BACKEND_BASE_URL,
    };
  });

  app.get("/resources", { preHandler: requireDashboardAuth }, async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [resources, requestCounts] = await Promise.all([
      prisma.resource.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.requestLog.groupBy({
        by: ["resourceId"],
        where: { createdAt: { gte: since } },
        _count: { resourceId: true },
      }),
    ]);
    const reqs24hByResource = new Map(
      requestCounts.map((count) => [count.resourceId, count._count.resourceId]),
    );
    const connectedIds = new Set(tunnel.connectedHosts().map((h) => h.id));
    return resources.map((r) => ({
      ...serializeResource(r),
      connected: connectedIds.has(r.id),
      reqs24h: reqs24hByResource.get(r.id) ?? 0,
    }));
  });

  app.post("/resources", { preHandler: requireDashboardAuth }, async (request, reply) => {
    const parsed = resourceRegistrationSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const slug = parsed.data.slug ?? generateResourceSlug(parsed.data.name);
    if (!slug) return reply.code(400).send({ error: "Resource slug is required" });
    const existing = await prisma.resource.findUnique({ where: { slug } });
    if (existing) return reply.code(409).send({ error: "Resource slug already exists" });
    const generated = createHostToken();
    const created = await prisma.resource.create({
      data: {
        name: parsed.data.name,
        slug,
        type: toPrismaResourceType(parsed.data.type),
        config: parsed.data.config,
        hostId: parsed.data.hostId,
        tokenHash: generated.tokenHash,
        tokenPrefix: generated.prefix,
      },
    });
    const resource = await prisma.resource.update({
      where: { id: created.id },
      data: { hostId: created.id },
    });
    return reply
      .code(201)
      .send({ resource: serializeResource(resource), hostToken: generated.token });
  });

  app.get<{ Params: ResourceParams }>(
    "/resources/:id",
    { preHandler: requireDashboardAuth },
    async (request, reply) => {
      const resource = await prisma.resource.findUnique({ where: { id: request.params.id } });
      if (!resource) return reply.code(404).send({ error: "Resource not found" });
      return serializeResource(resource);
    },
  );

  app.patch<{ Params: ResourceParams }>(
    "/resources/:id",
    { preHandler: requireDashboardAuth },
    async (request, reply) => {
      const parsed = resourceUpdateSchema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
      if (parsed.data.slug) {
        const existing = await prisma.resource.findUnique({ where: { slug: parsed.data.slug } });
        if (existing && existing.id !== request.params.id) {
          return reply.code(409).send({ error: "Resource slug already exists" });
        }
      }
      const resource = await prisma.resource.update({
        where: { id: request.params.id },
        data: parsed.data,
      });
      return serializeResource(resource);
    },
  );

  app.delete<{ Params: ResourceParams }>(
    "/resources/:id",
    { preHandler: requireDashboardAuth },
    async (request) => {
      await prisma.resource.delete({ where: { id: request.params.id } });
      return { ok: true };
    },
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
          tokenPrefix: generated.prefix,
        },
      });
      return reply
        .code(201)
        .send({ resource: serializeResource(resource), hostToken: generated.token });
    },
  );

  app.post<{ Params: ResourceParams }>(
    "/resources/:id/keys",
    { preHandler: requireDashboardAuth },
    async (request, reply) => {
      const parsed = apiKeyCreationSchema.safeParse({
        ...(typeof request.body === "object" && request.body ? request.body : {}),
        resourceId: request.params.id,
      });
      if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
      const generated = createApiKey();
      const apiKey = await prisma.apiKey.create({
        data: {
          name: parsed.data.name,
          resourceId: request.params.id,
          keyHash: generated.keyHash,
          prefix: generated.prefix,
        },
      });
      return reply.code(201).send({ apiKey, key: generated.key });
    },
  );

  app.get<{ Params: ResourceParams }>(
    "/resources/:id/keys",
    { preHandler: requireDashboardAuth },
    async (request) => {
      return prisma.apiKey.findMany({
        where: { resourceId: request.params.id },
        orderBy: { createdAt: "desc" },
      });
    },
  );

  app.delete<{ Params: KeyParams }>(
    "/keys/:id",
    { preHandler: requireDashboardAuth },
    async (request) => {
      await prisma.apiKey.delete({ where: { id: request.params.id } });
      return { ok: true };
    },
  );

  app.get("/logs/recent", { preHandler: requireDashboardAuth }, async () => {
    const items = await prisma.requestLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { resource: { select: { name: true } } },
    });

    return items.map((item) => ({
      id: item.id,
      time: item.createdAt.toISOString(),
      res: item.resource.name,
      method: item.method,
      path: item.path,
      status: item.statusCode,
      dur: `${item.durationMs}ms`,
      key: item.apiKeyId ? item.apiKeyId.slice(0, 8) : "–",
    }));
  });

  app.get<{ Querystring: LogsQuery }>(
    "/logs",
    { preHandler: requireDashboardAuth },
    async (request) => {
      const page = Math.max(Number(request.query.page ?? "1"), 1);
      const limit = Math.min(Math.max(Number(request.query.limit ?? "50"), 1), 100);
      const where = request.query.resourceId ? { resourceId: request.query.resourceId } : {};
      const [items, total] = await Promise.all([
        prisma.requestLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.requestLog.count({ where }),
      ]);
      return { items, page, limit, total };
    },
  );

  app.get("/tunnel/status", { preHandler: requireDashboardAuth }, async () => {
    return { hosts: tunnel.connectedHosts() };
  });

  const proxyPathResource = async (
    request: FastifyRequest<{ Params: { resourceId: string; "*"?: string } }>,
    reply: FastifyReply,
  ) => {
    const resource = await prisma.resource.findUnique({
      where: { id: request.params.resourceId },
    });
    if (!resource || !resource.active) return reply.code(404).send({ error: "Resource not found" });

    return proxyResolvedResource(resource, request, reply, buildProxyTargetPath(request));
  };

  async function proxyResolvedResource(
    resource: {
      id: string;
      type: string;
      config: unknown;
    },
    request: FastifyRequest,
    reply: FastifyReply,
    targetPath: string,
  ) {
    const started = Date.now();
    const apiKeyRequired = requiresApiKey(resource);
    const apiKeyValue = extractApiKey(request);
    let apiKeyId: string | null = null;

    if (apiKeyRequired) {
      if (!apiKeyValue) return reply.code(401).send({ error: "Missing API key" });
      const apiKey = await prisma.apiKey.findUnique({
        where: { keyHash: hashApiKey(apiKeyValue) },
      });
      if (!apiKey || (apiKey.resourceId && apiKey.resourceId !== resource.id)) {
        return reply.code(403).send({ error: "Invalid API key" });
      }
      apiKeyId = apiKey.id;
      await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsed: new Date() } });
    } else if (apiKeyValue) {
      const apiKey = await prisma.apiKey.findUnique({
        where: { keyHash: hashApiKey(apiKeyValue) },
      });
      if (apiKey && (!apiKey.resourceId || apiKey.resourceId === resource.id)) {
        apiKeyId = apiKey.id;
        await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsed: new Date() } });
      }
    }

    let response;
    try {
      response = await tunnel.send(resource.id, {
        requestId: randomUUID(),
        resourceId: resource.id,
        method: request.method,
        path: targetPath,
        headers: normalizeProxyRequestHeaders(request.headers),
        body:
          typeof request.body === "string"
            ? request.body
            : request.body
              ? JSON.stringify(request.body)
              : null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tunnel request failed";
      const statusCode = message.includes("not connected") ? 503 : 504;
      return reply.code(statusCode).send({ error: message });
    }

    await prisma.requestLog.create({
      data: {
        resourceId: resource.id,
        apiKeyId,
        method: request.method,
        path: targetPath,
        statusCode: response.statusCode,
        durationMs: Date.now() - started,
      },
    });

    const proxied =
      resource.type === "http_api"
        ? rewriteProxiedHttpResponse(response.body, response.headers, resource.id)
        : { body: response.body, headers: response.headers };

    for (const [key, value] of Object.entries(proxied.headers)) {
      reply.header(key, value);
    }
    return reply.code(response.statusCode).send(proxied.body);
  }

  app.all<{ Params: { resourceId: string } }>("/r/:resourceId", proxyPathResource);
  app.all<{ Params: { resourceId: string; "*": string } }>("/r/:resourceId/*", proxyPathResource);

  return app;
}

function buildProxyTargetPath(
  request: FastifyRequest<{ Params: { resourceId: string; "*"?: string } }>,
) {
  const query = request.url.includes("?") ? `?${request.url.split("?")[1]}` : "";
  const suffix = request.params["*"];
  if (suffix === undefined) return `/${query}`;
  const path = suffix ? `/${suffix}` : "/";
  return `${path}${query}`;
}

function buildSubdomainTargetPath(request: FastifyRequest) {
  return request.url || "/";
}

function extractSubdomainSlug(hostHeader: string | string[] | undefined) {
  const hostValue = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  if (!hostValue) return null;
  const baseDomain = (process.env.GATEWAY_BASE_DOMAIN ?? "").trim().toLowerCase();
  if (!baseDomain) return null;

  const host = hostValue.split(":")[0]?.toLowerCase();
  const normalizedBase = trimDots(baseDomain.split(":")[0] ?? "");
  if (!host || !normalizedBase || !host.endsWith(`.${normalizedBase}`)) return null;

  const subdomain = host.slice(0, -`.${normalizedBase}`.length);
  return subdomain.split(".").pop() || null;
}

function generateResourceSlug(name: string) {
  let slug = "";
  let pendingHyphen = false;

  for (const char of name.toLowerCase().trim()) {
    const code = char.charCodeAt(0);
    const isLowerAlpha = code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;

    if (isLowerAlpha || isDigit) {
      if (pendingHyphen && slug) slug += "-";
      slug += char;
      pendingHyphen = false;
      continue;
    }

    pendingHyphen = true;
  }

  return slug;
}

function trimDots(value: string) {
  let start = 0;
  let end = value.length;
  while (start < end && value[start] === ".") start += 1;
  while (end > start && value[end - 1] === ".") end -= 1;
  return value.slice(start, end);
}

function requiresApiKey(resource: { type: string; config: unknown }) {
  if (resource.type === "web_app") return false;
  if (resource.type === "api") {
    if (!resource.config || typeof resource.config !== "object") return true;
    return (resource.config as { publicAccess?: boolean }).publicAccess !== true;
  }
  return !isPublicHttpResource(resource);
}

function isPublicHttpResource(resource: { type: string; config: unknown }) {
  if (resource.type !== "http_api") return false;
  if (!resource.config || typeof resource.config !== "object") return false;
  return (resource.config as { publicAccess?: boolean }).publicAccess === true;
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

const PROXY_DROP_REQUEST_HEADERS = new Set(["accept-encoding", "connection", "content-length"]);

function normalizeProxyRequestHeaders(headers: FastifyRequest["headers"]) {
  return Object.fromEntries(
    Object.entries(headers).flatMap(([key, value]) => {
      if (!value || PROXY_DROP_REQUEST_HEADERS.has(key.toLowerCase())) return [];
      return [[key, Array.isArray(value) ? value.join(",") : String(value)]];
    }),
  );
}

type PublicResourceType = "database" | "ai-model" | "http-api" | "web-app" | "api";
type PrismaResourceType = "database" | "ai_model" | "http_api" | "web_app" | "api";

function toPrismaResourceType(type: PublicResourceType): PrismaResourceType {
  if (type === "ai-model") return "ai_model";
  if (type === "http-api") return "http_api";
  if (type === "web-app") return "web_app";
  if (type === "api") return "api";
  return "database";
}

function fromPrismaResourceType(type: PrismaResourceType): PublicResourceType {
  if (type === "ai_model") return "ai-model";
  if (type === "http_api") return "http-api";
  if (type === "web_app") return "web-app";
  if (type === "api") return "api";
  return "database";
}

function serializeResource<T extends { tokenHash?: string | null; type: PrismaResourceType }>(
  resource: T,
) {
  const sanitized = { ...resource };
  delete sanitized.tokenHash;
  return { ...sanitized, type: fromPrismaResourceType(resource.type) };
}
