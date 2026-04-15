// Authentication routes for AI Test Application
import { Hono } from 'hono'
import { neon } from '@neondatabase/serverless'
import { Env } from '../types/database'
import { hashPassword, verifyPassword, generateJWT, verifyJWT, generateUUID, getEnv } from '../utils/auth'

function getPool(c: any) {
  const connectionString = getEnv('DATABASE_URL', c)
  if (!connectionString) throw new Error('DATABASE_URL is not configured')
  const sql = neon(connectionString)
  return {
    query: async (text: string, params: any[] = []) => ({ rows: await sql(text, params) as any[] })
  }
}

const auth = new Hono<{ Bindings: Env }>()

async function registerUser(c: any, payload: { email?: string; password?: string; name?: string; age?: number | null; education_level?: string | null }) {
  const pool = getPool(c)
  const email = (payload.email || '').trim().toLowerCase()
  const password = payload.password || ''
  const name = (payload.name || '').trim()
  const age = payload.age ?? null
  const education_level = payload.education_level ?? null

  if (!email || !password || !name) {
    return c.json({ success: false, message: 'Name, email, and password are required' }, 400)
  }

  const id = generateUUID()
  const now = new Date().toISOString()
  const password_hash = await hashPassword(password)

  const result = await pool.query(
    `INSERT INTO users (id, email, password_hash, name, age, education_level, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (email) DO NOTHING
     RETURNING id, email, name, age, education_level, created_at, updated_at`,
    [id, email, password_hash, name, age, education_level, now, now]
  )

  const user = result.rows[0]
  if (!user) {
    return c.json({ success: false, message: 'Email already registered' }, 409)
  }

  const jwtSecret = getEnv('JWT_SECRET', c)
  if (!jwtSecret) {
    return c.json({ success: false, message: 'Server misconfigured: JWT_SECRET not set' }, 500)
  }
  const token = await generateJWT(user.id, user.email, jwtSecret)

  return c.json({ success: true, message: 'User registered successfully', user, token }, 201)
}

async function loginUser(c: any, payload: { email?: string; password?: string }) {
  const pool = getPool(c)
  const email = (payload.email || '').trim().toLowerCase()
  const password = payload.password || ''

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

  const jwtSecret = getEnv('JWT_SECRET', c)
  if (!jwtSecret) {
    return c.json({ success: false, message: 'Server misconfigured: JWT_SECRET not set' }, 500)
  }
  const token = await generateJWT(user.id, user.email, jwtSecret)

  const { password_hash: _, ...userWithoutPassword } = user
  return c.json({ success: true, message: 'Login successful', user: userWithoutPassword, token })
}

auth.get('/query-register', async (c) => {
  try {
    return await registerUser(c, {
      email: c.req.query('email') || `user-${Date.now()}@example.com`,
      password: c.req.query('password') || 'TempPass123!',
      name: c.req.query('name') || 'New User',
      age: null,
      education_level: null
    })
  } catch (error: any) {
    console.error('Query register error:', error)
    return c.json({ success: false, message: error?.message || 'Internal server error' }, 500)
  }
})

auth.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    return await registerUser(c, body || {})
  } catch (error: any) {
    console.error('Register error:', error)
    return c.json({ success: false, message: error?.message || 'Internal server error' }, 500)
  }
})

auth.get('/query-login', async (c) => {
  try {
    return await loginUser(c, {
      email: c.req.query('email') || '',
      password: c.req.query('password') || ''
    })
  } catch (error: any) {
    console.error('Query login error:', error)
    return c.json({ success: false, message: error?.message || 'Internal server error' }, 500)
  }
})

auth.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    return await loginUser(c, body || {})
  } catch (error: any) {
    console.error('Login error:', error)
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

    const jwtSecret = getEnv('JWT_SECRET', c)
    if (!jwtSecret) {
      return c.json({ success: false, message: 'Server misconfigured: JWT_SECRET not set' }, 500)
    }
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
