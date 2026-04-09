// Authentication routes for AI Test Application
import { Hono } from 'hono'
import { Env, CreateUserRequest, LoginRequest } from '../types/database'
import { DatabaseService } from '../utils/database'
import { hashPassword, verifyPassword, generateJWT, verifyJWT, isValidEmail, isValidPassword } from '../utils/auth'

function envValue(c: any, key: 'DATABASE_URL' | 'JWT_SECRET') {
  return c?.env?.[key] || process.env[key]
}

const auth = new Hono<{ Bindings: Env }>()

// User Registration
auth.post('/register', async (c) => {
  const trace = (step: string, extra?: any) => console.log('[auth/register]', step, extra ?? '')

  try {
    trace('start')
    const body: CreateUserRequest = await c.req.json()
    const { email, password, name, age, education_level } = body
    trace('body parsed', { email, hasPassword: Boolean(password), hasName: Boolean(name) })

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

    const databaseUrl = envValue(c, 'DATABASE_URL')
    trace('database url present', Boolean(databaseUrl))
    const db = DatabaseService.fromDatabaseUrl(databaseUrl)

    trace('before existing user lookup')
    const existingUser = await db.getUserByEmail(email)
    trace('after existing user lookup', Boolean(existingUser))

    if (existingUser) {
      return c.json({ success: false, message: 'Email already registered' }, 409)
    }

    trace('before password hash')
    const password_hash = await hashPassword(password)
    trace('after password hash')

    trace('before create user')
    const userId = await db.createUser({
      email,
      password_hash,
      name,
      age,
      education_level
    })
    trace('after create user', userId)

    const jwtSecret = envValue(c, 'JWT_SECRET') || 'default-jwt-secret-change-in-production'
    trace('before jwt')
    const token = await generateJWT(userId, email, jwtSecret)
    trace('after jwt')

    trace('before get user by id')
    const user = await db.getUserById(userId)
    trace('after get user by id', Boolean(user))
    if (!user) {
      return c.json({ success: false, message: 'Failed to create user' }, 500)
    }

    const { password_hash: _, ...userWithoutPassword } = user

    return c.json({
      success: true,
      message: 'User registered successfully',
      user: userWithoutPassword,
      token
    }, 201)

  } catch (error) {
    console.error('Registration error:', error)
    return c.json({ success: false, message: 'Internal server error' }, 500)
  }
})

// User Login
auth.post('/login', async (c) => {
  const trace = (step: string, extra?: any) => console.log('[auth/login]', step, extra ?? '')

  try {
    trace('start')
    const body: LoginRequest = await c.req.json()
    const { email, password } = body
    trace('body parsed', { email, hasPassword: Boolean(password) })

    if (!email || !password) {
      return c.json({ success: false, message: 'Email and password are required' }, 400)
    }

    if (!isValidEmail(email)) {
      return c.json({ success: false, message: 'Invalid email format' }, 400)
    }

    const db = DatabaseService.fromDatabaseUrl(envValue(c, 'DATABASE_URL'))
    trace('before get user by email')
    const user = await db.getUserByEmail(email)
    trace('after get user by email', Boolean(user))

    if (!user) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401)
    }

    trace('before verify password')
    const isPasswordValid = await verifyPassword(password, user.password_hash)
    trace('after verify password', isPasswordValid)

    if (!isPasswordValid) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401)
    }

    const jwtSecret = envValue(c, 'JWT_SECRET') || 'default-jwt-secret-change-in-production'
    trace('before jwt')
    const token = await generateJWT(user.id, user.email, jwtSecret)
    trace('after jwt')

    const { password_hash: _, ...userWithoutPassword } = user

    return c.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token
    })

  } catch (error) {
    console.error('Login error:', error)
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

    const db = DatabaseService.fromDatabaseUrl(envValue(c, 'DATABASE_URL'))
    const user = await db.getUserById(payload.user_id)
    
    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 404)
    }

    const { password_hash: _, ...userWithoutPassword } = user

    return c.json({
      success: true,
      valid: true,
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Token verification error:', error)
    return c.json({ success: false, message: 'Internal server error' }, 500)
  }
})

export { auth }
