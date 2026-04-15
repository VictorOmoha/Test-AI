# TestAI v2 Cleanup Implementation Plan

> For Hermes: use subagent-driven-development if this is delegated later.

Goal: turn the current demo-grade codebase into a cleaner v2 baseline with honest local execution, typed backend validation, safer dependency versions, and a more maintainable dev workflow.

Architecture: keep the existing Hono + Cloudflare Pages + D1 shape, but reduce hidden/demo behavior, centralize environment handling, make the backend typecheck cleanly, and add lightweight repo standards so future work starts from a stable base instead of a brittle prototype.

Tech Stack: TypeScript, Hono, Cloudflare Workers/Pages, D1, Vite, Wrangler, vanilla JS frontend.

---

## Task 1: Establish v2 repo identity and scripts
- Rename package identity from generic `webapp` to `test-ai`
- Add `description`
- Add `typecheck`, `check`, and `test` scripts
- Add `.dev.vars.example` with documented secrets
- Rewrite README to reflect actual architecture and honest app status

## Task 2: Make backend env and auth utilities cleanly typed
- Add Cloudflare worker types to TypeScript config
- Add a small env helper for JWT/OpenAI defaults
- Fix Hono context typing for auth middleware
- Fix missing imports and JWT payload typing issues
- Make `npx tsc --noEmit` pass

## Task 3: Remove fake blocker in test start flow
- Allow `/api/tests/start` to use fallback generation when `OPENAI_API_KEY` is absent
- Preserve AI usage when key exists
- Keep recommendation route fallback behavior intact
- Validate registration -> config -> start test works locally without OpenAI

## Task 4: Reduce prototype noise in frontend and app shell
- Replace debug `console.log` spam with gated local-only logging
- Remove the fake demo-login fallback path so auth behavior matches backend reality
- Keep the browser UX functional after cleanup

## Task 5: Update vulnerable direct dependencies to safe current versions
- Upgrade Hono, Vite, Wrangler, and related direct packages to current safe releases
- Reinstall lockfile
- Re-run build/typecheck/local smoke tests
- Re-check `npm audit`

## Task 6: Final verification
- `npm install`
- `npm run typecheck`
- `npm run build`
- `npm run db:reset`
- Boot local server
- Verify `/api/health`
- Verify register -> create config -> start test returns generated questions without OpenAI key

Expected outcome: a cleaner v2 codebase that still uses the same product surface, but is honest, locally runnable, typed, and safer to extend.
