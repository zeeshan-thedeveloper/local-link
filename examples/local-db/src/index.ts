import express from "express";
import "dotenv/config";
import { fromEnv } from "@locallink/client/pg";

const pool = fromEnv();

if (!pool) {
  console.error(
    "Missing LocalLink env vars. Copy .env.example to .env and fill in your credentials.",
  );
  process.exit(1);
}

const app = express();
app.use(express.json());

const gateway = process.env.LOCALLINK_GATEWAY!;
const resourceId = process.env.LOCALLINK_RESOURCE_ID!;
const apiKeyPreview = process.env.LOCALLINK_API_KEY!.slice(0, 12) + "...";
const port = Number(process.env.PORT ?? 3000);

// GET /
app.get("/", (_req, res) => {
  res.json({
    service: "locallink-local-db",
    gateway,
    resourceId,
    apiKey: apiKeyPreview,
    status: "connected",
  });
});

// GET /db/test
app.get("/db/test", async (_req, res) => {
  try {
    const { rows } = await pool.query<{ now: string; version: string }>(
      "SELECT now()::text, version()",
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /users
app.get("/users", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, "emailVerified", "createdAt" FROM "User" ORDER BY "createdAt" DESC LIMIT 20',
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /users/:id
app.get("/users/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, "emailVerified", "createdAt" FROM "User" WHERE id = $1',
      [req.params.id],
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /users/:id/sessions
app.get("/users/:id/sessions", async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, "expiresAt", "ipAddress", "userAgent", "createdAt" FROM "Session" WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [req.params.id],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /resources
app.get("/resources", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, type, "hostId", active, "createdAt" FROM "Resource" ORDER BY "createdAt" DESC',
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /resources/active
app.get("/resources/active", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, type, "hostId", active, "createdAt" FROM "Resource" WHERE active = true ORDER BY "createdAt" DESC',
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /resources/:id
app.get("/resources/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, type, "hostId", active, "createdAt" FROM "Resource" WHERE id = $1',
      [req.params.id],
    );
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /resources/:id/keys
app.get("/resources/:id/keys", async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, prefix, "lastUsed", "createdAt" FROM "ApiKey" WHERE "resourceId" = $1',
      [req.params.id],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /logs
app.get("/logs", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT l.id, l.method, l.path, l."statusCode", l."durationMs", l."createdAt", r.name AS "resourceName" FROM "RequestLog" l JOIN "Resource" r ON r.id = l."resourceId" ORDER BY l."createdAt" DESC LIMIT 50',
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /logs/resource/:resourceId
app.get("/logs/resource/:resourceId", async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT l.id, l.method, l.path, l."statusCode", l."durationMs", l."createdAt", r.name AS "resourceName" FROM "RequestLog" l JOIN "Resource" r ON r.id = l."resourceId" WHERE l."resourceId" = $1 ORDER BY l."createdAt" DESC LIMIT 50',
      [req.params.resourceId],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /logs/stats
app.get("/logs/stats", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT r.name AS "resourceName", COUNT(*)::int AS total, AVG(l."durationMs")::int AS "avgMs", COUNT(*) FILTER (WHERE l."statusCode" >= 400)::int AS errors FROM "RequestLog" l JOIN "Resource" r ON r.id = l."resourceId" GROUP BY r.id, r.name ORDER BY total DESC',
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /hosts
app.get("/hosts", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, "socketId", "connectedAt", "lastSeen" FROM "ConnectedHost" ORDER BY "lastSeen" DESC',
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(port, () => {
  console.log(`
LocalLink Local DB Example
  Gateway:    ${gateway}
  Resource:   ${resourceId}
  Listening:  http://localhost:${port}
  `);
});
