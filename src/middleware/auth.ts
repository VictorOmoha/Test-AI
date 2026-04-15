import { Context, Next } from 'hono'
import { Env } from '../types/database'
import { verifyJWT, extractTokenFromHeader, getEnv } from '../utils/auth'
import { DatabaseService } from '../utils/database'

export interface AuthContext {
  user_id: string;
  email: string;
}

export const authMiddleware = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const authHeader = c.req.header('Authorization')
  const token = extractTokenFromHeader(authHeader)

  if (!token) {
    return c.json({ success: false, message: 'Authorization token required' }, 401)
  }

  const jwtSecret = getEnv(c, 'JWT_SECRET')
  if (!jwtSecret) {
    return c.json({ success: false, message: 'Server misconfigured: JWT_SECRET not set' }, 500)
  }
  const payload = await verifyJWT(token, jwtSecret)

  if (!payload) {
    return c.json({ success: false, message: 'Invalid or expired token' }, 401)
  }

  const db = DatabaseService.fromDatabaseUrl(getEnv(c, 'DATABASE_URL'))
  const user = await db.getUserById(payload.user_id)

  if (!user) {
    return c.json({ success: false, message: 'User not found' }, 401)
  }

  c.set('auth' as any, { user_id: payload.user_id, email: payload.email })
  await next()
}

export const optionalAuthMiddleware = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const authHeader = c.req.header('Authorization')
  const token = extractTokenFromHeader(authHeader)

  if (token) {
    const jwtSecret = getEnv(c, 'JWT_SECRET')
    if (jwtSecret) {
      const payload = await verifyJWT(token, jwtSecret)
      if (payload) {
        const db = DatabaseService.fromDatabaseUrl(getEnv(c, 'DATABASE_URL'))
        const user = await db.getUserById(payload.user_id)
        if (user) {
          c.set('auth' as any, { user_id: payload.user_id, email: payload.email })
        }
      }
    }
  }

  await next()
}

export function getAuthUser(c: Context): AuthContext | null {
  return c.get('auth' as any) || null
}
