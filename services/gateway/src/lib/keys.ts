import { pbkdf2Sync, randomBytes } from "node:crypto";

const KEY_HASH_ALGORITHM = "pbkdf2-sha512";
const KEY_HASH_ITERATIONS = 210_000;
const KEY_HASH_LENGTH = 32;

function getKeyHashSecret() {
  const secret =
    process.env.API_KEY_HASH_SECRET ?? process.env.BETTER_AUTH_SECRET ?? process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Set API_KEY_HASH_SECRET, BETTER_AUTH_SECRET, or JWT_SECRET to hash API keys.");
  }

  return "locallink-development-key-hash-secret";
}

export function createApiKey() {
  const secret = randomBytes(32).toString("base64url");
  const key = `ll_${secret}`;
  return {
    key,
    prefix: key.slice(0, 10),
    keyHash: hashApiKey(key),
  };
}

export function createHostToken() {
  const secret = randomBytes(32).toString("base64url");
  const key = `lhk_${secret}`;
  return {
    token: key,
    prefix: key.slice(0, 10),
    tokenHash: hashApiKey(key),
  };
}

export function hashApiKey(key: string) {
  const digest = pbkdf2Sync(
    key,
    getKeyHashSecret(),
    KEY_HASH_ITERATIONS,
    KEY_HASH_LENGTH,
    "sha512",
  ).toString("hex");

  return `${KEY_HASH_ALGORITHM}:${KEY_HASH_ITERATIONS}:${digest}`;
}
