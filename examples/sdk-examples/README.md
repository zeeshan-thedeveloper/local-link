# LocalLink SDK Examples

This Node example tests the `@locallink/client` HTTP SDK against a LocalLink gateway.

## Setup

Install dependencies from the monorepo root:

```sh
pnpm install
```

Or from this directory:

```sh
pnpm install --filter @locallink-examples/sdk-examples
```

Copy the example environment file and add your API key:

```sh
cp .env.example .env
```

## Run

```sh
pnpm start
```

The script calls:

```ts
import { createClient } from "@locallink/client";

const api = createClient({
  gateway: "https://test-node-backend.locallink.zeeshanahmed.app",
  apiKey: process.env.LOCALLINK_API_KEY,
});

const res = await api.get("/users");
const data = await res.json();
```

Set `LOCALLINK_GATEWAY` in `.env` if you want to test a different gateway URL.
