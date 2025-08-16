// Authentication middleware for AI Test Application
import { Context, Next } from 'hono'
import { Env } from '../types/database'
import { verifyJWT, extractTokenFromHeader } from '../utils/auth'
import { DatabaseService } from '../utils/database'

export interface AuthContext {
  user_id: string;
  email: string;
}

// Middleware to authenticate users
export const authMiddleware = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const authHeader = c.req.header('Authorization')
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    return c.json({ success: false, message: 'Authorization token required' }, 401)
  }

  const jwtSecret = c.env.JWT_SECRET || 'default-jwt-secret-change-in-production'
  const payload = await verifyJWT(token, jwtSecret)

  if (!payload) {
    return c.json({ success: false, message: 'Invalid or expired token' }, 401)
  }

  // Verify user still exists in database
  const db = new DatabaseService(c.env.DB)
  const user = await db.getUserById(payload.user_id)
  
  if (!user) {
    return c.json({ success: false, message: 'User not found' }, 401)
  }

  // Add user info to context
  c.set('auth', { user_id: payload.user_id, email: payload.email })
  
  await next()
}

// Optional middleware - doesn't require authentication but adds user info if token is present
export const optionalAuthMiddleware = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const authHeader = c.req.header('Authorization')
  const token = extractTokenFromHeader(authHeader)

  if (token) {
    const jwtSecret = c.env.JWT_SECRET || 'default-jwt-secret-change-in-production'
    const payload = await verifyJWT(token, jwtSecret)
    
    if (payload) {
      const db = new DatabaseService(c.env.DB)
      const user = await db.getUserById(payload.user_id)
      
      if (user) {
        c.set('auth', { user_id: payload.user_id, email: payload.email })
      }
    }
  }

  await next()
}

// Helper function to get authenticated user from context
export function getAuthUser(c: Context): AuthContext | null {
  return c.get('auth') || null
}