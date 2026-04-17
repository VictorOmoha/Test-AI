import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { Env } from './types/database'
import { auth } from './routes/auth'
import { tests } from './routes/tests'
import { social } from './routes/social'
import { DatabaseService } from './utils/database'
import { getEnv } from './utils/auth'

const app = new Hono<{ Bindings: Env }>()

function getDb(c: any) {
  return DatabaseService.fromDatabaseUrl(getEnv(c, 'DATABASE_URL'))
}

// Middleware
app.use('*', logger())
app.use('/api/*', cors({
  origin: (origin) => origin, // Allow same-origin; add external origins as needed
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// Fail-fast middleware: reject API calls immediately if DB is unavailable
app.use('/api/auth/*', async (c, next) => {
  if (!getEnv(c, 'DATABASE_URL')) {
    return c.json({ success: false, message: 'Database not available' }, 503)
  }
  await next()
})
app.use('/api/tests/*', async (c, next) => {
  if (!getEnv(c, 'DATABASE_URL')) {
    return c.json({ success: false, message: 'Database not available' }, 503)
  }
  await next()
})
app.use('/api/social/*', async (c, next) => {
  if (!getEnv(c, 'DATABASE_URL')) {
    return c.json({ success: false, message: 'Database not available' }, 503)
  }
  await next()
})

// API Routes
app.route('/api/auth', auth)
app.route('/api/tests', tests)
app.route('/api/social', social)

// Health check endpoint
app.get('/api/health', async (c) => {
  try {
    const db = getDb(c)
    await db.rawQuery('SELECT 1')
    
    return c.json({
      success: true,
      message: 'AI Test Application is running',
      timestamp: new Date().toISOString(),
      database: 'connected'
    })
  } catch (error) {
    return c.json({
      success: false,
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 503)
  }
})

// Shared HTML shell — inject defaultScreen to control landing vs app
async function renderApp(c: any, defaultScreen: string) {
  let ssrCategories: Array<{ id: string; name: string; description: string }> = []
  try {
    const db = getDb(c)
    const all = await db.getAllTestCategories()
    ssrCategories = all.map((cat: any) => ({ id: cat.id, name: cat.name, description: cat.description }))
  } catch (e) { /* ignore */ }

  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>TestAI — AI-Powered Testing Platform</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
      <link rel="stylesheet" href="/static/styles.css">
    </head>
    <body>
      <div id="root"></div>

      <script>
        window.__SSR_CATEGORIES = ${JSON.stringify(ssrCategories)};
        window.__DEFAULT_SCREEN = ${JSON.stringify(defaultScreen)};
      </script>
      <script src="https://unpkg.com/react@18.3.1/umd/react.development.js" crossorigin></script>
      <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" crossorigin></script>
      <script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" crossorigin></script>
      <script type="text/babel" src="/static/react-app.js"></script>
    </body>
    </html>
  `)
}

// Landing page (marketing) — default for /
app.get('/', async (c) => renderApp(c, 'landing'))

// App dashboard — logged-in experience
app.get('/app', async (c) => renderApp(c, 'dashboard'))

export default app
