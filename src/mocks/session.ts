const SESSION_TTL_MS = 30_000

let expiresAt: number | null = null

export function startSession(): void {
  expiresAt = Date.now() + SESSION_TTL_MS
}

export function isSessionActive(): boolean {
  return expiresAt !== null && Date.now() < expiresAt
}
