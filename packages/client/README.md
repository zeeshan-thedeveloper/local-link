# @locallink/client

Drop-in clients for routing API calls and database queries through a LocalLink tunnel.

Lets a **deployed** backend temporarily talk to a **local** database with minimal
code changes — swap one import, add three env vars, done.

---

## How it works

```
Your deployed backend
        │
        │  POST /r/:resourceId/query  { sql, params }
        ▼
  LocalLink Gateway
        │
        │  socket.io tunnel
        ▼
  Your local machine (locallink CLI running)
        │
        ▼
  Local Postgres DB  →  rows back up the chain
```

---

## Prerequisites

1. **Register your DB** as a resource in the LocalLink dashboard
   - Type: `database`, engine: `postgres`, connection string: your local DB URL
   - Note the **Resource ID** shown after creation

2. **Generate an API key** for that resource (dashboard → resource → API Keys tab)

3. **Run the locallink CLI** on your local machine so the tunnel is open:
   ```bash
   npx locallink start
   # or if running locally in this repo:
   pnpm --filter @locallink/host dev -- start
   ```

---

## Installation

In your backend project:

```bash
npm install github:your-org/local-link  # or copy src/pg.ts directly
```

Or just copy `src/pg.ts` into your project — it has zero dependencies beyond `fetch`
(Node 18+).

---

## Usage

### REST API resources

```ts
import { createClient } from "@locallink/client";

const api = createClient({
  gateway: "https://my-api.locallink.zeeshanahmed.app",
  apiKey: process.env.LOCALLINK_API_KEY!,
});

const res = await api.get("/users");
const data = await res.json();
```

You can also configure it from environment variables:

```ts
import { fromEnv } from "@locallink/client";

const api = fromEnv();
if (!api) throw new Error("LocalLink API env vars are missing");
```

| Variable            | Purpose                                                                    |
| ------------------- | -------------------------------------------------------------------------- |
| `LOCALLINK_GATEWAY` | Base URL of the resource, e.g. `https://my-api.locallink.zeeshanahmed.app` |
| `LOCALLINK_API_KEY` | `ll_xxx` key from the dashboard                                            |

### Pattern 1 — Feature flag via env var (recommended)

No changes to your existing DB code. Add a check at the top of where you create
your pool:

```ts
import { Pool as PgPool } from "pg";
import { fromEnv } from "@locallink/client/pg";

// Uses LocalLink tunnel if LOCALLINK_* vars are set, otherwise your real DB.
export const pool = fromEnv() ?? new PgPool({ connectionString: process.env.DATABASE_URL });
```

Set these env vars when deploying with the tunnel:

```bash
LOCALLINK_GATEWAY=https://your-gateway.com
LOCALLINK_RESOURCE_ID=abc123def456        # from the dashboard
LOCALLINK_API_KEY=ll_k_...               # generated in the dashboard
```

Remove them to go back to your production DB. Zero code changes needed again.

### Pattern 2 — Explicit swap

```ts
// Before
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// After (swap just the import + constructor options)
import { Pool } from "@locallink/client/pg";
const pool = new Pool({
  gateway: process.env.LOCALLINK_GATEWAY,
  resourceId: process.env.LOCALLINK_RESOURCE_ID,
  apiKey: process.env.LOCALLINK_API_KEY,
});

// Everything else stays the same
const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
```

---

## API

### `new Pool(options)`

| Option       | Type   | Description                                     |
| ------------ | ------ | ----------------------------------------------- |
| `gateway`    | string | Your gateway URL, e.g. `https://gw.example.com` |
| `resourceId` | string | Resource ID from the LocalLink dashboard        |
| `apiKey`     | string | API key generated for this resource             |

### `pool.query(sql, params?)`

Same signature as `pg.Pool.query`. Returns `Promise<{ rows, rowCount }>`.

```ts
const { rows, rowCount } = await pool.query(
  "SELECT * FROM orders WHERE user_id = $1 AND status = $2",
  [userId, "pending"],
);
```

### `pool.end()`

No-op. Exists so you can swap back to `pg.Pool` without changing cleanup code.

### `fromEnv()`

Returns a `Pool` configured from env vars, or `null` if any are missing.
Use this for the feature-flag pattern.

---

## What's supported

| Feature                    | Supported                                     |
| -------------------------- | --------------------------------------------- |
| `SELECT` queries           | ✅                                            |
| `INSERT / UPDATE / DELETE` | ✅                                            |
| Parameterized queries      | ✅                                            |
| Transactions               | ❌ (each query is a separate HTTP round-trip) |
| `pool.connect()` client    | ❌                                            |
| Streaming                  | ❌                                            |

For transactions, wrap the statements in a single `BEGIN ... COMMIT` query string
if you need them temporarily.

---

## Removing it

1. Delete the `LOCALLINK_*` env vars from your deployment
2. Revert the one-line import change (or remove the `fromEnv()` check)
3. Done — back to your real DB
