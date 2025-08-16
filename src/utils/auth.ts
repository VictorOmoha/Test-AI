// Authentication utilities for AI Test Application
import { sign, verify } from 'hono/jwt'
import { v4 as uuidv4 } from 'uuid'

export interface JWTPayload {
  user_id: string;
  email: string;
  exp: number;
  iat: number;
}

// Simple password hashing using Web Crypto API (Cloudflare Workers compatible)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'ai-test-salt-2024') // Add salt
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hashedInput = await hashPassword(password)
  return hashedInput === hashedPassword
}

export async function generateJWT(user_id: string, email: string, secret: string): Promise<string> {
  const payload: JWTPayload = {
    user_id,
    email,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iat: Math.floor(Date.now() / 1000)
  }
  return await sign(payload, secret)
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const payload = await verify(token, secret) as JWTPayload
    
    // Check if token is expired
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    
    return payload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export function generateUUID(): string {
  return uuidv4()
}

export function generateSessionToken(): string {
  return uuidv4() + '-' + Date.now().toString()
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