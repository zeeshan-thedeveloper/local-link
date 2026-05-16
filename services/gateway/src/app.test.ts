import { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";

function createPrismaMock() {
  const state = {
    users: [] as Array<{ id: string; email: string; emailVerified?: boolean; name?: string; passwordHash: string }>,
    resources: [] as Array<Record<string, unknown>>,
    apiKeys: [] as Array<Record<string, unknown>>,
    logs: [] as Array<Record<string, unknown>>
  };

  return {
    state,
    user: {
      findUnique: vi.fn(({ where }) =>
        state.users.find((user) => user.email === where.email || user.id === where.id) ?? null
      ),
      count: vi.fn(() => state.users.length),
      create: vi.fn(({ data }) => {
        const user = { id: "user_1", ...data };
        state.users.push(user);
        return user;
      }),
      update: vi.fn(({ where, data }) => {
        const index = state.users.findIndex((user) => user.id === where.id);
        state.users[index] = { ...state.users[index], ...data };
        return state.users[index];
      })
    },
    account: {
      findFirst: vi.fn(({ where }) => {
        const user = state.users.find((item) => item.id === where.userId);
        if (!user?.passwordHash) return null;
        return { password: user.passwordHash };
      })
    },
    resource: {
      findMany: vi.fn(() => state.resources),
      findUnique: vi.fn(({ where }) => state.resources.find((resource) => resource.id === where.id) ?? null),
      create: vi.fn(({ data }) => {
        const resource = { id: "res_1", active: true, createdAt: new Date(), ...data };
        state.resources.push(resource);
        return resource;
      }),
      update: vi.fn(({ where, data }) => {
        const index = state.resources.findIndex((resource) => resource.id === where.id);
        state.resources[index] = { ...state.resources[index], ...data };
        return state.resources[index];
      }),
      delete: vi.fn(({ where }) => {
        state.resources = state.resources.filter((resource) => resource.id !== where.id);
        return { id: where.id };
      })
    },
    apiKey: {
      create: vi.fn(({ data }) => {
        const apiKey = { id: "key_1", createdAt: new Date(), lastUsed: null, ...data };
        state.apiKeys.push(apiKey);
        return apiKey;
      }),
      findMany: vi.fn(({ where }) => state.apiKeys.filter((key) => key.resourceId === where.resourceId)),
      findUnique: vi.fn(({ where }) => state.apiKeys.find((key) => key.keyHash === where.keyHash) ?? null),
      update: vi.fn(() => ({})),
      delete: vi.fn(({ where }) => ({ id: where.id }))
    },
    requestLog: {
      findMany: vi.fn(() => state.logs),
      count: vi.fn(() => state.logs.length),
      create: vi.fn(({ data }) => {
        state.logs.push(data);
        return data;
      })
    }
  } as unknown as PrismaClient & { state: typeof state };
}

describe("gateway app", () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let cookie = "";

  beforeEach(async () => {
    prisma = createPrismaMock();
    const app = await createApp({
      prisma,
      jwtSecret: "test-secret",
      tunnel: { connectedHosts: () => [], send: vi.fn() }
    });
    await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "me@example.com", password: "password" }
    });
    if (prisma.state.users[0]) prisma.state.users[0].emailVerified = true;
    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "me@example.com", password: "password" }
    });
    cookie = response.headers["set-cookie"] as string;
    await app.close();
  });

  it("creates the first single user on login", async () => {
    expect(prisma.state.users).toHaveLength(1);
    expect(cookie).toContain("locallink_session");
  });

  it("updates the current user's display name", async () => {
    const app = await createApp({
      prisma,
      jwtSecret: "test-secret",
      tunnel: { connectedHosts: () => [], send: vi.fn() }
    });

    const patch = await app.inject({
      method: "PATCH",
      url: "/auth/me",
      headers: { cookie },
      payload: { name: "Zeeshan" }
    });

    expect(patch.statusCode).toBe(200);
    expect(patch.json()).toMatchObject({
      user: { id: "user_1", sub: "user_1", email: "me@example.com", name: "Zeeshan" }
    });

    const me = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { cookie }
    });

    expect(me.json()).toMatchObject({
      user: { id: "user_1", sub: "user_1", email: "me@example.com", name: "Zeeshan" }
    });

    await app.close();
  });

  it("requires auth for resources", async () => {
    const app = await createApp({
      prisma,
      jwtSecret: "test-secret",
      tunnel: { connectedHosts: () => [], send: vi.fn() }
    });
    const response = await app.inject({ method: "GET", url: "/resources" });
    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it("creates and updates resources", async () => {
    const app = await createApp({
      prisma,
      jwtSecret: "test-secret",
      tunnel: { connectedHosts: () => [], send: vi.fn() }
    });
    const create = await app.inject({
      method: "POST",
      url: "/resources",
      headers: { cookie },
      payload: {
        name: "Local API",
        type: "http-api",
        hostId: "laptop",
        config: { url: "http://localhost:8080" }
      }
    });
    expect(create.statusCode).toBe(201);
    const patch = await app.inject({
      method: "PATCH",
      url: "/resources/res_1",
      headers: { cookie },
      payload: { active: false }
    });
    expect(patch.json()).toMatchObject({ active: false });
    await app.close();
  });
});
