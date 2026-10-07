const SESSION_TTL_MS = 30_000

let expiresAt: number | null = null
let isRefreshable = false
let sessionFingerprint: string | null = null

export function startSession(fingerprint?: string): void {
  expiresAt = Date.now() + SESSION_TTL_MS
  isRefreshable = true

  if (fingerprint !== undefined) {
    sessionFingerprint = fingerprint
  }
}

export function endSession(): void {
  expiresAt = null
  isRefreshable = false
  sessionFingerprint = null
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

export function canRotateSession(): boolean {
  return isRefreshable
}

export function getSessionFingerprint(): string | null {
  return sessionFingerprint
}

export function resetSession(): void {
  expiresAt = null
  isRefreshable = false
  sessionFingerprint = null
}
