# Neon + Vercel setup

## Required environment variables
Set these in Vercel project settings:

- `DATABASE_URL` = your Neon pooled connection string
- `JWT_SECRET` = long random secret
- `OPENAI_API_KEY` = your OpenAI key

## Database setup
Run this SQL in Neon:
1. `neon-schema.sql`
2. `seed.sql` (optional, for starter categories/demo data)

## Notes
- The app backend now reads `DATABASE_URL` instead of Cloudflare D1 bindings.
- Vercel should auto-deploy from GitHub after push.
- Old Cloudflare deploy scripts are still present in package.json, but they are no longer the target path for production.
