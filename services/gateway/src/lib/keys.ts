import { createHash, randomBytes } from "node:crypto";

export function createApiKey() {
  const secret = randomBytes(32).toString("base64url");
  const key = `ll_${secret}`;
  return {
    key,
    prefix: key.slice(0, 10),
    keyHash: hashApiKey(key)
  };
}

export function createHostToken() {
  const secret = randomBytes(32).toString("base64url");
  const key = `lhk_${secret}`;
  return {
    token: key,
    prefix: key.slice(0, 10),
    tokenHash: hashApiKey(key)
  };
}

export function hashApiKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}
