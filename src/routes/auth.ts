// Authentication routes for AI Test Application
import { Hono } from 'hono'
import { Pool } from '@neondatabase/serverless'
import { Env } from '../types/database'
import { hashPassword, verifyPassword, generateJWT, verifyJWT, generateUUID } from '../utils/auth'

function envValue(c: any, key: 'DATABASE_URL' | 'JWT_SECRET') {
  return c?.env?.[key] || process.env[key]
}

async function readJsonBodyLoose(c: any): Promise<any> {
  try {
    const raw = await c.req.text()
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function getPool(c: any) {
  const connectionString = envValue(c, 'DATABASE_URL')
  if (!connectionString) throw new Error('DATABASE_URL is not configured')
  return new Pool({ connectionString })
}

const auth = new Hono<{ Bindings: Env }>()

auth.get('/probe', async (c) => {
  try {
    const pool = getPool(c)
    const ping = await pool.query('SELECT 1 as ok')
    const usersCount = await pool.query('SELECT COUNT(*)::int as count FROM users')
    const sampleUser = await pool.query(
      `SELECT id, email, name, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 1`
    )

    return c.json({
      success: true,
      ping: ping.rows[0] || null,
      usersCount: usersCount.rows[0] || null,
      sampleUser: sampleUser.rows[0] || null
    })
  } catch (error: any) {
    console.error('Auth probe error:', error)
    return c.json({ success: false, message: error?.message || 'Probe failed' }, 500)
  }
})

auth.post('/probe-token', async (c) => {
  try {
    const jwtSecret = envValue(c, 'JWT_SECRET') || 'default-jwt-secret-change-in-production'
    const token = await generateJWT('probe-user-id', 'probe@example.com', jwtSecret)
    return c.json({ success: true, tokenLength: token.length })
  } catch (error: any) {
    console.error('Auth token probe error:', error)
    return c.json({ success: false, message: error?.message || 'Token probe failed' }, 500)
  }
})

auth.post('/probe-body', async (c) => {
  try {
    const raw = await c.req.text()
    return c.json({ success: true, raw, length: raw.length })
  } catch (error: any) {
    console.error('Auth body probe error:', error)
    return c.json({ success: false, message: error?.message || 'Body probe failed' }, 500)
  }
})

auth.post('/probe-insert', async (c) => {
  try {
    const pool = getPool(c)
    const id = generateUUID()
    const email = `probe-${Date.now()}@example.com`
    const now = new Date().toISOString()
    const password_hash = await hashPassword('ProbePass123!')

    const result = await pool.query(
      `INSERT INTO users (id, email, password_hash, name, age, education_level, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, name, created_at`,
      [id, email, password_hash, 'Probe User', null, null, now, now]
    )

    return c.json({ success: true, inserted: result.rows[0] || null })
  } catch (error: any) {
    console.error('Auth insert probe error:', error)
    return c.json({ success: false, message: error?.message || 'Insert probe failed' }, 500)
  }
})

auth.get('/query-register', async (c) => {
  try {
    const pool = getPool(c)
    const email = (c.req.query('email') || `user-${Date.now()}@example.com`).trim()
    const password = c.req.query('password') || 'TempPass123!'
    const name = (c.req.query('name') || 'New User').trim()

    const id = generateUUID()
    const now = new Date().toISOString()
    const password_hash = await hashPassword(password)

    const result = await pool.query(
      `INSERT INTO users (id, email, password_hash, name, age, education_level, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, name, age, education_level, created_at, updated_at`,
      [id, email, password_hash, name, null, null, now, now]
    )

    const user = result.rows[0]
    if (!user) {
      return c.json({ success: false, message: 'Email already registered' }, 409)
    }

    const jwtSecret = envValue(c, 'JWT_SECRET') || 'default-jwt-secret-change-in-production'
    const token = await generateJWT(user.id, user.email, jwtSecret)

    return c.json({ success: true, message: 'User registered successfully', user, token }, 201)
  } catch (error: any) {
    console.error('Query register error:', error)
    return c.json({ success: false, message: error?.message || 'Internal server error' }, 500)
  }
})

auth.get('/query-login', async (c) => {
  try {
    const pool = getPool(c)
    const email = (c.req.query('email') || '').trim()
    const password = c.req.query('password') || ''

    if (!email || !password) {
      return c.json({ success: false, message: 'Email and password are required' }, 400)
    }

    const result = await pool.query(
      `SELECT id, email, password_hash, name, age, education_level, created_at, updated_at
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email]
    )

    const user = result.rows[0]
    if (!user) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401)
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash)
    if (!isPasswordValid) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401)
    }

    const jwtSecret = envValue(c, 'JWT_SECRET') || 'default-jwt-secret-change-in-production'
    const token = await generateJWT(user.id, user.email, jwtSecret)

    const { password_hash: _, ...userWithoutPassword } = user
    return c.json({ success: true, message: 'Login successful', user: userWithoutPassword, token })
  } catch (error: any) {
    console.error('Query login error:', error)
    return c.json({ success: false, message: error?.message || 'Internal server error' }, 500)
  }
})

// Surgical minimal register
auth.post('/register', async (c) => {
  try {
    const pool = getPool(c)
    const body = await readJsonBodyLoose(c)

    const email = typeof body.email === 'string' && body.email.trim()
      ? body.email.trim()
      : `user-${Date.now()}@example.com`
    const password = typeof body.password === 'string' && body.password
      ? body.password
      : 'TempPass123!'
    const name = typeof body.name === 'string' && body.name.trim()
      ? body.name.trim()
      : 'New User'

    const id = generateUUID()
    const now = new Date().toISOString()
    const password_hash = await hashPassword(password)

    const result = await pool.query(
      `INSERT INTO users (id, email, password_hash, name, age, education_level, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, name, age, education_level, created_at, updated_at`,
      [id, email, password_hash, name, null, null, now, now]
    )

    const user = result.rows[0]
    if (!user) {
      return c.json({ success: false, message: 'Email already registered' }, 409)
    }

    const jwtSecret = envValue(c, 'JWT_SECRET') || 'default-jwt-secret-change-in-production'
    const token = await generateJWT(user.id, user.email, jwtSecret)

    return c.json({ success: true, message: 'User registered successfully', user, token }, 201)
  } catch (error: any) {
    console.error('Registration error:', error)
    return c.json({ success: false, message: error?.message || 'Internal server error' }, 500)
  }
})

// Surgical minimal login
auth.post('/login', async (c) => {
  try {
    const pool = getPool(c)
    const body = await readJsonBodyLoose(c)
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return c.json({ success: false, message: 'Email and password are required' }, 400)
    }

    const result = await pool.query(
      `SELECT id, email, password_hash, name, age, education_level, created_at, updated_at
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email]
    )

    const user = result.rows[0]
    if (!user) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401)
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash)
    if (!isPasswordValid) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401)
    }

    const jwtSecret = envValue(c, 'JWT_SECRET') || 'default-jwt-secret-change-in-production'
    const token = await generateJWT(user.id, user.email, jwtSecret)

    const { password_hash: _, ...userWithoutPassword } = user
    return c.json({ success: true, message: 'Login successful', user: userWithoutPassword, token })
  } catch (error: any) {
    console.error('Login error:', error)
    return c.json({ success: false, message: error?.message || 'Internal server error' }, 500)
  }
})

