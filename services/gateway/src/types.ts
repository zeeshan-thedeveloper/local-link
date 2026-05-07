import type { FastifyRequest } from "fastify";

export type AuthenticatedUser = {
  id: string;
  email: string;
};

export type DashboardRequest = FastifyRequest & {
  user: AuthenticatedUser;
};

export type ProxyAuth = {
  apiKeyId: string;
  resourceId: string | null;
};

