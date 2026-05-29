# LocalLink HTTP Node Example

This demo is a small local Express backend you can run on your machine and connect to a LocalLink daemon as an HTTP resource.

## Prerequisites

- Node.js 18 or newer
- The LocalLink CLI installed and available locally
- A LocalLink account when you are ready to register the resource

## Setup

Install dependencies from the monorepo root:

```sh
pnpm install
```

Or from this directory:

```sh
pnpm install --filter @locallink-examples/http-node
```

Copy the example environment file if you want to change the port:

```sh
cp .env.example .env
```

Run the local backend:

```sh
pnpm dev
```

The server starts on `http://localhost:37191` unless you set a different `PORT`.

## Available Routes

Health check:

```sh
curl http://localhost:37191/health
```

Service info:

```sh
curl http://localhost:37191/
```

List users:

```sh
curl http://localhost:37191/api/users
```

Fetch one user:

```sh
curl http://localhost:37191/api/users/usr_ada
```

Create a user:

```sh
curl -X POST http://localhost:37191/api/users \
  -H "content-type: application/json" \
  -d '{"name":"Alan Turing","email":"alan@example.com"}'
```

Delete a user:

```sh
curl -X DELETE http://localhost:37191/api/users/usr_ada
```

Echo a request:

```sh
curl -X POST "http://localhost:37191/api/echo?source=local" \
  -H "content-type: application/json" \
  -d '{"hello":"world"}'
```

## Connecting It To LocalLink

Start this backend first:

```sh
pnpm dev
```

Then register or configure an HTTP resource in LocalLink that points at:

```text
http://localhost:37191
```

Start the daemon:

```sh
locallink start
```

Requests sent through the LocalLink gateway for that HTTP resource will be forwarded to this local Express server.
