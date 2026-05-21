# LocalLink HTTP Example

Minimal Vite + React app for testing HTTP resource proxying through the LocalLink tunnel. The dev server is fixed to port **25543** so it is easy to spot in logs and avoids common port collisions.

## Run locally

From the monorepo root:

```sh
pnpm install
pnpm --filter @locallink-examples/http dev
```

Open [http://localhost:25543](http://localhost:25543), click **Fetch sample API**, and confirm JSON appears on screen.

## Register with LocalLink

1. Start the dev server (`pnpm dev` in this package).
2. In the dashboard, add an HTTP resource pointing at `http://localhost:25543`.
3. Start the host daemon and route traffic through the tunnel to verify end-to-end proxying.

The UI currently calls `https://jsonplaceholder.typicode.com/todos/1` as a placeholder. Swap the URL in `src/App.tsx` for your own backend route when testing proxied APIs.
