# Monara Sentinel — Dependency Security Audit 2026-09-09

**Baseline:** Phase 1 verified, `npm audit` after `npm update` (non-breaking) — 20 vulnerabilities (4 moderate, 14 high, 2 critical). Previous 21 → 20 via `npm update`.

**Policy:** No `npm audit fix --force` without proof. No major framework upgrades casually. Document direct vs transitive, exposure, patched version, breaking, mitigation, planned phase.

| Package | Direct | Severity | Affected | Exposure in Monara Sentinel | Patched | Breaking | Mitigation | Plan |
|---------|--------|----------|----------|-----------------------------|---------|----------|------------|------|
| `@fastify/static` (via `swagger-ui`) | No | high (GHSA-8pvw, GHSA-83w8) | `<=10.1.1` | Swagger UI at `/docs` — path traversal / auth bypass. Not used for user data. Low exploit: docs are static, no authz via static. | `@fastify/swagger-ui@6.1.1` | **major** (`5.2.6`→`6.1.1` changes Fastify 5 plugin API) | Restrict `/docs` to dev, no sensitive data served; rate-limit docs. | Phase 2 — schedule swagger-ui major upgrade with Fastify 5.12 compat test |
| `@fastify/swagger-ui` | **Yes** | moderate | `<=6.1.0` | Same as above. | `6.1.1` | major | Same | Same |
| `tar` (via `argon2→@mapbox/node-pre-gyp`) | No | **critical** (11 CVEs GHSA-34x7 etc.) | `<=7.5.20` | `tar` only used at `npm install` time by `node-pre-gyp` to download `argon2` prebuilds — **not** used at runtime for user uploads. No user tar extraction. | `argon2@0.45.1` (major) which drops `node-pre-gyp`/`tar` | major (`0.31.2`→`0.45.1` native API change) | Avoid `npm install` from untrusted tar; CI uses lockfile, no user tar. | Phase 2 — test `argon2@0.45` in isolated branch, verify `hashPassword`/`verifyPassword` still `argon2id 64MB/3/4` |
| `@mapbox/node-pre-gyp` | No | high | `<=1.0.11` | Same as `tar`. | `argon2@0.45.1` | major | Same | Same |
| `argon2` | **Yes** | high | `0.27.2-0.31.2` | Direct — password hashing `argon2id`. Vuln is transitive via `tar`, not in `argon2` crypto itself. | `0.45.1` | major (native rebuild, `hash` API same but build changes) | Keep `0.31.2` for now, hash verified in `security.test.ts:4`. | Same as above |
| `esbuild` (via `vite`→`vitest`) | No | moderate (GHSA-67mh) | `<=0.24.2` | Dev-only: `vitest` dev server allows any site to read dev server responses. **Not** in production `next build`/`api` runtime. | `vitest@4.1.11` | major (`1.6.1`→`4.1.11` Vite 6) | `vitest` only runs in `npm run test` locally, not exposed. | Phase 3 — evaluate `vitest@4` with `vite@6` compat |
| `vite` / `vite-node` / `vitest` | No/Yes | high/crit | `vitest <=3.2.5` | Same dev-only. | `4.1.11` | major | Same | Same |
| `minimatch` (via `typescript-estree`) | No | high (ReDoS GHSA-3ppc) | `9.0.0-9.0.6` | Used only at `eslint` lint time (`@typescript-eslint/typescript-estree` → `minimatch` for glob). Not runtime, not user input. | `@typescript-eslint/parser@8.70.0` | major (`6.21`→`8.70` ESLint 8→9 flat config) | Lint runs locally, ReDoS needs crafted pattern — not user-controlled. | Phase 2 — migrate `eslint` 8→9 + `@typescript-eslint` 8 with flat config (planned) |
| `@typescript-eslint/*` (5 packages) | **Yes** (parser, plugin) | high | `6.16.0-7.5.0` | Same lint-only. | `8.70.0` | major | Same | Same |
| `postcss` (via `next`) | No | high (XSS GHSA-qx2v etc.) | `<=8.5.22` | `next` build-time CSS transform — XSS via `</style>` in CSS, not user runtime. No user CSS injection. | `next@16.3.4` | major (`15.5.25`→`16.3.4` React 19) | No user CSS, build only. | Phase 3 — evaluate `next@16` with React 19 |
| `next` | **Yes** | moderate | `9.3.4-canary - 16.3.0-preview` | Same. | `16.3.4` | major | Same | Same |
| `deepmerge-ts` (via `@prisma/config`→`prisma`) | No | high (GHSA-ggr8) | `<8.0.0` | Prisma config deep-merge at `prisma generate`/`migrate` — recursive object graph. Not user input, only `schema.prisma`. | `prisma` `7.x` (major) | major (`6.19.3`→`7.10.0`) | Config is static, no user recursion. | Phase 2 — evaluate `prisma@7` with migration test |
| `@prisma/config` / `prisma` | No/**Yes** | high | `6.13.0-dev.1 - 8.1.0-dev.4` / `6.13 - 8.1` | Same. | `7.x` | major | Same | Same |
| `sharp` | No | high (libvips CVE-2026 etc.) | `<=0.35.4-rc.0` | `sharp` is `next` image optimization — **not used** in Phase 1 (no `next/image`). `next build` pulls `sharp` optionally. | `patch` via `npm audit fix` would update `sharp` within `0.34` — but current `15.5.25` pins `sharp` via `next`. `npm update` already applied non-breaking patch (now 20 not 21). | **non-breaking** `npm update` already applied | No Phase 1 image handling; `next` doesn't require `sharp` at build. | Monitor `sharp@0.34.3` — already latest `0.34` |

**Actions taken 2026-09-09:**
- `npm update` (non-breaking) — 1 vuln fixed (21→20), `audit` re-ran.
- `npm audit fix` (non-force) — no further non-breaking fixes.
- **Not** run `npm audit fix --force` — all remaining 20 require major upgrades (see above) with breaking changes to `next`, `argon2`, `vitest`, `typescript-eslint`, `prisma`, `swagger-ui`.
- Verified `typecheck`/`lint`/`test`/`build` still pass after `npm update`.

**Accepted risks for Phase 1:**
- `tar`/`argon2`/`sharp`/`postcss`/`minimatch`/`deepmerge` are **dev/build-time or transitive**, not exploitable via user requests in current `api`/`web` runtime (no tar extraction, no user CSS, no `sharp` image, no recursive merge from user). Mitigated by lockfile, no `tar` at runtime, rate-limit, helmet, audit logs.
- Planned resolution: Phase 2 will schedule majors in isolated branches with `npm install` + `typecheck` + `test` + `docker build` verification before merging.

**Next:** Re-verify Phase 1, then Phase 2.
