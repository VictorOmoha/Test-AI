const DEFAULT_JWT_SECRET = 'default-jwt-secret-change-in-production'

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || DEFAULT_JWT_SECRET
}

export function getOptionalOpenAiKey(): string | undefined {
  const key = process.env.OPENAI_API_KEY?.trim()
  return key ? key : undefined
}

export function getDatabaseUrl(): string | undefined {
  const value = process.env.DATABASE_URL?.trim()
  return value ? value : undefined
}
