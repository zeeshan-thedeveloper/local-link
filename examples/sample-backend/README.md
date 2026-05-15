# LocalLink Sample Backend

This demo shows how a standalone Express API can consume a local Postgres database through LocalLink using the published `@locallink/client` package. It is intentionally isolated from the monorepo workspace so it behaves like any external application a developer might build.

## Prerequisites

- Node.js 18 or newer
- A LocalLink account
- A registered database resource in the LocalLink dashboard
- The LocalLink CLI installed and available locally

## Setup

Install dependencies with npm:

```sh
npm install
```

Copy the example environment file and fill in the credentials from the LocalLink dashboard:

```sh
cp .env.example .env
```

Start the LocalLink tunnel so your registered local database resource is reachable:

```sh
locallink start
```

Run the API server:

```sh
npm run dev
```

The server starts on `http://localhost:3000` unless you set a different `PORT`.

## Available Routes

Health check and connection info:

```sh
curl http://localhost:3000/
```

Raw database connectivity test:

```sh
curl http://localhost:3000/db/test
```

List recent users:

```sh
curl http://localhost:3000/users
```

Fetch one user by id:

```sh
curl http://localhost:3000/users/cmox_user_id
```

Fetch sessions for a user:

```sh
curl http://localhost:3000/users/cmox_user_id/sessions
```

List all resources:

```sh
curl http://localhost:3000/resources
```

List active resources:

```sh
curl http://localhost:3000/resources/active
```

Fetch one resource by id:

```sh
curl http://localhost:3000/resources/cmoxj1aqb0001pp2m2drbgtkr
```

Fetch API keys for a resource:

```sh
curl http://localhost:3000/resources/cmoxj1aqb0001pp2m2drbgtkr/keys
```

List recent request logs:

```sh
curl http://localhost:3000/logs
```

List recent request logs for a resource:

```sh
curl http://localhost:3000/logs/resource/cmoxj1aqb0001pp2m2drbgtkr
```

Fetch request log stats grouped by resource:

```sh
curl http://localhost:3000/logs/stats
```

Example response:

```json
[
  {
    "resourceName": "LocalLink Gateway Database",
    "total": 128,
    "avgMs": 42,
    "errors": 3
  }
]
```

List connected hosts:

```sh
curl http://localhost:3000/hosts
```

## How `fromEnv()` Works

The app imports `fromEnv()` from `@locallink/client/pg` and uses the returned pool like a normal `pg.Pool`:

```ts
const pool = fromEnv();
const { rows } = await pool.query('SELECT now()::text, version()');
```

`fromEnv()` reads the LocalLink environment variables and builds a Postgres-compatible pool that routes queries through the LocalLink gateway and resource you configured. That makes it useful for feature-flagging database access across environments: production can use a direct real `pg` connection, while development or staging can use a LocalLink tunnel without changing the query code.

## Packages

- [`@locallink/client` on npm](https://www.npmjs.com/package/@locallink/client)
- [`@locallink/shared` on npm](https://www.npmjs.com/package/@locallink/shared)
