-- Better Auth's core schema includes Account.password and rejects the
-- database when it is missing. Email/password sign-in stays disabled.
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "password" TEXT;
