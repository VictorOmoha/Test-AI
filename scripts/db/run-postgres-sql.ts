import 'dotenv/config'
import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'
import { getDatabaseUrl, getSchemaSql, getSeedSql } from '../../src/utils/db'

neonConfig.webSocketConstructor = ws

const mode = process.argv[2]

if (!mode || !['migrate', 'seed', 'reset'].includes(mode)) {
  console.error('Usage: tsx scripts/db/run-postgres-sql.ts <migrate|seed|reset>')
  process.exit(1)
}

const connectionString = getDatabaseUrl()
if (!connectionString) {
  console.error('DATABASE_URL is required for Postgres migration commands.')
  process.exit(1)
}

const pool = new Pool({ connectionString })

async function run() {
  if (mode === 'migrate') {
    await pool.query(await getSchemaSql())
    console.log('Postgres migration applied successfully.')
    return
  }

  if (mode === 'seed') {
    await pool.query(await getSeedSql())
    console.log('Postgres seed applied successfully.')
    return
  }

  await pool.query(`
    DROP TABLE IF EXISTS questions CASCADE;
    DROP TABLE IF EXISTS test_attempts CASCADE;
    DROP TABLE IF EXISTS test_configurations CASCADE;
    DROP TABLE IF EXISTS user_sessions CASCADE;
    DROP TABLE IF EXISTS test_categories CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `)
  await pool.query(await getSchemaSql())
  await pool.query(await getSeedSql())
  console.log('Postgres database reset successfully.')
}

try {
  await run()
} finally {
  await pool.end()
}
