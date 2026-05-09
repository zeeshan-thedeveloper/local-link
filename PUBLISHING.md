# Publishing LocalLink to npm

All three package names are confirmed free on npm.

| Package | npm name | Type |
|---|---|---|
| `apps/host` | `locallink` | CLI tool |
| `packages/shared` | `@locallink/shared` | Types library |
| `packages/client` | `@locallink/client` | DB tunnel client |

---

## Stage 1 — npm account + scope

### 1.1 Create the `@locallink` org on npmjs.com

1. Go to [npmjs.com](https://www.npmjs.com) → sign in
2. Click your avatar → **Add Organization**
3. Name: `locallink` → **Create**
4. This claims the `@locallink` scope for all scoped packages

### 1.2 Authenticate your machine

```bash
npm login
# enter username, password, email, OTP
npm whoami   # should print your username
```

---

## Stage 2 — Fix package.json files

### `apps/host/package.json`

```json
{
  "name": "locallink",
  "version": "0.1.0",
  // remove "private": true
  "type": "module",
  "bin": { "locallink": "./dist/cli.js" },
  "files": ["dist"],
  "engines": { "node": ">=18" },
  "license": "MIT"
}
```

Changes:
- `"name"`: `@locallink/host` → `locallink`
- Remove `"private": true`
- Add `"files": ["dist"]`
- Add `"engines"` and `"license"`

### `packages/shared/package.json`

```json
{
  "name": "@locallink/shared",
  "version": "0.1.0",
  // remove "private": true
  "publishConfig": { "access": "public" },
  "files": ["dist"],
  "engines": { "node": ">=18" },
  "license": "MIT"
}
```

### `packages/client/package.json`

```json
{
  "name": "@locallink/client",
  "version": "0.1.0",
  // remove "private": true
  "publishConfig": { "access": "public" },
  "files": ["dist"],
  "engines": { "node": ">=18" },
  "license": "MIT"
}
```

---

## Stage 3 — Install Changesets

Changesets manages versioning and changelogs in pnpm monorepos.

```bash
pnpm add -D -w @changesets/cli
pnpm changeset init
```

Edit `.changeset/config.json`:

```json
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [
    "@locallink/validators",
    "@locallink/tsconfig"
  ]
}
```

The `ignore` list prevents accidental publishing of internal-only packages.

---

## Stage 4 — Build and publish

### 4.1 Build everything

```bash
pnpm build
```

This compiles `@locallink/shared` first (dependency), then `locallink` CLI and `@locallink/client`.
Verify `dist/` exists in each package before publishing.

### 4.2 Create a changeset (describe what changed)

```bash
pnpm changeset
```

- Select which packages changed (shared, host/locallink, client)
- Pick bump type: `patch` (bug fix) / `minor` (new feature) / `major` (breaking)
- Write a one-line summary of what changed

### 4.3 Bump versions + generate CHANGELOG

```bash
pnpm changeset version
```

This:
- Updates `version` in each package.json
- Replaces `workspace:*` references with real version numbers
- Generates/updates `CHANGELOG.md` in each package

### 4.4 Publish

```bash
pnpm changeset publish
```

This publishes `@locallink/shared` first (since `locallink` depends on it), then `locallink`, then `@locallink/client`.

Commit the version bumps:

```bash
git add .
git commit -m "Release v0.1.0"
git tag v0.1.0
git push && git push --tags
```

---

## Stage 5 — Test after publish

### Test the CLI

```bash
# Install globally
npm install -g locallink

# Verify
locallink --version
locallink --help

# Run setup against your gateway
locallink setup --gateway http://localhost:3003

# Connect
locallink start
```

### Test `@locallink/client` in a fresh Node.js project

```bash
mkdir test-tunnel && cd test-tunnel
npm init -y
npm install @locallink/client
```

Create `test.mjs`:

```js
import { fromEnv } from '@locallink/client/pg';

const pool = fromEnv();
if (!pool) {
  console.error('Set LOCALLINK_GATEWAY, LOCALLINK_RESOURCE_ID, LOCALLINK_API_KEY');
  process.exit(1);
}

const { rows } = await pool.query('SELECT NOW() as time');
console.log('Tunnel works:', rows[0].time);
```

Run it:

```bash
LOCALLINK_GATEWAY=http://localhost:3003 \
LOCALLINK_RESOURCE_ID=cmoxj1aqb0001pp2m2drbgtkr \
LOCALLINK_API_KEY=ll_IJl5AVn9LnjX7Aes-XGN4y0_n2CIGPlHCXuRMfFl810 \
node test.mjs
```

Expected output:
```
Tunnel works: 2026-05-10T...
```

### Test `@locallink/shared` types

```bash
npm install @locallink/shared
```

```ts
import type { ResourceType, TunnelRequestPayload } from '@locallink/shared';
// types should resolve without errors
```

---

## Stage 6 — Ongoing releases

Every time you make changes worth publishing:

```bash
pnpm changeset        # describe the change
pnpm changeset version # bump versions
pnpm build            # rebuild
pnpm changeset publish # push to npm
git add . && git commit -m "Release vX.Y.Z" && git push
```

---

## Stage 7 — CI automation (optional, later)

File: `.github/workflows/release.yml`

```yaml
name: Release
on:
  push:
    branches: [main]
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, registry-url: 'https://registry.npmjs.org' }
      - run: pnpm install
      - run: pnpm build
      - uses: changesets/action@v1
        with:
          publish: pnpm changeset publish
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Add `NPM_TOKEN` (from npmjs.com → Access Tokens → Automation token) as a GitHub repo secret.

---

## Checklist before first publish

- [ ] `npm whoami` returns your username
- [ ] `@locallink` org exists on npmjs.com
- [ ] `"private": true` removed from host, shared, client `package.json`
- [ ] `"files": ["dist"]` added to all three
- [ ] `pnpm build` succeeds with no errors
- [ ] `dist/` exists in all three packages
- [ ] `locallink` binary exists at `apps/host/dist/cli.js`
- [ ] Changesets installed and configured
- [ ] `pnpm changeset` run and a changeset file created
