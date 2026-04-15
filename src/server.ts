import 'dotenv/config'
import { serve } from '@hono/node-server'
import app from './index.js'

const port = Number(process.env.PORT || 3000)

const server = serve({
  fetch: app.fetch,
  port
})

const shutdown = () => {
  server.close()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
