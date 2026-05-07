import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "./prisma.js";

export const auth = betterAuth({
  baseURL: process.env.BACKEND_BASE_URL ?? "http://localhost:3003",
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET ?? "locallink-dev-secret",
  trustedOrigins: [
    process.env.FRONTEND_BASE_URL ?? "http://localhost:3000"
  ],
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
      prompt: "select_account",
    },
  },
});

export type Auth = typeof auth;
