# TestAI Vercel + Neon Deployment Checklist

Use this exact sequence.

## 1. Create the Neon database
1. Log into Neon.
2. Create a new project for TestAI.
3. Copy the pooled connection string.
4. Save it as `DATABASE_URL`.

Expected format:
`postgres://USER:PASSWORD@HOST/DB?sslmode=require`

## 2. Create the required Vercel environment variables
In the Vercel project settings, add these variables for Production at minimum:

Required
- `DATABASE_URL`
- `JWT_SECRET`

Optional
- `OPENAI_API_KEY`

Recommended values
- `JWT_SECRET`: generate a long random secret, at least 32 characters.

Example local `.env`
```env
DATABASE_URL=postgres://USER:PASSWORD@HOST/DB?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
OPENAI_API_KEY=
```

## 3. Connect the repo to Vercel
Option A: Vercel dashboard
1. Import the GitHub repo.
2. Confirm framework is detected as Other / Hono-compatible backend.
3. Root directory: repo root.
4. Leave install command as default (`npm install`).
5. Build command can stay default or be set explicitly to:
   - `npm run build`
6. Output directory: leave empty.

Option B: CLI
```bash
npm i -g vercel
vercel login
vercel link
```

## 4. Confirm the runtime entrypoint
The active Vercel entrypoint is:
- `api/[[...route]].ts`

The local Node server entrypoint is:
- `src/server.ts`

Do not point Vercel at `src/server.ts`.

## 5. Pre-deploy validation
Run these from the repo root:
```bash
npm install
npm run typecheck
npm run test
npm run build
```

Expected result
- typecheck passes
- smoke tests pass
- Tailwind CSS builds

## 6. Run the real Postgres migration before deploy
With your real `DATABASE_URL` available locally:
```bash
npm run db:migrate
npm run db:seed
```

If you need to fully rebuild the Neon schema:
```bash
npm run db:reset
```

## 7. Deploy
Dashboard-triggered deploy is fine.

CLI production deploy:
```bash
npm run deploy:prod
```

Preview deploy:
```bash
npm run deploy
```

## 7. Post-deploy checks
After deployment, verify:
1. `/api/health`
2. register a user
3. create a test config
4. start a test without OpenAI key
5. if OpenAI key is set, confirm AI generation/recommendations work

Minimum health check expectation:
```json
{
  "success": true,
  "database": "connected"
}
```

## 8. What to do if deployment fails
### If `/api/health` says database failed
- recheck `DATABASE_URL`
- make sure the Neon connection string is complete
- confirm SSL is enabled (`sslmode=require`)

### If auth fails everywhere
- recheck `JWT_SECRET`
- ensure Production env vars were added, not just Preview/Development

### If the UI loads but styling is broken
- rerun `npm run build`
- confirm `public/static/tailwind.css` exists in the deployed project

### If tests pass locally but Vercel fails
- verify Vercel is using repo root
- verify `api/[[...route]].ts` exists in the deployed branch

## 9. Current architectural note
- Production target: Neon Postgres
- Local fallback: in-memory Postgres via `pg-mem` when `DATABASE_URL` is missing

That fallback is useful for local smoke tests, but production should always have a real `DATABASE_URL`.
