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

const res = await api.get("/users");

if (!res.ok) {
  const body = await res.text();
  throw new Error(`GET /users failed with ${res.status} ${res.statusText}: ${body}`);
}

const data = await res.json();
console.log(JSON.stringify(data, null, 2));
