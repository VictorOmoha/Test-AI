// Authentication routes for AI Test Application
import { Hono } from 'hono'
import { Pool } from '@neondatabase/serverless'
import { Env, CreateUserRequest, LoginRequest } from '../types/database'
import { hashPassword, verifyPassword, generateJWT, verifyJWT, isValidEmail, isValidPassword, generateUUID } from '../utils/auth'

function envValue(c: any, key: 'DATABASE_URL' | 'JWT_SECRET') {
  return c?.env?.[key] || process.env[key]
}

async function readJsonBody<T>(c: any): Promise<T> {
  const raw = await c.req.text()
  if (!raw) throw new Error('Request body is empty')
  return JSON.parse(raw) as T
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
    return c.json({
      success: false,
      message: error?.message || 'Probe failed'
    }, 500)
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

// User Registration
auth.post('/register', async (c) => {
  try {
    const pool = getPool(c)
    const body = await readJsonBody<CreateUserRequest>(c)
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const age = typeof body?.age === 'number' ? body.age : null
    const education_level = typeof body?.education_level === 'string' ? body.education_level : null

    if (!email || !password || !name) {
      return c.json({ success: false, message: 'Email, password, and name are required' }, 400)
    }

    if (!isValidEmail(email)) {
      return c.json({ success: false, message: 'Invalid email format' }, 400)
    }

    const passwordValidation = isValidPassword(password)
    if (!passwordValidation.valid) {
      return c.json({ success: false, message: passwordValidation.message }, 400)
    }

    if (name.length < 1 || name.length > 100) {
      return c.json({ success: false, message: 'Name must be between 1 and 100 characters' }, 400)
    }

    const password_hash = await hashPassword(password)
    const userId = generateUUID()
    const now = new Date().toISOString()

    const insertResult = await pool.query(
      `INSERT INTO users (id, email, password_hash, name, age, education_level, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, name, age, education_level, created_at, updated_at`,
      [userId, email, password_hash, name, age, education_level, now, now]
    )

    const user = insertResult.rows[0]
    if (!user) {
      return c.json({ success: false, message: 'Email already registered' }, 409)
    }

    const jwtSecret = envValue(c, 'JWT_SECRET') || 'default-jwt-secret-change-in-production'
    const token = await generateJWT(user.id, user.email, jwtSecret)

    return c.json({ success: true, message: 'User registered successfully', user, token }, 201)
  } catch (error: any) {
    console.error('Registration error:', error)

    if (String(error?.message || '').includes('empty') || String(error?.message || '').includes('JSON')) {
      return c.json({ success: false, message: 'Invalid JSON body' }, 400)
    }

    return c.json({ success: false, message: 'Internal server error' }, 500)
  }
})

// User Login
auth.post('/login', async (c) => {
  try {
    const pool = getPool(c)
    const body = await readJsonBody<LoginRequest>(c)
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!email || !password) {
      return c.json({ success: false, message: 'Email and password are required' }, 400)
    }

    if (!isValidEmail(email)) {
      return c.json({ success: false, message: 'Invalid email format' }, 400)
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

    if (String(error?.message || '').includes('empty') || String(error?.message || '').includes('JSON')) {
      return c.json({ success: false, message: 'Invalid JSON body' }, 400)
    }

    return c.json({ success: false, message: 'Internal server error' }, 500)
  }
})

// Verify Token (for client-side token validation)
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

    return c.json({
      success: true,
      valid: true,
      user
    })

  } catch (error) {
    console.error('Token verification error:', error)
    return c.json({ success: false, message: 'Internal server error' }, 500)
  }
})

export { auth }
