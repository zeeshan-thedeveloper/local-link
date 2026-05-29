import "dotenv/config";
import { createClient } from "@locallink/client";

const gateway =
  process.env.LOCALLINK_GATEWAY ?? "https://test-node-backend.locallink.zeeshanahmed.app";
const apiKey = process.env.LOCALLINK_API_KEY;

if (!apiKey) {
  console.error("Missing LOCALLINK_API_KEY. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const api = createClient({
  gateway,
  apiKey,
});

const usersRes = await api.get("/api/users");

if (!usersRes.ok) {
  const body = await usersRes.text();
  throw new Error(`GET /api/users failed with ${usersRes.status} ${usersRes.statusText}: ${body}`);
}

const users = await usersRes.json();
console.log(JSON.stringify(users, null, 2));

const healthRes = await api.get("/health");

if (!healthRes.ok) {
  const body = await healthRes.text();
  throw new Error(`GET /health failed with ${healthRes.status} ${healthRes.statusText}: ${body}`);
}

const health = await healthRes.json();
console.log(JSON.stringify(health, null, 2));
