# TestAI Vercel + Neon Migration Plan

Goal: remove Cloudflare from TestAI completely and move the app to Vercel for runtime/deploy and Neon Postgres for data.

What is currently Cloudflare-coupled
- Runtime entrypoint: `src/index.tsx` uses `hono/cloudflare-workers` static serving and `Bindings: Env`
- Database binding: `Env.DB` is a `D1Database`
- Data layer: `src/utils/database.ts` is fully written around D1 `.prepare().bind().first()/all()/run()`
- Tooling/scripts: `wrangler.jsonc`, `ecosystem.config.cjs`, and package scripts are all Wrangler/D1 based
- Schema/bootstrap: `migrations/0001_initial_schema.sql` and `seed.sql` are portable SQL-ish, but need Postgres syntax review and a Neon execution path

Target shape
- Runtime: Hono on Vercel Node runtime
- Handler: `api/[[...route]].ts` or equivalent Vercel API entry using Hono Vercel/Node adapter
- Local dev: Node server using Hono node-server, not Wrangler
- Database: Neon Postgres via serverless Postgres driver
- Config: `DATABASE_URL`, `OPENAI_API_KEY`, `JWT_SECRET`

Execution plan

1. Runtime extraction
- Move app construction into a reusable module, e.g. `src/app.ts`
- Remove Cloudflare static serving adapter usage
- Serve static assets from Vercel public directory or root static folder
- Add Vercel API entrypoint and local Node server entrypoint

2. Database abstraction replacement
- Replace `D1Database` and Cloudflare `Env.DB` typing with a database client abstraction
- Introduce Neon/Postgres helper in `src/utils/database.ts` or split into:
  - `src/utils/db-client.ts`
  - `src/utils/database.ts`
- Convert all D1-style queries to Postgres parameterized queries
- Replace `.first()` / `.all()` result handling with row-based Postgres handling

3. Schema migration
- Convert SQLite/D1 schema to Postgres-safe SQL
- Create Postgres migration file(s), likely under `db/postgres/` or `migrations/postgres/`
- Convert booleans, datetime defaults, and checks where needed
- Convert seed script for Postgres inserts

4. Tooling cleanup
- Remove Wrangler-only scripts
- Add scripts like:
  - `dev` -> local Node/Hono server
  - `build`
  - `start`
  - `db:migrate`
  - `db:seed`
- Add `vercel.json` only if needed
- Rewrite README to Vercel + Neon setup

5. Validation
- Local smoke tests must pass against the new Node/Vercel-compatible server path
- Core path required:
  - `/api/health`
  - register
  - create config
  - start test without OpenAI key

Recommended implementation order
1. Runtime extraction first
2. DB client abstraction second
3. Postgres query conversion third
4. Migrations/seeding fourth
5. Docs/scripts cleanup last

Risk note
- The real migration cost is not Vercel. It is the D1-specific data layer. That is the main rewrite.

Recommendation
- Do this as a clean cutover, not a half-cloudflare/half-vercel hybrid.
