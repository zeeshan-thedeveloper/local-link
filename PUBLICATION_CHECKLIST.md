# Publication Checklist — Local-Link

Use this before making the repository public.

---

## 1. Secret scan

**Status: PASS**

- `git ls-files` filtered for `.env`, `*.pem`, `*.key`, `*secret*`, `*.db`, `*.sqlite`, `*.sql`, `*.dump`, `*.zip` — no sensitive files tracked.
- `git grep` scan for real API key patterns (Resend `re_*`, Google `GOCSPX-*`, npm `npm_*`, GitHub `ghp_*`/`ghs_*`, LocalLink `ll_*`) — **zero matches in tracked files**.
- `git log --all --full-history -- .env` — no `.env` or credential file ever committed to history.
- Local `.env` files exist on disk with real credentials but are correctly gitignored (`.env` / `.env.*` rules in `.gitignore`).

**Action required before going public:**

- Rotate any credentials that were used locally during development, as a precaution regardless of scan results.
  - Google OAuth client secret
  - GitHub OAuth client secret
  - Resend API key
  - Any JWT / Better Auth secrets used in a real deployment

---

## 2. Screenshot / public asset review

**Status: PLACEHOLDER ADDED — MANUAL IMAGE PENDING**

- `apps/web/public/` contains only `.gitkeep`. No screenshots, no images, no files.
- `desing/` folder removed from git tracking in a previous session and added to `.gitignore`.
- `docs/assets/` folder created with `.gitkeep` for future screenshot placement.
- `docs/assets/local-link-dashboard.png` — **not yet present**. Hero image placeholder added to README. Add a real screenshot before final public polish.
- Screenshots section added to README with a table describing 4 views (dashboard, resource setup, API key management, request logs) — no image files required to render the table, but adding real PNGs will improve the portfolio presentation significantly.

---

## 3. Environment example files

**Status: PASS**

| File                             | Status                                                |
| -------------------------------- | ----------------------------------------------------- |
| `.env.example`                   | All values are `replace-with-*` or localhost defaults |
| `services/gateway/.env.example`  | All values are `replace-with-*` or localhost defaults |
| `apps/web/.env.example`          | Localhost URL only                                    |
| `examples/local-db/.env.example` | Placeholder IDs and keys (`res_xxx`, `lk_live_xxx`)   |

---

## 4. README naming consistency

**Status: PASS**

- Product name throughout README: **Local-Link** (consistent).
- No "QueryGate" references in any tracked file.
- No "accesslayer" or "Local Database Hosting" references in any tracked file.
- Historical context note added to README: _"Local-Link is a portfolio migration of an older Local Database Hosting prototype."_
- `desing/` reference removed from README architecture block (folder removed from tracking entirely).
- "Why this project matters" section added.
- Screenshots section added.
- Hero image placeholder added (manual image still pending — see section 2).

---

## 5. .gitignore coverage

**Status: PASS (updated)**

The following patterns are now covered:

```
.env
.env.*
!.env.example
*.pem
*.key
*.p12
*firebase-adminsdk*.json
service-account*.json
*.db
*.sqlite
*.sqlite3
*.dump
*.sql
*.bak
*.zip
*.tar
*.tar.gz
*.tgz
.planning/
.claude/
.codex/
STATUS.md
PLAN.md
TASKS.md
```

---

## 6. IDE / AI assistant config files

**Status: FIXED**

- `.claude/settings.local.json` was tracked by git — **removed from tracking** (`git rm --cached`) in this session.
- `.claude/` is now in `.gitignore`.
- `.cursor/` was already in `.gitignore`.

---

## 7. No private client / user data

**Status: PASS**

- No real email addresses found in tracked files.
- No real user records, client names, or personal data found.
- All log/request data shown in design files is mock/placeholder.

---

## 8. Branch and default branch

**Note — action required before making public:**

- Current default branch: `main`
- Confirm in GitHub Settings → Branches that `main` is set as the default branch before flipping the repo to public.
- The repo should be public-facing from `main`, not a development or feature branch.

---

## 9. Manual review items

These items could not be verified automatically and require human review:

| Item                                            | Notes                                                                                                                       |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `desing/` HTML/JSX mockups                      | Removed from git tracking. Folder still exists locally but is gitignored. No action needed.                                 |
| `DEPLOYMENT.md`                                 | **Sanitized** — real IP (`134.x.x.x`) replaced with `YOUR_SERVER_IP`; personal deploy username replaced with `deploy`.      |
| GitHub Actions workflows (`.github/workflows/`) | Review for any hardcoded tokens or environment-specific secrets. All secrets should reference `${{ secrets.* }}` variables. |
| npm publish config                              | If publishing packages, ensure `NPM_TOKEN` is only in GitHub Secrets, not in any tracked file.                              |

---

## 10. Final recommendation

**Status: SAFE TO MAKE PUBLIC — after completing the action items below.**

### Required before going public

- [ ] Rotate all credentials used during local development (see section 1).
- [ ] Confirm `main` is set as default branch in GitHub Settings (see section 8).
- [x] Sanitize `DEPLOYMENT.md` — real IP and personal username replaced with placeholders.
- [ ] Review `.github/workflows/` to ensure no hardcoded tokens.

### Recommended before going public

- [ ] Add `docs/assets/local-link-dashboard.png` — a real screenshot of the running dashboard (see section 2).
- [ ] Add remaining screenshots (resource setup, API keys, request logs) to `docs/assets/` and update the Screenshots table in README.

### Optional

- [ ] Add a `CONTRIBUTING.md` if you want external contributions.
- [ ] Add GitHub repository topics: `portfolio`, `api-gateway`, `typescript`, `socket-io`, `self-hosted`.
- [ ] Set a social preview image in GitHub Settings → Social preview.