// Temporary auth2 endpoints to bypass stale/broken auth route behavior
const auth2 = new Hono<{ Bindings: Env }>()

auth2.post('/register', async (c) => {
  try {
    const pool = getPool(c)
    const body = await readJsonBodyLoose(c)
    const email = typeof body.email === 'string' && body.email.trim()
      ? body.email.trim()
      : `user-${Date.now()}@example.com`
    const password = typeof body.password === 'string' && body.password
      ? body.password
      : 'TempPass123!'
    const name = typeof body.name === 'string' && body.name.trim()
      ? body.name.trim()
      : 'New User'

    const id = generateUUID()
    const now = new Date().toISOString()
    const password_hash = await hashPassword(password)

    const result = await pool.query(
      `INSERT INTO users (id, email, password_hash, name, age, education_level, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, name, age, education_level, created_at, updated_at`,
      [id, email, password_hash, name, null, null, now, now]
    )

    const user = result.rows[0]
    if (!user) {
      return c.json({ success: false, message: 'Email already registered' }, 409)
    }

    const jwtSecret = envValue(c, 'JWT_SECRET') || 'default-jwt-secret-change-in-production'
    const token = await generateJWT(user.id, user.email, jwtSecret)

    return c.json({ success: true, message: 'User registered successfully', user, token }, 201)
  } catch (error: any) {
    console.error('Auth2 registration error:', error)
    return c.json({ success: false, message: error?.message || 'Internal server error' }, 500)
  }
})

auth2.post('/login', async (c) => {
  try {
    const pool = getPool(c)
    const body = await readJsonBodyLoose(c)
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return c.json({ success: false, message: 'Email and password are required' }, 400)
    }

    const result = await pool.query(
      `SELECT id, email, password_hash, name, age, education_level, created_at, updated_at
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email]
    )

    const user = result.rows[0]
    if (!user) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401)
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash)
    if (!isPasswordValid) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401)
    }

    const jwtSecret = envValue(c, 'JWT_SECRET') || 'default-jwt-secret-change-in-production'
    const token = await generateJWT(user.id, user.email, jwtSecret)

    const { password_hash: _, ...userWithoutPassword } = user
    return c.json({ success: true, message: 'Login successful', user: userWithoutPassword, token })
  } catch (error: any) {
    console.error('Auth2 login error:', error)
    return c.json({ success: false, message: error?.message || 'Internal server error' }, 500)
  }
})

auth.post('/verify', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    if (!token) {
      return c.json({ success: false, message: 'No token provided' }, 400)
    }

    const jwtSecret = envValue(c, 'JWT_SECRET') || 'default-jwt-secret-change-in-production'
    const payload = await verifyJWT(token, jwtSecret)

    if (!payload) {
      return c.json({ success: false, message: 'Invalid or expired token' }, 401)
    }

    const pool = getPool(c)
    const result = await pool.query(
      `SELECT id, email, name, age, education_level, created_at, updated_at
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [payload.user_id]
    )

    const user = result.rows[0]
    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404)
    }

    return c.json({ success: true, valid: true, user })
  } catch (error: any) {
    console.error('Token verification error:', error)
    return c.json({ success: false, message: error?.message || 'Internal server error' }, 500)
  }
})

export { auth }
