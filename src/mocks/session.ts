const SESSION_TTL_MS = 30_000

let expiresAt: number | null = null

export function startSession(): void {
  expiresAt = Date.now() + SESSION_TTL_MS
}

export function isSessionActive(): boolean {
  if (expiresAt === null) {
    return false
  }

  if (Date.now() >= expiresAt) {
    expiresAt = null
    return false
  }

  return true
}
