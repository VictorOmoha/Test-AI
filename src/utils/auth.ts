// Authentication utilities for AI Test Application
import { randomUUID, createHmac, timingSafeEqual } from 'node:crypto'
import bcrypt from 'bcryptjs'

export interface JWTPayload {
  user_id: string;
  email: string;
  exp: number;
  iat: number;
}

// Centralized env helper
export function getEnv(c: any, key: 'DATABASE_URL' | 'OPENAI_API_KEY' | 'JWT_SECRET'): string | undefined {
  return c?.env?.[key] || process.env[key]
}

export function requireEnv(c: any, key: 'DATABASE_URL' | 'OPENAI_API_KEY' | 'JWT_SECRET'): string {
  const value = getEnv(c, key)
  if (!value) throw new Error(`${key} environment variable is required`)
  return value
}

function base64Url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padding = (4 - (normalized.length % 4)) % 4
  return Buffer.from(normalized + '='.repeat(padding), 'base64').toString('utf8')
}

const BCRYPT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // Support legacy SHA-256 hashes for migration
  if (hashedPassword.length === 64 && /^[a-f0-9]+$/i.test(hashedPassword)) {
    const { createHash } = await import('node:crypto')
    const legacyHash = createHash('sha256').update(password + 'ai-test-salt-2024').digest('hex')
    return legacyHash === hashedPassword
  }
  return bcrypt.compare(password, hashedPassword)
}

export async function generateJWT(user_id: string, email: string, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload: JWTPayload = {
    user_id,
    email,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
    iat: Math.floor(Date.now() / 1000)
  }

  const encodedHeader = base64Url(JSON.stringify(header))
  const encodedPayload = base64Url(JSON.stringify(payload))
  const data = `${encodedHeader}.${encodedPayload}`
  const signature = createHmac('sha256', secret).update(data).digest()

  return `${data}.${base64Url(signature)}`
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [encodedHeader, encodedPayload, encodedSignature] = parts
    const data = `${encodedHeader}.${encodedPayload}`
    const expectedSignature = base64Url(createHmac('sha256', secret).update(data).digest())

    const left = Buffer.from(expectedSignature)
    const right = Buffer.from(encodedSignature)
    if (left.length !== right.length || !timingSafeEqual(left, right)) return null

    const header = JSON.parse(decodeBase64Url(encodedHeader))
    if (header.alg !== 'HS256') return null

    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as JWTPayload
    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export function generateUUID(): string {
  return randomUUID()
}

export function generateSessionToken(): string {
  return `${randomUUID()}-${Date.now()}`
}

// Extract Bearer token from Authorization header
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password strength validation
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' }
  }
  if (password.length > 100) {
    return { valid: false, message: 'Password must be less than 100 characters' }
  }
  return { valid: true }
}

// Generate secure random string for session tokens
export function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
