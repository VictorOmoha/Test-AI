// Authentication routes for AI Test Application
import { Hono } from 'hono'
import { Env, CreateUserRequest, LoginRequest } from '../types/database'
import { DatabaseService } from '../utils/database'
import { hashPassword, verifyPassword, generateJWT, verifyJWT, isValidEmail, isValidPassword, generateUUID } from '../utils/auth'

const auth = new Hono<{ Bindings: Env }>()

// User Registration
auth.post('/register', async (c) => {
  try {
    const body: CreateUserRequest = await c.req.json()
    const { email, password, name, age, education_level } = body

    // Validation
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

    // Check if user already exists
    const db = new DatabaseService(c.env.DB)
    const existingUser = await db.getUserByEmail(email)
    
    if (existingUser) {
      return c.json({ success: false, message: 'Email already registered' }, 409)
    }

    // Hash password and create user
    const password_hash = await hashPassword(password)
    const userId = await db.createUser({
      email,
      password_hash,
      name,
      age,
      education_level
    })

    // Generate JWT token
    const jwtSecret = c.env.JWT_SECRET || 'default-jwt-secret-change-in-production'
    const token = await generateJWT(userId, email, jwtSecret)

    // Get created user (without password)
    const user = await db.getUserById(userId)
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
  try {
    const body: LoginRequest = await c.req.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      return c.json({ success: false, message: 'Email and password are required' }, 400)
    }

    if (!isValidEmail(email)) {
      return c.json({ success: false, message: 'Invalid email format' }, 400)
    }

    // Find user
    const db = new DatabaseService(c.env.DB)
    const user = await db.getUserByEmail(email)
    
    if (!user) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401)
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash)
    
    if (!isPasswordValid) {
      return c.json({ success: false, message: 'Invalid credentials' }, 401)
    }

    // Generate JWT token
    const jwtSecret = c.env.JWT_SECRET || 'default-jwt-secret-change-in-production'
    const token = await generateJWT(user.id, user.email, jwtSecret)

    // Return user info (without password)
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

    const jwtSecret = c.env.JWT_SECRET || 'default-jwt-secret-change-in-production'
    const payload = await verifyJWT(token, jwtSecret)
    
    if (!payload) {
      return c.json({ success: false, message: 'Invalid or expired token' }, 401)
    }

    // Get current user info
    const db = new DatabaseService(c.env.DB)
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