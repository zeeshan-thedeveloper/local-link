import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email.js";
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
    github: {
      clientId: process.env.GITHUB_OAUTH_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET ?? "",
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    expiresIn: 60 * 60 * 24,
    async sendVerificationEmail({ user, url }) {
      await sendVerificationEmail(user.email, url);
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    async sendResetPassword({ user, url }) {
      await sendPasswordResetEmail(user.email, url);
    },
    password: {
      hash: (password) => bcrypt.hash(password, 12),
      verify: ({ hash, password }) => bcrypt.compare(password, hash),
    },
  },
});

export type Auth = typeof auth;
